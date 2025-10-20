import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";

type ItemPopularity = {
  item_name: string;
  click_count: number;
};

export const ItemPopularityAnalytics = () => {
  const { user } = useAuth();

  const fetchItemPopularity = async () => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { data, error } = await supabase.rpc('get_item_click_popularity', {
      restaurant_id_param: user.id
    });
    if (error) throw error;
    return data;
  };

  const { data, isLoading, error } = useQuery<ItemPopularity[]>({
    queryKey: ["itemPopularity", user?.id],
    queryFn: fetchItemPopularity,
    enabled: !!user,
  });

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { top: [], bottom: [] };
    const topItems = data.slice(0, 5);
    const bottomItems = data.length > 5 ? data.slice(-5).reverse() : [];
    return { top: topItems, bottom: bottomItems };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Não foi possível carregar os dados de popularidade dos itens.</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg mt-6">
        <h3 className="text-lg font-semibold">Nenhum dado de clique encontrado</h3>
        <p className="text-sm text-muted-foreground">Os dados aparecerão aqui quando os clientes começarem a clicar nos itens do seu cardápio.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Itens Mais Populares</CardTitle>
          <CardDescription>Os itens que mais receberam cliques no seu cardápio.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.top} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="item_name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="click_count" fill="hsl(var(--primary))" name="Cliques" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {processedData.bottom.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Itens Menos Populares</CardTitle>
            <CardDescription>Itens com menos cliques. Considere revisar fotos ou descrições.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processedData.bottom} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="item_name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="click_count" fill="hsl(var(--muted-foreground))" name="Cliques" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};