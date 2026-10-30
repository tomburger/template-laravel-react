import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error is already set in context
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password && password.length >= 8;
  const isFormValid = isEmailValid && isPasswordValid;

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h1 className="card-title text-center mb-4">{t('login.title')}</h1>

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
                      className={`form-control ${touched.email && !isEmailValid ? 'is-invalid' : ''}`}
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder={t('common.emailPlaceholder')}
                      disabled={loading}
                    />
                    {touched.email && !isEmailValid && (
                      <div className="invalid-feedback d-block">{t('common.invalidEmail')}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      {t('common.password')}
                    </label>
                    <input
                      type="password"
                      className={`form-control ${touched.password && !isPasswordValid ? 'is-invalid' : ''}`}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur('password')}
                      placeholder={t('login.passwordPlaceholder')}
                      disabled={loading}
                    />
                    {touched.password && !isPasswordValid && (
                      <div className="invalid-feedback d-block">{t('common.passwordMin')}</div>
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
                          {t('login.submitting')}
                        </>
                      ) : (
                        t('login.submit')
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p className="mb-2">
                    <Link to="/forgot-password" className="text-decoration-none">
                      {t('login.forgotPassword')}
                    </Link>
                  </p>
                  <p>
                    {t('login.noAccount')}{' '}
                    <Link to="/register" className="text-decoration-none">
                      {t('login.registerHere')}
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

export default Login;
