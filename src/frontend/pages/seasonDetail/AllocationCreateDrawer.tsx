import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RightDrawer from '../../components/RightDrawer';
import { getEndpoints } from '../../services/endpoints/endpoints';
import { Allocation, MemberEnrollment, UnitEnrollment, apiErrorMessage, authRequestOptions } from '../../services/apiHelpers';

export type AllocationTarget =
  | { kind: 'member'; id: number }
  | { kind: 'unit'; id: number };

interface Props {
  seasonId: number;
  target: AllocationTarget | null;
  members: MemberEnrollment[];
  units: UnitEnrollment[];
  allocations: Allocation[];
  onClose: () => void;
  onCreated: (allocation: Allocation) => void;
}

const AllocationCreateDrawer: React.FC<Props> = ({ seasonId, target, members, units, allocations, onClose, onCreated }) => {
  const { t } = useTranslation();
  const { allocateAUnitToAMember } = getEndpoints();
  const [memberId, setMemberId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setMemberId(target.kind === 'member' ? String(target.id) : '');
      setUnitId(target.kind === 'unit' ? String(target.id) : '');
      setError(null);
    }
  }, [target]);

  const taken = new Set(allocations.filter((item) => item.status !== 'cancelled').map((item) => item.unit_season_id));
  const availableUnits = units.filter((unit) => !taken.has(unit.id));

  const create = async () => {
    if (!target || !memberId || !unitId || saving) return;
    try {
      setSaving(true);
      setError(null);
      const response = await allocateAUnitToAMember<{ data: { allocation: Allocation } }>(
        seasonId,
        { member_season_id: Number(memberId), unit_season_id: Number(unitId) },
        authRequestOptions(),
      );
      onCreated(response.data.allocation);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminSeasonDetail.allocateFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RightDrawer
      isOpen={target !== null}
      onClose={onClose}
      title={t('adminSeasonDetail.createAllocation')}
      ariaLabel={t('adminSeasonDetail.createAllocation')}
      closeText={t('adminUsers.close')}
      disableClose={saving}
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            {t('adminUsers.cancel')}
          </button>
          <button type="button" className="btn btn-dark" onClick={create} disabled={saving || !memberId || !unitId}>
            {saving ? t('adminUsers.saving') : t('adminSeasonDetail.allocate')}
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="mb-3">
        <label className="form-label" htmlFor="allocation-member">{t('adminSeasonDetail.member')}</label>
        <select id="allocation-member" className="form-select" value={memberId} onChange={(event) => setMemberId(event.target.value)} disabled={saving || target?.kind === 'member'}>
          <option value="">{t('adminSeasonDetail.selectMember')}</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.last_name} {member.first_name}{member.category ? ` (${member.category})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="allocation-unit">{t('adminSeasonDetail.unit')}</label>
        <select id="allocation-unit" className="form-select" value={unitId} onChange={(event) => setUnitId(event.target.value)} disabled={saving || target?.kind === 'unit'}>
          <option value="">{t('adminSeasonDetail.selectUnit')}</option>
          {availableUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.location_name} / {unit.code}{unit.category ? ` (${unit.category})` : ''}
            </option>
          ))}
        </select>
        {availableUnits.length === 0 && <div className="form-text">{t('adminSeasonDetail.noAvailableUnits')}</div>}
      </div>
      <p className="form-text">{t('adminSeasonDetail.createAllocationHint')}</p>
    </RightDrawer>
  );
};

export default AllocationCreateDrawer;
