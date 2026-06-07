import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { getEndpoints } from '../services/endpoints/endpoints';

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

const AdminUsers: React.FC = () => {
  const { listAllUsers, updateUserFlags, resendVerificationEmailForUseradmin } = getEndpoints();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const requestOptions = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    return {
      baseURL: apiUrl.replace(/\/api\/?$/, ''),
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
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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

  const handleToggleDeactivated = async (user: UserRow) => {
    try {
      setBusyUserId(user.id);
      setError(null);
      setNotice(null);

      const response = await updateUserFlags<{ data: UpdateUserResponse }>(
        user.id,
        { is_deactivated: !user.is_deactivated },
        requestOptions(),
      );

      setUsers((prevUsers) => prevUsers.map((item) => (item.id === user.id ? response.data.user : item)));
      setNotice(response.data.message || 'User status updated.');
    } catch {
      setError('Failed to update user status.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleAdmin = async (user: UserRow) => {
    try {
      setBusyUserId(user.id);
      setError(null);
      setNotice(null);

      const response = await updateUserFlags<{ data: UpdateUserResponse }>(
        user.id,
        { is_admin: !user.is_admin },
        requestOptions(),
      );

      setUsers((prevUsers) => prevUsers.map((item) => (item.id === user.id ? response.data.user : item)));
      setNotice(response.data.message || 'User role updated.');
    } catch {
      setError('Failed to update admin role.');
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
      setNotice(`Verification email resent to ${user.email}.`);
    } catch {
      setError('Failed to resend verification email.');
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
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-1">User Register</h1>
                    <p className="text-muted mb-0">Manage user access, account status, and email verification.</p>
                  </div>
                  <button className="btn btn-outline-secondary btn-sm" onClick={loadUsers} disabled={loading}>
                    Refresh
                  </button>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-8">
                    <label className="form-label" htmlFor="user-search">Search users</label>
                    <input
                      id="user-search"
                      className="form-control"
                      placeholder="Search by name or email"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="user-filter">Filter</label>
                    <select
                      id="user-filter"
                      className="form-select"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value as FilterValue)}
                    >
                      <option value="all">All users</option>
                      <option value="active">Active</option>
                      <option value="deactivated">Deactivated</option>
                      <option value="verified">Verified</option>
                      <option value="pending-verification">Pending verification</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {notice && <div className="alert alert-success">{notice}</div>}

                {loading ? (
                  <div className="d-flex align-items-center" role="status">
                    <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    <span>Loading users...</span>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Role</th>
                          <th>Created</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">No users match current filters.</td>
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
                                  <span className="badge bg-secondary">Deactivated</span>
                                ) : (
                                  <span className="badge bg-success">Active</span>
                                )}
                                <span className="ms-2">
                                  {user.email_verified_at ? (
                                    <span className="badge bg-primary">Verified</span>
                                  ) : (
                                    <span className="badge bg-warning text-dark">Pending</span>
                                  )}
                                </span>
                              </td>
                              <td>
                                {user.is_admin ? (
                                  <span className="badge bg-dark">Admin</span>
                                ) : (
                                  <span className="badge bg-light text-dark border">User</span>
                                )}
                              </td>
                              <td>{new Date(user.created_at).toLocaleDateString()}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end flex-wrap gap-2">
                                  <button
                                    className={`btn btn-sm ${user.is_deactivated ? 'btn-success' : 'btn-outline-secondary'}`}
                                    onClick={() => handleToggleDeactivated(user)}
                                    disabled={isBusy}
                                  >
                                    {user.is_deactivated ? 'Activate' : 'Deactivate'}
                                  </button>
                                  <button
                                    className={`btn btn-sm ${user.is_admin ? 'btn-outline-dark' : 'btn-dark'}`}
                                    onClick={() => handleToggleAdmin(user)}
                                    disabled={isBusy}
                                  >
                                    {user.is_admin ? 'Remove admin' : 'Make admin'}
                                  </button>
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleResendVerification(user)}
                                    disabled={isBusy || user.email_verified_at !== null}
                                  >
                                    Resend verification
                                  </button>
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
    </PageLayout>
  );
};

export default AdminUsers;
