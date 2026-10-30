import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import RightDrawer from '../components/RightDrawer';
import { Location, Unit, apiErrorMessage, locationsApi, unitsApi } from '../services/adminApi';

const AdminUnits: React.FC = () => {
  const { t } = useTranslation();
  const locationId = Number(useParams().locationId);
  const [location, setLocation] = useState<Location | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState({ code: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [locations, loadedUnits] = await Promise.all([locationsApi.list(), unitsApi.list(locationId)]);
      setLocation(locations.find((item) => item.id === locationId) ?? null);
      setUnits(loadedUnits);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminUnits.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [locationId]);

  const openDrawer = (unit: Unit | null) => {
    setEditing(unit);
    setForm({ code: unit?.code ?? '', category: unit?.category ?? '' });
    setFormError(null);
    setDrawerOpen(true);
  };

  const save = async () => {
    const data = { code: form.code.trim(), category: form.category.trim() || null };
    try {
      setSaving(true);
      setFormError(null);
      if (editing) {
        await unitsApi.update(locationId, editing.id, data);
      } else {
        await unitsApi.create(locationId, data);
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminUnits.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (unit: Unit) => {
    if (!window.confirm(t('adminUnits.confirmDelete', { code: unit.code }))) return;
    try {
      setError(null);
      await unitsApi.remove(locationId, unit.id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminUnits.deleteFailed')));
    }
  };

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin/locations" className="text-decoration-none">&larr; {t('adminUnits.back')}</Link>
          </p>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h1 className="h3 mb-1">{t('adminUnits.title', { location: location?.name ?? '' })}</h1>
              <p className="text-muted mb-0">{t('adminUnits.subtitle')}</p>
            </div>
            <button className="btn btn-dark btn-sm" onClick={() => openDrawer(null)}>
              {t('adminUnits.add')}
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
                    <th>{t('adminUnits.code')}</th>
                    <th>{t('adminUnits.category')}</th>
                    <th className="text-end">{t('adminUsers.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {units.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4">{t('adminUnits.empty')}</td>
                    </tr>
                  )}
                  {units.map((unit) => (
                    <tr key={unit.id}>
                      <td>{unit.code}</td>
                      <td>{unit.category}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end flex-wrap gap-2">
                          <button className="btn btn-sm btn-dark" onClick={() => openDrawer(unit)}>
                            {t('adminUsers.edit')}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(unit)}>
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
        title={editing ? t('adminUnits.edit') : t('adminUnits.add')}
        closeText={t('adminUsers.close')}
        disableClose={saving}
        ariaLabel={editing ? t('adminUnits.edit') : t('adminUnits.add')}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)} disabled={saving}>
              {t('adminUsers.cancel')}
            </button>
            <button type="button" className="btn btn-dark" onClick={save} disabled={saving || form.code.trim() === ''}>
              {saving ? t('adminUsers.saving') : t('adminUsers.save')}
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger">{formError}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="unit-code">{t('adminUnits.code')}</label>
          <input id="unit-code" className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="unit-category">{t('adminUnits.category')}</label>
          <input id="unit-category" className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
      </RightDrawer>
    </PageLayout>
  );
};

export default AdminUnits;
