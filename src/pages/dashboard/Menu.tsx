import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MenuItemsTable } from "@/components/dashboard/menu/MenuItemsTable";
import { MenuItemSheet } from "@/components/dashboard/menu/MenuItemSheet";
import { useAuth } from "@/contexts/AuthContext";

export type MenuItem = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  created_at: string;
};

const Menu = () => {
  const { restaurantId } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const fetchMenuItems = async () => {
    if (!restaurantId) throw new Error("ID do restaurante não encontrado");

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("user_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: menuItems, isLoading, error } = useQuery<MenuItem[]>({
    queryKey: ["menuItems", restaurantId],
    queryFn: fetchMenuItems,
    enabled: !!restaurantId,
  });

  const handleEdit = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMenuItem(null);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedMenuItem(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Cardápio</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os itens do cardápio. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      )}

      {menuItems && <MenuItemsTable menuItems={menuItems} onEdit={handleEdit} />}

      <MenuItemSheet 
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        menuItem={selectedMenuItem}
      />
    </div>
  );
};

export default Menu;