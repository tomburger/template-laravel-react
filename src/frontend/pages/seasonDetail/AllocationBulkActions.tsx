import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import RightDrawer from '../../components/RightDrawer';
import { useConfirm } from '../../components/useConfirm';
import { Allocation, Season, apiErrorMessage, authRequestOptions } from '../../services/apiHelpers';

interface Props {
  seasonId: number;
  seasons: Season[];
  allocations: Allocation[] | null;
  onChanged: () => void;
}

const AllocationBulkActions: React.FC<Props> = ({ seasonId, seasons, allocations, onChanged }) => {
  const { t } = useTranslation();
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const sources = seasons.filter((season) => season.id !== seasonId);
  const pending = allocations?.filter((item) => item.status === 'pending').length ?? 0;
  const removable = allocations?.filter((item) => item.status === 'pending' || item.status === 'cancelled').length ?? 0;

  const remove = async () => {
    if (busy || !removable) return;
    if (!(await confirm({ message: t('adminSeasonDashboard.confirmRemoveAllocations'), confirmText: t('common.delete') }))) return;
    try {
      setBusy(true);
      setError(null);
      setResult(null);
      const response = await axios.delete<{ deleted: number; retained: number }>(
        `/api/seasons/${seasonId}/allocations`,
        authRequestOptions(),
      );
      setResult(t('adminSeasonDashboard.removeAllocationsResult', response.data));
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminSeasonDashboard.removeAllocationsFailed')));
    } finally {
      setBusy(false);
    }
  };

  const recalculate = async () => {
    if (busy || !pending) return;
    if (!(await confirm({ message: t('adminSeasonDashboard.confirmRecalculate'), confirmText: t('adminSeasonDashboard.recalculateAllocations') }))) return;
    try {
      setBusy(true);
      setError(null);
      setResult(null);
      const response = await axios.post<{ recalculated: number; skipped_no_rule: number }>(
        `/api/seasons/${seasonId}/allocations/recalculate`,
        {},
        authRequestOptions(),
      );
      setResult(t('adminSeasonDashboard.recalculateResult', response.data));
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminSeasonDashboard.recalculateFailed')));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    const source = sources.find((item) => item.id === Number(sourceId));
    if (busy || !source) return;
    if (!(await confirm({ message: t('adminSeasonDashboard.confirmCopyAllocations', { season: `${source.name} (${source.start_date} – ${source.end_date})` }), confirmText: t('adminSeasonDashboard.copyAllocations') }))) return;
    try {
      setBusy(true);
      setError(null);
      setResult(null);
      const response = await axios.post<{ copied: number; skipped_ineligible: number; skipped_occupied: number; skipped_no_rule: number }>(
        `/api/seasons/${seasonId}/allocations/copy`,
        { source_season_id: source.id },
        authRequestOptions(),
      );
      setResult(t('adminSeasonDashboard.copyAllocationsResult', response.data));
      setCopyOpen(false);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('adminSeasonDashboard.copyAllocationsFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={remove} disabled={busy || !allocations || !removable}>
          {t('adminSeasonDashboard.removeAllocations')}
        </button>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={recalculate} disabled={busy || !allocations || !pending}>
          {t('adminSeasonDashboard.recalculateAllocations')}
        </button>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => { setSourceId(''); setError(null); setCopyOpen(true); }} disabled={busy || !allocations}>
          {t('adminSeasonDashboard.copyAllocations')}
        </button>
      </div>
      {result && <div className="alert alert-success mt-3 mb-0" role="status">{result}</div>}
      {error && !copyOpen && <div className="alert alert-danger mt-3 mb-0" role="alert">{error}</div>}
      <RightDrawer
        isOpen={copyOpen}
        onClose={() => setCopyOpen(false)}
        title={t('adminSeasonDashboard.copyAllocations')}
        ariaLabel={t('adminSeasonDashboard.copyAllocations')}
        closeText={t('adminUsers.close')}
        disableClose={busy}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setCopyOpen(false)} disabled={busy}>
              {t('adminUsers.cancel')}
            </button>
            <button type="button" className="btn btn-dark" onClick={copy} disabled={busy || !sourceId}>
              {busy ? t('adminUsers.saving') : t('adminSeasonDashboard.copyAllocations')}
            </button>
          </div>
        }
      >
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <label className="form-label" htmlFor="source-season">{t('adminSeasonDashboard.sourceSeason')}</label>
        <select id="source-season" className="form-select" value={sourceId} onChange={(event) => setSourceId(event.target.value)} disabled={busy}>
          <option value="">{t('adminSeasonDashboard.selectSourceSeason')}</option>
          {sources.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.start_date} – {item.end_date})</option>)}
        </select>
        {sources.length === 0 && <div className="form-text">{t('adminSeasonDashboard.noSourceSeasons')}</div>}
        <p className="form-text mt-2">{t('adminSeasonDashboard.copyAllocationsHint')}</p>
      </RightDrawer>
      {dialog}
    </div>
  );
};

export default AllocationBulkActions;
