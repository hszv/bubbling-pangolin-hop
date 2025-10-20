import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Star } from "lucide-react";
import type { SurveyWithCount } from "@/pages/dashboard/Surveys";

interface SurveyResponsesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  survey: SurveyWithCount | null;
}

type SurveyResponse = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />)}
  </div>
);

export function SurveyResponsesDialog({ isOpen, onClose, survey }: SurveyResponsesDialogProps) {
  const fetchResponses = async () => {
    if (!survey) return [];
    const { data, error } = await supabase.from("survey_responses").select("id, rating, comment, created_at").eq("survey_id", survey.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  };

  const { data: responses, isLoading, error } = useQuery<SurveyResponse[]>({
    queryKey: ["surveyResponses", survey?.id],
    queryFn: fetchResponses,
    enabled: !!survey && isOpen,
  });

  const averageRating = responses && responses.length > 0 ? (responses.reduce((acc, r) => acc + r.rating, 0) / responses.length).toFixed(1) : "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Respostas da Pesquisa</DialogTitle>
          <DialogDescription className="truncate">"{survey?.question}"</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-center mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Nota Média</p>
            <p className="text-3xl font-bold">{averageRating}</p>
          </div>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {error && <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar as respostas.</AlertDescription></Alert>}
          {responses && responses.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
              {responses.map(res => (
                <div key={res.id} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <StarRating rating={res.rating} />
                    <span className="text-xs text-muted-foreground">{new Date(res.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {res.comment && <p className="text-sm text-muted-foreground mt-1 italic">"{res.comment}"</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma resposta ainda.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}