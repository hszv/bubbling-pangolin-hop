import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useState } from "react";
import { Star } from "lucide-react";

interface ReviewSheetProps {
  restaurantId: string;
}

const formSchema = z.object({
  reviewer_name: z.string().min(2, "O nome é obrigatório."),
  rating: z.number().min(1, "A nota é obrigatória.").max(5),
  comment: z.string().optional(),
});

export function ReviewSheet({ restaurantId }: ReviewSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reviewer_name: "",
      rating: 0,
      comment: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { error } = await supabase.from("reviews").insert({
        ...values,
        restaurant_id: restaurantId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicMenu", restaurantId] });
      showSuccess("Sua avaliação foi enviada com sucesso!");
      setIsOpen(false);
      form.reset();
    },
    onError: (error) => {
      showError(`Erro ao enviar avaliação: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="custom-primary-bg">Deixar uma Avaliação</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Deixe sua Avaliação</SheetTitle>
          <SheetDescription>
            Conte-nos sobre sua experiência. Sua opinião é muito importante!
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="reviewer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome Sobrenome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua Nota</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => field.onChange(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 cursor-pointer ${
                              star <= field.value
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva sua experiência..." {...field} />
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
                {mutation.isPending ? "Enviando..." : "Enviar Avaliação"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}