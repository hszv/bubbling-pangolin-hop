import { UtensilsCrossed } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto text-center text-muted-foreground">
        <div className="flex justify-center items-center gap-2 mb-4">
          <UtensilsCrossed className="h-5 w-5" />
          <h1 className="text-lg font-bold">Cardápio Digital</h1>
        </div>
        <p className="text-sm">
          © {new Date().getFullYear()} Cardápio Digital. Todos os direitos reservados.
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <a href="#" className="text-sm hover:underline">Termos de Serviço</a>
          <a href="#" className="text-sm hover:underline">Política de Privacidade</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;