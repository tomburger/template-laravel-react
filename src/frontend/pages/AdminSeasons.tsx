import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import RightDrawer from '../components/RightDrawer';
import { getEndpoints } from '../services/endpoints/endpoints';
import { Season, apiErrorMessage, authRequestOptions } from '../services/apiHelpers';

const emptyForm = { name: '', start_date: '', end_date: '', copy_from_season_id: '' };

const AdminSeasons: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { listSeasons, createSeason, updateSeason, deleteSeason } = getEndpoints();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listSeasons<{ data: { seasons: Season[] } }>(authRequestOptions());
      setSeasons(response.data.seasons);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminSeasons.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(i18n.language);

  const openDrawer = (season: Season | null) => {
    setEditing(season);
    setForm(
      season
        ? { name: season.name, start_date: season.start_date, end_date: season.end_date, copy_from_season_id: '' }
        : emptyForm
    );
    setFormError(null);
    setDrawerOpen(true);
  };

  const save = async () => {
    const data = { name: form.name.trim(), start_date: form.start_date, end_date: form.end_date };
    try {
      setSaving(true);
      setFormError(null);
      setNotice(null);
      if (editing) {
        await updateSeason(editing.id, data, authRequestOptions());
      } else {
        const response = await createSeason<{ data: { copied: { members: number; units: number } } }>(
          {
            ...data,
            ...(form.copy_from_season_id ? { copy_from_season_id: Number(form.copy_from_season_id) } : {}),
          },
          authRequestOptions()
        );
        if (form.copy_from_season_id) {
          setNotice(t('adminSeasons.copied', response.data.copied));
        }
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminSeasons.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (season: Season) => {
    if (!window.confirm(t('adminSeasons.confirmDelete', { name: season.name }))) return;
    try {
      setError(null);
      await deleteSeason(season.id, authRequestOptions());
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminSeasons.deleteFailed')));
    }
  };

  const canSave = form.name.trim() !== '' && form.start_date !== '' && form.end_date !== '';

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin" className="text-decoration-none">&larr; {t('adminSeasons.back')}</Link>
          </p>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h1 className="h3 mb-1">{t('adminSeasons.title')}</h1>
              <p className="text-muted mb-0">{t('adminSeasons.subtitle')}</p>
            </div>
            <button className="btn btn-dark btn-sm" onClick={() => openDrawer(null)}>
              {t('adminSeasons.add')}
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {notice && <div className="alert alert-success">{notice}</div>}

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
                    <th>{t('adminSeasons.name')}</th>
                    <th>{t('adminSeasons.startDate')}</th>
                    <th>{t('adminSeasons.endDate')}</th>
                    <th className="text-end">{t('adminUsers.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">{t('adminSeasons.empty')}</td>
                    </tr>
                  )}
                  {seasons.map((season) => (
                    <tr key={season.id}>
                      <td>{season.name}</td>
                      <td>{formatDate(season.start_date)}</td>
                      <td>{formatDate(season.end_date)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end flex-wrap gap-2">
                          <Link to={`/admin/seasons/${season.id}`} className="btn btn-sm btn-outline-primary">
                            {t('adminSeasons.enrollments')}
                          </Link>
                          <button className="btn btn-sm btn-dark" onClick={() => openDrawer(season)}>
                            {t('adminUsers.edit')}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(season)}>
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
        title={editing ? t('adminSeasons.edit') : t('adminSeasons.add')}
        closeText={t('adminUsers.close')}
        disableClose={saving}
        ariaLabel={editing ? t('adminSeasons.edit') : t('adminSeasons.add')}
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
          <label className="form-label" htmlFor="season-name">{t('adminSeasons.name')}</label>
          <input id="season-name" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="season-start">{t('adminSeasons.startDate')}</label>
          <input id="season-start" type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="season-end">{t('adminSeasons.endDate')}</label>
          <input id="season-end" type="date" className="form-control" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        {!editing && (
          <div className="mb-3">
            <label className="form-label" htmlFor="season-copy">{t('adminSeasons.copyFrom')}</label>
            <select id="season-copy" className="form-select" value={form.copy_from_season_id} onChange={(e) => setForm({ ...form, copy_from_season_id: e.target.value })}>
              <option value="">{t('adminSeasons.copyNone')}</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
            <div className="form-text">{t('adminSeasons.copyHint')}</div>
          </div>
        )}
      </RightDrawer>
    </PageLayout>
  );
};

export default AdminSeasons;
