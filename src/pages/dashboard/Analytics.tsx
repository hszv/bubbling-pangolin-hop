import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { AlertTriangle, TrendingUp, Package, HelpCircle } from "lucide-react";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip as ShadTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { ItemPopularityAnalytics } from "@/components/dashboard/analytics/ItemPopularityAnalytics";
import { Separator } from "@/components/ui/separator";

type AnalyticsEvent = {
  event_type: string;
  created_at: string;
  metadata: { item_id: string } | null;
};

type SalesPerformanceData = {
  item_name: string;
  total_quantity_sold: number;
  total_revenue: number;
};

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Componente para a aba de Visão Geral (Cliques e Visualizações)
const OverviewAnalytics = () => {
  const { restaurantId } = useAuth();
  const fetchAnalyticsData = async () => {
    if (!restaurantId) throw new Error("ID do restaurante não encontrado");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("menu_analytics")
      .select("event_type, created_at, metadata")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", thirtyDaysAgo.toISOString());
    if (error) throw error;
    return data;
  };

  const { data: analytics, isLoading, error } = useQuery<AnalyticsEvent[]>({
    queryKey: ["analytics", restaurantId],
    queryFn: fetchAnalyticsData,
    enabled: !!restaurantId,
  });

  const processedData = useMemo(() => {
    if (!analytics) return { views: [], clicks: [] };
    const viewsByDay = analytics.filter(e => e.event_type === "menu_view").reduce((acc, curr) => {
      const day = new Date(curr.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      views: Object.entries(viewsByDay).map(([name, views]) => ({ name, views })).reverse(),
    };
  }, [analytics]);

  if (isLoading) return <div className="grid md:grid-cols-2 gap-6"><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /></div>;
  if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar os dados de visualização.</AlertDescription></Alert>;

  return (
    <div className="space-y-6 mt-6">
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
          ) : (
            <p className="text-muted-foreground text-center py-12">Nenhuma visualização registrada.</p>
          )}
        </CardContent>
      </Card>
      <Separator />
      <ItemPopularityAnalytics />
    </div>
  );
};

// Componente para a aba de Performance de Vendas
const SalesPerformanceAnalytics = () => {
  const { restaurantId } = useAuth();
  const fetchSalesData = async () => {
    if (!restaurantId) throw new Error("ID do restaurante não encontrado");
    const { data, error } = await supabase.rpc('get_menu_item_performance', { restaurant_id_param: restaurantId });
    if (error) throw error;
    return data;
  };

  const { data: salesData, isLoading, error } = useQuery<SalesPerformanceData[]>({
    queryKey: ["salesPerformance", restaurantId],
    queryFn: fetchSalesData,
    enabled: !!restaurantId,
  });

  const abcAnalysis = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    const totalRevenue = salesData.reduce((sum, item) => sum + item.total_revenue, 0);
    let cumulativePercentage = 0;
    return salesData.map(item => {
      const percentage = (item.total_revenue / totalRevenue) * 100;
      cumulativePercentage += percentage;
      let classification = 'C';
      if (cumulativePercentage <= 80) classification = 'A';
      else if (cumulativePercentage <= 95) classification = 'B';
      return { ...item, percentage, cumulativePercentage, classification };
    });
  }, [salesData]);

  if (isLoading) return <div className="grid lg:grid-cols-2 gap-6 mt-6"><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /></div>;
  if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar os dados de vendas. Verifique se já existem pedidos concluídos.</AlertDescription></Alert>;
  if (!salesData || salesData.length === 0) return <div className="text-center py-16 border-2 border-dashed rounded-lg mt-6"><h2 className="text-xl font-semibold">Nenhum dado de venda encontrado</h2><p className="text-muted-foreground mt-2">Comece a registrar pedidos concluídos para ver as análises.</p></div>;

  const topRevenue = [...salesData].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10);
  const topQuantity = [...salesData].sort((a, b) => b.total_quantity_sold - a.total_quantity_sold).slice(0, 10);

  return (
    <div className="space-y-6 mt-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2">Top 10 Itens por Faturamento <TrendingUp className="h-5 w-5" /></CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={topRevenue} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={formatCurrency} /><YAxis type="category" dataKey="item_name" width={100} tick={{ fontSize: 12 }} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Bar dataKey="total_revenue" fill="hsl(var(--primary))" name="Faturamento" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2">Top 10 Itens por Quantidade Vendida <Package className="h-5 w-5" /></CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={topQuantity} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="item_name" width={100} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="total_quantity_sold" fill="hsl(var(--primary))" name="Quantidade" /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Análise de Produtos (Curva ABC)
            <ShadTooltip>
              <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent><p className="max-w-xs">A Curva ABC classifica seus produtos por importância de faturamento. Itens 'A' são os mais importantes (aprox. 80% da receita), 'B' são intermediários (aprox. 15%) e 'C' são os menos significativos (aprox. 5%).</p></TooltipContent>
            </ShadTooltip>
          </CardTitle>
          <CardDescription>Classificação de todos os seus produtos vendidos com base no faturamento gerado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Classificação</TableHead><TableHead className="text-right">Qtd. Vendida</TableHead><TableHead className="text-right">Faturamento</TableHead><TableHead className="text-right">% do Total</TableHead></TableRow></TableHeader><TableBody>{abcAnalysis.map(item => (<TableRow key={item.item_name}><TableCell className="font-medium">{item.item_name}</TableCell><TableCell><Badge variant={item.classification === 'A' ? 'default' : item.classification === 'B' ? 'secondary' : 'outline'}>{item.classification}</Badge></TableCell><TableCell className="text-right">{item.total_quantity_sold}</TableCell><TableCell className="text-right">{formatCurrency(item.total_revenue)}</TableCell><TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell></TableRow>))}</TableBody></Table></div>
        </CardContent>
      </Card>
    </div>
  );
};

const Analytics = () => {
  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Dashboard Analítico">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Análises</h1>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Performance de Vendas</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewAnalytics />
          </TabsContent>
          <TabsContent value="sales">
            <FeatureGuard requiredPlan="Premium" featureName="Análise de Vendas">
              <SalesPerformanceAnalytics />
            </FeatureGuard>
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGuard>
  );
};

export default Analytics;