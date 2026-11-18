import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AllocationStatus, apiErrorMessage, authRequestOptions } from '../services/apiHelpers';
import { useConfirm } from './useConfirm';

type MemberAllocation = {
  id: number;
  season_name: string;
  location_name: string;
  unit_code: string;
  status: AllocationStatus;
  amount_due: string;
  variable_symbol: string;
};

const MemberAllocations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { confirm, dialog } = useConfirm();
  const [allocations, setAllocations] = useState<MemberAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const cancelController = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await axios.get<{ allocations: MemberAllocation[] }>('/api/user/allocations', {
          ...authRequestOptions(), signal: controller.signal,
        });
        if (!controller.signal.aborted) setAllocations(response.data.allocations);
      } catch (err) {
        if (!controller.signal.aborted) setLoadError(apiErrorMessage(err, t('home.allocationsLoadFailed')));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => () => cancelController.current?.abort(), []);

  const cancel = async (allocation: MemberAllocation) => {
    if (!(await confirm({
      message: t('home.confirmCancelAllocation', { unit: allocation.unit_code, season: allocation.season_name }),
      confirmText: t('home.cancelAllocation'),
    }))) return;

    const controller = new AbortController();
    cancelController.current = controller;
    try {
      setCancelling(allocation.id);
      setCancelError(null);
      await axios.post(`/api/user/allocations/${allocation.id}/cancel`, {}, {
        ...authRequestOptions(), signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setAllocations((current) => current.map((item) =>
          item.id === allocation.id ? { ...item, status: 'cancelled' } : item
        ));
      }
    } catch (err) {
      if (!controller.signal.aborted) setCancelError(apiErrorMessage(err, t('home.cancelAllocationFailed')));
    } finally {
      if (!controller.signal.aborted) setCancelling(null);
    }
  };

  const retry = () => {
    setCancelError(null);
    setRefresh((current) => current + 1);
  };
  const formatPrice = (value: string) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CZK' }).format(Number(value));

  return (
    <section className="mt-4" aria-labelledby="home-allocations-heading">
      <h3 id="home-allocations-heading" className="h5">{t('home.allocations')}</h3>
      {(loadError || cancelError) && (
        <div className="alert alert-danger" role="alert">
          {loadError || cancelError}{' '}
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={retry} disabled={loading || cancelling !== null}>
            {t('home.retry')}
          </button>
        </div>
      )}
      {loading && <div role="status">{t('common.loading')}</div>}
      {!loading && !loadError && allocations.length === 0 && <p className="text-muted mb-0">{t('home.noAllocations')}</p>}
      {!loading && !loadError && allocations.length > 0 && (
        <ul className="list-group">
          {allocations.map((allocation) => (
            <li key={allocation.id} className="list-group-item">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <strong>{allocation.season_name} · {allocation.location_name} · {allocation.unit_code}</strong>
                  <div>{t('adminSeasonDetail.status')}: {t(`adminSeasonDetail.statuses.${allocation.status}`)}</div>
                  <div>{t('adminSeasonDetail.amountDue')}: {formatPrice(allocation.amount_due)}</div>
                  <div>{t('adminSeasonDetail.variableSymbol')}: {allocation.variable_symbol}</div>
                </div>
                {(allocation.status === 'pending' || allocation.status === 'confirmed') && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void cancel(allocation)} disabled={cancelling !== null}>
                    {cancelling === allocation.id ? t('home.cancellingAllocation') : t('home.cancelAllocation')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {dialog}
    </section>
  );
};

export default MemberAllocations;
