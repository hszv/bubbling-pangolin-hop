import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Utensils,
  ShoppingCart,
  Calendar,
  Ticket,
  Image,
  Settings,
  Shield,
  BarChart3,
  Star,
  Bot,
  Armchair,
  ChefHat,
  MessageSquareQuote,
  Megaphone,
  Users,
} from "lucide-react";
import { FeatureGuard } from "./FeatureGuard";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/dashboard", icon: <Home className="h-4 w-4" />, label: "Visão Geral", requiredPlan: "Básico", ownerOnly: false },
  { to: "/dashboard/menu", icon: <Utensils className="h-4 w-4" />, label: "Cardápio", requiredPlan: "Básico", ownerOnly: false },
  { to: "/dashboard/tables", icon: <Armchair className="h-4 w-4" />, label: "Mesas", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/orders", icon: <ShoppingCart className="h-4 w-4" />, label: "Pedidos", requiredPlan: "Premium", ownerOnly: false },
  { to: "/dashboard/kitchen", icon: <ChefHat className="h-4 w-4" />, label: "Painel da Cozinha", requiredPlan: "Premium", ownerOnly: false },
  { to: "/dashboard/reservations", icon: <Calendar className="h-4 w-4" />, label: "Reservas", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/analytics", icon: <BarChart3 className="h-4 w-4" />, label: "Análises", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/coupons", icon: <Ticket className="h-4 w-4" />, label: "Cupons", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/banners", icon: <Image className="h-4 w-4" />, label: "Banners", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/alerts", icon: <Megaphone className="h-4 w-4" />, label: "Alertas", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/reviews", icon: <Star className="h-4 w-4" />, label: "Avaliações", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/surveys", icon: <MessageSquareQuote className="h-4 w-4" />, label: "Pesquisas", requiredPlan: "Profissional", ownerOnly: false },
  { to: "/dashboard/bot", icon: <Bot className="h-4 w-4" />, label: "Assistente Virtual", requiredPlan: "Premium", ownerOnly: false },
  { to: "/dashboard/team", icon: <Users className="h-4 w-4" />, label: "Equipe", requiredPlan: "Premium", ownerOnly: true },
  { to: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, label: "Configurações", requiredPlan: "Básico", ownerOnly: true },
];

export function DashboardNav() {
  const { profile, user, restaurantId } = useAuth();
  const isOwner = user?.id === restaurantId;

  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => {
          if (item.ownerOnly && !isOwner) {
            return null;
          }
          return (
            <FeatureGuard key={item.to} requiredPlan={item.requiredPlan as any} featureName={item.label}>
              <NavLink
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </FeatureGuard>
          );
        })}
        {profile?.role === 'admin' && (
           <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary"
              )
            }
          >
            <Shield className="h-4 w-4" />
            Admin
          </NavLink>
        )}
      </nav>
    </aside>
  );
}