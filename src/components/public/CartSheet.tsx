import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, XCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface CartSheetProps {
  restaurantId: string;
}

export function CartSheet({ restaurantId }: CartSheetProps) {
  const { cartItems, cartCount, totalPrice, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon, appliedCoupon, discountAmount, finalPrice } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    await applyCoupon(couponCode, restaurantId);
    setCouponCode("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          customer_name: customerName,
          notes: notes,
          total_price: finalPrice,
          status: 'pending',
          coupon_code: appliedCoupon?.code,
          discount_amount: discountAmount,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error("Failed to create order.");

      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        item_name: item.name,
        price_per_item: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      showSuccess("Pedido enviado com sucesso!");
      clearCart();
      setIsCheckout(false);
      setCustomerName("");
      setNotes("");
    },
    onError: (error) => {
      showError(`Erro ao enviar pedido: ${error.message}`);
    },
  });

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      showError("Por favor, informe seu nome.");
      return;
    }
    mutation.mutate();
  };

  return (
    <Sheet onOpenChange={(open) => !open && setIsCheckout(false)}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg custom-primary-bg z-20">
          <ShoppingCart className="h-7 w-7" />
          {cartCount > 0 && (
            <Badge variant="destructive" className="absolute top-0 right-0">
              {cartCount}
            </Badge>
          )}
          <span className="sr-only">Abrir carrinho</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{isCheckout ? "Finalizar Pedido" : "Seu Carrinho"}</SheetTitle>
          <SheetDescription>
            {isCheckout ? "Confirme seus dados para enviar o pedido." : "Revise os itens do seu pedido."}
          </SheetDescription>
        </SheetHeader>
        
        {isCheckout ? (
          <form onSubmit={handleSubmitOrder} className="flex-grow flex flex-col">
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Seu Nome</Label>
                <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea id="notes" placeholder="Ex: Sem cebola, ponto da carne, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="mt-auto">
              <Button type="button" variant="outline" onClick={() => setIsCheckout(false)} className="w-full mb-2">
                Voltar para o Carrinho
              </Button>
              <Button type="submit" className="w-full custom-primary-bg" disabled={mutation.isPending}>
                {mutation.isPending ? "Enviando..." : `Enviar Pedido (${formatCurrency(finalPrice)})`}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex-grow flex flex-col">
            {cartItems.length > 0 ? (
              <div className="flex-grow overflow-y-auto -mx-6 px-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-4 border-b">
                    <img src={item.image_url || "/placeholder.svg"} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                    <div className="flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                        <span>{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground">Seu carrinho está vazio.</p>
              </div>
            )}
            <SheetFooter className="mt-auto">
              <div className="w-full space-y-2">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input placeholder="Código do Cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    <Button variant="outline" onClick={handleApplyCoupon}>Aplicar</Button>
                  </div>
                ) : (
                  <div className="text-sm text-green-600 dark:text-green-400 p-2 bg-green-500/10 rounded-md flex justify-between items-center">
                    <span>Cupom <b>{appliedCoupon.code}</b> aplicado!</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeCoupon}><XCircle className="h-4 w-4" /></Button>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Desconto:</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(finalPrice)}</span>
                </div>
                <Button onClick={() => setIsCheckout(true)} className="w-full custom-primary-bg" disabled={cartItems.length === 0}>
                  Finalizar Pedido
                </Button>
              </div>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}