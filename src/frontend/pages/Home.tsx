import React from 'react';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import DefaultAdminWarning from '../components/DefaultAdminWarning';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { user, isDefaultAdminActive } = useAuth();
  const { t, i18n } = useTranslation();

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
                <h1 className="card-title mb-4">                {t('home.title')}</h1>
                <div className="alert alert-success" role="alert">
                                  {t('home.loggedIn')}
                </div>

                <div className="mt-4">
                                  <h5>{t('home.profile')}</h5>
                  <table className="table">
                    <tbody>
                      <tr>
                                        <td><strong>{t('home.name')}</strong></td>
                        <td>{user?.name}</td>
                      </tr>
                      <tr>
                                        <td><strong>{t('home.email')}</strong></td>
                        <td>{user?.email}</td>
                      </tr>
                      <tr>
                                        <td><strong>{t('home.emailVerified')}</strong></td>
                        <td>
                          {user?.email_verified_at ? (
                                            <span className="badge bg-success">{t('common.yes')}</span>
                          ) : (
                                            <span className="badge bg-warning">{t('common.no')}</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                                        <td><strong>{t('home.memberSince')}</strong></td>
                                        <td>{user && new Date(user.created_at).toLocaleDateString(i18n.language)}</td>
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
