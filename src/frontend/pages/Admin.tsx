import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import DefaultAdminWarning from '../components/DefaultAdminWarning';
import { getEndpoints } from '../services/endpoints/endpoints';
import { useTranslation } from 'react-i18next';

const AUTH_TOKEN_KEY = 'auth_token';

interface AdminInfoResponse {
  users: {
    total: number;
    active: number;
    pending_verification: number;
    recent: number;
  };
}

const Admin: React.FC = () => {
  const { user, isDefaultAdminActive } = useAuth();
  const { t } = useTranslation();
  const { adminDashboardInfo } = getEndpoints();
  const [stats, setStats] = useState<AdminInfoResponse['users'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const response = await adminDashboardInfo<{ data: AdminInfoResponse }>({
          baseURL: '',
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        setStats(response.data.users);
      } catch {
        setError(t('admin.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  return (
    <PageLayout>
        <div className="row">
          <div className="col-md-10 mx-auto">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <DefaultAdminWarning
                  isDefaultAdminActive={isDefaultAdminActive}
                  isCurrentUserAdmin={user?.is_admin}
                />
                <h1 className="card-title mb-4">                {t('admin.title')}</h1>

                                <h2 className="h4 mb-3">{t('admin.users')}</h2>

                {loading && (
                  <div className="d-flex align-items-center" role="status">
                    <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    <span>{t('admin.loadingStats')}</span>
                  </div>
                )}

                {!loading && error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {!loading && !error && stats && (
                  <div>
                    <div className="row g-3 mb-4">
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 p-3 bg-white h-100">
                          <div className="text-muted small">{t('admin.total')}</div>
                          <div className="fs-4 fw-semibold">{stats.total}</div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 p-3 bg-white h-100">
                          <div className="text-muted small">{t('admin.active')}</div>
                          <div className="fs-4 fw-semibold text-success">{stats.active}</div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 p-3 bg-white h-100">
                          <div className="text-muted small">{t('admin.pendingVerification')}</div>
                          <div className="fs-4 fw-semibold text-warning">{stats.pending_verification}</div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="border rounded-3 p-3 bg-white h-100">
                          <div className="text-muted small">{t('admin.recent')}</div>
                          <div className="fs-4 fw-semibold text-primary">{stats.recent}</div>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-3 mb-0" role="status">
                      <div>
                        <strong>{t('admin.next')}</strong> {t('admin.nextText')}
                        <span className="ms-2 text-muted">{t('admin.nextHint')}</span>
                      </div>
                      <Link to="/admin/users" className="btn btn-primary btn-sm">
                        {t('common.openUserRegister')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </PageLayout>
  );
};

export default Admin;
