import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import type { TeamMember } from "@/pages/dashboard/Team";
import { useState } from "react";

interface EditMemberRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
}

export function EditMemberRoleDialog({ isOpen, onClose, member }: EditMemberRoleDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState(member.role);

  const mutation = useMutation({
    mutationFn: async (newRole: string) => {
      const { error } = await supabase.rpc('update_team_member_role', {
        member_id_param: member.id,
        new_role_param: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      showSuccess("Função do membro atualizada com sucesso!");
      onClose();
    },
    onError: (error) => {
      showError(`Erro ao atualizar função: ${error.message}`);
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedRole);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alterar Função</AlertDialogTitle>
          <AlertDialogDescription>
            Selecione a nova função para <span className="font-semibold">{member.users.email}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="role-select">Função</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Selecione uma função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}