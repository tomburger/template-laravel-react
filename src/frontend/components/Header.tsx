import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../config';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      // Error is handled in context
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-2">
      <div className="container">
        <span
          className="navbar-brand mb-0 h1"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          {APP_NAME}
        </span>
        <div className="d-flex align-items-center gap-2">
          <span className="me-3">{t('header.welcome', { name: user?.name })}</span>
          <LanguageSwitcher />
          {user?.is_admin && (
            <button
              className="btn btn-outline-primary btn-sm me-2"
              onClick={() => navigate('/admin')}
            >
              {t('header.admin')}
            </button>
          )}
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            {t('header.logout')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
