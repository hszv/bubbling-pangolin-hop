import { QRCodeDisplay } from "@/components/dashboard/QRCodeDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { Utensils, ShoppingCart, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const Overview = () => {
  const { user, profile, restaurantId } = useAuth();

  const fetchOverviewData = async () => {
    if (!restaurantId || !profile) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const menuItemsPromise = supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", restaurantId);

    const ordersPromise = profile.plan === 'Premium' ? supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString()) : Promise.resolve({ count: 0, error: null });

    const reservationsPromise = (profile.plan === 'Profissional' || profile.plan === 'Premium') ? supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending") : Promise.resolve({ count: 0, error: null });

    const reviewsPromise = (profile.plan === 'Profissional' || profile.plan === 'Premium') ? supabase
      .from("reviews")
      .select("rating")
      .eq("restaurant_id", restaurantId) : Promise.resolve({ data: [], error: null });

    const [
      { count: menuItemsCount, error: menuItemsError },
      { count: ordersCount, error: ordersError },
      { count: reservationsCount, error: reservationsError },
      { data: reviewsData, error: reviewsError },
    ] = await Promise.all([menuItemsPromise, ordersPromise, reservationsPromise, reviewsPromise]);

    if (menuItemsError || ordersError || reservationsError || reviewsError) {
      console.error({ menuItemsError, ordersError, reservationsError, reviewsError });
      throw new Error("Falha ao buscar dados da visão geral.");
    }

    const avgRating = reviewsData && reviewsData.length > 0
      ? (reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length).toFixed(1)
      : "N/A";

    return {
      menuItemsCount: menuItemsCount ?? 0,
      ordersTodayCount: ordersCount ?? 0,
      pendingReservationsCount: reservationsCount ?? 0,
      averageRating: avgRating,
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: ["overviewData", restaurantId],
    queryFn: fetchOverviewData,
    enabled: !!restaurantId && !!profile,
  });

  const planLevel = {
    "Básico": 1,
    "Profissional": 2,
    "Premium": 3,
  }[profile?.plan || "Básico"];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Visão Geral
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Itens no Cardápio"
          value={data?.menuItemsCount ?? 0}
          icon={<Utensils className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        {planLevel >= 3 && (
          <StatCard 
            title="Pedidos Hoje"
            value={data?.ordersTodayCount ?? 0}
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
          />
        )}
        {planLevel >= 2 && (
          <StatCard 
            title="Reservas Pendentes"
            value={data?.pendingReservationsCount ?? 0}
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
          />
        )}
        {planLevel >= 2 && (
          <StatCard 
            title="Nota Média"
            value={data?.averageRating ?? "N/A"}
            icon={<Star className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
          />
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-8 flex flex-col justify-center">
          <h2 className="text-xl font-semibold mb-2">Bem-vindo, {profile?.restaurant_name}!</h2>
          <p className="text-muted-foreground mb-4">
            Use este painel para gerenciar seu cardápio, acompanhar pedidos e muito mais.
          </p>
          <Button asChild className="w-fit">
            <a href={`/menu/${restaurantId}`} target="_blank" rel="noopener noreferrer">
              Ver meu Cardápio
            </a>
          </Button>
        </div>
        <QRCodeDisplay />
      </div>
    </div>
  );
};

export default Overview;