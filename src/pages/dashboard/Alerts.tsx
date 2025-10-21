import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureGuard } from "@/components/FeatureGuard";
import { AlertsTable } from "@/components/dashboard/alerts/AlertsTable";
import { AlertSheet } from "@/components/dashboard/alerts/AlertSheet";
import { useAuth } from "@/contexts/AuthContext";

export type PromotionalAlert = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
};

const Alerts = () => {
  const { restaurantId } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PromotionalAlert | null>(null);

  const fetchAlerts = async () => {
    if (!restaurantId) throw new Error("ID do restaurante não encontrado");

    const { data, error } = await supabase
      .from("promotional_alerts")
      .select("*")
      .eq("user_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: alerts, isLoading, error } = useQuery<PromotionalAlert[]>({
    queryKey: ["alerts", restaurantId],
    queryFn: fetchAlerts,
    enabled: !!restaurantId,
  });

  const handleEdit = (alert: PromotionalAlert) => {
    setSelectedAlert(alert);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAlert(null);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedAlert(null);
  }

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Alertas Promocionais">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Alertas Promocionais</h1>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Alerta
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os alertas. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {alerts && <AlertsTable alerts={alerts} onEdit={handleEdit} />}

        <AlertSheet 
          isOpen={isSheetOpen}
          onClose={handleSheetClose}
          alert={selectedAlert}
        />
      </div>
    </FeatureGuard>
  );
};

export default Alerts;