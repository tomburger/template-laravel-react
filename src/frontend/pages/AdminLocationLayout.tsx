import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import LocationLayoutViewer from '../components/LocationLayoutViewer';
import ConfirmModal from '../components/ConfirmModal';
import { getEndpoints } from '../services/endpoints/endpoints';
import { Location, Unit, apiErrorMessage, authRequestOptions } from '../services/apiHelpers';
import { SHAPE_KINDS, ShapeKind, buildShape, insertShape } from './locationLayout/svgShapes';

const AdminLocationLayout: React.FC = () => {
  const { t } = useTranslation();
  const locationId = Number(useParams().locationId);
  const { listLocations, listUnitsOfALocation, getLocationLayout, saveLocationLayout, clearLocationLayout } = getEndpoints();
  const [location, setLocation] = useState<Location | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [svg, setSvg] = useState('');
  const [savedSvg, setSavedSvg] = useState('');
  // Changing the key remounts the file input, which is the only way to empty it
  const [inputKey, setInputKey] = useState(0);

  const dirty = pendingFile !== null || svg !== savedSvg;

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const onImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotice(null);
    setImageSize(null);
    setPendingFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  // The image's natural size drives the ratio; a blank editor gets a starter SVG in image coordinates
  const onImageSize = ({ width, height }: { width: number; height: number }) => {
    setImageSize({ width, height });
    setSvg((current) =>
      current.trim() === '' ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n</svg>` : current
    );
  };

  const addShape = (kind: ShapeKind) => {
    const { width, height } = imageSize ?? { width: 1000, height: 1000 };
    setSvg((current) => insertShape(current, buildShape(kind, width, height)));
  };

  // Adds a rectangle already carrying the unit's id, so the unit drops off the list
  const addUnitShape = (unit: Unit) => {
    const { width, height } = imageSize ?? { width: 1000, height: 1000 };
    const shape = buildShape('rect', width, height).replace('<rect', `<rect id="unit-${unit.id}"`);
    setSvg((current) => insertShape(current, shape));
  };

  // Units are drawn once an SVG element carries the id "unit-<unitId>"
  const drawnUnitIds = new Set(Array.from(svg.matchAll(/\bid\s*=\s*["']unit-(\d+)["']/g), (match) => Number(match[1])));
  const remainingUnits = units.filter((unit) => !drawnUnitIds.has(unit.id));

  type SavedLayout = { svg: string | null; image_url: string | null };

  // Makes the editor reflect what the server holds
  const applyLayout = (layout: SavedLayout) => {
    setSvg(layout.svg ?? '');
    setSavedSvg(layout.svg ?? '');
    setImageUrl(layout.image_url);
    setPendingFile(null);
    setInputKey((key) => key + 1);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const response = await saveLocationLayout<{ data: { layout: SavedLayout } }>(
        locationId,
        { svg, image: pendingFile ?? undefined },
        authRequestOptions()
      );
      applyLayout(response.data.layout);
      setNotice(t('adminLocationLayout.saved'));
    } catch (err) {
      setError(apiErrorMessage(err, t('adminLocationLayout.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  // Wipes the image and SVG, both in the editor and on the server
  const clear = async () => {
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      await clearLocationLayout(locationId, authRequestOptions());
      applyLayout({ svg: null, image_url: null });
      setImageSize(null);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminLocationLayout.clearFailed')));
    } finally {
      setSaving(false);
      setConfirmingClear(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const options = authRequestOptions();
      const [locationsResponse, unitsResponse, layoutResponse] = await Promise.all([
        listLocations<{ data: { locations: Location[] } }>(options),
        listUnitsOfALocation<{ data: { units: Unit[] } }>(locationId, options),
        getLocationLayout<{ data: { layout: SavedLayout } }>(locationId, options),
      ]);
      setLocation(locationsResponse.data.locations.find((item) => item.id === locationId) ?? null);
      setUnits(unitsResponse.data.units);
      applyLayout(layoutResponse.data.layout);
    } catch (err) {
      setError(apiErrorMessage(err, t('adminLocationLayout.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [locationId]);

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin/locations" className="text-decoration-none">&larr; {t('adminLocationLayout.back')}</Link>
          </p>
          <h1 className="h3 mb-1">{t('adminLocationLayout.title', { location: location?.name ?? '' })}</h1>
          <p className="text-muted">{t('adminLocationLayout.subtitle')}</p>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="d-flex align-items-center" role="status">
              <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              <span>{t('common.loading')}</span>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label" htmlFor="layout-image">{t('adminLocationLayout.image')}</label>
                <input
                  key={inputKey}
                  id="layout-image"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="form-control"
                  onChange={onImagePicked}
                />
                {imageSize && (
                  <div className="form-text">
                    {t('adminLocationLayout.ratio', {
                      width: imageSize.width,
                      height: imageSize.height,
                      ratio: (imageSize.width / imageSize.height).toFixed(3),
                    })}
                  </div>
                )}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <button type="button" className="btn btn-dark btn-sm" onClick={save} disabled={saving || !dirty}>
                  {saving ? t('adminUsers.saving') : t('adminUsers.save')}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setConfirmingClear(true)}
                  disabled={saving || (!imageUrl && svg.trim() === '' && savedSvg === '')}
                >
                  {t('adminLocationLayout.clear')}
                </button>
                {dirty && <span className="text-warning small">{t('adminLocationLayout.unsaved')}</span>}
                {!dirty && notice && <span className="text-success small">{notice}</span>}
              </div>
              <div className="row g-3">
                <div className="col-lg-5">
                  <label className="form-label" htmlFor="layout-svg">{t('adminLocationLayout.svg')}</label>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <span className="text-muted small">{t('adminLocationLayout.addShape')}</span>
                    {SHAPE_KINDS.map((kind) => (
                      <button key={kind} type="button" className="btn btn-sm btn-outline-dark" onClick={() => addShape(kind)}>
                        {t(`adminLocationLayout.shapes.${kind}`)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="layout-svg"
                    className="form-control font-monospace"
                    rows={20}
                    spellCheck={false}
                    value={svg}
                    onChange={(e) => setSvg(e.target.value)}
                  />
                </div>
                <div className="col-lg-7">
                  <div className="form-label">{t('adminLocationLayout.preview')}</div>
                  {imageUrl ? (
                    <LocationLayoutViewer imageUrl={imageUrl} svg={svg} units={units} onImageSize={onImageSize} />
                  ) : (
                    <div className="text-center text-muted py-5 border rounded">{t('adminLocationLayout.placeholder')}</div>
                  )}
                  <div className="mt-3">
                    <div className="form-label">
                      {t('adminLocationLayout.unitsWithoutShape')} ({remainingUnits.length}/{units.length})
                    </div>
                    {remainingUnits.length === 0 ? (
                      <div className="text-muted small">
                        {units.length === 0 ? t('adminLocationLayout.noUnits') : t('adminLocationLayout.allUnitsHaveShape')}
                      </div>
                    ) : (
                      <>
                        <div className="form-text mt-0 mb-2">{t('adminLocationLayout.unitHint')}</div>
                        <div className="d-flex flex-wrap gap-1 overflow-auto" style={{ maxHeight: '10rem' }}>
                          {remainingUnits.map((unit) => (
                            <button
                              key={unit.id}
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0"
                              title={`id="unit-${unit.id}"${unit.category ? ` – ${unit.category}` : ''}`}
                              onClick={() => addUnitShape(unit)}
                            >
                              {unit.code}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmingClear}
        title={t('adminLocationLayout.clear')}
        confirmText={t('adminLocationLayout.clear')}
        cancelText={t('adminUsers.cancel')}
        busy={saving}
        danger
        onConfirm={clear}
        onCancel={() => setConfirmingClear(false)}
      >
        {t('adminLocationLayout.confirmClear')}
      </ConfirmModal>
    </PageLayout>
  );
};

export default AdminLocationLayout;
