import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import type { Coupon } from "@/pages/dashboard/Coupons";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CouponSheetProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

const formSchema = z.object({
  code: z.string().min(3, { message: "O código deve ter pelo menos 3 caracteres." }).transform(val => val.toUpperCase()),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive({ message: "O valor do desconto deve ser positivo." }),
});

export function CouponSheet({ isOpen, onClose, coupon }: CouponSheetProps) {
  const queryClient = useQueryClient();
  const { restaurantId } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: 0,
    },
  });

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code,
        discount_type: coupon.discount_type as "percentage" | "fixed",
        discount_value: coupon.discount_value,
      });
    } else {
      form.reset({
        code: "",
        discount_type: "percentage",
        discount_value: 0,
      });
    }
  }, [coupon, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!restaurantId) throw new Error("ID do restaurante não encontrado");

      const dataToUpsert = {
        ...values,
        user_id: restaurantId,
        id: coupon?.id,
      };

      const { error } = await supabase.from("coupons").upsert(dataToUpsert).select();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons", restaurantId] });
      showSuccess(`Cupom ${coupon ? 'atualizado' : 'criado'} com sucesso!`);
      onClose();
    },
    onError: (error) => {
      showError(`Erro: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{coupon ? "Editar Cupom" : "Adicionar Novo Cupom"}</SheetTitle>
          <SheetDescription>
            Crie um código de desconto para seus clientes.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="EX: PROMO10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Desconto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Desconto</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-4">
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}