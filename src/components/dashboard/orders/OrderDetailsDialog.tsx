import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/pages/dashboard/Orders";

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: (Order & { coupon_code?: string | null; discount_amount?: number | null; }) | null;
}

type OrderItem = {
  id: string;
  item_name: string;
  quantity: number;
  price_per_item: number;
};

export function OrderDetailsDialog({ isOpen, onClose, order }: OrderDetailsDialogProps) {
  const fetchOrderItems = async () => {
    if (!order) return [];
    const { data, error } = await supabase
      .from("order_items")
      .select("id, item_name, quantity, price_per_item")
      .eq("order_id", order.id);
    if (error) throw error;
    return data;
  };

  const { data: items, isLoading, error: queryError } = useQuery<OrderItem[]>({
    queryKey: ["orderDetails", order?.id],
    queryFn: fetchOrderItems,
    enabled: !!order && isOpen,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido</DialogTitle>
          <DialogDescription>
            Pedido de <span className="font-semibold">{order?.customer_name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading && <Skeleton className="h-32 w-full" />}
          {queryError && <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar os itens.</AlertDescription></Alert>}
          {items && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qtd.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price_per_item * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 space-y-1">
                {order?.discount_amount && order.discount_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency((order.total_price ?? 0) + (order.discount_amount ?? 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Desconto ({order.coupon_code}):</span>
                      <span>- {formatCurrency(order.discount_amount)}</span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t text-right font-bold text-lg">
                  Total: {formatCurrency(order?.total_price ?? 0)}
                </div>
              </div>
              {order?.notes && (
                <div className="mt-4">
                  <p className="font-semibold">Observações:</p>
                  <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">{order.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}