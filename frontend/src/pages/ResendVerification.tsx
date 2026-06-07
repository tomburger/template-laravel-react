import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResendVerification: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);
  const { resendVerificationEmail, error, clearError } = useAuth();
  const navigate = useNavigate();

  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await resendVerificationEmail(email);
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
                  <h2 className="card-title mb-3">Verification Email Sent</h2>
                  <p className="card-text mb-3">
                    We've sent a new verification link to <strong>{email}</strong>. Please check your email.
                  </p>
                  <p className="text-muted small">Redirecting to login in a moment...</p>
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
                <h1 className="card-title text-center mb-4">Resend Verification Email</h1>
                <p className="text-muted text-center mb-4">
                  Enter your email address and we'll send you a new verification link.
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
                      Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${touched && !isEmailValid ? 'is-invalid' : ''}`}
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                    {touched && !isEmailValid && (
                      <div className="invalid-feedback d-block">Please enter a valid email</div>
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
                          Sending...
                        </>
                      ) : (
                        'Send Verification Email'
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p>
                    <Link to="/login" className="text-decoration-none">
                      Back to Login
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

export default ResendVerification;
