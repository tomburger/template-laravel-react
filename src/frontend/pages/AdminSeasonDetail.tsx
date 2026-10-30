import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import RightDrawer from '../components/RightDrawer';
import { getEndpoints } from '../services/endpoints/endpoints';
import {
  Allocation,
  AllocationStatus,
  AvailableMember,
  AvailableUnit,
  MemberEnrollment,
  Season,
  UnitEnrollment,
  apiErrorMessage,
  authRequestOptions,
} from '../services/apiHelpers';

type Tab = 'members' | 'units' | 'allocations';
type AllocationFilter = 'all' | 'allocated' | 'not-allocated';

const ALLOCATION_FILTERS: AllocationFilter[] = ['all', 'allocated', 'not-allocated'];

// Mirrors the allowed status changes enforced by the API
const STATUS_TRANSITIONS: Record<AllocationStatus, AllocationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['pending', 'paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  cancelled: [],
};

const STATUS_BADGES: Record<AllocationStatus, string> = {
  pending: 'bg-secondary',
  confirmed: 'bg-primary',
  paid: 'bg-success',
  cancelled: 'bg-danger',
};

const AdminSeasonDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const seasonId = Number(useParams().seasonId);
  const {
    listSeasons,
    listMembersEnrolledInASeason,
    listMembersNotYetEnrolledInASeason,
    enrollMemberInASeason,
    removeMemberEnrollmentFromASeason,
    listUnitsEnrolledInASeason,
    listUnitsNotYetEnrolledInASeason,
    enrollUnitInASeason,
    removeUnitEnrollmentFromASeason,
    listAllocationsOfASeason,
    allocateAUnitToAMember,
    changeAllocationStatus,
    updateAllocation,
    deleteAllocation,
  } = getEndpoints();

  const [tab, setTab] = useState<Tab>('members');
  const [season, setSeason] = useState<Season | null>(null);
  const [memberEnrollments, setMemberEnrollments] = useState<MemberEnrollment[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [unitEnrollments, setUnitEnrollments] = useState<UnitEnrollment[]>([]);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [allocMember, setAllocMember] = useState('');
  const [allocUnit, setAllocUnit] = useState('');
  const [memberFilter, setMemberFilter] = useState<AllocationFilter>('all');
  const [unitFilter, setUnitFilter] = useState<AllocationFilter>('all');
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [allocForm, setAllocForm] = useState({ amount_due: '', variable_symbol: '', status: 'pending' as AllocationStatus });
  const [allocSaving, setAllocSaving] = useState(false);
  const [allocFormError, setAllocFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const options = authRequestOptions();
      const [seasons, members, freeMembers, units, freeUnits, allocationList] = await Promise.all([
        listSeasons<{ data: { seasons: Season[] } }>(options),
        listMembersEnrolledInASeason<{ data: { enrollments: MemberEnrollment[] } }>(seasonId, options),
        listMembersNotYetEnrolledInASeason<{ data: { members: AvailableMember[] } }>(seasonId, options),
        listUnitsEnrolledInASeason<{ data: { enrollments: UnitEnrollment[] } }>(seasonId, options),
        listUnitsNotYetEnrolledInASeason<{ data: { units: AvailableUnit[] } }>(seasonId, options),
        listAllocationsOfASeason<{ data: { allocations: Allocation[] } }>(seasonId, options),
      ]);
      setSeason(seasons.data.seasons.find((item) => item.id === seasonId) ?? null);
      setMemberEnrollments(members.data.enrollments);
      setAvailableMembers(freeMembers.data.members);
      setUnitEnrollments(units.data.enrollments);
      setAvailableUnits(freeUnits.data.units);
      setAllocations(allocationList.data.allocations);
      setAllocMember('');
      setAllocUnit('');
      setSelectedMember('');
      setSelectedUnit('');
    } catch (err) {
      setError(apiErrorMessage(err, t('adminSeasonDetail.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [seasonId]);

  // Runs a mutation, then reloads; shows the server message on failure
  const run = async (action: () => Promise<unknown>, fallback: string) => {
    try {
      setBusy(true);
      setError(null);
      await action();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(i18n.language);

  const formatPrice = (value: string | number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CZK' }).format(Number(value));

  // Units that already have an active (non-cancelled) allocation cannot be allocated again
  const allocatedUnitSeasonIds = new Set(
    allocations.filter((item) => item.status !== 'cancelled').map((item) => item.unit_season_id)
  );
  const allocatableUnits = unitEnrollments.filter((item) => !allocatedUnitSeasonIds.has(item.id));

  // Active (non-cancelled) allocations grouped by member / unit enrollment
  const groupActiveAllocations = (key: 'member_season_id' | 'unit_season_id') => {
    const groups = new Map<number, Allocation[]>();
    allocations
      .filter((item) => item.status !== 'cancelled')
      .forEach((item) => groups.set(item[key], [...(groups.get(item[key]) ?? []), item]));
    return groups;
  };
  const allocationsByMember = groupActiveAllocations('member_season_id');
  const allocationsByUnit = groupActiveAllocations('unit_season_id');

  const matchesFilter = (filter: AllocationFilter, hasAllocation: boolean) =>
    filter === 'all' || (filter === 'allocated') === hasAllocation;

  const visibleMembers = memberEnrollments.filter((item) => matchesFilter(memberFilter, allocationsByMember.has(item.id)));
  const visibleUnits = unitEnrollments.filter((item) => matchesFilter(unitFilter, allocationsByUnit.has(item.id)));

  const renderFilter = (id: string, value: AllocationFilter, onChange: (value: AllocationFilter) => void) => (
    <div className="row g-3 mb-3">
      <div className="col-md-4">
        <label className="form-label" htmlFor={id}>{t('adminSeasonDetail.allocationFilter')}</label>
        <select id={id} className="form-select" value={value} onChange={(e) => onChange(e.target.value as AllocationFilter)}>
          {ALLOCATION_FILTERS.map((option) => (
            <option key={option} value={option}>{t(`adminSeasonDetail.allocationFilters.${option}`)}</option>
          ))}
        </select>
      </div>
    </div>
  );

  // Lists the active allocations of an enrollment, each with an edit button;
  // when there are none, a link jumps to the Allocations tab with this entry preselected
  const renderAllocationCell = (
    items: Allocation[] | undefined,
    label: (item: Allocation) => string,
    onAllocate: () => void
  ) => {
    if (!items || items.length === 0) {
      return (
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="text-muted">{t('adminSeasonDetail.notAllocated')}</span>
          <button type="button" className="btn btn-sm btn-outline-dark py-0" disabled={busy} onClick={onAllocate}>
            {t('adminSeasonDetail.allocate')}
          </button>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column gap-1">
        {items.map((item) => (
          <div key={item.id} className="d-flex flex-wrap align-items-center gap-2">
            <span>{label(item)}</span>
            <span className={`badge ${STATUS_BADGES[item.status]}`}>{t(`adminSeasonDetail.statuses.${item.status}`)}</span>
            <button className="btn btn-sm btn-outline-dark py-0" disabled={busy} onClick={() => openAllocationEditor(item)}>
              {t('adminSeasonDetail.editAllocationShort')}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const openAllocationEditor = (item: Allocation) => {
    setEditingAllocation(item);
    setAllocForm({ amount_due: item.amount_due, variable_symbol: item.variable_symbol, status: item.status });
    setAllocFormError(null);
  };

  const saveAllocation = async () => {
    if (!editingAllocation) return;
    try {
      setAllocSaving(true);
      setAllocFormError(null);
      await updateAllocation(
        editingAllocation.id,
        {
          amount_due: Number(allocForm.amount_due),
          variable_symbol: allocForm.variable_symbol.trim(),
          status: allocForm.status,
        },
        authRequestOptions()
      );
      setEditingAllocation(null);
      await load();
    } catch (err) {
      setAllocFormError(apiErrorMessage(err, t('adminSeasonDetail.allocationSaveFailed')));
    } finally {
      setAllocSaving(false);
    }
  };

  const renderAllocations = () => (
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
                    <button className="btn btn-sm btn-dark" disabled={busy} onClick={() => openAllocationEditor(item)}>
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

  const renderMembers = () => (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select w-auto"
          aria-label={t('adminSeasonDetail.selectMember')}
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
        >
          <option value="">{t('adminSeasonDetail.selectMember')}</option>
          {availableMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.last_name} {member.first_name}{member.category ? ` (${member.category})` : ''}
            </option>
          ))}
        </select>
        <button
          className="btn btn-dark btn-sm"
          disabled={busy || selectedMember === ''}
          onClick={() =>
            run(
              () => enrollMemberInASeason(seasonId, { member_id: Number(selectedMember) }, authRequestOptions()),
              t('adminSeasonDetail.enrollFailed')
            )
          }
        >
          {t('adminSeasonDetail.enroll')}
        </button>
      </div>
      {renderFilter('member-allocation-filter', memberFilter, setMemberFilter)}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{t('adminMembers.name')}</th>
              <th>{t('adminSeasonDetail.categorySnapshot')}</th>
              <th>{t('adminSeasonDetail.allocation')}</th>
              <th className="text-end">{t('adminUsers.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  {memberEnrollments.length === 0 ? t('adminSeasonDetail.noMembers') : t('adminSeasonDetail.noMatches')}
                </td>
              </tr>
            )}
            {visibleMembers.map((item) => (
              <tr key={item.id}>
                <td>{item.last_name} {item.first_name}</td>
                <td>{item.category}</td>
                <td>
                  {renderAllocationCell(allocationsByMember.get(item.id), (a) => `${a.location_name} / ${a.unit_code}`, () => {
                    setAllocMember(String(item.id));
                    setAllocUnit('');
                    setTab('allocations');
                  })}
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm(t('adminSeasonDetail.confirmRemove', { name: `${item.first_name} ${item.last_name}` }))) return;
                      run(
                        () => removeMemberEnrollmentFromASeason(seasonId, item.id, authRequestOptions()),
                        t('adminSeasonDetail.removeFailed')
                      );
                    }}
                  >
                    {t('adminSeasonDetail.remove')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderUnits = () => (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select w-auto"
          aria-label={t('adminSeasonDetail.selectUnit')}
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
        >
          <option value="">{t('adminSeasonDetail.selectUnit')}</option>
          {availableUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.location_name} / {unit.code}{unit.category ? ` (${unit.category})` : ''}
            </option>
          ))}
        </select>
        <button
          className="btn btn-dark btn-sm"
          disabled={busy || selectedUnit === ''}
          onClick={() =>
            run(
              () => enrollUnitInASeason(seasonId, { unit_id: Number(selectedUnit) }, authRequestOptions()),
              t('adminSeasonDetail.enrollFailed')
            )
          }
        >
          {t('adminSeasonDetail.enroll')}
        </button>
      </div>
      {renderFilter('unit-allocation-filter', unitFilter, setUnitFilter)}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{t('adminLocations.name')}</th>
              <th>{t('adminUnits.code')}</th>
              <th>{t('adminSeasonDetail.categorySnapshot')}</th>
              <th>{t('adminSeasonDetail.allocation')}</th>
              <th className="text-end">{t('adminUsers.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleUnits.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  {unitEnrollments.length === 0 ? t('adminSeasonDetail.noUnits') : t('adminSeasonDetail.noMatches')}
                </td>
              </tr>
            )}
            {visibleUnits.map((item) => (
              <tr key={item.id}>
                <td>{item.location_name}</td>
                <td>{item.code}</td>
                <td>{item.category}</td>
                <td>
                  {renderAllocationCell(allocationsByUnit.get(item.id), (a) => a.member_name, () => {
                    setAllocUnit(String(item.id));
                    setAllocMember('');
                    setTab('allocations');
                  })}
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm(t('adminSeasonDetail.confirmRemove', { name: item.code }))) return;
                      run(
                        () => removeUnitEnrollmentFromASeason(seasonId, item.id, authRequestOptions()),
                        t('adminSeasonDetail.removeFailed')
                      );
                    }}
                  >
                    {t('adminSeasonDetail.remove')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin/seasons" className="text-decoration-none">&larr; {t('adminSeasonDetail.back')}</Link>
          </p>
          <h1 className="h3 mb-1">{t('adminSeasonDetail.title', { season: season?.name ?? '' })}</h1>
          {season && (
            <p className="text-muted">{formatDate(season.start_date)} – {formatDate(season.end_date)}</p>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
                {t('adminSeasonDetail.membersTab')} ({memberEnrollments.length})
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'units' ? 'active' : ''}`} onClick={() => setTab('units')}>
                {t('adminSeasonDetail.unitsTab')} ({unitEnrollments.length})
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'allocations' ? 'active' : ''}`} onClick={() => setTab('allocations')}>
                {t('adminSeasonDetail.allocationsTab')} ({allocations.length})
              </button>
            </li>
          </ul>

          {loading ? (
            <div className="d-flex align-items-center" role="status">
              <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              <span>{t('common.loading')}</span>
            </div>
          ) : tab === 'members' ? (
            renderMembers()
          ) : tab === 'units' ? (
            renderUnits()
          ) : (
            renderAllocations()
          )}
        </div>
      </div>

      <RightDrawer
        isOpen={editingAllocation !== null}
        onClose={() => setEditingAllocation(null)}
        title={t('adminSeasonDetail.editAllocation')}
        closeText={t('adminUsers.close')}
        disableClose={allocSaving}
        ariaLabel={t('adminSeasonDetail.editAllocation')}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingAllocation(null)} disabled={allocSaving}>
              {t('adminUsers.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-dark"
              onClick={saveAllocation}
              disabled={allocSaving || allocForm.amount_due === '' || allocForm.variable_symbol.trim() === ''}
            >
              {allocSaving ? t('adminUsers.saving') : t('adminUsers.save')}
            </button>
          </div>
        }
      >
        {allocFormError && <div className="alert alert-danger">{allocFormError}</div>}
        {editingAllocation && (
          <p className="text-muted">
            {editingAllocation.member_name} – {editingAllocation.location_name} / {editingAllocation.unit_code}
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
            value={allocForm.amount_due}
            onChange={(e) => setAllocForm({ ...allocForm, amount_due: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="alloc-vs">{t('adminSeasonDetail.variableSymbol')}</label>
          <input
            id="alloc-vs"
            className="form-control"
            inputMode="numeric"
            maxLength={10}
            value={allocForm.variable_symbol}
            onChange={(e) => setAllocForm({ ...allocForm, variable_symbol: e.target.value })}
          />
          <div className="form-text">{t('adminSeasonDetail.variableSymbolHint')}</div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="alloc-status">{t('adminSeasonDetail.status')}</label>
          <select
            id="alloc-status"
            className="form-select"
            value={allocForm.status}
            onChange={(e) => setAllocForm({ ...allocForm, status: e.target.value as AllocationStatus })}
          >
            {editingAllocation &&
              [editingAllocation.status, ...STATUS_TRANSITIONS[editingAllocation.status]].map((status) => (
                <option key={status} value={status}>{t(`adminSeasonDetail.statuses.${status}`)}</option>
              ))}
          </select>
        </div>
      </RightDrawer>
    </PageLayout>
  );
};

export default AdminSeasonDetail;
