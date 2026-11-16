import React from 'react';
import { useTranslation } from 'react-i18next';
import { Allocation } from '../../services/apiHelpers';
import { STATUS_BADGES } from './shared';

interface Props {
  items: Allocation[] | undefined;
  label: (item: Allocation) => string;
  busy: boolean;
  canEdit: boolean;
  canAllocate: boolean;
  onEdit: (item: Allocation) => void;
  onAllocate: () => void;
}

const AllocationCell: React.FC<Props> = ({ items, label, busy, canEdit, canAllocate, onEdit, onAllocate }) => {
  const { t, i18n } = useTranslation();
  const active = items?.some((item) => item.status !== 'cancelled') ?? false;
  const formatPrice = (value: string) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CZK' }).format(Number(value));

  return (
    <div className="d-flex flex-column gap-1">
      {items?.map((item) => (
        <div key={item.id} className="d-flex flex-wrap align-items-center gap-2">
          <span>{label(item)}</span>
          <span className={`badge ${STATUS_BADGES[item.status]}`}>{t(`adminSeasonDetail.statuses.${item.status}`)}</span>
          <span>{formatPrice(item.amount_due)}</span>
          {canEdit && <button className="btn btn-sm btn-outline-dark py-0" disabled={busy} onClick={() => onEdit(item)}>
            {t('adminSeasonDetail.editAllocationShort')}
          </button>}
        </div>
      ))}
      {!active && <span className="text-muted">{t('adminSeasonDetail.notAllocated')}</span>}
      {canEdit && canAllocate && !items?.length && <div>
        <button type="button" className="btn btn-sm btn-outline-dark py-0" disabled={busy} onClick={onAllocate}>
          {t('adminSeasonDetail.allocate')}
        </button>
      </div>}
    </div>
  );
};

export default AllocationCell;
