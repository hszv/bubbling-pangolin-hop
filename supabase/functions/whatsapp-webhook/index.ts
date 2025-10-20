import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MenuItem = { id: string; name: string; price: number };
type CartItem = MenuItem & { quantity: number };
type Coupon = { code: string; discount_type: 'percentage' | 'fixed'; discount_value: number };
type Conversation = {
  id: string;
  customer_phone: string;
  restaurant_id: string;
  current_state: string;
  cart: CartItem[];
  customer_name: string | null;
  notes: string | null;
  applied_coupon: Coupon | null;
};

const sendResponse = (message: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
const formatMessage = (text: string, variables: Record<string, string | number>) => Object.entries(variables).reduce((acc, [key, value]) => acc.replace(new RegExp(`{${key}}`, "g"), String(value)), text);
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const getCartTotal = (cart: CartItem[]) => cart.reduce((total, item) => total + item.price * item.quantity, 0);

const calculateDiscount = (total: number, coupon: Coupon | null) => {
  if (!coupon) return 0;
  if (coupon.discount_type === 'fixed') return Math.min(coupon.discount_value, total);
  if (coupon.discount_type === 'percentage') return (total * coupon.discount_value) / 100;
  return 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const body = await req.formData();
    const customerPhone = body.get("From")?.toString().replace("whatsapp:", "");
    const restaurantPhone = body.get("To")?.toString().replace("whatsapp:", "");
    const message = body.get("Body")?.toString().toLowerCase().trim();

    if (!customerPhone || !restaurantPhone || !message) return new Response("Missing parameters", { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("id, restaurant_name").eq("whatsapp_number", restaurantPhone.replace("+", "")).single();
    if (!profile) return new Response("Restaurant not configured", { status: 404 });

    const { data: responsesData } = await supabase.from("whatsapp_responses").select("message_type, message_text").eq("restaurant_id", profile.id);
    const responses = new Map(responsesData?.map((r) => [r.message_type, r.message_text]));
    const getResponse = (type: string) => responses.get(type) || `(Mensagem para '${type}' não configurada)`;

    let { data: conversation } = await supabase.from("whatsapp_conversations").select<"*", Conversation>().eq("customer_phone", customerPhone).eq("restaurant_id", profile.id).single();
    if (!conversation) {
      const { data: newConv } = await supabase.from("whatsapp_conversations").insert({ customer_phone: customerPhone, restaurant_id: profile.id, current_state: "GREETING", cart: [] }).select<"*", Conversation>().single();
      conversation = newConv!;
    }

    let responseMessage = "";
    let nextState = conversation.current_state;
    let cart = conversation.cart || [];
    let applied_coupon = conversation.applied_coupon || null;
    const messageVariables = { restaurant_name: profile.restaurant_name, customer_name: conversation.customer_name || "cliente" };

    switch (conversation.current_state) {
      case "GREETING":
        responseMessage = formatMessage(getResponse("GREETING"), messageVariables) + "\n\n" + formatMessage(getResponse("MAIN_MENU"), messageVariables);
        nextState = "MAIN_MENU";
        break;

      case "MAIN_MENU":
        if (message.includes("1") || message.includes("cardapio")) {
          const menuUrl = `${Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".vercel.app")}/menu/${profile.id}`;
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
            responseMessage = "Seu carrinho está vazio.\n\n" + formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          } else {
            responseMessage = formatMessage(getResponse("CHECKOUT_CONFIRMATION"), { ...messageVariables, total_carrinho: formatCurrency(getCartTotal(cart)) });
            nextState = "CHECKOUT_CONFIRMATION";
          }
        } else {
          const { data: foundItem } = await supabase.from("menu_items").select("id, name, price").eq("user_id", profile.id).ilike("name", `%${message}%`).limit(1).single<MenuItem>();
          if (!foundItem) {
            responseMessage = `Não encontrei o item "${message}".\n\n` + formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          } else {
            const existingItemIndex = cart.findIndex((item) => item.id === foundItem.id);
            if (existingItemIndex > -1) cart[existingItemIndex].quantity += 1;
            else cart.push({ ...foundItem, quantity: 1 });
            responseMessage = formatMessage(getResponse("ITEM_ADDED"), { ...messageVariables, item_name: foundItem.name, total_carrinho: formatCurrency(getCartTotal(cart)) }) + "\n\n" + formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          }
        }
        break;

      case "CHECKOUT_CONFIRMATION":
        if (message.includes("sim")) {
          responseMessage = formatMessage(getResponse("COUPON_CODE_PROMPT"), messageVariables);
          nextState = "APPLYING_COUPON";
        } else {
          responseMessage = formatMessage(getResponse("CHECKOUT_NAME_PROMPT"), messageVariables);
          nextState = "GETTING_NAME";
        }
        break;

      case "APPLYING_COUPON":
        const { data: coupon } = await supabase.from("coupons").select<"*", Coupon>("code, discount_type, discount_value").eq("user_id", profile.id).eq("code", message.toUpperCase()).eq("is_active", true).single();
        if (coupon) {
          applied_coupon = coupon;
          const total = getCartTotal(cart);
          const discount = calculateDiscount(total, coupon);
          responseMessage = formatMessage(getResponse("COUPON_APPLIED"), { ...messageVariables, coupon_code: coupon.code, final_price: formatCurrency(total - discount) }) + "\n\n" + formatMessage(getResponse("CHECKOUT_NAME_PROMPT"), messageVariables);
          nextState = "GETTING_NAME";
        } else {
          responseMessage = formatMessage(getResponse("COUPON_INVALID"), messageVariables) + "\n\n" + formatMessage(getResponse("COUPON_CODE_PROMPT"), messageVariables);
        }
        break;

      case "GETTING_NAME":
        conversation.customer_name = message.split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" ");
        const total = getCartTotal(cart);
        const discount = calculateDiscount(total, applied_coupon);
        const { data: orderData } = await supabase.from("orders").insert({ restaurant_id: profile.id, customer_name: conversation.customer_name, total_price: total - discount, status: "pending", coupon_code: applied_coupon?.code, discount_amount: discount }).select("id").single();
        if (orderData) {
          const orderItems = cart.map(item => ({ order_id: orderData.id, menu_item_id: item.id, quantity: item.quantity, item_name: item.name, price_per_item: item.price }));
          await supabase.from("order_items").insert(orderItems);
        }
        cart = [];
        applied_coupon = null;
        responseMessage = formatMessage(getResponse("ORDER_FINALIZED"), { ...messageVariables, customer_name: conversation.customer_name });
        nextState = "MAIN_MENU";
        break;

      default:
        responseMessage = formatMessage(getResponse("ERROR"), messageVariables);
        nextState = "MAIN_MENU";
        break;
    }

    await supabase.from("whatsapp_conversations").update({ current_state: nextState, cart, customer_name: conversation.customer_name, applied_coupon }).eq("id", conversation.id);
    return sendResponse(responseMessage);
  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});