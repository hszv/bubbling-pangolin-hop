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
} from "lucide-react";
import { FeatureGuard } from "./FeatureGuard";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/dashboard", icon: <Home className="h-4 w-4" />, label: "Visão Geral", requiredPlan: "Básico" },
  { to: "/dashboard/menu", icon: <Utensils className="h-4 w-4" />, label: "Cardápio", requiredPlan: "Básico" },
  { to: "/dashboard/analytics", icon: <BarChart3 className="h-4 w-4" />, label: "Análises", requiredPlan: "Profissional" },
  { to: "/dashboard/orders", icon: <ShoppingCart className="h-4 w-4" />, label: "Pedidos", requiredPlan: "Premium" },
  { to: "/dashboard/reservations", icon: <Calendar className="h-4 w-4" />, label: "Reservas", requiredPlan: "Profissional" },
  { to: "/dashboard/coupons", icon: <Ticket className="h-4 w-4" />, label: "Cupons", requiredPlan: "Profissional" },
  { to: "/dashboard/banners", icon: <Image className="h-4 w-4" />, label: "Banners", requiredPlan: "Profissional" },
  { to: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, label: "Configurações", requiredPlan: "Básico" },
];

export function DashboardNav() {
  const { profile } = useAuth();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
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
        ))}
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