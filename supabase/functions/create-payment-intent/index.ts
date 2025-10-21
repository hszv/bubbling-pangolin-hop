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

type Coupon = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cartItems, restaurantId, couponCode } = await req.json();

    if (!cartItems || !restaurantId || cartItems.length === 0) {
      throw new Error("Dados do carrinho ou ID do restaurante ausentes.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Security Step 1: Fetch item prices from the database ---
    const itemIds = cartItems.map((item: { id: string }) => item.id);
    const { data: menuItems, error: dbError } = await supabaseAdmin
      .from("menu_items")
      .select("id, price")
      .in("id", itemIds);

    if (dbError) throw dbError;

    const priceMap = new Map(menuItems.map((item: { id: string; price: number }) => [item.id, item.price]));
    const subtotal = cartItems.reduce((total: number, item: { id: string; quantity: number }) => {
      const price = priceMap.get(item.id) || 0;
      return total + price * item.quantity;
    }, 0);

    // --- Security Step 2: Validate coupon and calculate discount ---
    let discountAmount = 0;
    let finalAmount = subtotal;
    let appliedCoupon: Coupon | null = null;

    if (couponCode) {
      const { data: couponData, error: couponError } = await supabaseAdmin
        .from("coupons")
        .select("code, discount_type, discount_value")
        .eq("user_id", restaurantId)
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single<Coupon>();
      
      if (couponError) {
        console.warn(`Coupon validation failed for code ${couponCode}:`, couponError.message);
      } else if (couponData) {
        appliedCoupon = couponData;
        if (couponData.discount_type === 'fixed') {
          discountAmount = Math.min(couponData.discount_value, subtotal);
        } else if (couponData.discount_type === 'percentage') {
          discountAmount = (subtotal * couponData.discount_value) / 100;
        }
        finalAmount = subtotal - discountAmount;
      }
    }

    if (finalAmount <= 0 && subtotal > 0) {
      finalAmount = 0; // Cannot be negative, but can be zero for 100% discount
    } else if (finalAmount < 0.50 && subtotal > 0) { // Stripe minimum charge is ~$0.50
        throw new Error("O valor final do pedido é muito baixo para ser processado.");
    }


    // Create a Payment Intent with the server-calculated final amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Amount in cents
      currency: "brl",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        restaurant_id: restaurantId,
        cart_items: JSON.stringify(cartItems.map((item: {id: string, quantity: number, name: string}) => ({id: item.id, qty: item.quantity, name: item.name}))),
        applied_coupon: appliedCoupon?.code || 'None',
        discount_amount: discountAmount,
      }
    });

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