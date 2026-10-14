import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AdminAuthLayout from '@/components/admin/AdminAuthLayout';
import PasswordField from '@/components/admin/PasswordField';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AuthError } from '@/types/auth';
import './AdminLoginPage.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

/** Admin sign-in (Owner and Menu Editor). */
export default function AdminLoginPage() {
  useDocumentTitle('Admin sign in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.adminHome;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failCount, setFailCount] = useState(0); // re-announces repeated errors
  const emailRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formError) alertRef.current?.focus();
  }, [formError, failCount]);

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const found = validate(email, password);
    setErrors(found);
    if (found.email) {
      emailRef.current?.focus();
      return;
    }
    if (found.password) {
      (e.currentTarget.elements.namedItem('password') as HTMLInputElement | null)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setPassword('');
      setFailCount((n) => n + 1);
      setFormError(
        err instanceof AuthError ? err.message : 'We couldn’t reach the server. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthLayout title="Sign in" subtitle="Manage the Bonsoir menu">
      {formError && (
        <div key={failCount} ref={alertRef} className="alert alert-danger bn-auth-alert" role="alert" tabIndex={-1}>
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="admin-email" className="form-label">
            Email
          </label>
          <input
            ref={emailRef}
            id="admin-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={`form-control${errors.email ? ' is-invalid' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'admin-email-error' : undefined}
            disabled={submitting}
            required
          />
          {errors.email && (
            <div id="admin-email-error" className="invalid-feedback">
              {errors.email}
            </div>
          )}
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
          disabled={submitting}
        />

        <div className="d-flex justify-content-end mb-4">
          <Link to={ROUTES.adminForgotPassword} className="bn-auth-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary w-100 bn-auth-submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </AdminAuthLayout>
  );
}
