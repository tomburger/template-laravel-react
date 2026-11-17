import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface AdminRouteProps {
  children: React.ReactNode;
  access?: 'content' | 'community' | 'pricing';
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, access }) => {
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

  const isOwner = user?.is_location_owner || user?.is_season_owner;
  const canAccess = user && !user.is_deactivated && (
    access === 'content'
      ? user.is_admin || user.is_content_manager || isOwner
      : access === 'community'
        ? user.is_community_manager || isOwner
        : access === 'pricing'
          ? user.is_admin || user.is_pricing_manager
          : user.is_admin || user.is_content_manager || user.is_community_manager || user.is_pricing_manager || isOwner
  );

  if (!isAuthenticated || !canAccess) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <h1 className="display-4 mb-4">          {t('adminRoute.title')}</h1>
                    <p className="lead mb-4">{t('adminRoute.noPermission')}</p>
                    {access === 'pricing' && !user?.is_admin && <p className="text-muted">{t('adminRoute.pricingManagersOrAdmins')}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
