import React from 'react';
import { useTranslation } from 'react-i18next';
import { ALLOCATION_FILTERS, AllocationFilter } from './shared';

interface Props {
  id: string;
  value: AllocationFilter;
  onChange: (value: AllocationFilter) => void;
}

const AllocationFilterSelect: React.FC<Props> = ({ id, value, onChange }) => {
  const { t } = useTranslation();

  return (
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
};

export default AllocationFilterSelect;
