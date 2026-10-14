import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AdminAuthLayout from '@/components/admin/AdminAuthLayout';
import { ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { requestPasswordLink } from '@/services/authService';
import './AdminLoginPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Asks the server to email a single-use, time-limited link to set a new password. */
export default function AdminForgotPasswordPage() {
  useDocumentTitle('Reset password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError(value ? 'Enter a valid email address, like name@example.com.' : 'Enter your email address.');
      emailRef.current?.focus();
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await requestPasswordLink(value);
      setSent(res.message);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminAuthLayout title="Reset password" subtitle="We’ll email you a link to choose a new password.">
      {sent ? (
        <div className="alert alert-success bn-auth-alert" role="status">
          {sent} The link expires in 60 minutes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="alert alert-danger bn-auth-alert" role="alert">
              {formError}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="reset-email" className="form-label">
              Email
            </label>
            <input
              ref={emailRef}
              id="reset-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className={`form-control${error ? ' is-invalid' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'reset-email-error' : undefined}
              disabled={busy}
              required
            />
            {error && (
              <div id="reset-email-error" className="invalid-feedback">
                {error}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary w-100 bn-auth-submit mb-3" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      )}
      <Link to={ROUTES.adminLogin} className="btn btn-outline-secondary w-100" style={{ minHeight: 48, display: 'grid', placeItems: 'center' }}>
        Back to sign in
      </Link>
    </AdminAuthLayout>
  );
}
