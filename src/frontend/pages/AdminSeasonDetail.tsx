import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import { getEndpoints } from '../services/endpoints/endpoints';
import {
  Allocation,
  AvailableMember,
  AvailableUnit,
  MemberEnrollment,
  Season,
  UnitEnrollment,
  apiErrorMessage,
  authRequestOptions,
} from '../services/apiHelpers';
import AllocationEditDrawer from './seasonDetail/AllocationEditDrawer';
import AllocationsTab from './seasonDetail/AllocationsTab';
import MembersTab from './seasonDetail/MembersTab';
import UnitsTab from './seasonDetail/UnitsTab';
import { AllocationFilter, AllocationsByEnrollment } from './seasonDetail/shared';

type Tab = 'members' | 'units' | 'allocations';

const AdminSeasonDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const seasonId = Number(useParams().seasonId);
  const {
    listSeasons,
    listMembersEnrolledInASeason,
    listMembersNotYetEnrolledInASeason,
    listUnitsEnrolledInASeason,
    listUnitsNotYetEnrolledInASeason,
    listAllocationsOfASeason,
  } = getEndpoints();

  const [tab, setTab] = useState<Tab>('members');
  const [season, setSeason] = useState<Season | null>(null);
  const [memberEnrollments, setMemberEnrollments] = useState<MemberEnrollment[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [unitEnrollments, setUnitEnrollments] = useState<UnitEnrollment[]>([]);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  // Filters live here because reloading unmounts the tabs, which would reset local state
  const [memberFilter, setMemberFilter] = useState<AllocationFilter>('all');
  const [unitFilter, setUnitFilter] = useState<AllocationFilter>('all');
  const [preselect, setPreselect] = useState({ memberSeasonId: '', unitSeasonId: '' });
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
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
      setPreselect({ memberSeasonId: '', unitSeasonId: '' });
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

  // Active (non-cancelled) allocations grouped by member / unit enrollment
  const groupActiveAllocations = (key: 'member_season_id' | 'unit_season_id') => {
    const groups: AllocationsByEnrollment = new Map();
    allocations
      .filter((item) => item.status !== 'cancelled')
      .forEach((item) => groups.set(item[key], [...(groups.get(item[key]) ?? []), item]));
    return groups;
  };

  const startAllocation = (memberSeasonId: string, unitSeasonId: string) => {
    setPreselect({ memberSeasonId, unitSeasonId });
    setTab('allocations');
  };

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
            <MembersTab
              seasonId={seasonId}
              busy={busy}
              run={run}
              enrollments={memberEnrollments}
              availableMembers={availableMembers}
              allocationsByMember={groupActiveAllocations('member_season_id')}
              filter={memberFilter}
              onFilterChange={setMemberFilter}
              onEditAllocation={setEditingAllocation}
              onAllocate={(id) => startAllocation(String(id), '')}
            />
          ) : tab === 'units' ? (
            <UnitsTab
              seasonId={seasonId}
              busy={busy}
              run={run}
              enrollments={unitEnrollments}
              availableUnits={availableUnits}
              allocationsByUnit={groupActiveAllocations('unit_season_id')}
              filter={unitFilter}
              onFilterChange={setUnitFilter}
              onEditAllocation={setEditingAllocation}
              onAllocate={(id) => startAllocation('', String(id))}
            />
          ) : (
            <AllocationsTab
              seasonId={seasonId}
              busy={busy}
              run={run}
              memberEnrollments={memberEnrollments}
              unitEnrollments={unitEnrollments}
              allocations={allocations}
              initialMemberId={preselect.memberSeasonId}
              initialUnitId={preselect.unitSeasonId}
              onEditAllocation={setEditingAllocation}
            />
          )}
        </div>
      </div>

      <AllocationEditDrawer
        allocation={editingAllocation}
        onClose={() => setEditingAllocation(null)}
        onSaved={() => {
          setEditingAllocation(null);
          load();
        }}
      />
    </PageLayout>
  );
};

export default AdminSeasonDetail;
