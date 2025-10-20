import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureGuard } from "@/components/FeatureGuard";
import { ReservationsTable } from "@/components/dashboard/reservations/ReservationsTable";

export type Reservation = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  reservation_date: string;
  party_size: number;
  status: string;
  notes: string | null;
  created_at: string;
};

const Reservations = () => {
  const fetchReservations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", user.id)
      .order("reservation_date", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: reservations, isLoading, error } = useQuery<Reservation[]>({
    queryKey: ["reservations"],
    queryFn: fetchReservations,
  });

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gerenciar Reservas">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gerenciar Reservas
        </h1>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar as reservas. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {reservations && <ReservationsTable reservations={reservations} />}
      </div>
    </FeatureGuard>
  );
};

export default Reservations;