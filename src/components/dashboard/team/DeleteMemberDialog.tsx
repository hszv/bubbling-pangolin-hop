import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import type { TeamMember } from "@/pages/dashboard/Team";

interface DeleteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
}

export function DeleteMemberDialog({ isOpen, onClose, member }: DeleteMemberDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("team_members").delete().eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      showSuccess("Membro removido com sucesso!");
      onClose();
    },
    onError: (error) => {
      showError(`Erro ao remover membro: ${error.message}`);
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação removerá permanentemente <span className="font-semibold">{member.users.email}</span> da sua equipe.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? "Removendo..." : "Remover"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}