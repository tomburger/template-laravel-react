import React from 'react';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <h1 className="display-4 mb-4">Sorry</h1>
          <p className="lead mb-4">You don't have permission to access this page.</p>
          <p className="text-muted">Only administrators can access the admin panel.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
