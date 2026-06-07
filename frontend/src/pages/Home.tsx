import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
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
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
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

      <div className="container">
        <div className="row">
          <div className="col-md-8 mx-auto">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h1 className="card-title mb-4">Dashboard</h1>
                <div className="alert alert-success" role="alert">
                  You are successfully logged in!
                </div>

                <div className="mt-4">
                  <h5>Your Profile Information</h5>
                  <table className="table">
                    <tbody>
                      <tr>
                        <td><strong>Name:</strong></td>
                        <td>{user?.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{user?.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Email Verified:</strong></td>
                        <td>
                          {user?.email_verified_at ? (
                            <span className="badge bg-success">Yes</span>
                          ) : (
                            <span className="badge bg-warning">No</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Member Since:</strong></td>
                        <td>{user && new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
