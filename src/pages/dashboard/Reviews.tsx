import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureGuard } from "@/components/FeatureGuard";
import { ReviewsTable } from "@/components/dashboard/reviews/ReviewsTable";
import { useAuth } from "@/contexts/AuthContext";

export type Review = {
  id: string;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
};

const Reviews = () => {
  const { restaurantId } = useAuth();

  const fetchReviews = async () => {
    if (!restaurantId) throw new Error("ID do restaurante não encontrado");

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: reviews, isLoading, error } = useQuery<Review[]>({
    queryKey: ["reviews", restaurantId],
    queryFn: fetchReviews,
    enabled: !!restaurantId,
  });

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gerenciar Avaliações">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gerenciar Avaliações
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
              Não foi possível carregar as avaliações. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {reviews && <ReviewsTable reviews={reviews} />}
      </div>
    </FeatureGuard>
  );
};

export default Reviews;