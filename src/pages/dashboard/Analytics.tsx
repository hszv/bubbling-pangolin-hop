import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AnalyticsEvent = {
  event_type: string;
  created_at: string;
  metadata: { item_id: string } | null;
};

const Analytics = () => {
  const fetchAnalyticsData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("menu_analytics")
      .select("event_type, created_at, metadata")
      .eq("restaurant_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (error) throw error;
    return data;
  };

  const { data: analytics, isLoading, error } = useQuery<AnalyticsEvent[]>({
    queryKey: ["analytics"],
    queryFn: fetchAnalyticsData,
  });

  const processedData = useMemo(() => {
    if (!analytics) return { views: [], clicks: [] };

    const viewsByDay = analytics
      .filter((e) => e.event_type === "menu_view")
      .reduce((acc, curr) => {
        const day = format(new Date(curr.created_at), "dd/MM");
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const clicksByItem = analytics
      .filter((e) => e.event_type === "item_click" && e.metadata?.item_id)
      .reduce((acc, curr) => {
        const itemName = "Item " + curr.metadata!.item_id.substring(0, 6); // Placeholder name
        acc[itemName] = (acc[itemName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      views: Object.entries(viewsByDay).map(([name, views]) => ({ name, views })).reverse(),
      clicks: Object.entries(clicksByItem).map(([name, clicks]) => ({ name, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 10),
    };
  }, [analytics]);

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Dashboard Analítico">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Análises</h1>
        
        {isLoading && (
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os dados de análise. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {analytics && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualizações do Cardápio (Últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                {processedData.views.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.views}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="hsl(var(--primary))" name="Visualizações" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-center py-12">Nenhuma visualização registrada ainda.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Itens Mais Clicados (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                {processedData.clicks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.clicks} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Cliques" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-center py-12">Nenhum clique em itens registrado ainda.</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default Analytics;