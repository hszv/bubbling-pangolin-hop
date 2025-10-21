import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";

interface CheckoutFormProps {
  orderId: string;
}

export function CheckoutForm({ orderId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/menu/payment-success?order_id=${orderId}`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      showError(error.message || "Ocorreu um erro com seu cartão.");
    } else {
      showError("Ocorreu um erro inesperado ao processar o pagamento.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button disabled={isLoading || !stripe || !elements} className="w-full mt-6 custom-primary-bg">
        {isLoading ? "Processando..." : "Pagar Agora"}
      </Button>
    </form>
  );
}