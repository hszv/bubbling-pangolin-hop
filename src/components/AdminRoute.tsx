import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { Skeleton } from './ui/skeleton';

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;