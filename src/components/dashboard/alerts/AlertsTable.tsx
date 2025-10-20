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
import type { PromotionalAlert } from "@/pages/dashboard/Alerts";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface AlertsTableProps {
  alerts: PromotionalAlert[];
  onEdit: (alert: PromotionalAlert) => void;
}

export function AlertsTable({ alerts, onEdit }: AlertsTableProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<PromotionalAlert | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: string, isActive: boolean }) => {
      const { error } = await supabase
        .from("promotional_alerts")
        .update({ is_active: isActive })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      showError(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const handleDeleteClick = (alert: PromotionalAlert) => {
    setAlertToDelete(alert);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChange = (alert: PromotionalAlert, isActive: boolean) => {
    mutation.mutate({ alertId: alert.id, isActive });
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) => handleStatusChange(alert, checked)}
                      />
                      <Badge variant={alert.is_active ? "default" : "outline"}>
                        {alert.is_active ? "Ativo" : "Inativo"}
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
                        <DropdownMenuItem onClick={() => onEdit(alert)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(alert)}>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Nenhum alerta encontrado. Crie seu primeiro alerta promocional!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {alertToDelete && (
        <DeleteAlertDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          alert={alertToDelete}
        />
      )}
    </>
  );
}