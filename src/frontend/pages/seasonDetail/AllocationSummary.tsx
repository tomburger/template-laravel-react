import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Allocation, AllocationStatus, MemberEnrollment, UnitEnrollment } from '../../services/apiHelpers';
import { STATUS_BADGES } from './shared';

interface Props {
  members: MemberEnrollment[];
  units: UnitEnrollment[];
  allocations: Allocation[];
  onRetry: () => void;
}

interface CategoryRow {
  category: string | null;
  enrolled: number;
  allocated: number;
  amount: number;
}

const categoryRows = (
  enrollments: { id: number; category: string | null }[],
  active: Allocation[],
  enrollmentKey: 'member_season_id' | 'unit_season_id',
): CategoryRow[] => {
  const rows = new Map<string | null, CategoryRow>();
  const enrollmentCategories = new Map<number, string | null>();
  const allocatedIds = new Set(active.map((item) => item[enrollmentKey]));

  for (const enrollment of enrollments) {
    const category = enrollment.category && enrollment.category.trim() !== '' ? enrollment.category : null;
    enrollmentCategories.set(enrollment.id, category);
    const row = rows.get(category) ?? { category, enrolled: 0, allocated: 0, amount: 0 };
    row.enrolled += 1;
    if (allocatedIds.has(enrollment.id)) row.allocated += 1;
    rows.set(category, row);
  }
  for (const allocation of active) {
    const category = enrollmentCategories.get(allocation[enrollmentKey]);
    if (category !== undefined) {
      const row = rows.get(category);
      if (row) row.amount += Math.round(Number(allocation.amount_due) * 100);
    }
  }
  return Array.from(rows.values());
};

const STATUSES: AllocationStatus[] = ['pending', 'confirmed', 'paid', 'cancelled'];

const AllocationSummary: React.FC<Props> = ({ members, units, allocations, onRetry }) => {
  const { t, i18n } = useTranslation();
  const summary = useMemo(() => {
    const active = allocations.filter((allocation) => allocation.status !== 'cancelled');
    const memberIds = new Set(members.map((member) => member.id));
    const unitIds = new Set(units.map((unit) => unit.id));
    const memberRows = categoryRows(members, active, 'member_season_id');
    const unitRows = categoryRows(units, active, 'unit_season_id');
    const statuses = STATUSES.map((status) => {
      const items = allocations.filter((allocation) => allocation.status === status);
      return {
        status,
        count: items.length,
        amount: items.reduce((total, item) => total + Math.round(Number(item.amount_due) * 100), 0),
      };
    });
    return {
      memberRows,
      unitRows,
      statuses,
      memberCount: memberRows.reduce((total, row) => total + row.allocated, 0),
      unitCount: unitRows.reduce((total, row) => total + row.allocated, 0),
      amount: active.reduce((total, item) => total + Math.round(Number(item.amount_due) * 100), 0),
      inconsistent: active.some((item) => !memberIds.has(item.member_season_id) || !unitIds.has(item.unit_season_id)),
    };
  }, [members, units, allocations]);

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CZK' }).format(cents / 100);
  const formatPercent = (count: number, total: number) =>
    total === 0 ? '—' : new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }).format(count / total);

  if (summary.inconsistent) {
    return (
      <div className="alert alert-danger" role="alert">
        {t('adminSeasonDashboard.allocationDataChanged')}{' '}
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>{t('home.retry')}</button>
      </div>
    );
  }

  const categoryTable = (title: string, rows: CategoryRow[]) => (
    <div className="table-responsive">
      <h3 className="h6">{title}</h3>
      <table className="table table-sm align-middle" aria-label={title}>
        <thead>
          <tr>
            <th scope="col">{t('adminMembers.category')}</th>
            <th scope="col" className="text-end">{t('adminSeasonDashboard.allocatedCount')}</th>
            <th scope="col" className="text-end">{t('adminSeasonDashboard.enrolledCount')}</th>
            <th scope="col" className="text-end">{t('adminSeasonDashboard.progress')}</th>
            <th scope="col" className="text-end">{t('adminSeasonDashboard.activeValue')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category === null ? '__uncategorized__' : `category:${row.category}`}>
              <td>{row.category ?? t('adminSeasonDashboard.noCategory')}</td>
              <td className="text-end">{row.allocated}</td>
              <td className="text-end">{row.enrolled}</td>
              <td className="text-end">{formatPercent(row.allocated, row.enrolled)}</td>
              <td className="text-end">{formatMoney(row.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="text-muted">{t('adminSeasonDashboard.noEnrollments')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <p className="text-muted small">{t('adminSeasonDashboard.allocationSummaryHint')}</p>
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="h3 mb-1">{formatPercent(summary.unitCount, units.length)}</div>
          <div>{t('adminSeasonDashboard.unitsAllocated', { allocated: summary.unitCount, total: units.length })}</div>
        </div>
        <div className="col-12 col-md-4">
          <div className="h3 mb-1">{formatPercent(summary.memberCount, members.length)}</div>
          <div>{t('adminSeasonDashboard.membersAllocated', { allocated: summary.memberCount, total: members.length })}</div>
        </div>
        <div className="col-12 col-md-4">
          <div className="h3 mb-1">{formatMoney(summary.amount)}</div>
          <div>{t('adminSeasonDashboard.activeValue')}</div>
        </div>
      </div>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          {categoryTable(t('adminSeasonDashboard.memberAllocationCategories'), summary.memberRows)}
        </div>
        <div className="col-12 col-lg-6">
          {categoryTable(t('adminSeasonDashboard.unitAllocationCategories'), summary.unitRows)}
        </div>
      </div>
      <div className="table-responsive mt-3">
        <h3 className="h6">{t('adminSeasonDashboard.allocationsByStatus')}</h3>
        <table className="table table-sm align-middle mb-0" aria-label={t('adminSeasonDashboard.allocationsByStatus')}>
          <thead>
            <tr>
              <th scope="col">{t('adminSeasonDetail.status')}</th>
              <th scope="col" className="text-end">{t('adminSeasonDetail.allocationsTab')}</th>
              <th scope="col" className="text-end">{t('adminSeasonDetail.amountDue')}</th>
            </tr>
          </thead>
          <tbody>
            {summary.statuses.map((row) => (
              <tr key={row.status}>
                <td><span className={`badge ${STATUS_BADGES[row.status]}`}>{t(`adminSeasonDetail.statuses.${row.status}`)}</span></td>
                <td className="text-end">{row.count}</td>
                <td className="text-end">{formatMoney(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AllocationSummary;
