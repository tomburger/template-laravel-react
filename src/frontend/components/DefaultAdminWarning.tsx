import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type DefaultAdminWarningProps = {
  isDefaultAdminActive: boolean;
  isCurrentUserAdmin?: boolean;
  showActionButton?: boolean;
};

const DefaultAdminWarning: React.FC<DefaultAdminWarningProps> = ({
  isDefaultAdminActive,
  isCurrentUserAdmin,
  showActionButton = true,
}) => {
  const { t } = useTranslation();

  if (!isDefaultAdminActive || !isCurrentUserAdmin) {
    return null;
  }

  return (
    <div className="alert alert-warning border-warning mb-4" role="alert">
      <strong>{t('defaultAdminWarning.title')}</strong> {t('defaultAdminWarning.using')}
      <span className="ms-2">
        {t('defaultAdminWarning.advice')}
      </span>
      {showActionButton && (
        <div className="mt-2">
          <Link to="/admin/users" className="btn btn-sm btn-outline-dark">
            {t('common.openUserRegister')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default DefaultAdminWarning;