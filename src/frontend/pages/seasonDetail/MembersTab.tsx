import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getEndpoints } from '../../services/endpoints/endpoints';
import { Allocation, AvailableMember, MemberEnrollment, apiErrorMessage, authRequestOptions } from '../../services/apiHelpers';
import AllocationCell from './AllocationCell';
import RightDrawer from '../../components/RightDrawer';
import AllocationFilterSelect from './AllocationFilterSelect';
import { AllocationFilter, AllocationsByEnrollment, RunAction, matchesFilter } from './shared';

interface Props {
  seasonId: number;
  canEdit: boolean;
  busy: boolean;
  run: RunAction;
  enrollments: MemberEnrollment[];
  availableMembers: AvailableMember[];
  allocationsByMember: AllocationsByEnrollment;
  filter: AllocationFilter;
  onFilterChange: (filter: AllocationFilter) => void;
  onEditAllocation: (allocation: Allocation) => void;
  onAllocate: (memberSeasonId: number) => void;
  onChanged: () => void;
  onConfirmRemove: (name: string) => Promise<boolean>;
}

const MembersTab: React.FC<Props> = ({
  seasonId,
  canEdit,
  busy,
  run,
  enrollments,
  availableMembers,
  allocationsByMember,
  filter,
  onFilterChange,
  onEditAllocation,
  onAllocate,
  onChanged,
  onConfirmRemove,
}) => {
  const { t } = useTranslation();
  const { enrollMemberInASeason, removeMemberEnrollmentFromASeason } = getEndpoints();
  const [selectedMember, setSelectedMember] = useState('');
  const [editing, setEditing] = useState<MemberEnrollment | null>(null);
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const visible = enrollments.filter((item) => matchesFilter(filter, allocationsByMember.has(item.id)));

  const openEditor = (item: MemberEnrollment) => {
    setEditing(item);
    setCategory(item.category ?? '');
    setFormError(null);
  };

  const save = async () => {
    if (!editing || saving) return;
    try {
      setSaving(true);
      setFormError(null);
      await axios.patch(
        `/api/seasons/${seasonId}/members/${editing.id}`,
        { category: category.trim() || null },
        authRequestOptions(),
      );
      setEditing(null);
      onChanged();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminSeasonDetail.memberCategorySaveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing || saving) return;
    if (!(await onConfirmRemove(`${editing.first_name} ${editing.last_name}`))) return;
    try {
      setSaving(true);
      setFormError(null);
      await removeMemberEnrollmentFromASeason(seasonId, editing.id, authRequestOptions());
      setEditing(null);
      onChanged();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminSeasonDetail.removeFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {canEdit && <div className="d-flex flex-wrap gap-2 mb-3">
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
      </div>}
      <AllocationFilterSelect id="member-allocation-filter" value={filter} onChange={onFilterChange} />
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{t('adminMembers.name')}</th>
              <th>{t('adminSeasonDetail.seasonCategory')}</th>
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
                <td>
                  {item.category || t('adminSeasonDashboard.noCategory')}
                  {(item.category || null) !== (item.member_category || null) && (
                    <div className="small text-muted">
                      {t('adminSeasonDetail.memberCategoryValue', { category: item.member_category || t('adminSeasonDashboard.noCategory') })}
                    </div>
                  )}
                </td>
                <td>
                  <AllocationCell
                    items={allocationsByMember.get(item.id)}
                    label={(a) => `${a.location_name} / ${a.unit_code}`}
                    busy={busy}
                    canEdit={canEdit}
                    onEdit={onEditAllocation}
                    onAllocate={() => onAllocate(item.id)}
                  />
                </td>
                <td className="text-end">
                  {canEdit && <button
                    className="btn btn-sm btn-dark"
                    disabled={busy || saving}
                    onClick={() => openEditor(item)}
                  >
                    {t('adminUsers.edit')}
                  </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RightDrawer
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={t('adminSeasonDetail.editMemberEnrollment')}
        subtitle={editing ? `${editing.first_name} ${editing.last_name}` : undefined}
        closeText={t('adminUsers.close')}
        ariaLabel={t('adminSeasonDetail.editMemberEnrollment')}
        disableClose={saving}
        footer={
          <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(null)} disabled={saving}>
                {t('adminUsers.cancel')}
              </button>
              <button type="button" className="btn btn-dark" onClick={save} disabled={saving}>
                {saving ? t('adminUsers.saving') : t('adminUsers.save')}
              </button>
            </div>
            <button type="button" className="btn btn-danger w-100" onClick={remove} disabled={saving}>
              {t('adminSeasonDetail.remove')}
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
        {editing && (
          <>
            <div className="mb-3">
              <label className="form-label" htmlFor="enrollment-category">{t('adminSeasonDetail.seasonCategory')}</label>
              <input
                id="enrollment-category"
                className="form-control"
                value={category}
                maxLength={100}
                onChange={(event) => setCategory(event.target.value)}
                disabled={saving}
              />
              <div className="form-text">{t('adminSeasonDetail.categoryPricingHint')}</div>
            </div>
            <div className="text-muted small">
              {t('adminSeasonDetail.memberCategoryValue', { category: editing.member_category || t('adminSeasonDashboard.noCategory') })}
            </div>
          </>
        )}
      </RightDrawer>
    </>
  );
};

export default MembersTab;
