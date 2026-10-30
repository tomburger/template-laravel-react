import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<{ password?: boolean; passwordConfirmation?: boolean }>({});
  const { resetPassword, error, clearError } = useAuth();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const isPasswordValid = password && password.length >= 8;
  const isPasswordConfirmationValid = passwordConfirmation === password && passwordConfirmation.length > 0;
  const isFormValid = isPasswordValid && isPasswordConfirmationValid;

  if (!email || !token) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-sm">
                <div className="card-body p-5 text-center">
                  <div className="mb-3">
                    <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h2 className="card-title mb-3">                  {t('resetPassword.invalidTitle')}</h2>
                  <p className="text-muted mb-3">
                                      {t('resetPassword.invalidText')}
                  </p>
                  <Link to="/forgot-password" className="btn btn-primary">
                                      {t('resetPassword.requestNew')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await resetPassword(email, token, password, passwordConfirmation);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: { message: t('resetPassword.successMessage') },
        });
      }, 2000);
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
                  <h2 className="card-title mb-3">                  {t('resetPassword.successTitle')}</h2>
                                    <p className="text-muted">{t('resetPassword.successText')}</p>
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
                <h1 className="card-title text-center mb-4">{t('resetPassword.title')}</h1>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={clearError}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      {t('resetPassword.newPassword')}
                    </label>
                    <input
                      type="password"
                      className={`form-control ${touched.password && !isPasswordValid ? 'is-invalid' : ''}`}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched({ ...touched, password: true })}
                      placeholder={t('resetPassword.newPasswordPlaceholder')}
                      disabled={loading}
                    />
                    {touched.password && !isPasswordValid && (
                      <div className="invalid-feedback d-block">{t('common.passwordMin')}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="passwordConfirmation" className="form-label">
                      {t('common.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      className={`form-control ${touched.passwordConfirmation && !isPasswordConfirmationValid ? 'is-invalid' : ''}`}
                      id="passwordConfirmation"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      onBlur={() => setTouched({ ...touched, passwordConfirmation: true })}
                      placeholder={t('resetPassword.confirmPlaceholder')}
                      disabled={loading}
                    />
                    {touched.passwordConfirmation && !isPasswordConfirmationValid && (
                      <div className="invalid-feedback d-block">{t('common.passwordsMustMatch')}</div>
                    )}
                  </div>

                  <div className="d-grid gap-2 mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {t('resetPassword.submitting')}
                        </>
                      ) : (
                        t('resetPassword.submit')
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

export default ResetPassword;
