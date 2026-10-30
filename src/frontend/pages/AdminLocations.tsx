import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import RightDrawer from '../components/RightDrawer';
import { getEndpoints } from '../services/endpoints/endpoints';
import { Location, apiErrorMessage, authRequestOptions } from '../services/apiHelpers';

const AdminLocations: React.FC = () => {
  const { t } = useTranslation();
  const { listLocations, createLocation, updateLocation, deleteLocation } = getEndpoints();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listLocations<{ data: { locations: Location[] } }>(authRequestOptions());
      setLocations(response.data.locations);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminLocations.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDrawer = (location: Location | null) => {
    setEditing(location);
    setName(location?.name ?? '');
    setFormError(null);
    setDrawerOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      setFormError(null);
      if (editing) {
        await updateLocation(editing.id, { name }, authRequestOptions());
      } else {
        await createLocation({ name }, authRequestOptions());
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminLocations.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (location: Location) => {
    if (!window.confirm(t('adminLocations.confirmDelete', { name: location.name }))) return;
    try {
      setError(null);
      await deleteLocation(location.id, authRequestOptions());
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminLocations.deleteFailed')));
    }
  };

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin" className="text-decoration-none">&larr; {t('adminLocations.back')}</Link>
          </p>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h1 className="h3 mb-1">{t('adminLocations.title')}</h1>
              <p className="text-muted mb-0">{t('adminLocations.subtitle')}</p>
            </div>
            <button className="btn btn-dark btn-sm" onClick={() => openDrawer(null)}>
              {t('adminLocations.add')}
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
                    <th>{t('adminLocations.name')}</th>
                    <th>{t('adminLocations.units')}</th>
                    <th className="text-end">{t('adminUsers.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4">{t('adminLocations.empty')}</td>
                    </tr>
                  )}
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td>{location.name}</td>
                      <td>{location.units_count}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end flex-wrap gap-2">
                          <Link to={`/admin/locations/${location.id}`} className="btn btn-sm btn-primary">
                            {t('adminLocations.manageUnits')}
                          </Link>
                          <Link to={`/admin/locations/${location.id}/layout`} className="btn btn-sm btn-primary">
                            {t('adminLocations.layout')}
                          </Link>
                          <button className="btn btn-sm btn-dark" onClick={() => openDrawer(location)}>
                            {t('adminUsers.edit')}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(location)}>
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
        title={editing ? t('adminLocations.edit') : t('adminLocations.add')}
        closeText={t('adminUsers.close')}
        disableClose={saving}
        ariaLabel={editing ? t('adminLocations.edit') : t('adminLocations.add')}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)} disabled={saving}>
              {t('adminUsers.cancel')}
            </button>
            <button type="button" className="btn btn-dark" onClick={save} disabled={saving || name.trim() === ''}>
              {saving ? t('adminUsers.saving') : t('adminUsers.save')}
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger">{formError}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="location-name">{t('adminLocations.name')}</label>
          <input id="location-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </RightDrawer>
    </PageLayout>
  );
};

export default AdminLocations;
