import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber: string;
}

export const WhatsAppButton = ({ phoneNumber }: WhatsAppButtonProps) => {
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 rounded-full h-16 w-16 shadow-lg flex items-center justify-center z-20 text-white custom-primary-bg"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="h-8 w-8" />
    </a>
  );
};