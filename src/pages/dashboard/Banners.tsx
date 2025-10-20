import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureGuard } from "@/components/FeatureGuard";
import { BannersTable } from "@/components/dashboard/banners/BannersTable";
import { BannerSheet } from "@/components/dashboard/banners/BannerSheet";

export type Banner = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
};

const Banners = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: banners, isLoading, error } = useQuery<Banner[]>({
    queryKey: ["banners"],
    queryFn: fetchBanners,
  });

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBanner(null);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedBanner(null);
  }

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gerenciar Banners">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Banners</h1>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Banner
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
              Não foi possível carregar os banners. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {banners && <BannersTable banners={banners} onEdit={handleEdit} />}

        <BannerSheet 
          isOpen={isSheetOpen}
          onClose={handleSheetClose}
          banner={selectedBanner}
        />
      </div>
    </FeatureGuard>
  );
};

export default Banners;