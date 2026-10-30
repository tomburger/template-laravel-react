import React from 'react';
import { useTranslation } from 'react-i18next';
import { Allocation } from '../../services/apiHelpers';
import { STATUS_BADGES } from './shared';

interface Props {
  items: Allocation[] | undefined;
  label: (item: Allocation) => string;
  busy: boolean;
  onEdit: (item: Allocation) => void;
  onAllocate: () => void;
}

// Active allocations of an enrollment with an edit button each; when there are none,
// an Allocate button jumps to the Allocations tab with this entry preselected
const AllocationCell: React.FC<Props> = ({ items, label, busy, onEdit, onAllocate }) => {
  const { t } = useTranslation();

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
          <button className="btn btn-sm btn-outline-dark py-0" disabled={busy} onClick={() => onEdit(item)}>
            {t('adminSeasonDetail.editAllocationShort')}
          </button>
        </div>
      ))}
    </div>
  );
};

export default AllocationCell;
