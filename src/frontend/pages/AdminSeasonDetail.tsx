import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import { getEndpoints } from '../services/endpoints/endpoints';
import {
  AvailableMember,
  AvailableUnit,
  MemberEnrollment,
  Season,
  UnitEnrollment,
  apiErrorMessage,
  authRequestOptions,
} from '../services/apiHelpers';

type Tab = 'members' | 'units';

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
  } = getEndpoints();

  const [tab, setTab] = useState<Tab>('members');
  const [season, setSeason] = useState<Season | null>(null);
  const [memberEnrollments, setMemberEnrollments] = useState<MemberEnrollment[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [unitEnrollments, setUnitEnrollments] = useState<UnitEnrollment[]>([]);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const options = authRequestOptions();
      const [seasons, members, freeMembers, units, freeUnits] = await Promise.all([
        listSeasons<{ data: { seasons: Season[] } }>(options),
        listMembersEnrolledInASeason<{ data: { enrollments: MemberEnrollment[] } }>(seasonId, options),
        listMembersNotYetEnrolledInASeason<{ data: { members: AvailableMember[] } }>(seasonId, options),
        listUnitsEnrolledInASeason<{ data: { enrollments: UnitEnrollment[] } }>(seasonId, options),
        listUnitsNotYetEnrolledInASeason<{ data: { units: AvailableUnit[] } }>(seasonId, options),
      ]);
      setSeason(seasons.data.seasons.find((item) => item.id === seasonId) ?? null);
      setMemberEnrollments(members.data.enrollments);
      setAvailableMembers(freeMembers.data.members);
      setUnitEnrollments(units.data.enrollments);
      setAvailableUnits(freeUnits.data.units);
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
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{t('adminMembers.name')}</th>
              <th>{t('adminSeasonDetail.categorySnapshot')}</th>
              <th className="text-end">{t('adminUsers.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {memberEnrollments.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">{t('adminSeasonDetail.noMembers')}</td>
              </tr>
            )}
            {memberEnrollments.map((item) => (
              <tr key={item.id}>
                <td>{item.last_name} {item.first_name}</td>
                <td>{item.category}</td>
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
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{t('adminLocations.name')}</th>
              <th>{t('adminUnits.code')}</th>
              <th>{t('adminSeasonDetail.categorySnapshot')}</th>
              <th className="text-end">{t('adminUsers.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {unitEnrollments.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">{t('adminSeasonDetail.noUnits')}</td>
              </tr>
            )}
            {unitEnrollments.map((item) => (
              <tr key={item.id}>
                <td>{item.location_name}</td>
                <td>{item.code}</td>
                <td>{item.category}</td>
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
          </ul>

          {loading ? (
            <div className="d-flex align-items-center" role="status">
              <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              <span>{t('common.loading')}</span>
            </div>
          ) : tab === 'members' ? (
            renderMembers()
          ) : (
            renderUnits()
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminSeasonDetail;
