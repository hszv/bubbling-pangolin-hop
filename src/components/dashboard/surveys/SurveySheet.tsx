import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";
import type { SurveyWithCount } from "@/pages/dashboard/Surveys";

interface SurveySheetProps {
  isOpen: boolean;
  onClose: () => void;
  survey: SurveyWithCount | null;
}

const formSchema = z.object({
  question: z.string().min(10, { message: "A pergunta deve ter pelo menos 10 caracteres." }),
});

export function SurveySheet({ isOpen, onClose, survey }: SurveySheetProps) {
  const queryClient = useQueryClient();
  const { restaurantId } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { question: "" },
  });

  useEffect(() => {
    if (survey) form.reset({ question: survey.question });
    else form.reset({ question: "" });
  }, [survey, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!restaurantId) throw new Error("ID do restaurante não autenticado.");
      const dataToUpsert = { ...values, restaurant_id: restaurantId, id: survey?.id };
      const { error } = await supabase.from("surveys").upsert(dataToUpsert).select();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys", restaurantId] });
      showSuccess(`Pesquisa ${survey ? 'atualizada' : 'criada'} com sucesso!`);
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
          <SheetTitle>{survey ? "Editar Pesquisa" : "Criar Nova Pesquisa"}</SheetTitle>
          <SheetDescription>Escreva uma pergunta clara para obter o melhor feedback dos seus clientes.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pergunta</FormLabel>
                  <FormControl><Textarea placeholder="Ex: De 1 a 5, qual a probabilidade de você nos recomendar a um amigo?" {...field} rows={4} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-4">
              <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Salvando..." : "Salvar"}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}