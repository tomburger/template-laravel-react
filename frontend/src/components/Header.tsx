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
        <span className="navbar-brand mb-0 h1">LaravelReact</span>
        <div className="d-flex align-items-center">
          <span className="me-3">Welcome, {user?.name}!</span>
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
