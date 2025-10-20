import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { SurveySheet } from './SurveySheet';

interface SurveyToastProps {
  survey: { id: string; question: string };
}

export function SurveyToast({ survey }: SurveyToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 15000); // Mostra após 15 segundos

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Card className="fixed bottom-24 right-6 w-80 shadow-lg z-50 animate-in slide-in-from-bottom">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sua opinião é importante!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 truncate">{survey.question}</p>
          <Button className="w-full" onClick={() => setIsSheetOpen(true)}>
            Responder
          </Button>
        </CardContent>
      </Card>
      <SurveySheet
        survey={survey}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}