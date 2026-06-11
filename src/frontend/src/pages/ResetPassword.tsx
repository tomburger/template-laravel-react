import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPassword: React.FC = () => {
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
                  <h2 className="card-title mb-3">Invalid Reset Link</h2>
                  <p className="text-muted mb-3">
                    The password reset link is missing or invalid. Please request a new one.
                  </p>
                  <Link to="/forgot-password" className="btn btn-primary">
                    Request New Reset Link
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
          state: { message: 'Password reset successful! Please login with your new password.' },
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
                  <h2 className="card-title mb-3">Password Reset Successful!</h2>
                  <p className="text-muted">Your password has been reset. Redirecting to login...</p>
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
                <h1 className="card-title text-center mb-4">Reset Password</h1>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={clearError}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      className={`form-control ${touched.password && !isPasswordValid ? 'is-invalid' : ''}`}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched({ ...touched, password: true })}
                      placeholder="Enter new password (min 8 characters)"
                      disabled={loading}
                    />
                    {touched.password && !isPasswordValid && (
                      <div className="invalid-feedback d-block">Password must be at least 8 characters</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="passwordConfirmation" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className={`form-control ${touched.passwordConfirmation && !isPasswordConfirmationValid ? 'is-invalid' : ''}`}
                      id="passwordConfirmation"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      onBlur={() => setTouched({ ...touched, passwordConfirmation: true })}
                      placeholder="Confirm your new password"
                      disabled={loading}
                    />
                    {touched.passwordConfirmation && !isPasswordConfirmationValid && (
                      <div className="invalid-feedback d-block">Passwords must match</div>
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
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p>
                    Remember your password?{' '}
                    <Link to="/login" className="text-decoration-none">
                      Login here
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
