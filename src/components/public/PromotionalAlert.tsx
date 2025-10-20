import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type Alert = {
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
};

interface PromotionalAlertProps {
  alert: Alert | null;
}

export function PromotionalAlert({ alert }: PromotionalAlertProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasBeenShown = sessionStorage.getItem('promoAlertShown');
    if (!hasBeenShown && alert) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('promoAlertShown', 'true');
      }, 10000); // Mostra após 10 segundos

      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (!alert) return null;

  const handleActionClick = () => {
    if (alert.link_url) {
      window.open(alert.link_url, '_blank');
    }
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        {alert.image_url && <img src={alert.image_url} alt={alert.title} className="w-full h-40 object-cover rounded-t-lg -mt-6 -mx-6 mb-4" />}
        <AlertDialogHeader>
          <AlertDialogTitle>{alert.title}</AlertDialogTitle>
          {alert.description && <AlertDialogDescription>{alert.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Fechar</Button>
          <Button onClick={handleActionClick} className="custom-primary-bg">
            {alert.link_url ? 'Ver Oferta' : 'Entendi'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}