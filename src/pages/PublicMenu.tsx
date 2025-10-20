import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UtensilsCrossed, AlertTriangle, PlusCircle, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ReservationSheet } from "@/components/public/ReservationSheet";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ReviewSheet } from "@/components/public/ReviewSheet";
import { FloatingActionMenu } from "@/components/public/FloatingActionMenu";

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

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
};

type Profile = {
  restaurant_name: string;
  logo_url: string | null;
  primary_color: string | null;
  plan: string;
  whatsapp_number: string | null;
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
      />
    ))}
  </div>
);

const MenuContent = () => {
  const { userId } = useParams<{ userId: string }>();
  const { addToCart } = useCart();

  const fetchMenuData = async () => {
    if (!userId) throw new Error("ID do restaurante não fornecido.");

    const profilePromise = supabase.from("profiles").select("restaurant_name, logo_url, primary_color, plan, whatsapp_number").eq("id", userId).single<Profile>();
    const menuItemsPromise = supabase.from("menu_items").select("id, name, description, price, category, image_url").eq("user_id", userId).order("category");
    const bannersPromise = supabase.from("banners").select("id, title, description, image_url, link_url").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false });
    const reviewsPromise = supabase.from("reviews").select("id, rating, comment, reviewer_name, created_at").eq("restaurant_id", userId).order("created_at", { ascending: false });

    const [{ data: profile, error: profileError }, { data: menuItems, error: menuItemsError }, { data: banners, error: bannersError }, { data: reviews, error: reviewsError }] = await Promise.all([profilePromise, menuItemsPromise, bannersPromise, reviewsPromise]);

    if (profileError) throw new Error("Restaurante não encontrado.");
    if (menuItemsError) throw new Error("Não foi possível carregar o cardápio.");
    if (bannersError) throw new Error("Não foi possível carregar os banners.");
    if (reviewsError) throw new Error("Não foi possível carregar as avaliações.");

    return { profile, menuItems, banners, reviews };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["publicMenu", userId],
    queryFn: fetchMenuData,
    enabled: !!userId,
  });

  useEffect(() => {
    if (userId && data?.profile.plan !== 'Básico') {
      const logView = async () => {
        await supabase.from('menu_analytics').insert({ restaurant_id: userId, event_type: 'menu_view' });
      };
      logView();
    }
  }, [userId, data]);

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
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
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
  
  const canOrder = data?.profile.plan === 'Premium';
  const canReserve = data?.profile.plan === 'Profissional' || data?.profile.plan === 'Premium';
  const canReview = data?.profile.plan === 'Profissional' || data?.profile.plan === 'Premium';

  return (
    <div className="bg-background text-foreground">
      <style>{`.custom-primary-bg { background-color: var(--custom-primary, hsl(var(--primary))); } .custom-primary-text { color: var(--custom-primary, hsl(var(--primary))); }`}</style>
      
      <header className="py-8 text-center sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4">
          {data?.profile.logo_url ? <img src={data.profile.logo_url} alt={`Logo de ${data.profile.restaurant_name}`} className="h-20 w-20 object-contain mx-auto mb-4 rounded-md" /> : <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-4"><UtensilsCrossed className="h-10 w-10 text-muted-foreground" /></div>}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{data?.profile.restaurant_name}</h1>
          {userId && canReserve && <div className="mt-4"><ReservationSheet restaurantId={userId} /></div>}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {data?.banners && data.banners.length > 0 && (
          <section className="mb-12"><Carousel className="w-full max-w-4xl mx-auto"><CarouselContent>{data.banners.map((banner) => (<CarouselItem key={banner.id}><a href={banner.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block"><Card className="overflow-hidden"><CardContent className="p-0"><img src={banner.image_url} alt={banner.title} className="w-full aspect-[3/1] object-cover" /></CardContent></Card></a></CarouselItem>))}</CarouselContent><CarouselPrevious /><CarouselNext /></Carousel></section>
        )}

        {groupedMenu && Object.keys(groupedMenu).length > 0 ? (
          <div className="space-y-12">{Object.entries(groupedMenu).map(([category, items]) => (<section key={category}><h2 className="text-3xl font-bold tracking-tight mb-6 custom-primary-text border-b-2 border-current pb-2">{category}</h2><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{items.map((item) => (<Card key={item.id} className="overflow-hidden flex flex-col"><div className="flex flex-grow"><div className="flex-grow p-4 flex flex-col"><h3 className="text-lg font-semibold mb-1">{item.name}</h3>{item.description && <p className="text-sm text-muted-foreground mb-2 flex-grow">{item.description}</p>}<p className="font-semibold text-lg custom-primary-text mt-auto">{formatCurrency(item.price)}</p></div>{item.image_url && <img src={item.image_url} alt={item.name} className="w-32 h-full object-cover flex-shrink-0" />}</div>{canOrder && (<CardContent className="p-4 pt-0"><Button className="w-full custom-primary-bg" onClick={() => addToCart(item)}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button></CardContent>)}</Card>))}</div></section>))}</div>
        ) : <div className="text-center py-16"><h2 className="text-2xl font-semibold">Cardápio Vazio</h2><p className="text-muted-foreground mt-2">Este restaurante ainda não adicionou itens ao cardápio.</p></div>}
      </main>
      
      {userId && canReview && (
        <section className="container mx-auto px-4 py-12 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Avaliações de Clientes</h2>
            <ReviewSheet restaurantId={userId} />
          </div>
          {data?.reviews && data.reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{review.reviewer_name}</CardTitle>
                        <CardDescription>{new Date(review.created_at).toLocaleDateString("pt-BR")}</CardDescription>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic">"{review.comment || 'Nenhum comentário.'}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted rounded-lg">
              <p className="text-muted-foreground">Este restaurante ainda não recebeu avaliações.</p>
              <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar!</p>
            </div>
          )}
        </section>
      )}

      {userId && (canOrder || data?.profile.whatsapp_number) && (
        <FloatingActionMenu 
          restaurantId={userId} 
          restaurantWhatsApp={data?.profile.whatsapp_number} 
        />
      )}
      <Footer />
    </div>
  );
};

const PublicMenu = () => (
  <CartProvider>
    <MenuContent />
  </CartProvider>
);

export default PublicMenu;