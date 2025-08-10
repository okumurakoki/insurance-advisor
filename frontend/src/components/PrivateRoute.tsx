import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedAccountTypes?: ('parent' | 'child' | 'grandchild')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedAccountTypes }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedAccountTypes && !allowedAccountTypes.includes(user.accountType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;