import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Banner } from "@/pages/dashboard/Banners";
import { DeleteBannerDialog } from "./DeleteBannerDialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface BannersTableProps {
  banners: Banner[];
  onEdit: (banner: Banner) => void;
}

export function BannersTable({ banners, onEdit }: BannersTableProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ bannerId, isActive }: { bannerId: string, isActive: boolean }) => {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: isActive })
        .eq("id", bannerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (error) => {
      showError(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChange = (banner: Banner, isActive: boolean) => {
    mutation.mutate({ bannerId: banner.id, isActive });
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">Imagem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.length > 0 ? (
              banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="hidden sm:table-cell">
                    <img
                      alt={banner.title}
                      className="aspect-video rounded-md object-cover"
                      height="64"
                      src={banner.image_url || "/placeholder.svg"}
                      width="128"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={(checked) => handleStatusChange(banner, checked)}
                      />
                      <Badge variant={banner.is_active ? "default" : "outline"}>
                        {banner.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(banner)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(banner)}>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhum banner encontrado. Crie seu primeiro banner promocional!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {bannerToDelete && (
        <DeleteBannerDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          banner={bannerToDelete}
        />
      )}
    </>
  );
}