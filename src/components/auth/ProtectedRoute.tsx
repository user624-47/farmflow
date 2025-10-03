import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrganization?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireOrganization = false 
}: ProtectedRouteProps) => {
  const { user, loading, organization } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    // Store the attempted URL the user came from
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If organization is required but not set, redirect to setup
  if (requireOrganization && !organization) {
    return <Navigate to="/setup-organization" state={{ from: location }} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
