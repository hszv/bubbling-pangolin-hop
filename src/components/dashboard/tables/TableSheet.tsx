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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";

interface TableSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  table_number: z.string().min(1, { message: "O nome/número da mesa é obrigatório." }),
});

export function TableSheet({ isOpen, onClose }: TableSheetProps) {
  const queryClient = useQueryClient();
  const { restaurantId } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { table_number: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!restaurantId) throw new Error("ID do restaurante não autenticado.");
      const { error } = await supabase
        .from("restaurant_tables")
        .insert({ ...values, restaurant_id: restaurantId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      showSuccess("Mesa adicionada com sucesso!");
      form.reset();
      onClose();
    },
    onError: (error) => {
      showError(`Erro: ${error.message}`);
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Nova Mesa</SheetTitle>
          <SheetDescription>
            Insira o nome ou número da mesa para adicioná-la ao seu salão.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="table_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome/Número da Mesa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mesa 05, Balcão 1" {...field} />
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
                {mutation.isPending ? "Adicionando..." : "Adicionar Mesa"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}