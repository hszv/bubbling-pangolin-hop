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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";

interface InviteMemberSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  role: z.enum(["admin", "editor"], { required_error: "A função é obrigatória." }),
});

export function InviteMemberSheet({ isOpen, onClose }: InviteMemberSheetProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { error } = await supabase.from("invitations").insert({
        restaurant_id: user.id,
        email: values.email,
        role: values.role,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      showSuccess(`Convite enviado para ${variables.email}!`);
      onClose();
    },
    onError: (error) => {
      showError(`Erro ao enviar convite: ${error.message}`);
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Convidar Novo Membro</SheetTitle>
          <SheetDescription>
            Envie um convite para alguém se juntar à sua equipe. Eles receberão um link para se cadastrar.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-4">
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Função</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione uma função" /></SelectTrigger></FormControl><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="editor">Editor</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <SheetFooter className="pt-4">
              <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Enviando..." : "Enviar Convite"}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}