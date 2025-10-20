import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KitchenOrderCard } from "@/components/dashboard/kitchen/KitchenOrderCard";
import type { Order } from "@/pages/dashboard/Orders";
import notificationSound from "@/assets/notification.mp3";

const Kitchen = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const audio = new Audio(notificationSound);

  const fetchInitialOrders = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", user.id)
      .in("status", ["pending", "in_progress", "ready"])
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  };

  const { isLoading, error } = useQuery<Order[]>({
    queryKey: ["kitchenOrders", user?.id],
    queryFn: fetchInitialOrders,
    onSuccess: (data) => {
      setOrders(data);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`kitchen-orders:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [...prev, newOrder]);
            audio.play().catch(e => console.error("Error playing sound:", e));
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, audio]);

  const filterOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  const pendingOrders = filterOrdersByStatus("pending");
  const inProgressOrders = filterOrdersByStatus("in_progress");
  const readyOrders = filterOrdersByStatus("ready");

  return (
    <FeatureGuard requiredPlan="Premium" featureName="Painel da Cozinha">
      <div className="h-screen flex flex-col bg-muted/40">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold tracking-tight">Painel da Cozinha</h1>
        </div>
        {isLoading && <Skeleton className="w-full flex-1" />}
        {error && <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar os pedidos.</AlertDescription></Alert>}
        {!isLoading && !error && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-auto">
            <div className="bg-card rounded-lg p-4 flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Pendentes ({pendingOrders.length})</h2>
              <div className="space-y-4 overflow-y-auto">
                {pendingOrders.map((order) => (
                  <KitchenOrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
            <div className="bg-card rounded-lg p-4 flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Em Preparo ({inProgressOrders.length})</h2>
              <div className="space-y-4 overflow-y-auto">
                {inProgressOrders.map((order) => (
                  <KitchenOrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
            <div className="bg-card rounded-lg p-4 flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Prontos ({readyOrders.length})</h2>
              <div className="space-y-4 overflow-y-auto">
                {readyOrders.map((order) => (
                  <KitchenOrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default Kitchen;