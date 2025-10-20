import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UtensilsCrossed, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ReservationSheet } from "@/components/public/ReservationSheet";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
};

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
};

type Profile = {
  restaurant_name: string;
  logo_url: string | null;
  primary_color: string | null;
};

const PublicMenu = () => {
  const { userId } = useParams<{ userId: string }>();

  const fetchMenuData = async () => {
    if (!userId) throw new Error("ID do restaurante não fornecido.");

    const profilePromise = supabase
      .from("profiles")
      .select("restaurant_name, logo_url, primary_color")
      .eq("id", userId)
      .single<Profile>();

    const menuItemsPromise = supabase
      .from("menu_items")
      .select("id, name, description, price, category, image_url")
      .eq("user_id", userId)
      .order("category");
      
    const bannersPromise = supabase
      .from("banners")
      .select("id, title, description, image_url, link_url")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const [{ data: profile, error: profileError }, { data: menuItems, error: menuItemsError }, { data: banners, error: bannersError }] = await Promise.all([profilePromise, menuItemsPromise, bannersPromise]);

    if (profileError) throw new Error("Restaurante não encontrado.");
    if (menuItemsError) throw new Error("Não foi possível carregar o cardápio.");
    if (bannersError) throw new Error("Não foi possível carregar os banners.");

    return { profile, menuItems, banners };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["publicMenu", userId],
    queryFn: fetchMenuData,
    enabled: !!userId,
  });

  useEffect(() => {
    if (data?.profile.primary_color) {
      document.documentElement.style.setProperty('--custom-primary', data.profile.primary_color);
    }
    return () => {
      document.documentElement.style.removeProperty('--custom-primary');
    }
  }, [data]);

  const groupedMenu = data?.menuItems.reduce((acc, item) => {
    const category = item.category || "Outros";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <div className="space-y-8">
          <div>
            <Skeleton className="h-6 w-1/4 mb-4" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <style>
        {`
          .custom-primary-bg { background-color: var(--custom-primary, hsl(var(--primary))); }
          .custom-primary-text { color: var(--custom-primary, hsl(var(--primary))); }
        `}
      </style>
      <header className="py-8 text-center sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4">
          {data?.profile.logo_url ? (
            <img src={data.profile.logo_url} alt={`Logo de ${data.profile.restaurant_name}`} className="h-20 w-20 object-contain mx-auto mb-4 rounded-md" />
          ) : (
            <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-4">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{data?.profile.restaurant_name}</h1>
          {userId && (
            <div className="mt-4">
              <ReservationSheet restaurantId={userId} />
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {data?.banners && data.banners.length > 0 && (
          <section className="mb-12">
            <Carousel className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {data.banners.map((banner) => (
                  <CarouselItem key={banner.id}>
                    <a href={banner.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <img src={banner.image_url} alt={banner.title} className="w-full aspect-[3/1] object-cover" />
                        </CardContent>
                      </Card>
                    </a>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </section>
        )}

        {groupedMenu && Object.keys(groupedMenu).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedMenu).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-3xl font-bold tracking-tight mb-6 custom-primary-text border-b-2 border-current pb-2">
                  {category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="flex">
                        <div className="flex-grow p-4">
                          <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          )}
                          <p className="font-semibold text-lg custom-primary-text">{formatCurrency(item.price)}</p>
                        </div>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-32 h-32 object-cover flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">Cardápio Vazio</h2>
            <p className="text-muted-foreground mt-2">Este restaurante ainda não adicionou itens ao cardápio.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PublicMenu;