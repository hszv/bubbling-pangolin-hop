import { Outlet } from "react-router-dom";
import { DashboardNav } from "./DashboardNav";
import { Header } from "./Header";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <DashboardNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;