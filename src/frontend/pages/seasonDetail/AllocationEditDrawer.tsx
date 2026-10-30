import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RightDrawer from '../../components/RightDrawer';
import { getEndpoints } from '../../services/endpoints/endpoints';
import { Allocation, AllocationStatus, apiErrorMessage, authRequestOptions } from '../../services/apiHelpers';
import { STATUS_TRANSITIONS } from './shared';

interface Props {
  allocation: Allocation | null;
  onClose: () => void;
  onSaved: () => void;
}

const AllocationEditDrawer: React.FC<Props> = ({ allocation, onClose, onSaved }) => {
  const { t } = useTranslation();
  const { updateAllocation } = getEndpoints();
  const [form, setForm] = useState({ amount_due: '', variable_symbol: '', status: 'pending' as AllocationStatus });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (allocation) {
      setForm({ amount_due: allocation.amount_due, variable_symbol: allocation.variable_symbol, status: allocation.status });
      setFormError(null);
    }
  }, [allocation]);

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

  return (
    <RightDrawer
      isOpen={allocation !== null}
      onClose={onClose}
      title={t('adminSeasonDetail.editAllocation')}
      closeText={t('adminUsers.close')}
      disableClose={saving}
      ariaLabel={t('adminSeasonDetail.editAllocation')}
      footer={
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
      }
    >
      {formError && <div className="alert alert-danger">{formError}</div>}
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
          value={form.amount_due}
          onChange={(e) => setForm({ ...form, amount_due: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="alloc-vs">{t('adminSeasonDetail.variableSymbol')}</label>
        <input
          id="alloc-vs"
          className="form-control"
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
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as AllocationStatus })}
        >
          {allocation &&
            [allocation.status, ...STATUS_TRANSITIONS[allocation.status]].map((status) => (
              <option key={status} value={status}>{t(`adminSeasonDetail.statuses.${status}`)}</option>
            ))}
        </select>
      </div>
    </RightDrawer>
  );
};

export default AllocationEditDrawer;
