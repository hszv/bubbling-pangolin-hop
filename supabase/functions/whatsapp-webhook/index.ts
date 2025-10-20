import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to format Twilio's TwiML response
const sendResponse = (message: string) => {
  const twilioResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new Response(twilioResponse, {
    headers: { ...corsHeaders, "Content-Type": "text/xml" },
  });
};

// Helper to replace placeholders in messages
const formatMessage = (text: string, variables: Record<string, string>) => {
  let formattedText = text;
  for (const key in variables) {
    formattedText = formattedText.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
  }
  return formattedText;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use service role key for server-side operations
    );

    const body = await req.formData();
    const customerPhone = body.get("From")?.toString().replace("whatsapp:", "");
    const restaurantPhone = body.get("To")?.toString().replace("whatsapp:", "");
    const message = body.get("Body")?.toString().toLowerCase().trim();

    if (!customerPhone || !restaurantPhone || !message) {
      return new Response("Missing parameters", { status: 400, headers: corsHeaders });
    }

    // 1. Find the restaurant
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, restaurant_name")
      .eq("whatsapp_number", restaurantPhone.replace("+", ""))
      .single();

    if (profileError || !profile) {
      console.error("Profile not found for number:", restaurantPhone, profileError);
      return new Response("Restaurant not configured", { status: 404, headers: corsHeaders });
    }
    const restaurantId = profile.id;

    // 2. Fetch all custom responses for this restaurant
    const { data: responsesData, error: responsesError } = await supabase
      .from("whatsapp_responses")
      .select("message_type, message_text")
      .eq("restaurant_id", restaurantId);
    
    if (responsesError) throw responsesError;
    
    const responses = new Map(responsesData.map(r => [r.message_type, r.message_text]));
    const getResponse = (type: string) => responses.get(type) || `(Mensagem para '${type}' não configurada)`;

    // 3. Find or create a conversation
    let { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("customer_phone", customerPhone)
      .eq("restaurant_id", restaurantId)
      .single();

    let isNewConversation = false;
    if (!conversation) {
      isNewConversation = true;
      const { data: newConv, error: newConvError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          customer_phone: customerPhone,
          restaurant_id: restaurantId,
          current_state: "GREETING",
          cart: [],
        })
        .select()
        .single();
      if (newConvError) throw newConvError;
      conversation = newConv;
    }

    // 4. State Machine Logic
    let responseMessage = "";
    let nextState = conversation.current_state;

    const messageVariables = {
      restaurant_name: profile.restaurant_name,
      customer_name: conversation.customer_name || 'cliente',
    };

    if (isNewConversation) {
      conversation.current_state = "GREETING";
    }

    switch (conversation.current_state) {
      case "GREETING":
        responseMessage = formatMessage(getResponse("GREETING"), messageVariables) + "\n\n" + formatMessage(getResponse("MAIN_MENU"), messageVariables);
        nextState = "MAIN_MENU";
        break;

      case "MAIN_MENU":
        if (message.includes("1") || message.includes("cardapio") || message.includes("menu")) {
          // Note: This assumes the app is hosted at a URL derived from the Supabase URL.
          const appUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace('supabase.co', 'vercel.app');
          const menuUrl = `${appUrl}/menu/${restaurantId}`;
          responseMessage = `Aqui está o nosso cardápio completo: ${menuUrl}\n\n` + formatMessage(getResponse("MAIN_MENU"), messageVariables);
          nextState = "MAIN_MENU";
        } else if (message.includes("2") || message.includes("pedido")) {
          responseMessage = formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
          nextState = "ORDERING";
        } else if (message.includes("ajuda")) {
          responseMessage = formatMessage(getResponse("HELP"), messageVariables);
          nextState = "MAIN_MENU";
        } else {
          responseMessage = formatMessage(getResponse("ERROR"), messageVariables) + "\n\n" + formatMessage(getResponse("MAIN_MENU"), messageVariables);
          nextState = "MAIN_MENU";
        }
        break;
      
      case "ORDERING":
        responseMessage = `Ok, vamos começar seu pedido! (Lógica de pedido em desenvolvimento). Você disse: "${message}".\n\n` + formatMessage(getResponse("ORDER_PROMPT"), messageVariables);
        nextState = "ORDERING";
        break;

      default:
        responseMessage = formatMessage(getResponse("ERROR"), messageVariables);
        nextState = "MAIN_MENU"; // Reset state if it's unknown
        break;
    }

    // 5. Update conversation state in DB
    if (nextState !== conversation.current_state) {
      const { error: updateError } = await supabase
        .from("whatsapp_conversations")
        .update({ current_state: nextState })
        .eq("id", conversation.id);
      if (updateError) throw updateError;
    }

    // 6. Send the reply
    return sendResponse(responseMessage);

  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});