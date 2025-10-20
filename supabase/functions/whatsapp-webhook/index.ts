import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MenuItem = { id: string; name: string; price: number };
type CartItem = MenuItem & { quantity: number };
type Conversation = {
  id: string;
  customer_phone: string;
  restaurant_id: string;
  current_state: string;
  cart: CartItem[];
  customer_name: string | null;
  notes: string | null;
};

const sendResponse = (message: string) => {
  const twilioResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new Response(twilioResponse, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
};

const formatMessage = (text: string, variables: Record<string, string>) => {
  let formattedText = text;
  for (const key in variables) {
    formattedText = formattedText.replace(new RegExp(`{${key}}`, "g"), variables[key]);
  }
  return formattedText;
};

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getCartTotal = (cart: CartItem[]) => cart.reduce((total, item) => total + item.price * item.quantity, 0);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.formData();
    const customerPhone = body.get("From")?.toString().replace("whatsapp:", "");
    const restaurantPhone = body.get("To")?.toString().replace("whatsapp:", "");
    const message = body.get("Body")?.toString().toLowerCase().trim();

    if (!customerPhone || !restaurantPhone || !message) {
      return new Response("Missing parameters", { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("id, restaurant_name").eq("whatsapp_number", restaurantPhone.replace("+", "")).single();
    if (profileError || !profile) {
      console.error("Profile not found:", restaurantPhone, profileError);
      return new Response("Restaurant not configured", { status: 404 });
    }
    const restaurantId = profile.id;

    const { data: responsesData, error: responsesError } = await supabase.from("whatsapp_responses").select("message_type, message_text").eq("restaurant_id", restaurantId);
    if (responsesError) throw responsesError;
    const responses = new Map(responsesData.map((r) => [r.message_type, r.message_text]));
    const getResponse = (type: string) => responses.get(type) || `(Mensagem para '${type}' não configurada)`;

    let { data: conversation, error: convError } = await supabase.from("whatsapp_conversations").select<"*", Conversation>().eq("customer_phone", customerPhone).eq("restaurant_id", restaurantId).single();
    if (!conversation) {
      const { data: newConv, error: newConvError } = await supabase.from("whatsapp_conversations").insert({ customer_phone: customerPhone, restaurant_id: restaurantId, current_state: "GREETING", cart: [] }).select<"*", Conversation>().single();
      if (newConvError) throw newConvError;
      conversation = newConv;
      conversation.current_state = "GREETING"; // Force initial state
    }

    let responseMessage = "";
    let nextState = conversation.current_state;
    let cart = conversation.cart || [];
    const messageVariables = { restaurant_name: profile.restaurant_name, customer_name: conversation.customer_name || "cliente" };

    // Main State Machine
    switch (conversation.current_state) {
      case "GREETING":
        responseMessage = formatMessage(getResponse("GREETING"), messageVariables) + "\n\n" + formatMessage(getResponse("MAIN_MENU"), messageVariables);
        nextState = "MAIN_MENU";
        break;

      case "MAIN_MENU":
        if (message.includes("1") || message.includes("cardapio")) {
          const appUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace("supabase.co", "vercel.app");
          const menuUrl = `${appUrl}/menu/${restaurantId}`;
          responseMessage = `Aqui está o nosso cardápio completo: ${menuUrl}\n\n` + formatMessage(getResponse("MAIN_MENU"), messageVariables);
        } else if (message.includes("2") || message.includes("pedido")) {
          responseMessage = formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          nextState = "ORDERING";
        } else {
          responseMessage = formatMessage(getResponse("ERROR"), messageVariables) + "\n\n" + formatMessage(getResponse("MAIN_MENU"), messageVariables);
        }
        break;

      case "ORDERING":
        if (message.includes("finalizar") || message.includes("fechar")) {
          if (cart.length === 0) {
            responseMessage = "Seu carrinho está vazio. Adicione alguns itens antes de finalizar.\n\n" + formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          } else {
            responseMessage = formatMessage(getResponse("CHECKOUT_NAME_PROMPT"), messageVariables);
            nextState = "GETTING_NAME";
          }
        } else {
          const { data: foundItem, error: itemError } = await supabase.from("menu_items").select("id, name, price").eq("user_id", restaurantId).ilike("name", `%${message}%`).limit(1).single<MenuItem>();
          if (itemError || !foundItem) {
            responseMessage = `Não encontrei o item "${message}". Por favor, verifique o nome e tente novamente.\n\n` + formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          } else {
            const existingItemIndex = cart.findIndex((item) => item.id === foundItem.id);
            if (existingItemIndex > -1) {
              cart[existingItemIndex].quantity += 1;
            } else {
              cart.push({ ...foundItem, quantity: 1 });
            }
            const total = formatCurrency(getCartTotal(cart));
            responseMessage = formatMessage(getResponse("ITEM_ADDED"), { item_name: foundItem.name, total_carrinho: total }) + "\n\n" + formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          }
        }
        break;

      case "GETTING_NAME":
        conversation.customer_name = message.split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" "); // Capitalize name
        
        const { data: orderData, error: orderError } = await supabase.from("orders").insert({ restaurant_id: restaurantId, customer_name: conversation.customer_name, total_price: getCartTotal(cart), status: "pending" }).select("id").single();
        if (orderError) throw orderError;

        const orderItems = cart.map(item => ({ order_id: orderData.id, menu_item_id: item.id, quantity: item.quantity, item_name: item.name, price_per_item: item.price }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;

        cart = []; // Clear cart
        responseMessage = formatMessage(getResponse("ORDER_FINALIZED"), { customer_name: conversation.customer_name });
        nextState = "MAIN_MENU";
        break;

      default:
        responseMessage = formatMessage(getResponse("ERROR"), messageVariables);
        nextState = "MAIN_MENU";
        break;
    }

    // Update conversation in DB
    const { error: updateError } = await supabase.from("whatsapp_conversations").update({ current_state: nextState, cart: cart, customer_name: conversation.customer_name }).eq("id", conversation.id);
    if (updateError) throw updateError;

    return sendResponse(responseMessage);
  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});