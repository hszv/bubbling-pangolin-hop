import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.3.0?target=deno&deno-std=0.132.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  const signingSecret = Deno.env.get("STRIPE_PAYMENT_WEBHOOK_SIGNING_SECRET")!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, signingSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(err.message, { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Find the order using the payment_intent_id
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ status: 'pending' }) // Update status from 'awaiting_payment' to 'pending'
        .eq('payment_intent_id', paymentIntent.id);

      if (error) {
        console.error(`Error updating order for payment intent ${paymentIntent.id}:`, error);
        throw error;
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error processing payment webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});