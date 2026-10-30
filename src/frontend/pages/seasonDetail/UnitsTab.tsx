import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEndpoints } from '../../services/endpoints/endpoints';
import { Allocation, AvailableUnit, UnitEnrollment, authRequestOptions } from '../../services/apiHelpers';
import AllocationCell from './AllocationCell';
import { useConfirm } from '../../components/useConfirm';
import AllocationFilterSelect from './AllocationFilterSelect';
import { AllocationFilter, AllocationsByEnrollment, RunAction, matchesFilter } from './shared';

interface Props {
  seasonId: number;
  busy: boolean;
  run: RunAction;
  enrollments: UnitEnrollment[];
  availableUnits: AvailableUnit[];
  allocationsByUnit: AllocationsByEnrollment;
  filter: AllocationFilter;
  onFilterChange: (filter: AllocationFilter) => void;
  onEditAllocation: (allocation: Allocation) => void;
  onAllocate: (unitSeasonId: number) => void;
}

const UnitsTab: React.FC<Props> = ({
  seasonId,
  busy,
  run,
  enrollments,
  availableUnits,
  allocationsByUnit,
  filter,
  onFilterChange,
  onEditAllocation,
  onAllocate,
}) => {
  const { t } = useTranslation();
  const { confirm, dialog } = useConfirm();
  const { enrollUnitInASeason, removeUnitEnrollmentFromASeason } = getEndpoints();
  const [selectedUnit, setSelectedUnit] = useState('');

  const visible = enrollments.filter((item) => matchesFilter(filter, allocationsByUnit.has(item.id)));

  return (
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
      <AllocationFilterSelect id="unit-allocation-filter" value={filter} onChange={onFilterChange} />
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
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  {enrollments.length === 0 ? t('adminSeasonDetail.noUnits') : t('adminSeasonDetail.noMatches')}
                </td>
              </tr>
            )}
            {visible.map((item) => (
              <tr key={item.id}>
                <td>{item.location_name}</td>
                <td>{item.code}</td>
                <td>{item.category}</td>
                <td>
                  <AllocationCell
                    items={allocationsByUnit.get(item.id)}
                    label={(a) => a.member_name}
                    busy={busy}
                    onEdit={onEditAllocation}
                    onAllocate={() => onAllocate(item.id)}
                  />
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    disabled={busy}
                    onClick={async () => {
                      if (!(await confirm({ message: t('adminSeasonDetail.confirmRemove', { name: item.code }), confirmText: t('adminSeasonDetail.remove') }))) return;
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
      {dialog}
    </>
  );
};

export default UnitsTab;
