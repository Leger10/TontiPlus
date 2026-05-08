import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

const RoleBasedRoute = ({ children, requiredRole }) => {
  return (
    <ProtectedRoute allowedRoles={requiredRole}>
      {children}
    </ProtectedRoute>
  );
};

export default RoleBasedRoute;