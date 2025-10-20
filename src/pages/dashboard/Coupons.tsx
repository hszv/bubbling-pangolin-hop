import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureGuard } from "@/components/FeatureGuard";
import { CouponsTable } from "@/components/dashboard/coupons/CouponsTable";
import { CouponSheet } from "@/components/dashboard/coupons/CouponSheet";

export type Coupon = {
  id: string;
  user_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  created_at: string;
};

const Coupons = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: coupons, isLoading, error } = useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: fetchCoupons,
  });

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCoupon(null);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedCoupon(null);
  }

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gerenciar Cupons">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Cupons</h1>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cupom
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
              Não foi possível carregar os cupons. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {coupons && <CouponsTable coupons={coupons} onEdit={handleEdit} />}

        <CouponSheet 
          isOpen={isSheetOpen}
          onClose={handleSheetClose}
          coupon={selectedCoupon}
        />
      </div>
    </FeatureGuard>
  );
};

export default Coupons;