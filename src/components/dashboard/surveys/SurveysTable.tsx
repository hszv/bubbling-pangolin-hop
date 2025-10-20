import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import type { SurveyWithCount } from "@/pages/dashboard/Surveys";
import { DeleteSurveyDialog } from "./DeleteSurveyDialog";
import { SurveyResponsesDialog } from "./SurveyResponsesDialog";

interface SurveysTableProps {
  surveys: SurveyWithCount[];
  onEdit: (survey: SurveyWithCount) => void;
}

export function SurveysTable({ surveys, onEdit }: SurveysTableProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResponsesDialogOpen, setIsResponsesDialogOpen] = useState(false);
  const [surveyToAction, setSurveyToAction] = useState<SurveyWithCount | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ surveyId, isActive }: { surveyId: string, isActive: boolean }) => {
      const { error } = await supabase.from("surveys").update({ is_active: isActive }).eq("id", surveyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
    onError: (error) => {
      showError(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const handleDeleteClick = (survey: SurveyWithCount) => {
    setSurveyToAction(survey);
    setIsDeleteDialogOpen(true);
  };

  const handleViewResponsesClick = (survey: SurveyWithCount) => {
    setSurveyToAction(survey);
    setIsResponsesDialogOpen(true);
  };

  const handleStatusChange = (survey: SurveyWithCount, isActive: boolean) => {
    mutation.mutate({ surveyId: survey.id, isActive });
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pergunta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Respostas</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveys.length > 0 ? (
              surveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium max-w-md truncate">{survey.question}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={survey.is_active} onCheckedChange={(checked) => handleStatusChange(survey, checked)} />
                      <Badge variant={survey.is_active ? "default" : "outline"}>{survey.is_active ? "Ativa" : "Inativa"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{survey.response_count}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewResponsesClick(survey)} className="mr-2">
                      <LineChart className="h-4 w-4 mr-2" /> Ver Respostas
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(survey)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(survey)}>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma pesquisa encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {surveyToAction && (
        <>
          <DeleteSurveyDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} survey={surveyToAction} />
          <SurveyResponsesDialog isOpen={isResponsesDialogOpen} onClose={() => setIsResponsesDialogOpen(false)} survey={surveyToAction} />
        </>
      )}
    </>
  );
}