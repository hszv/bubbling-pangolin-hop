import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Menu from "./pages/dashboard/Menu";
import Orders from "./pages/dashboard/Orders";
import Reservations from "./pages/dashboard/Reservations";
import Coupons from "./pages/dashboard/Coupons";
import Banners from "./pages/dashboard/Banners";
import Alerts from "./pages/dashboard/Alerts";
import Settings from "./pages/dashboard/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PublicMenu from "./pages/PublicMenu";
import Analytics from "./pages/dashboard/Analytics";
import Reviews from "./pages/dashboard/Reviews";
import Bot from "./pages/dashboard/Bot";
import Tables from "./pages/dashboard/Tables";
import Kitchen from "./pages/dashboard/Kitchen";
import Surveys from "./pages/dashboard/Surveys";
import Team from "./pages/dashboard/Team";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/menu/:userId" element={<PublicMenu />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="menu" element={<Menu />} />
              <Route path="tables" element={<Tables />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="orders" element={<Orders />} />
              <Route path="kitchen" element={<Kitchen />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="banners" element={<Banners />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="surveys" element={<Surveys />} />
              <Route path="bot" element={<Bot />} />
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;