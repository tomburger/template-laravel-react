import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage, authRequestOptions } from '../services/apiHelpers';

type MemberSeason = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  enrolled: boolean;
};

const MemberSeasons: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [seasons, setSeasons] = useState<MemberSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const enrollController = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await axios.get<{ seasons: MemberSeason[] }>('/api/user/seasons', {
          ...authRequestOptions(), signal: controller.signal,
        });
        setSeasons(response.data.seasons);
      } catch (err) {
        if (!controller.signal.aborted) setLoadError(apiErrorMessage(err, t('home.seasonsLoadFailed')));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => () => enrollController.current?.abort(), []);

  const enroll = async (seasonId: number) => {
    const controller = new AbortController();
    enrollController.current = controller;
    try {
      setEnrolling(seasonId);
      setEnrollError(null);
      await axios.post(`/api/user/seasons/${seasonId}/enrollment`, {}, {
        ...authRequestOptions(), signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setSeasons((current) => current.map((season) =>
          season.id === seasonId ? { ...season, enrolled: true } : season
        ));
      }
    } catch (err) {
      if (!controller.signal.aborted) setEnrollError(apiErrorMessage(err, t('home.enrollFailed')));
    } finally {
      if (!controller.signal.aborted) setEnrolling(null);
    }
  };

  const retry = () => {
    setEnrollError(null);
    setRefresh((current) => current + 1);
  };
  const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(i18n.language);

  return (
    <section className="mt-4" aria-labelledby="home-open-seasons-heading">
      <h3 id="home-open-seasons-heading" className="h5">{t('home.openSeasons')}</h3>
      {(loadError || enrollError) && (
        <div className="alert alert-danger" role="alert">
          {loadError || enrollError}{' '}
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={retry} disabled={loading || enrolling !== null}>
            {t('home.retry')}
          </button>
        </div>
      )}
      {loading && <div role="status">{t('common.loading')}</div>}
      {!loading && !loadError && seasons.length === 0 && <p className="text-muted mb-0">{t('home.noOpenSeasons')}</p>}
      {!loading && !loadError && seasons.length > 0 && (
        <ul className="list-group">
          {seasons.map((season) => (
            <li key={season.id} className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <strong>{season.name}</strong>
                <div className="text-muted small">{formatDate(season.start_date)} – {formatDate(season.end_date)}</div>
              </div>
              {season.enrolled ? (
                <span className="badge bg-success">{t('home.enrolled')}</span>
              ) : (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => void enroll(season.id)} disabled={enrolling !== null}>
                  {enrolling === season.id ? t('home.enrolling') : t('home.enroll')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MemberSeasons;
