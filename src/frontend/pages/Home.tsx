import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import DefaultAdminWarning from '../components/DefaultAdminWarning';
import RightDrawer from '../components/RightDrawer';
import { apiErrorMessage, authRequestOptions } from '../services/apiHelpers';

type MemberProfile = {
  first_name: string;
  last_name: string;
  phone_number: string | null;
  category: string | null;
};

type Profile = {
  name: string;
  member: MemberProfile | null;
};

const Home: React.FC = () => {
  const { user, isDefaultAdminActive, updateCurrentUserName } = useAuth();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ name: '', first_name: '', last_name: '', phone_number: '' });
  const [join, setJoin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadProfile = async (signal?: AbortSignal) => {
    try {
      setLoadingProfile(true);
      setLoadError(null);
      const response = await axios.get<Profile>('/api/user/profile', { ...authRequestOptions(), signal });
      setProfile(response.data);
    } catch (err) {
      if (!signal?.aborted) {
        setLoadError(apiErrorMessage(err, t('home.profileLoadFailed')));
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingProfile(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setProfile(null);
    void loadProfile(controller.signal);
    return () => controller.abort();
  }, [user?.id]);

  const openEditor = (joinMembership = false) => {
    setForm({
      name: user?.name ?? '',
      first_name: profile?.member?.first_name ?? '',
      last_name: profile?.member?.last_name ?? '',
      phone_number: profile?.member?.phone_number ?? '',
    });
    setJoin(joinMembership);
    setSaveError(null);
    setSaved(false);
    setDrawerOpen(true);
  };

  const save = async () => {
    const member = profile?.member || join
      ? {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone_number: form.phone_number.trim() || null,
        }
      : undefined;

    try {
      setSaving(true);
      setSaveError(null);
      const response = await axios.put<Profile>(
        '/api/user/profile',
        { name: form.name.trim(), ...(member ? { member } : {}) },
        authRequestOptions(),
      );
      setProfile(response.data);
      updateCurrentUserName(response.data.name);
      setLoadError(null);
      setDrawerOpen(false);
      setSaved(true);
    } catch (err) {
      setSaveError(apiErrorMessage(err, t('home.profileSaveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const editingMember = Boolean(profile?.member || join);
  const canSave = form.name.trim() !== ''
    && (!editingMember || (form.first_name.trim() !== '' && form.last_name.trim() !== ''));

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
              <h1 className="card-title mb-4">{t('home.title')}</h1>
              <div className="alert alert-success" role="alert">{t('home.loggedIn')}</div>
              {saved && <div className="alert alert-success" role="status">{t('home.profileSaved')}</div>}
              {loadError && (
                <div className="alert alert-danger" role="alert">
                  {loadError}{' '}
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void loadProfile()}>
                    {t('home.retry')}
                  </button>
                </div>
              )}
              {loadingProfile && <div role="status">{t('common.loading')}</div>}
              {profile && !profile.member && (
                <div className="alert alert-warning" role="alert">
                  <div>{t('home.notMember')}</div>
                  <button type="button" className="btn btn-sm btn-outline-dark mt-2" onClick={() => openEditor(true)}>
                    {t('home.becomeMember')}
                  </button>
                </div>
              )}

              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <h5>{t('home.profile')}</h5>
                  <button type="button" className="btn btn-sm btn-dark" onClick={() => openEditor()} disabled={loadingProfile}>
                    {t('home.editProfile')}
                  </button>
                </div>
                <table className="table">
                  <tbody>
                    <tr><td><strong>{t('home.name')}</strong></td><td>{user?.name}</td></tr>
                    <tr><td><strong>{t('home.email')}</strong></td><td>{user?.email}</td></tr>
                    <tr>
                      <td><strong>{t('home.emailVerified')}</strong></td>
                      <td>
                        {user?.email_verified_at
                          ? <span className="badge bg-success">{t('common.yes')}</span>
                          : <span className="badge bg-warning">{t('common.no')}</span>}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>{t('home.memberSince')}</strong></td>
                      <td>{user && new Date(user.created_at).toLocaleDateString(i18n.language)}</td>
                    </tr>
                    {profile?.member && (
                      <>
                        <tr><td><strong>{t('adminMembers.firstName')}</strong></td><td>{profile.member.first_name}</td></tr>
                        <tr><td><strong>{t('adminMembers.lastName')}</strong></td><td>{profile.member.last_name}</td></tr>
                        <tr><td><strong>{t('adminMembers.phone')}</strong></td><td>{profile.member.phone_number || '—'}</td></tr>
                        <tr><td><strong>{t('adminMembers.category')}</strong></td><td>{profile.member.category || '—'}</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RightDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('home.editProfile')}
        ariaLabel={t('home.editProfile')}
        closeText={t('adminUsers.close')}
        disableClose={saving}
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
        {saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="profile-name">{t('home.displayName')}</label>
          <input id="profile-name" className="form-control" maxLength={255} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        {profile && !profile.member && (
          <div className="form-check mb-3">
            <input id="profile-join" className="form-check-input" type="checkbox" checked={join} onChange={(e) => setJoin(e.target.checked)} />
            <label className="form-check-label" htmlFor="profile-join">{t('home.becomeMember')}</label>
          </div>
        )}
        {editingMember && (
          <>
            <h6>{t('home.memberDetails')}</h6>
            <div className="mb-3">
              <label className="form-label" htmlFor="profile-first-name">{t('adminMembers.firstName')}</label>
              <input id="profile-first-name" className="form-control" maxLength={100} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="profile-last-name">{t('adminMembers.lastName')}</label>
              <input id="profile-last-name" className="form-control" maxLength={100} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="profile-phone">{t('adminMembers.phone')}</label>
              <input id="profile-phone" className="form-control" maxLength={50} value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            </div>
            {profile?.member && (
              <div className="mb-3">
                <label className="form-label" htmlFor="profile-category">{t('adminMembers.category')}</label>
                <input id="profile-category" className="form-control" value={profile.member.category ?? ''} readOnly />
                <div className="form-text">{t('home.categoryManaged')}</div>
              </div>
            )}
          </>
        )}
      </RightDrawer>
    </PageLayout>
  );
};

export default Home;
