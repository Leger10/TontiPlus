import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, initialLoading } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute - initialLoading:', initialLoading);
  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('🛡️ ProtectedRoute - profile:', profile);
  console.log('🛡️ ProtectedRoute - role:', profile?.role);

  if (initialLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!rolesArray.includes(profile.role)) {
      console.log('🚫 Rôle non autorisé:', profile.role);
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;