import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  restaurant_name: z.string().min(2, "O nome do restaurante é obrigatório."),
  logo_url: z.string().url("Insira uma URL válida para o logo.").optional().or(z.literal('')),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Insira uma cor hexadecimal válida (ex: #FFFFFF).").optional().or(z.literal('')),
  whatsapp_number: z.string().optional(),
});

const Settings = () => {
  const { profile, user, loading, refetchProfile, restaurantId } = useAuth();
  const isOwner = user?.id === restaurantId;

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      restaurant_name: "",
      logo_url: "",
      primary_color: "#000000",
      whatsapp_number: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        restaurant_name: profile.restaurant_name || "",
        logo_url: profile.logo_url || "",
        primary_color: profile.primary_color || "#000000",
        whatsapp_number: profile.whatsapp_number || "",
      });
    }
  }, [profile, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof settingsSchema>) => {
      if (!isOwner || !restaurantId) throw new Error("Apenas o proprietário pode alterar as configurações.");
      const { error } = await supabase
        .from('profiles')
        .update({
          restaurant_name: values.restaurant_name,
          logo_url: values.logo_url,
          primary_color: values.primary_color,
          whatsapp_number: values.whatsapp_number,
        })
        .eq('id', restaurantId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refetchProfile();
      showSuccess("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      showError(`Erro ao salvar: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    mutation.mutate(values);
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-link');
      if (error) throw error;
      window.location.href = data.url;
    } catch (error) {
      showError(`Erro ao abrir portal: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Configurações</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={!isOwner}>
              <Card>
                <CardHeader>
                  <CardTitle>Perfil do Restaurante</CardTitle>
                  <CardDescription>Personalize as informações e a aparência do seu cardápio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="restaurant_name" render={({ field }) => (<FormItem><FormLabel>Nome do Restaurante</FormLabel><FormControl><Input placeholder="Pizzaria do Sabor" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="logo_url" render={({ field }) => (<FormItem><FormLabel>URL do Logotipo</FormLabel><FormControl><Input placeholder="https://exemplo.com/logo.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="primary_color" render={({ field }) => (<FormItem><FormLabel>Cor Principal</FormLabel><div className="flex items-center gap-2"><FormControl><Input type="color" className="w-12 h-10 p-1" {...field} /></FormControl><Input placeholder="#FFFFFF" {...field} /></div><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="whatsapp_number" render={({ field }) => (<FormItem><FormLabel>Número do WhatsApp</FormLabel><FormControl><Input placeholder="5511999998888" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={mutation.isPending || !isOwner}>{mutation.isPending ? "Salvando..." : "Salvar Alterações"}</Button>
                </CardFooter>
              </Card>
            </fieldset>
          </form>
        </Form>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assinatura</CardTitle>
              <CardDescription>Gerencie seu plano e informações de pagamento.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Seu plano atual: <strong>{profile?.plan}</strong></p>
              {profile?.subscription_renews_at && (
                <p className="text-sm text-muted-foreground">
                  Sua assinatura renova em {new Date(profile.subscription_renews_at).toLocaleDateString('pt-BR')}.
                </p>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              {isOwner && profile?.plan !== 'Básico' ? (
                <Button onClick={handleManageSubscription}>Gerenciar Assinatura</Button>
              ) : (
                <p className="text-sm text-muted-foreground">Apenas o proprietário pode gerenciar a assinatura.</p>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;