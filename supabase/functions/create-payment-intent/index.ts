import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.3.0?target=deno&deno-std=0.132.0";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cartItems, restaurantId } = await req.json();

    if (!cartItems || !restaurantId || cartItems.length === 0) {
      throw new Error("Dados do carrinho ou ID do restaurante ausentes.");
    }

    // Create a Supabase admin client to securely fetch product prices
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Security Step: Fetch prices from the database, not the client ---
    const itemIds = cartItems.map((item: { id: string }) => item.id);
    const { data: menuItems, error: dbError } = await supabaseAdmin
      .from("menu_items")
      .select("id, price")
      .in("id", itemIds);

    if (dbError) throw dbError;

    const priceMap = new Map(menuItems.map((item: { id: string; price: number }) => [item.id, item.price]));

    // Calculate total amount based on prices from the database
    const totalAmount = cartItems.reduce((total: number, item: { id: string; quantity: number }) => {
      const price = priceMap.get(item.id) || 0;
      return total + price * item.quantity;
    }, 0);

    if (totalAmount <= 0) {
      throw new Error("O valor total do pedido deve ser positivo.");
    }

    // Create a Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Amount in cents
      currency: "brl",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        restaurant_id: restaurantId,
        cart_items: JSON.stringify(cartItems.map((item: {id: string, quantity: number, name: string}) => ({id: item.id, qty: item.quantity, name: item.name}))),
      }
    });

    // Return the client secret to the frontend
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});