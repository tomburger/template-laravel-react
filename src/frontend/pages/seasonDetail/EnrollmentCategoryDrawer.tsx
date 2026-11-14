import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import RightDrawer from '../../components/RightDrawer';
import { apiErrorMessage, authRequestOptions } from '../../services/apiHelpers';

interface Props {
  seasonId: number;
  kind: 'members' | 'units';
  enrollment: { id: number; category: string | null } | null;
  title: string;
  name: string;
  currentCategory: string | null;
  currentCategoryLabel: 'adminSeasonDetail.memberCategoryValue' | 'adminSeasonDetail.unitCategoryValue';
  onClose: () => void;
  onChanged: () => void;
  onRemove: (id: number) => Promise<unknown>;
  onConfirmRemove: (name: string) => Promise<boolean>;
}

const EnrollmentCategoryDrawer: React.FC<Props> = ({
  seasonId, kind, enrollment, title, name, currentCategory, currentCategoryLabel,
  onClose, onChanged, onRemove, onConfirmRemove,
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (enrollment) {
      setCategory(enrollment.category ?? '');
      setFormError(null);
    }
  }, [enrollment]);

  const save = async () => {
    if (!enrollment || saving) return;
    try {
      setSaving(true);
      setFormError(null);
      await axios.patch(
        `/api/seasons/${seasonId}/${kind}/${enrollment.id}`,
        { category: category.trim() || null },
        authRequestOptions(),
      );
      onClose();
      onChanged();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminSeasonDetail.categorySaveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!enrollment || saving) return;
    if (!(await onConfirmRemove(name))) return;
    try {
      setSaving(true);
      setFormError(null);
      await onRemove(enrollment.id);
      onClose();
      onChanged();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('adminSeasonDetail.removeFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RightDrawer
      isOpen={enrollment !== null}
      onClose={onClose}
      title={title}
      subtitle={name}
      closeText={t('adminUsers.close')}
      ariaLabel={title}
      disableClose={saving}
      footer={
        <div className="d-flex flex-column gap-3">
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
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
      {enrollment && (
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
            {t(currentCategoryLabel, { category: currentCategory || t('adminSeasonDashboard.noCategory') })}
          </div>
        </>
      )}
    </RightDrawer>
  );
};

export default EnrollmentCategoryDrawer;
