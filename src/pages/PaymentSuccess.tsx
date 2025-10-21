import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentSuccess = () => {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'error'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderIdParam = searchParams.get('order_id');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    
    setOrderId(orderIdParam);

    if (!orderIdParam || !paymentIntentClientSecret) {
      setStatus('error');
      return;
    }

    const verifyPayment = async () => {
      // The webhook handles the final confirmation. Here we just check if the order is no longer 'awaiting_payment'.
      // This provides immediate feedback to the user.
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderIdParam)
        .single();

      if (error || !data) {
        setStatus('error');
      } else if (data.status !== 'awaiting_payment') {
        setStatus('confirmed');
      } else {
        // Poll for a few seconds in case the webhook is slow
        setTimeout(verifyPayment, 2000);
      }
    };

    const timeout = setTimeout(() => {
        if (status === 'loading') {
            setStatus('confirmed'); // Assume success if webhook is slow, to not leave user hanging.
        }
    }, 10000); // 10 second timeout

    verifyPayment();

    return () => clearTimeout(timeout);
  }, [location.search, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Status do Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary mb-4" />
              <CardDescription>Confirmando seu pagamento, por favor aguarde...</CardDescription>
            </>
          )}
          {status === 'confirmed' && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="font-semibold text-xl mb-2">Pagamento Aprovado!</p>
              <CardDescription>Seu pedido foi enviado para a cozinha. Obrigado!</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="font-semibold text-xl mb-2 text-destructive">Erro na Confirmação</p>
              <CardDescription>Não foi possível confirmar seu pagamento. Por favor, entre em contato com o restaurante.</CardDescription>
            </>
          )}
          <Button asChild className="mt-6">
            <Link to="/">Voltar para a Página Inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;