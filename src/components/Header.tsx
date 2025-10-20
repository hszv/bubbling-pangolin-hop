import { UtensilsCrossed } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "./UserNav";
import { Skeleton } from "./ui/skeleton";

export const Header = () => {
  const { session, loading } = useAuth();

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <span className="">Cardápio Digital</span>
        </Link>
        
        <div className="flex items-center gap-4">
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