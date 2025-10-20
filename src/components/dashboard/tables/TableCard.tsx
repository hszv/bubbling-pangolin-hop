import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import type { RestaurantTable } from "@/pages/dashboard/Tables";
import { DeleteTableDialog } from "./DeleteTableDialog";

interface TableCardProps {
  table: RestaurantTable;
}

const getStatusStyles = (status: RestaurantTable['status']) => {
  switch (status) {
    case 'Livre':
      return { variant: "default", className: "bg-green-500" };
    case 'Ocupada':
      return { variant: "destructive", className: "" };
    case 'Reservada':
      return { variant: "secondary", className: "bg-blue-500" };
    case 'Limpando':
      return { variant: "outline", className: "bg-yellow-500 text-black" };
    default:
      return { variant: "secondary", className: "" };
  }
};

export function TableCard({ table }: TableCardProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const statusStyles = getStatusStyles(table.status);

  const mutation = useMutation({
    mutationFn: async (newStatus: RestaurantTable['status']) => {
      const { error } = await supabase
        .from("restaurant_tables")
        .update({ status: newStatus })
        .eq("id", table.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      showSuccess(`Mesa ${table.table_number} atualizada.`);
    },
    onError: (error) => {
      showError(`Erro: ${error.message}`);
    },
  });

  return (
    <>
      <Card className={`relative border-2 ${table.status === 'Livre' ? 'border-green-500' : 'border-transparent'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">{table.table_number}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => mutation.mutate('Livre')}>Marcar como Livre</DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutation.mutate('Ocupada')}>Marcar como Ocupada</DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutation.mutate('Reservada')}>Marcar como Reservada</DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutation.mutate('Limpando')}>Marcar como Limpando</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Mesa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Badge variant={statusStyles.variant} className={statusStyles.className}>
            {table.status}
          </Badge>
        </CardContent>
      </Card>
      <DeleteTableDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        table={table}
      />
    </>
  );
}