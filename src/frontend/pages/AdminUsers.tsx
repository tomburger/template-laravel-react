import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import DefaultAdminWarning from '../components/DefaultAdminWarning';
import RightDrawer from '../components/RightDrawer';
import { getEndpoints } from '../services/endpoints/endpoints';
import { useTranslation } from 'react-i18next';

const AUTH_TOKEN_KEY = 'auth_token';

type UserRow = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_deactivated: boolean;
  email_verified_at: string | null;
  created_at: string;
};

type UsersResponse = {
  users: UserRow[];
};

type UpdateUserResponse = {
  user: UserRow;
  message?: string;
};

type FilterValue = 'all' | 'active' | 'deactivated' | 'verified' | 'pending-verification' | 'admin';

const FILTER_VALUES: FilterValue[] = ['all', 'active', 'deactivated', 'verified', 'pending-verification', 'admin'];

const AdminUsers: React.FC = () => {
  const { user, isDefaultAdminActive, setDefaultAdminActive } = useAuth();
  const { t, i18n } = useTranslation();
  const { listAllUsers, updateUserFlags, resendVerificationEmailForUseradmin } = getEndpoints();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editFlags, setEditFlags] = useState({ is_admin: false, is_deactivated: false });

  const requestOptions = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    return {
      baseURL: '',
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    };
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listAllUsers<{ data: UsersResponse }>(requestOptions());
      setUsers(response.data.users);
      const defaultAdminActive = response.data.users.some((item) => item.id === 1 && item.is_admin && !item.is_deactivated);
      setDefaultAdminActive(defaultAdminActive);
    } catch {
      setError(t('adminUsers.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setEditFlags({
        is_admin: editingUser.is_admin,
        is_deactivated: editingUser.is_deactivated,
      });
    }
  }, [editingUser]);

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        searchText.length === 0
        || user.name.toLowerCase().includes(searchText)
        || user.email.toLowerCase().includes(searchText);

      if (!matchesSearch) {
        return false;
      }

      switch (filter) {
        case 'active':
          return !user.is_deactivated;
        case 'deactivated':
          return user.is_deactivated;
        case 'verified':
          return user.email_verified_at !== null;
        case 'pending-verification':
          return user.email_verified_at === null;
        case 'admin':
          return user.is_admin;
        default:
          return true;
      }
    });
  }, [users, search, filter]);

  const defaultAdminActiveFromUsers = useMemo(
    () => users.some((item) => item.id === 1 && item.is_admin && !item.is_deactivated),
    [users],
  );

  const shouldShowDefaultAdminWarning = users.length > 0
    ? defaultAdminActiveFromUsers
    : isDefaultAdminActive;

  const handleSaveUser = async () => {
    if (!editingUser) {
      return;
    }

    try {
      setBusyUserId(editingUser.id);
      setError(null);
      setNotice(null);

      const response = await updateUserFlags<{ data: UpdateUserResponse }>(
        editingUser.id,
        editFlags,
        requestOptions(),
      );

      setUsers((prevUsers) => (
        prevUsers.map((item) => (item.id === editingUser.id ? response.data.user : item))
      ));
      if (response.data.user.id === 1) {
        setDefaultAdminActive(response.data.user.is_admin && !response.data.user.is_deactivated);
      }
      setNotice(response.data.message || t('adminUsers.updated'));
      setEditingUser(null);
    } catch {
            setError(t('adminUsers.updateFailed'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResendVerification = async (user: UserRow) => {
    try {
      setBusyUserId(user.id);
      setError(null);
      setNotice(null);

      await resendVerificationEmailForUseradmin(user.id, requestOptions());
      setNotice(t('adminUsers.resent', { email: user.email }));
    } catch {
            setError(t('adminUsers.resendFailed'));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <PageLayout>
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body p-4 p-md-5">
                <DefaultAdminWarning
                  isDefaultAdminActive={shouldShowDefaultAdminWarning}
                  isCurrentUserAdmin={user?.is_admin}
                  showActionButton={false}
                />
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-1">                    {t('adminUsers.title')}</h1>
                                        <p className="text-muted mb-0">{t('adminUsers.subtitle')}</p>
                                      </div>
                                      <button className="btn btn-outline-secondary btn-sm" onClick={loadUsers} disabled={loading}>
                                        {t('adminUsers.refresh')}
                                      </button>
                                    </div>

                                    <div className="row g-3 mb-4">
                                      <div className="col-md-8">
                                        <label className="form-label" htmlFor="user-search">{t('adminUsers.searchLabel')}</label>
                                        <input
                                          id="user-search"
                                          className="form-control"
                                          placeholder={t('adminUsers.searchPlaceholder')}
                                          value={search}
                                          onChange={(event) => setSearch(event.target.value)}
                                        />
                                      </div>
                                      <div className="col-md-4">
                                        <label className="form-label" htmlFor="user-filter">{t('adminUsers.filter')}</label>
                                        <select
                                          id="user-filter"
                                          className="form-select"
                                          value={filter}
                                          onChange={(event) => setFilter(event.target.value as FilterValue)}
                                        >
                                          {FILTER_VALUES.map((value) => (
                                            <option key={value} value={value}>{t(`adminUsers.filters.${value}`)}</option>
                                          ))}
                                        </select>
                  </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {notice && <div className="alert alert-success">{notice}</div>}

                {loading ? (
                  <div className="d-flex align-items-center" role="status">
                    <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    <span>{t('adminUsers.loadingUsers')}</span>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>{t('adminUsers.columns.name')}</th>
                          <th>{t('adminUsers.columns.email')}</th>
                          <th>{t('adminUsers.columns.status')}</th>
                          <th>{t('adminUsers.columns.role')}</th>
                          <th>{t('adminUsers.columns.created')}</th>
                          <th className="text-end">{t('adminUsers.columns.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">{t('adminUsers.noMatch')}</td>
                          </tr>
                        )}

                        {filteredUsers.map((user) => {
                          const isBusy = busyUserId === user.id;

                          return (
                            <tr key={user.id}>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>
                                {user.is_deactivated ? (
                                  <span className="badge bg-secondary">{t('adminUsers.deactivated')}</span>
                                ) : (
                                  <span className="badge bg-success">{t('adminUsers.active')}</span>
                                )}
                                <span className="ms-2">
                                  {user.email_verified_at ? (
                                    <span className="badge bg-primary">{t('adminUsers.verified')}</span>
                                  ) : (
                                    <span className="badge bg-warning text-dark">{t('adminUsers.pending')}</span>
                                  )}
                                </span>
                              </td>
                              <td>
                                {user.is_admin ? (
                                  <span className="badge bg-dark">{t('adminUsers.admin')}</span>
                                ) : (
                                  <span className="badge bg-light text-dark border">{t('adminUsers.user')}</span>
                                )}
                              </td>
                              <td>{new Date(user.created_at).toLocaleDateString(i18n.language)}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end flex-wrap gap-2">
                                  <button
                                    className="btn btn-sm btn-dark"
                                    onClick={() => setEditingUser(user)}
                                    disabled={isBusy}
                                  >
                                    {t('adminUsers.edit')}                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <RightDrawer
          isOpen={editingUser !== null}
          onClose={() => setEditingUser(null)}
          title={t('adminUsers.editUser')}
          subtitle={editingUser?.email}
          closeText={t('adminUsers.close')}
          disableClose={busyUserId === editingUser?.id}
          ariaLabel={t('adminUsers.editUser')}
          footer={
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setEditingUser(null)}
                disabled={busyUserId === editingUser?.id}
              >
                {t('adminUsers.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={handleSaveUser}
                disabled={busyUserId === editingUser?.id}
              >
                {busyUserId === editingUser?.id ? t('adminUsers.saving') : t('adminUsers.save')}
              </button>
            </div>
          }
        >
          {editingUser && (
            <>
              <div className="mb-4">
                <label className="form-label" htmlFor="edit-user-name">{t('adminUsers.name')}</label>
                <input id="edit-user-name" className="form-control" value={editingUser.name} readOnly />
              </div>
              <div className="mb-4">
                <label className="form-label" htmlFor="edit-user-email">{t('adminUsers.email')}</label>
                <input id="edit-user-email" type="email" className="form-control" value={editingUser.email} readOnly />
              </div>
              <div className="border rounded p-3 mb-4 bg-light-subtle">
                <div className="fw-semibold mb-3">{t('adminUsers.access')}</div>
                <div className="form-check form-switch mb-3">
                  <input
                    id="edit-user-admin"
                    className="form-check-input"
                    type="checkbox"
                    checked={editFlags.is_admin}
                    onChange={(event) => setEditFlags((flags) => ({ ...flags, is_admin: event.target.checked }))}
                    disabled={editingUser.id === 1 && !editingUser.is_admin}
                  />
                  <label className="form-check-label" htmlFor="edit-user-admin">{t('adminUsers.administrator')}</label>
                </div>
                <div className="form-check form-switch">
                  <input
                    id="edit-user-deactivated"
                    className="form-check-input"
                    type="checkbox"
                    checked={editFlags.is_deactivated}
                    onChange={(event) => setEditFlags((flags) => ({ ...flags, is_deactivated: event.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="edit-user-deactivated">{t('adminUsers.deactivateAccount')}</label>
                </div>
              </div>
              <div className="border rounded p-3">
                <div className="fw-semibold                 mb-1">{t('adminUsers.emailVerification')}</div>
                <p className="small text-muted mb-3">
                                  {editingUser.email_verified_at ? t('adminUsers.emailVerified') : t('adminUsers.emailAwaiting')}
                </p>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handleResendVerification(editingUser)}
                  disabled={busyUserId === editingUser.id || editingUser.email_verified_at !== null}
                >
                  {t('adminUsers.resendVerification')}
                </button>
              </div>
            </>
          )}
        </RightDrawer>
    </PageLayout>
  );
};

export default AdminUsers;
