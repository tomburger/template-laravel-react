import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface AdminInfoResponse {
  users: {
    total: number;
    active: number;
    pending_verification: number;
    recent: number;
  };
}

const Admin: React.FC = () => {
  const [stats, setStats] = useState<AdminInfoResponse['users'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await axios.get<AdminInfoResponse>(`${apiUrl}/admin/info`, {
          withCredentials: true,
        });

        setStats(response.data.users);
      } catch {
        setError('Failed to load admin info. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Header />

      <main className="flex-grow-1 container my-5">
        <div className="row">
          <div className="col-md-10 mx-auto">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h1 className="card-title mb-4">Admin Panel</h1>

                <h2 className="h4 mb-3">Users</h2>

                {loading && (
                  <div className="d-flex align-items-center" role="status">
                    <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    <span>Loading user stats...</span>
                  </div>
                )}

                {!loading && error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {!loading && !error && stats && (
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">Metric</th>
                          <th scope="col">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Total</td>
                          <td>{stats.total}</td>
                        </tr>
                        <tr>
                          <td>Active</td>
                          <td>{stats.active}</td>
                        </tr>
                        <tr>
                          <td>Pending verification</td>
                          <td>{stats.pending_verification}</td>
                        </tr>
                        <tr>
                          <td>Recent (last 7 days)</td>
                          <td>{stats.recent}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
