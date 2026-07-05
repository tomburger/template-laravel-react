import React from 'react';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import DefaultAdminWarning from '../components/DefaultAdminWarning';

const Home: React.FC = () => {
  const { user, isDefaultAdminActive } = useAuth();

  return (
    <PageLayout>
        <div className="row">
          <div className="col-md-8 mx-auto">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <DefaultAdminWarning
                  isDefaultAdminActive={isDefaultAdminActive}
                  isCurrentUserAdmin={user?.is_admin}
                />
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
    </PageLayout>
  );
};

export default Home;
