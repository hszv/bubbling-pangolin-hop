import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureGuard } from "@/components/FeatureGuard";
import { OrdersTable } from "@/components/dashboard/orders/OrdersTable";

export type Order = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  notes: string | null;
  total_price: number;
  status: string;
  created_at: string;
};

const Orders = () => {
  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  return (
    <FeatureGuard requiredPlan="Premium" featureName="Gerenciar Pedidos">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gerenciar Pedidos
        </h1>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os pedidos. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {orders && <OrdersTable orders={orders} />}
      </div>
    </FeatureGuard>
  );
};

export default Orders;