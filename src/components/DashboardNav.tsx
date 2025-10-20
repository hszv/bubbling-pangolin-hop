import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Utensils,
  ShoppingCart,
  Calendar,
  Ticket,
  Image,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: <Home className="h-4 w-4" />, label: "Visão Geral" },
  { to: "/dashboard/menu", icon: <Utensils className="h-4 w-4" />, label: "Cardápio" },
  { to: "/dashboard/orders", icon: <ShoppingCart className="h-4 w-4" />, label: "Pedidos" },
  { to: "/dashboard/reservations", icon: <Calendar className="h-4 w-4" />, label: "Reservas" },
  { to: "/dashboard/coupons", icon: <Ticket className="h-4 w-4" />, label: "Cupons" },
  { to: "/dashboard/banners", icon: <Image className="h-4 w-4" />, label: "Banners" },
  { to: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, label: "Configurações" },
];

export function DashboardNav() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
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
        ))}
      </nav>
    </aside>
  );
}