import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import RightDrawer from '../components/RightDrawer';
import { Member, UserOption, apiErrorMessage, membersApi } from '../services/adminApi';

const emptyForm = { user_id: '', first_name: '', last_name: '', phone_number: '', category: '' };

const AdminMembers: React.FC = () => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [candidates, setCandidates] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [loadedMembers, loadedCandidates] = await Promise.all([membersApi.list(), membersApi.candidates()]);
      setMembers(loadedMembers);
      setCandidates(loadedCandidates);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminMembers.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDrawer = (member: Member | null) => {
    setEditing(member);
    setForm(
      member
        ? {
            user_id: String(member.id),
            first_name: member.first_name,
            last_name: member.last_name,
            phone_number: member.phone_number ?? '',
            category: member.category ?? '',
          }
        : emptyForm
    );
    setFormError(null);
    setDrawerOpen(true);
  };

  const save = async () => {
    const data = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone_number: form.phone_number.trim() || null,
      category: form.category.trim() || null,
    };
    try {
      setSaving(true);
      setFormError(null);
      if (editing) {
        await membersApi.update(editing.id, data);
      } else {
        await membersApi.create({ ...data, user_id: Number(form.user_id) });
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminMembers.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: Member) => {
    if (!window.confirm(t('adminMembers.confirmDelete', { name: `${member.first_name} ${member.last_name}` }))) return;
    try {
      setError(null);
      await membersApi.remove(member.id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminMembers.deleteFailed')));
    }
  };

  const canSave =
    form.first_name.trim() !== '' && form.last_name.trim() !== '' && (editing !== null || form.user_id !== '');

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin" className="text-decoration-none">&larr; {t('adminMembers.back')}</Link>
          </p>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h1 className="h3 mb-1">{t('adminMembers.title')}</h1>
              <p className="text-muted mb-0">{t('adminMembers.subtitle')}</p>
            </div>
            <button className="btn btn-dark btn-sm" onClick={() => openDrawer(null)}>
              {t('adminMembers.add')}
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="d-flex align-items-center" role="status">
              <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              <span>{t('common.loading')}</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>{t('adminMembers.name')}</th>
                    <th>{t('common.email')}</th>
                    <th>{t('adminMembers.phone')}</th>
                    <th>{t('adminMembers.category')}</th>
                    <th className="text-end">{t('adminUsers.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">{t('adminMembers.empty')}</td>
                    </tr>
                  )}
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.last_name} {member.first_name}</td>
                      <td>{member.email}</td>
                      <td>{member.phone_number}</td>
                      <td>{member.category}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end flex-wrap gap-2">
                          <button className="btn btn-sm btn-dark" onClick={() => openDrawer(member)}>
                            {t('adminUsers.edit')}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(member)}>
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <RightDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? t('adminMembers.edit') : t('adminMembers.add')}
        closeText={t('adminUsers.close')}
        disableClose={saving}
        ariaLabel={editing ? t('adminMembers.edit') : t('adminMembers.add')}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)} disabled={saving}>
              {t('adminUsers.cancel')}
            </button>
            <button type="button" className="btn btn-dark" onClick={save} disabled={saving || !canSave}>
              {saving ? t('adminUsers.saving') : t('adminUsers.save')}
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger">{formError}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="member-user">{t('adminMembers.user')}</label>
          {editing ? (
            <input id="member-user" className="form-control" value={`${editing.user_name ?? ''} (${editing.email ?? ''})`} disabled />
          ) : (
            <>
              <select id="member-user" className="form-select" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
                <option value="">{t('adminMembers.selectUser')}</option>
                {candidates.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
              {candidates.length === 0 && <div className="form-text">{t('adminMembers.noCandidates')}</div>}
            </>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="member-first-name">{t('adminMembers.firstName')}</label>
          <input id="member-first-name" className="form-control" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="member-last-name">{t('adminMembers.lastName')}</label>
          <input id="member-last-name" className="form-control" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="member-phone">{t('adminMembers.phone')}</label>
          <input id="member-phone" className="form-control" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="member-category">{t('adminMembers.category')}</label>
          <input id="member-category" className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
      </RightDrawer>
    </PageLayout>
  );
};

export default AdminMembers;
