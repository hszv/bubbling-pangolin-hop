import { UtensilsCrossed } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "./UserNav";
import { Skeleton } from "./ui/skeleton";

const Header = () => {
  const { session, loading } = useAuth();

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b border-border/40">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Cardápio Digital</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Recursos
          </a>
          <a href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Preços
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-10 w-24" />
          ) : session ? (
            <UserNav />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Começar Agora</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;