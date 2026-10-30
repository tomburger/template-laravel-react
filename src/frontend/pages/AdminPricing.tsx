import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import RightDrawer from '../components/RightDrawer';
import { getEndpoints } from '../services/endpoints/endpoints';
import { PricingRule, Season, apiErrorMessage, authRequestOptions } from '../services/apiHelpers';

const emptyForm = { season_id: '', unit_category: '', member_category: '', priority: '0', price: '' };
const emptyPreview = { season_id: '', unit_category: '', member_category: '' };

const AdminPricing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { listPricingRules, createPricingRule, updatePricingRule, deletePricingRule, listSeasons, previewPrice } = getEndpoints();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState(emptyPreview);
  const [previewResult, setPreviewResult] = useState<{ rule: PricingRule | null; price: string | null } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const formatPrice = (value: string | number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CZK' }).format(Number(value));

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rulesResponse, seasonsResponse] = await Promise.all([
        listPricingRules<{ data: { rules: PricingRule[] } }>(authRequestOptions()),
        listSeasons<{ data: { seasons: Season[] } }>(authRequestOptions()),
      ]);
      setRules(rulesResponse.data.rules);
      setSeasons(seasonsResponse.data.seasons);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminPricing.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDrawer = (rule: PricingRule | null) => {
    setEditing(rule);
    setForm(
      rule
        ? {
            season_id: rule.season_id ? String(rule.season_id) : '',
            unit_category: rule.unit_category ?? '',
            member_category: rule.member_category ?? '',
            priority: String(rule.priority),
            price: rule.price,
          }
        : emptyForm
    );
    setFormError(null);
    setDrawerOpen(true);
  };

  const save = async () => {
    const data = {
      season_id: form.season_id ? Number(form.season_id) : null,
      unit_category: form.unit_category.trim() || null,
      member_category: form.member_category.trim() || null,
      priority: Number(form.priority),
      price: Number(form.price),
    };
    try {
      setSaving(true);
      setFormError(null);
      if (editing) {
        await updatePricingRule(editing.id, data, authRequestOptions());
      } else {
        await createPricingRule(data, authRequestOptions());
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminPricing.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rule: PricingRule) => {
    if (!window.confirm(t('adminPricing.confirmDelete'))) return;
    try {
      setError(null);
      await deletePricingRule(rule.id, authRequestOptions());
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminPricing.deleteFailed')));
    }
  };

  const runPreview = async () => {
    const params = {
      season_id: Number(preview.season_id),
      ...(preview.unit_category.trim() ? { unit_category: preview.unit_category.trim() } : {}),
      ...(preview.member_category.trim() ? { member_category: preview.member_category.trim() } : {}),
    };
    try {
      setPreviewError(null);
      const response = await previewPrice<{ data: { rule: PricingRule | null; price: string | null } }>(
        params,
        params,
        authRequestOptions()
      );
      setPreviewResult(response.data);
    } catch (err) {
      setPreviewResult(null);
      setPreviewError(apiErrorMessage(err, t('adminPricing.previewFailed')));
    }
  };

  const anyLabel = (value: string | null) => value ?? <span className="text-muted">{t('adminPricing.any')}</span>;
  const canSave = form.price !== '' && form.priority !== '';

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin" className="text-decoration-none">&larr; {t('adminPricing.back')}</Link>
          </p>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h1 className="h3 mb-1">{t('adminPricing.title')}</h1>
              <p className="text-muted mb-0">{t('adminPricing.subtitle')}</p>
            </div>
            <button className="btn btn-dark btn-sm" onClick={() => openDrawer(null)}>
              {t('adminPricing.add')}
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
                    <th>{t('adminPricing.priority')}</th>
                    <th>{t('adminPricing.season')}</th>
                    <th>{t('adminPricing.unitCategory')}</th>
                    <th>{t('adminPricing.memberCategory')}</th>
                    <th className="text-end">{t('adminPricing.price')}</th>
                    <th className="text-end">{t('adminUsers.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">{t('adminPricing.empty')}</td>
                    </tr>
                  )}
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{rule.priority}</td>
                      <td>{anyLabel(rule.season_name)}</td>
                      <td>{anyLabel(rule.unit_category)}</td>
                      <td>{anyLabel(rule.member_category)}</td>
                      <td className="text-end">{formatPrice(rule.price)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end flex-wrap gap-2">
                          <button className="btn btn-sm btn-dark" onClick={() => openDrawer(rule)}>
                            {t('adminUsers.edit')}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(rule)}>
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

          <hr className="my-4" />
          <h2 className="h5 mb-3">{t('adminPricing.previewTitle')}</h2>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label" htmlFor="preview-season">{t('adminPricing.season')}</label>
              <select id="preview-season" className="form-select" value={preview.season_id} onChange={(e) => setPreview({ ...preview, season_id: e.target.value })}>
                <option value="">{t('adminPricing.selectSeason')}</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="preview-unit">{t('adminPricing.unitCategory')}</label>
              <input id="preview-unit" className="form-control" value={preview.unit_category} onChange={(e) => setPreview({ ...preview, unit_category: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="preview-member">{t('adminPricing.memberCategory')}</label>
              <input id="preview-member" className="form-control" value={preview.member_category} onChange={(e) => setPreview({ ...preview, member_category: e.target.value })} />
            </div>
            <div className="col-md-3">
              <button className="btn btn-outline-primary w-100" onClick={runPreview} disabled={!preview.season_id}>
                {t('adminPricing.calculate')}
              </button>
            </div>
          </div>
          {previewError && <div className="alert alert-danger mt-3 mb-0">{previewError}</div>}
          {previewResult && (
            <div className={`alert mt-3 mb-0 ${previewResult.rule ? 'alert-success' : 'alert-warning'}`}>
              {previewResult.rule
                ? t('adminPricing.previewResult', {
                    price: formatPrice(previewResult.price ?? 0),
                    priority: previewResult.rule.priority,
                  })
                : t('adminPricing.previewNone')}
            </div>
          )}
        </div>
      </div>

      <RightDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? t('adminPricing.edit') : t('adminPricing.add')}
        closeText={t('adminUsers.close')}
        disableClose={saving}
        ariaLabel={editing ? t('adminPricing.edit') : t('adminPricing.add')}
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
          <label className="form-label" htmlFor="rule-season">{t('adminPricing.season')}</label>
          <select id="rule-season" className="form-select" value={form.season_id} onChange={(e) => setForm({ ...form, season_id: e.target.value })}>
            <option value="">{t('adminPricing.anySeason')}</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>{season.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="rule-unit">{t('adminPricing.unitCategory')}</label>
          <input id="rule-unit" className="form-control" value={form.unit_category} placeholder={t('adminPricing.anyPlaceholder')} onChange={(e) => setForm({ ...form, unit_category: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="rule-member">{t('adminPricing.memberCategory')}</label>
          <input id="rule-member" className="form-control" value={form.member_category} placeholder={t('adminPricing.anyPlaceholder')} onChange={(e) => setForm({ ...form, member_category: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="rule-priority">{t('adminPricing.priority')}</label>
          <input id="rule-priority" type="number" min="0" step="1" className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          <div className="form-text">{t('adminPricing.priorityHint')}</div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="rule-price">{t('adminPricing.price')}</label>
          <input id="rule-price" type="number" min="0" step="0.01" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
      </RightDrawer>
    </PageLayout>
  );
};

export default AdminPricing;
