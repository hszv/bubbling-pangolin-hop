import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TableSheet } from "@/components/dashboard/tables/TableSheet";
import { TableCard } from "@/components/dashboard/tables/TableCard";

export type RestaurantTable = {
  id: string;
  restaurant_id: string;
  table_number: string;
  status: 'Livre' | 'Ocupada' | 'Reservada' | 'Limpando';
  created_at: string;
};

const Tables = () => {
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchTables = async () => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("restaurant_id", user.id)
      .order("table_number");
    if (error) throw error;
    return data;
  };

  const { data: tables, isLoading, error } = useQuery<RestaurantTable[]>({
    queryKey: ["tables", user?.id],
    queryFn: fetchTables,
    enabled: !!user,
  });

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gestão de Mesas">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Mesas</h1>
          <Button onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Mesa
          </Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>Não foi possível carregar as mesas.</AlertDescription>
          </Alert>
        )}

        {tables && tables.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        )}

        {tables && tables.length === 0 && (
           <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">Nenhuma mesa cadastrada</h2>
            <p className="text-muted-foreground mt-2">Clique em "Adicionar Mesa" para começar a organizar seu salão.</p>
          </div>
        )}

        <TableSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
      </div>
    </FeatureGuard>
  );
};

export default Tables;