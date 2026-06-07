import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
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
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-5">
      <div className="container">
        <span
          className="navbar-brand mb-0 h1"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          LaravelReact
        </span>
        <div className="d-flex align-items-center gap-2">
          <span className="me-3">Welcome, {user?.name}!</span>
          {user?.is_admin && (
            <button
              className="btn btn-outline-primary btn-sm me-2"
              onClick={() => navigate('/admin')}
            >
              Admin
            </button>
          )}
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
