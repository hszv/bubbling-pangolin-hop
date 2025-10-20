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

// !! AÇÃO NECESSÁRIA: Substitua pelos IDs de Preço do seu painel Stripe !!
const priceToPlanMap = {
  "price_xxxxxxxxxxxxxx": "Profissional",
  "price_yyyyyyyyyyyyyy": "Premium",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!;

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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeCustomerId = session.customer as string;
        const userId = session.client_reference_id!;
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        await supabaseAdmin.from("stripe_customers").upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
        });

        const priceId = subscription.items.data[0].price.id;
        const plan = priceToPlanMap[priceId];
        const renewalDate = new Date(subscription.current_period_end * 1000).toISOString();

        await supabaseAdmin.from("profiles").update({
          plan: plan,
          subscription_renews_at: renewalDate,
        }).eq("id", userId);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        
        const { data: customer } = await supabaseAdmin.from("stripe_customers").select("user_id").eq("stripe_customer_id", stripeCustomerId).single();
        if (customer) {
          const renewalDate = new Date(subscription.current_period_end * 1000).toISOString();
          await supabaseAdmin.from("profiles").update({
            subscription_renews_at: renewalDate,
          }).eq("id", customer.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        const { data: customer } = await supabaseAdmin.from("stripe_customers").select("user_id").eq("stripe_customer_id", stripeCustomerId).single();
        if (customer) {
          await supabaseAdmin.from("profiles").update({
            plan: "Básico",
            subscription_renews_at: null,
          }).eq("id", customer.user_id);
        }
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error processing webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});