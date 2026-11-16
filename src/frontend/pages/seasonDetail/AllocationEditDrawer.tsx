import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import RightDrawer from '../../components/RightDrawer';
import { getEndpoints } from '../../services/endpoints/endpoints';
import { Allocation, AllocationStatus, apiErrorMessage, authRequestOptions } from '../../services/apiHelpers';
import { STATUS_TRANSITIONS } from './shared';

interface Props {
  allocation: Allocation | null;
  newlyCreated: boolean;
  onClose: () => void;
  onSaved: () => void;
  onConfirmDelete: (variableSymbol: string) => Promise<boolean>;
  onAllocateMore?: () => void;
}

type PricePreview =
  | { allocationId: number; status: 'loading' }
  | { allocationId: number; status: 'loaded'; price: string | null }
  | { allocationId: number; status: 'error'; message: string };

const AllocationEditDrawer: React.FC<Props> = ({ allocation, newlyCreated, onClose, onSaved, onConfirmDelete, onAllocateMore }) => {
  const { t, i18n } = useTranslation();
  const { updateAllocation, deleteAllocation } = getEndpoints();
  const [form, setForm] = useState({ amount_due: '', variable_symbol: '', status: 'pending' as AllocationStatus });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pricePreview, setPricePreview] = useState<PricePreview | null>(null);
  const [priceReload, setPriceReload] = useState(0);
  const dirty = allocation && (
    form.amount_due !== allocation.amount_due ||
    form.variable_symbol !== allocation.variable_symbol ||
    form.status !== allocation.status
  );

  useEffect(() => {
    if (allocation) {
      setForm({ amount_due: allocation.amount_due, variable_symbol: allocation.variable_symbol, status: allocation.status });
      setFormError(null);
    }
  }, [allocation]);

  const allocationId = allocation?.id;
  useEffect(() => {
    if (allocationId === undefined) {
      setPricePreview(null);
      return;
    }

    const controller = new AbortController();
    const loadPrice = async () => {
      setPricePreview({ allocationId, status: 'loading' });
      try {
        const response = await axios.get<{ price: string | null }>(
          `/api/allocations/${allocationId}/price`,
          { ...authRequestOptions(), signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setPricePreview({ allocationId, status: 'loaded', price: response.data.price });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setPricePreview({ allocationId, status: 'error', message: apiErrorMessage(err, t('adminSeasonDetail.rulePriceLoadFailed')) });
        }
      }
    };

    void loadPrice();
    return () => controller.abort();
  }, [allocationId, priceReload, t]);

  const save = async () => {
    if (!allocation) return;
    try {
      setSaving(true);
      setFormError(null);
      await updateAllocation(
        allocation.id,
        {
          amount_due: Number(form.amount_due),
          variable_symbol: form.variable_symbol.trim(),
          status: form.status,
        },
        authRequestOptions()
      );
      onSaved();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminSeasonDetail.allocationSaveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!allocation || saving) return;
    if (!(await onConfirmDelete(allocation.variable_symbol))) return;
    try {
      setSaving(true);
      setFormError(null);
      await deleteAllocation(allocation.id, authRequestOptions());
      onSaved();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminSeasonDetail.deleteAllocationFailed')));
    } finally {
      setSaving(false);
    }
  };

  const applyRulePrice = (price: string) => () => {
    setForm((current) => ({ ...current, amount_due: price }));
  };

  return (
    <RightDrawer
      isOpen={allocation !== null}
      onClose={onClose}
      title={t('adminSeasonDetail.editAllocation')}
      closeText={t('adminUsers.close')}
      disableClose={saving}
      ariaLabel={t('adminSeasonDetail.editAllocation')}
      footer={
        <div className="d-flex flex-column gap-3">
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
              {t('adminUsers.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-dark"
              onClick={save}
              disabled={saving || form.amount_due === '' || form.variable_symbol.trim() === ''}
            >
              {saving ? t('adminUsers.saving') : t('adminUsers.save')}
            </button>
          </div>
          {allocation && (allocation.status === 'pending' || allocation.status === 'cancelled') && (
            <button type="button" className="btn btn-danger w-100" onClick={remove} disabled={saving}>
              {t('common.delete')}
            </button>
          )}
        </div>
      }
    >
      {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
      {allocation && newlyCreated && <div className="alert alert-success" role="status">{t('adminSeasonDetail.allocationCreated')}</div>}
      {allocation && (
        <p className="text-muted">
          {allocation.member_name} – {allocation.location_name} / {allocation.unit_code}
        </p>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="alloc-amount">{t('adminSeasonDetail.amountDue')}</label>
        <input
          id="alloc-amount"
          type="number"
          min="0"
          step="0.01"
          className="form-control"
          disabled={saving}
          value={form.amount_due}
          onChange={(e) => setForm({ ...form, amount_due: e.target.value })}
        />
        {allocation && (!pricePreview || pricePreview.allocationId !== allocation.id || pricePreview.status === 'loading') && (
          <div className="form-text" role="status">{t('common.loading')}</div>
        )}
        {allocation && pricePreview?.allocationId === allocation.id && pricePreview.status === 'error' && (
          <div className="alert alert-danger mt-2" role="alert">
            {pricePreview.message}{' '}
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setPriceReload((value) => value + 1)}>
              {t('home.retry')}
            </button>
          </div>
        )}
        {allocation && pricePreview?.allocationId === allocation.id && pricePreview.status === 'loaded' && (
          pricePreview.price === null ? (
            <div className="form-text">{t('adminSeasonDetail.noRulePrice')}</div>
          ) : (
            <div className="mt-2">
              <div>{t('adminSeasonDetail.rulePrice', {
                price: new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CZK' }).format(Number(pricePreview.price)),
              })}</div>
              {form.amount_due !== '' && Number.isFinite(Number(form.amount_due)) && (
                Number(form.amount_due) === Number(pricePreview.price) ? (
                  <div className="form-text">{t('adminSeasonDetail.rulePriceMatches')}</div>
                ) : (
                  <div className="form-text text-warning-emphasis">{t('adminSeasonDetail.rulePriceDiffers')}</div>
                )
              )}
              {form.amount_due === '' || Number(form.amount_due) !== Number(pricePreview.price) ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary mt-2"
                  disabled={saving}
                  onClick={applyRulePrice(pricePreview.price)}
                >
                  {t('adminSeasonDetail.applyRulePrice')}
                </button>
              ) : null}
              {form.amount_due !== '' && Number(form.amount_due) === Number(pricePreview.price) && Number(allocation.amount_due) !== Number(pricePreview.price) && (
                <div className="form-text">{t('adminSeasonDetail.rulePriceUnsaved')}</div>
              )}
            </div>
          )
        )}
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="alloc-vs">{t('adminSeasonDetail.variableSymbol')}</label>
        <input
          id="alloc-vs"
          className="form-control"
          disabled={saving}
          inputMode="numeric"
          maxLength={10}
          value={form.variable_symbol}
          onChange={(e) => setForm({ ...form, variable_symbol: e.target.value })}
        />
        <div className="form-text">{t('adminSeasonDetail.variableSymbolHint')}</div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="alloc-status">{t('adminSeasonDetail.status')}</label>
        <select
          id="alloc-status"
          className="form-select"
          disabled={saving}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as AllocationStatus })}
        >
          {allocation &&
            [allocation.status, ...STATUS_TRANSITIONS[allocation.status]].map((status) => (
              <option key={status} value={status}>{t(`adminSeasonDetail.statuses.${status}`)}</option>
            ))}
        </select>
      </div>
      {allocation && onAllocateMore && (
        <div>
          <button type="button" className="btn btn-outline-dark" onClick={onAllocateMore} disabled={saving || Boolean(dirty)}>
            {t('adminSeasonDetail.allocateAnother')}
          </button>
          {dirty && <div className="form-text">{t('adminSeasonDetail.saveBeforeAllocating')}</div>}
        </div>
      )}
    </RightDrawer>
  );
};

export default AllocationEditDrawer;
