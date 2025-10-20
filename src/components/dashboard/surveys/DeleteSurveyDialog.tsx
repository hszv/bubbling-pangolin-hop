import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import type { SurveyWithCount } from "@/pages/dashboard/Surveys";

interface DeleteSurveyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  survey: SurveyWithCount;
}

export function DeleteSurveyDialog({ isOpen, onClose, survey }: DeleteSurveyDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("surveys").delete().eq("id", survey.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      showSuccess("Pesquisa excluída com sucesso!");
      onClose();
    },
    onError: (error) => {
      showError(`Erro ao excluir: ${error.message}`);
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente a pesquisa e todas as suas respostas.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}