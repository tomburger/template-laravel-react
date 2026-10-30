import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation, Trans } from 'react-i18next';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);
  const { forgotPassword, error, clearError } = useAuth();
  const navigate = useNavigate();

  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await forgotPassword(email);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch {
      // Error is already set in context
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-sm border-success">
                <div className="card-body p-5 text-center">
                  <div className="mb-3">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h2 className="card-title mb-3">                  {t('forgotPassword.sentTitle')}</h2>
                  <p className="card-text mb-3">
                                      <Trans i18nKey="forgotPassword.sentText" values={{ email }} components={{ strong: <strong /> }} />
                  </p>
                                    <p className="text-muted small">{t('forgotPassword.expires')}</p>
                                    <p className="text-muted small">{t('forgotPassword.redirecting')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h1 className="card-title                 text-center mb-4">{t('forgotPassword.title')}</h1>
                <p className="text-muted text-center mb-4">
                                  {t('forgotPassword.description')}
                </p>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={clearError}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      {t('common.email')}
                    </label>
                    <input
                      type="email"
                      className={`form-control ${touched && !isEmailValid ? 'is-invalid' : ''}`}
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      placeholder={t('common.emailPlaceholder')}
                      disabled={loading}
                    />
                    {touched && !isEmailValid && (
                      <div className="invalid-feedback d-block">{t('common.invalidEmail')}</div>
                    )}
                  </div>

                  <div className="d-grid gap-2 mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={!isEmailValid || loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {t('forgotPassword.submitting')}
                        </>
                      ) : (
                        t('forgotPassword.submit')
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p>
                    {t('common.rememberPassword')}{' '}
                    <Link to="/login" className="text-decoration-none">
                      {t('common.loginHere')}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
