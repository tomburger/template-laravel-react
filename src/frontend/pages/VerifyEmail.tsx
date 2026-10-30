import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const { verifyEmail, error, clearError } = useAuth();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!email || !token) {
      setLoading(false);
      setShowResendOption(true);
      return;
    }

    const verify = async () => {
      try {
        clearError();
        await verifyEmail(email, token);
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', {
            state: { message: t('verifyEmail.successMessage') },
          });
        }, 2000);
      } catch {
        setShowResendOption(true);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [email, token, verifyEmail, clearError, navigate]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body p-5 text-center">
                {loading && (
                  <>
                    <div className="mb-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('verifyEmail.verifying')}</span>
                      </div>
                    </div>
                    <h2 className="card-title mb-3">{t('verifyEmail.verifyingTitle')}</h2>
                    <p className="text-muted">{t('verifyEmail.verifyingText')}</p>
                  </>
                )}

                {success && (
                  <>
                    <div className="mb-3">
                      <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h2 className="card-title mb-3">                    {t('verifyEmail.successTitle')}</h2>
                                        <p className="text-muted">{t('verifyEmail.successText')}</p>
                  </>
                )}

                {!loading && !success && (
                  <>
                    {error && (
                      <div className="alert alert-danger mb-3">{error}</div>
                    )}
                    <div className="mb-3">
                      <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h2 className="card-title mb-3">                    {t('verifyEmail.failedTitle')}</h2>
                    <p className="text-muted mb-3">
                                          {t('verifyEmail.failedText')}
                    </p>

                    {showResendOption && (
                      <div className="d-grid gap-2 mb-3">
                        <Link to="/resend-verification" className="btn btn-primary">
                                              {t('verifyEmail.requestNew')}
                        </Link>
                      </div>
                    )}

                    <p>
                      <Link to="/login" className="text-decoration-none">
                                            {t('common.backToLogin')}
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
