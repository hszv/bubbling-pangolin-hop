import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { showError } from "@/utils/toast";
import type { Order } from "@/pages/dashboard/Orders";

interface KitchenOrderCardProps {
  order: Order;
}

type OrderItem = {
  item_name: string;
  quantity: number;
};

export function KitchenOrderCard({ order }: KitchenOrderCardProps) {
  const queryClient = useQueryClient();

  const fetchOrderItems = async () => {
    const { data, error } = await supabase
      .from("order_items")
      .select("item_name, quantity")
      .eq("order_id", order.id);
    if (error) throw error;
    return data;
  };

  const { data: items, isLoading } = useQuery<OrderItem[]>({
    queryKey: ["kitchenOrderItems", order.id],
    queryFn: fetchOrderItems,
  });

  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
    },
    onError: (error) => {
      showError(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{order.customer_name}</CardTitle>
          <span className="text-xs text-muted-foreground">{timeSince(order.created_at)} atrás</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 text-sm">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <ul className="space-y-1">
            {items?.map((item, index) => (
              <li key={index}>
                <span className="font-bold">{item.quantity}x</span> {item.item_name}
              </li>
            ))}
          </ul>
        )}
        {order.notes && (
          <>
            <Separator className="my-2" />
            <p className="text-xs italic text-amber-600">Obs: {order.notes}</p>
          </>
        )}
      </CardContent>
      <CardFooter className="p-4 flex gap-2">
        {order.status === 'pending' && (
          <Button className="w-full" onClick={() => mutation.mutate('in_progress')}>
            Iniciar Preparo
          </Button>
        )}
        {order.status === 'in_progress' && (
          <Button className="w-full" onClick={() => mutation.mutate('ready')}>
            Marcar como Pronto
          </Button>
        )}
        {order.status === 'ready' && (
          <Button className="w-full" variant="secondary" onClick={() => mutation.mutate('completed')}>
            Finalizar Pedido
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}