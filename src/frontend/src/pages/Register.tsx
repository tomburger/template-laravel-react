import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean; passwordConfirmation?: boolean }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched({ ...touched, [field]: true });
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = formData.name && formData.name.length > 0;
  const isEmailValid = formData.email && validateEmail(formData.email);
  const isPasswordValid = formData.password && formData.password.length >= 8;
  const isPasswordConfirmationValid = formData.passwordConfirmation === formData.password && formData.passwordConfirmation.length > 0;

  const isFormValid = isNameValid && isEmailValid && isPasswordValid && isPasswordConfirmationValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await register(formData.name, formData.email, formData.password, formData.passwordConfirmation);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Registration successful! Please check your email to verify your account.' },
        });
      }, 3000);
    } catch {
      // Error is already set in context
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
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
                  <h2 className="card-title mb-3">Registration Successful!</h2>
                  <p className="card-text mb-3">
                    We've sent a verification link to <strong>{formData.email}</strong>. Please check your email and click the link to verify your account.
                  </p>
                  <p className="text-muted small">Redirecting to login...</p>
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
                <h1 className="card-title text-center mb-4">Register</h1>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={clearError}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className={`form-control ${touched.name && !isNameValid ? 'is-invalid' : ''}`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('name')}
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                    {touched.name && !isNameValid && (
                      <div className="invalid-feedback d-block">Name is required</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${touched.email && !isEmailValid ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                    {touched.email && !isEmailValid && (
                      <div className="invalid-feedback d-block">Please enter a valid email</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className={`form-control ${touched.password && !isPasswordValid ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      placeholder="Enter your password (min 8 characters)"
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
                      name="passwordConfirmation"
                      value={formData.passwordConfirmation}
                      onChange={handleChange}
                      onBlur={() => handleBlur('passwordConfirmation')}
                      placeholder="Confirm your password"
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
                          Registering...
                        </>
                      ) : (
                        'Register'
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p>
                    Already have an account?{' '}
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

export default Register;
