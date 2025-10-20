import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { showSuccess, showError } from "@/utils/toast";

const responseSchema = z.object({
  message_type: z.string(),
  message_text: z.string().min(1, "A mensagem não pode estar vazia."),
});

const formSchema = z.object({
  responses: z.array(responseSchema),
});

const messageTypes = [
  { type: 'GREETING', label: 'Saudação Inicial', description: 'A primeira mensagem que o cliente recebe.' },
  { type: 'MAIN_MENU', label: 'Menu Principal', description: 'Apresenta as opções principais (ver cardápio, etc.).' },
  { type: 'ORDER_PROMPT', label: 'Instrução de Pedido', description: 'Instrui o cliente sobre como adicionar itens.' },
  { type: 'ITEM_ADDED', label: 'Item Adicionado', description: 'Confirmação de que um item foi adicionado ao carrinho.' },
  { type: 'CHECKOUT_NAME_PROMPT', label: 'Solicitação de Nome', description: 'Pede o nome do cliente para finalizar.' },
  { type: 'ORDER_FINALIZED', label: 'Pedido Finalizado', description: 'Mensagem de agradecimento após a confirmação.' },
  { type: 'HELP', label: 'Mensagem de Ajuda', description: 'Instruções de como usar o assistente.' },
  { type: 'ERROR', label: 'Mensagem de Erro', description: 'Quando o assistente não entende o comando.' },
];

export function ResponsesForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchResponses = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("whatsapp_responses")
      .select("message_type, message_text")
      .eq("restaurant_id", user.id);
    if (error) throw error;

    // Ensure all message types exist
    const existingTypes = data.map(d => d.message_type);
    const missingTypes = messageTypes.filter(mt => !existingTypes.includes(mt.type));
    return [...data, ...missingTypes.map(mt => ({ message_type: mt.type, message_text: '' }))];
  };

  const { data: responses, isLoading, error } = useQuery({
    queryKey: ["whatsappResponses", user?.id],
    queryFn: fetchResponses,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: { responses: responses || [] },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "responses",
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const dataToUpsert = values.responses.map(r => ({
        restaurant_id: user.id,
        message_type: r.message_type,
        message_text: r.message_text,
      }));
      const { error } = await supabase.from("whatsapp_responses").upsert(dataToUpsert, { onConflict: 'restaurant_id, message_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappResponses"] });
      showSuccess("Respostas salvas com sucesso!");
    },
    onError: (err) => {
      showError(`Erro ao salvar: ${err.message}`);
    },
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar as respostas.</AlertDescription></Alert>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensagens do Assistente</CardTitle>
        <CardDescription>
          Personalize as respostas do seu bot. Use variáveis como `
          {'{restaurant_name}'}` que serão substituídas. Para o Menu Principal, instrua os clientes a responder com números ou palavras-chave (ex: '1. Ver Cardápio', '2. Fazer Pedido').
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
            {fields.map((field, index) => {
              const messageTypeInfo = messageTypes.find(mt => mt.type === field.message_type);
              if (!messageTypeInfo) return null;
              return (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`responses.${index}.message_text`}
                  render={({ field }) => (
                    <FormItem>
                      <Label>{messageTypeInfo.label}</Label>
                      <p className="text-xs text-muted-foreground">{messageTypeInfo.description}</p>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar Respostas"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}