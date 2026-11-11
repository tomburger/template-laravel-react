import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface AdminRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  membersOnly?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, adminOnly = false, membersOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const canAccess = user && !user.is_deactivated && (adminOnly
    ? user.is_admin
    : (!membersOnly && user.is_admin) || user.is_manager || user.is_location_owner || user.is_season_owner);

  if (!isAuthenticated || !canAccess) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <h1 className="display-4 mb-4">          {t('adminRoute.title')}</h1>
                    <p className="lead mb-4">{t('adminRoute.noPermission')}</p>
                    {adminOnly && <p className="text-muted">{t('adminRoute.adminsOnly')}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
