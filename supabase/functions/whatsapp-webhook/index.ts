import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This is a simplified state machine for the WhatsApp bot.
// In a real-world scenario, this would be more complex and robust.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // This assumes a Twilio-like webhook format.
    const body = await req.formData();
    const customerPhone = body.get("From")?.toString().replace("whatsapp:", "");
    const restaurantPhone = body.get("To")?.toString().replace("whatsapp:", "");
    const message = body.get("Body")?.toString().toLowerCase().trim();

    if (!customerPhone || !restaurantPhone || !message) {
      return new Response("Missing parameters", { status: 400, headers: corsHeaders });
    }

    // Find the restaurant profile by its WhatsApp number
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, restaurant_name")
      .eq("whatsapp_number", restaurantPhone.replace("+", ""))
      .single();

    if (profileError || !profile) {
      console.error("Profile not found for number:", restaurantPhone);
      return new Response("Restaurant not configured", { status: 404, headers: corsHeaders });
    }
    const restaurantId = profile.id;

    // Find or create a conversation
    let { data: conversation, error: convError } = await supabaseClient
      .from("whatsapp_conversations")
      .select("*")
      .eq("customer_phone", customerPhone)
      .eq("restaurant_id", restaurantId)
      .single();

    if (!conversation) {
      const { data: newConv, error: newConvError } = await supabaseClient
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

    // Simple state machine logic will go here.
    // For now, we'll just acknowledge the message.
    let responseMessage = `Obrigado por sua mensagem! O restaurante ${profile.restaurant_name} recebeu: "${message}". A lógica do bot ainda está em desenvolvimento.`;

    // In a real implementation, you would fetch customized responses
    // from the 'whatsapp_responses' table and use a state machine
    // to handle the conversation flow.

    const twilioResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${responseMessage}</Message></Response>`;

    return new Response(twilioResponse, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });

  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});