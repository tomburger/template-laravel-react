import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEndpoints } from '../../services/endpoints/endpoints';
import {
  Allocation,
  AllocationStatus,
  MemberEnrollment,
  UnitEnrollment,
  authRequestOptions,
} from '../../services/apiHelpers';
import { RunAction, STATUS_BADGES, STATUS_TRANSITIONS } from './shared';

interface Props {
  seasonId: number;
  busy: boolean;
  run: RunAction;
  memberEnrollments: MemberEnrollment[];
  unitEnrollments: UnitEnrollment[];
  allocations: Allocation[];
  initialMemberId: string;
  initialUnitId: string;
  onEditAllocation: (allocation: Allocation) => void;
}

const AllocationsTab: React.FC<Props> = ({
  seasonId,
  busy,
  run,
  memberEnrollments,
  unitEnrollments,
  allocations,
  initialMemberId,
  initialUnitId,
  onEditAllocation,
}) => {
  const { t, i18n } = useTranslation();
  const { allocateAUnitToAMember, changeAllocationStatus, deleteAllocation } = getEndpoints();
  const [allocMember, setAllocMember] = useState(initialMemberId);
  const [allocUnit, setAllocUnit] = useState(initialUnitId);

  const formatPrice = (value: string | number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CZK' }).format(Number(value));

  // Units that already have an active (non-cancelled) allocation cannot be allocated again
  const allocatedUnitSeasonIds = new Set(
    allocations.filter((item) => item.status !== 'cancelled').map((item) => item.unit_season_id)
  );
  const allocatableUnits = unitEnrollments.filter((item) => !allocatedUnitSeasonIds.has(item.id));

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select w-auto"
          aria-label={t('adminSeasonDetail.selectMember')}
          value={allocMember}
          onChange={(e) => setAllocMember(e.target.value)}
        >
          <option value="">{t('adminSeasonDetail.selectMember')}</option>
          {memberEnrollments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.last_name} {item.first_name}{item.category ? ` (${item.category})` : ''}
            </option>
          ))}
        </select>
        <select
          className="form-select w-auto"
          aria-label={t('adminSeasonDetail.selectUnit')}
          value={allocUnit}
          onChange={(e) => setAllocUnit(e.target.value)}
        >
          <option value="">{t('adminSeasonDetail.selectUnit')}</option>
          {allocatableUnits.map((item) => (
            <option key={item.id} value={item.id}>
              {item.location_name} / {item.code}{item.category ? ` (${item.category})` : ''}
            </option>
          ))}
        </select>
        <button
          className="btn btn-dark btn-sm"
          disabled={busy || allocMember === '' || allocUnit === ''}
          onClick={() =>
            run(
              () =>
                allocateAUnitToAMember(
                  seasonId,
                  { member_season_id: Number(allocMember), unit_season_id: Number(allocUnit) },
                  authRequestOptions()
                ),
              t('adminSeasonDetail.allocateFailed')
            )
          }
        >
          {t('adminSeasonDetail.allocate')}
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{t('adminSeasonDetail.variableSymbol')}</th>
              <th>{t('adminSeasonDetail.member')}</th>
              <th>{t('adminSeasonDetail.unit')}</th>
              <th className="text-end">{t('adminSeasonDetail.amountDue')}</th>
              <th>{t('adminSeasonDetail.status')}</th>
              <th className="text-end">{t('adminUsers.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {allocations.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">{t('adminSeasonDetail.noAllocations')}</td>
              </tr>
            )}
            {allocations.map((item) => (
              <tr key={item.id}>
                <td>{item.variable_symbol}</td>
                <td>{item.member_name}</td>
                <td>{item.location_name} / {item.unit_code}</td>
                <td className="text-end">{formatPrice(item.amount_due)}</td>
                <td>
                  <span className={`badge ${STATUS_BADGES[item.status]}`}>{t(`adminSeasonDetail.statuses.${item.status}`)}</span>
                </td>
                <td className="text-end">
                  <div className="d-flex justify-content-end flex-wrap gap-2">
                    <button className="btn btn-sm btn-dark" disabled={busy} onClick={() => onEditAllocation(item)}>
                      {t('adminUsers.edit')}
                    </button>
                    {STATUS_TRANSITIONS[item.status].length > 0 && (
                      <select
                        className="form-select form-select-sm w-auto"
                        aria-label={t('adminSeasonDetail.changeStatus')}
                        value=""
                        disabled={busy}
                        onChange={(e) => {
                          const status = e.target.value as AllocationStatus;
                          if (!status) return;
                          run(
                            () => changeAllocationStatus(item.id, { status }, authRequestOptions()),
                            t('adminSeasonDetail.statusFailed')
                          );
                        }}
                      >
                        <option value="">{t('adminSeasonDetail.changeStatus')}</option>
                        {STATUS_TRANSITIONS[item.status].map((status) => (
                          <option key={status} value={status}>{t(`adminSeasonDetail.statuses.${status}`)}</option>
                        ))}
                      </select>
                    )}
                    {(item.status === 'pending' || item.status === 'cancelled') && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm(t('adminSeasonDetail.confirmDeleteAllocation', { name: item.variable_symbol }))) return;
                          run(() => deleteAllocation(item.id, authRequestOptions()), t('adminSeasonDetail.deleteAllocationFailed'));
                        }}
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AllocationsTab;
