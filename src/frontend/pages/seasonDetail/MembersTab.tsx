import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEndpoints } from '../../services/endpoints/endpoints';
import { Allocation, AvailableMember, MemberEnrollment, authRequestOptions } from '../../services/apiHelpers';
import AllocationCell from './AllocationCell';
import AllocationFilterSelect from './AllocationFilterSelect';
import { AllocationFilter, AllocationsByEnrollment, RunAction, matchesFilter } from './shared';

interface Props {
  seasonId: number;
  busy: boolean;
  run: RunAction;
  enrollments: MemberEnrollment[];
  availableMembers: AvailableMember[];
  allocationsByMember: AllocationsByEnrollment;
  filter: AllocationFilter;
  onFilterChange: (filter: AllocationFilter) => void;
  onEditAllocation: (allocation: Allocation) => void;
  onAllocate: (memberSeasonId: number) => void;
}

const MembersTab: React.FC<Props> = ({
  seasonId,
  busy,
  run,
  enrollments,
  availableMembers,
  allocationsByMember,
  filter,
  onFilterChange,
  onEditAllocation,
  onAllocate,
}) => {
  const { t } = useTranslation();
  const { enrollMemberInASeason, removeMemberEnrollmentFromASeason } = getEndpoints();
  const [selectedMember, setSelectedMember] = useState('');

  const visible = enrollments.filter((item) => matchesFilter(filter, allocationsByMember.has(item.id)));

  return (
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
      <AllocationFilterSelect id="member-allocation-filter" value={filter} onChange={onFilterChange} />
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
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  {enrollments.length === 0 ? t('adminSeasonDetail.noMembers') : t('adminSeasonDetail.noMatches')}
                </td>
              </tr>
            )}
            {visible.map((item) => (
              <tr key={item.id}>
                <td>{item.last_name} {item.first_name}</td>
                <td>{item.category}</td>
                <td>
                  <AllocationCell
                    items={allocationsByMember.get(item.id)}
                    label={(a) => `${a.location_name} / ${a.unit_code}`}
                    busy={busy}
                    onEdit={onEditAllocation}
                    onAllocate={() => onAllocate(item.id)}
                  />
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
};

export default MembersTab;
