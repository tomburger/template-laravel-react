import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { getEndpoints } from '../services/endpoints/endpoints';
import { MemberEnrollment, SEASON_STATUSES, Season, SeasonStatus, apiErrorMessage, authRequestOptions } from '../services/apiHelpers';

const AdminSeasonDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const seasonId = Number(useParams().seasonId);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [members, setMembers] = useState<MemberEnrollment[] | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersReload, setMembersReload] = useState(0);
  const statusRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setSeason(null);
        setError(null);
        setStatusError(null);
        setUpdating(false);
        const response = await getEndpoints().listSeasons<{ data: { seasons: Season[] } }>(authRequestOptions());
        if (!cancelled) {
          const selected = response.data.seasons.find((item) => item.id === seasonId);
          if (selected) {
            setSeason(selected);
          } else {
            setError(t('adminSeasonDashboard.notFound'));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiErrorMessage(err, t('adminSeasons.loadFailed')));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      statusRequest.current?.abort();
    };
  }, [seasonId, t]);

  const isOwner = Boolean(season?.id === seasonId && season.owners.some((owner) => owner.id === user?.id));

  useEffect(() => {
    if (!isOwner) {
      setMembers(null);
      setMembersError(null);
      setMembersLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadMembers = async () => {
      try {
        setMembers(null);
        setMembersError(null);
        setMembersLoading(true);
        const response = await getEndpoints().listMembersEnrolledInASeason<{ data: { enrollments: MemberEnrollment[] } }>(
          seasonId,
          { ...authRequestOptions(), signal: controller.signal },
        );
        if (!controller.signal.aborted) setMembers(response.data.enrollments);
      } catch (err) {
        if (!controller.signal.aborted) setMembersError(apiErrorMessage(err, t('adminSeasonDashboard.membersLoadFailed')));
      } finally {
        if (!controller.signal.aborted) setMembersLoading(false);
      }
    };

    void loadMembers();
    return () => controller.abort();
  }, [isOwner, seasonId, membersReload, t]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    for (const member of members ?? []) {
      const category = member.category && member.category.trim() !== '' ? member.category : null;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [members]);

  const updateStatus = async (status: SeasonStatus) => {
    if (!season || !isOwner || updating || status === season.status) return;

    const controller = new AbortController();
    statusRequest.current = controller;
    try {
      setUpdating(true);
      setStatusError(null);
      const response = await axios.patch<{ season: Season }>(
        `/api/seasons/${season.id}/status`,
        { status },
        { ...authRequestOptions(), signal: controller.signal },
      );
      if (!controller.signal.aborted) setSeason(response.data.season);
    } catch (err) {
      if (!controller.signal.aborted) setStatusError(apiErrorMessage(err, t('adminSeasonDashboard.statusUpdateFailed')));
    } finally {
      if (!controller.signal.aborted) setUpdating(false);
    }
  };

  const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(i18n.language);

  return (
    <PageLayout>
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="mb-2">
            <Link to="/admin/seasons" className="text-decoration-none">&larr; {t('adminSeasonDetail.back')}</Link>
          </p>
          <h1 className="h3 mb-1">{t('adminSeasonDashboard.title', { season: isOwner ? season?.name : '' })}</h1>
          {season && isOwner && (
            <p className="text-muted">
              {formatDate(season.start_date)} – {formatDate(season.end_date)} · {t('adminSeasons.status')}: {t(`adminSeasons.statuses.${season.status}`)}
            </p>
          )}
          {loading && <div role="status">{t('common.loading')}</div>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {season && !isOwner && <div className="alert alert-danger mt-3" role="alert">{t('adminSeasonDashboard.ownersOnly')}</div>}
          {season && isOwner && (
            <>
            <div className="mt-4">
              <div className="fw-semibold mb-2">{t('adminSeasons.status')}</div>
              <div className="btn-group flex-wrap" role="group" aria-label={t('adminSeasons.status')}>
                {SEASON_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`btn ${season.status === status ? 'btn-primary' : 'btn-outline-primary'}`}
                    aria-pressed={season.status === status}
                    disabled={updating}
                    onClick={() => void updateStatus(status)}
                  >
                    {t(`adminSeasons.statuses.${status}`)}
                  </button>
                ))}
              </div>
              {updating && <div className="form-text" role="status">{t('adminSeasonDashboard.updatingStatus')}</div>}
              {statusError && <div className="alert alert-danger mt-3" role="alert">{statusError}</div>}
            </div>
            <div className="row mt-4">
              <div className="col-12 col-md-6">
                <section className="card h-100" aria-labelledby="season-members-heading">
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                      <h2 id="season-members-heading" className="h5 mb-0">{t('adminSeasonDetail.membersTab')}</h2>
                      <Link to={`/admin/seasons/${seasonId}/enrollments`} className="btn btn-outline-primary btn-sm">
                        {t('adminSeasonDashboard.manageMembers')}
                      </Link>
                    </div>
                    {membersLoading && <div role="status">{t('common.loading')}</div>}
                    {membersError && (
                      <div className="alert alert-danger" role="alert">
                        {membersError}{' '}
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setMembersReload((value) => value + 1)}>
                          {t('home.retry')}
                        </button>
                      </div>
                    )}
                    {members && (
                      <>
                        <div className="mb-3">
                          <div className="display-5 fw-semibold lh-1">{members.length}</div>
                          <div className="text-muted">{t('adminSeasonDashboard.membersEnrolled')}</div>
                        </div>
                        {categoryCounts.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0" aria-label={t('adminSeasonDashboard.membersByCategory')}>
                              <thead>
                                <tr>
                                  <th scope="col">{t('adminMembers.category')}</th>
                                  <th scope="col" className="text-end">{t('adminSeasonDetail.membersTab')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryCounts.map(([category, count]) => (
                                  <tr key={category === null ? '__uncategorized__' : `category:${category}`}>
                                    <td>{category ?? t('adminSeasonDashboard.noCategory')}</td>
                                    <td className="text-end">{count}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <p className="text-muted mb-0">{t('adminSeasonDetail.noMembers')}</p>}
                      </>
                    )}
                  </div>
                </section>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminSeasonDashboard;
