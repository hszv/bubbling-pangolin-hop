import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { showError } from "@/utils/toast";
import { CheckoutForm } from "./CheckoutForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Make sure to add your publishable key to your environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  restaurantId: string;
}

export function CheckoutDialog({ isOpen, onOpenChange, restaurantId }: CheckoutDialogProps) {
  const { cartItems, finalPrice, appliedCoupon, discountAmount, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<'details' | 'payment'>('details');

  const createOrderAndPaymentIntent = async () => {
    if (!customerName) {
      showError("Por favor, informe seu nome.");
      return;
    }

    try {
      // 1. Create order in DB with 'awaiting_payment' status
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          customer_name: customerName,
          notes: notes,
          total_price: finalPrice,
          status: 'awaiting_payment',
          coupon_code: appliedCoupon?.code,
          discount_amount: discountAmount,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      setOrderId(orderData.id);

      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        item_name: item.name,
        price_per_item: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 2. Create Payment Intent via Edge Function
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
        body: { cartItems, restaurantId },
      });
      if (paymentError) throw paymentError;
      
      const secret = paymentData.clientSecret;
      const paymentIntentId = secret.split('_secret')[0];
      setClientSecret(secret);

      // 3. Update order with payment_intent_id
      const { error: updateError } = await supabase
        .from('orders')
        .update({ payment_intent_id: paymentIntentId })
        .eq('id', orderData.id);
      if (updateError) throw updateError;

      setStep('payment');

    } catch (error: any) {
      showError(`Erro ao iniciar pagamento: ${error.message}`);
    }
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagamento Online</DialogTitle>
          <DialogDescription>
            {step === 'details' ? "Preencha seus dados para continuar." : "Insira os dados do seu cartão para pagar."}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'details' && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Seu Nome</Label>
              <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" placeholder="Ex: Sem cebola, ponto da carne, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button onClick={createOrderAndPaymentIntent} className="w-full custom-primary-bg">
              Ir para Pagamento
            </Button>
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm orderId={orderId} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}