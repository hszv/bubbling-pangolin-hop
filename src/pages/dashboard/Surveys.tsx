import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SurveysTable } from "@/components/dashboard/surveys/SurveysTable";
import { SurveySheet } from "@/components/dashboard/surveys/SurveySheet";

export type SurveyWithCount = {
  id: string;
  question: string;
  is_active: boolean;
  created_at: string;
  response_count: number;
};

const Surveys = () => {
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyWithCount | null>(null);

  const fetchSurveys = async () => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { data, error } = await supabase.rpc('get_surveys_with_response_count', {
      restaurant_id_param: user.id
    });
    if (error) throw error;
    return data;
  };

  const { data: surveys, isLoading, error } = useQuery<SurveyWithCount[]>({
    queryKey: ["surveys", user?.id],
    queryFn: fetchSurveys,
    enabled: !!user,
  });

  const handleEdit = (survey: SurveyWithCount) => {
    setSelectedSurvey(survey);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSurvey(null);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedSurvey(null);
  };

  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Pesquisas de Satisfação">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Pesquisas de Satisfação</h1>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Pesquisa
          </Button>
        </div>

        {isLoading && <Skeleton className="h-64 w-full" />}
        {error && <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar as pesquisas.</AlertDescription></Alert>}
        {surveys && <SurveysTable surveys={surveys} onEdit={handleEdit} />}

        <SurveySheet
          isOpen={isSheetOpen}
          onClose={handleSheetClose}
          survey={selectedSurvey}
        />
      </div>
    </FeatureGuard>
  );
};

export default Surveys;