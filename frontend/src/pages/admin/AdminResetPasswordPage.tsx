import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminAuthLayout from '@/components/admin/AdminAuthLayout';
import PasswordField from '@/components/admin/PasswordField';
import { ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiError } from '@/services/apiClient';
import { resetPassword } from '@/services/authService';
import './AdminLoginPage.css';

const MIN_LENGTH = 10;

/** Opened from the emailed link (new account setup or forgotten password). */
export default function AdminResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const isSetup = params.get('setup') === '1';
  useDocumentTitle(isSetup ? 'Choose your password' : 'Set a new password');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const found: typeof errors = {};
    if (password.length < MIN_LENGTH) found.password = `Use at least ${MIN_LENGTH} characters.`;
    else if (!/[A-Za-z]/.test(password)) found.password = 'Include at least one letter.';
    if (confirm !== password) found.confirm = 'The two passwords are different.';
    setErrors(found);
    if (found.password || found.confirm) return;

    setBusy(true);
    try {
      await resetPassword({ token, email, password, password_confirmation: confirm });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.password) setErrors({ password: err.fieldErrors.password });
      else setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const title = isSetup ? 'Choose your password' : 'Set a new password';

  if (!token || !email) {
    return (
      <AdminAuthLayout title={title} subtitle="This link is incomplete. Please open the link from your email again.">
        <Link to={ROUTES.adminForgotPassword} className="btn btn-primary w-100 bn-auth-submit" style={{ display: 'grid', placeItems: 'center' }}>
          Request a new link
        </Link>
      </AdminAuthLayout>
    );
  }

  return (
    <AdminAuthLayout title={title} subtitle={email}>
      {done ? (
        <>
          <div className="alert alert-success bn-auth-alert" role="status">
            Your password has been saved. You can now sign in.
          </div>
          <Link to={ROUTES.adminLogin} className="btn btn-primary w-100 bn-auth-submit" style={{ display: 'grid', placeItems: 'center' }}>
            Go to sign in
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="alert alert-danger bn-auth-alert" role="alert">
              {formError} <Link to={ROUTES.adminForgotPassword}>Request a new link</Link>
            </div>
          )}
          <PasswordField label="New password" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" disabled={busy} />
          <p className="bn-help mb-3" style={{ marginTop: '-0.5rem' }}>
            At least {MIN_LENGTH} characters. A longer phrase is safer.
          </p>
          <PasswordField
            label="Repeat new password"
            name="password_confirmation"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            autoComplete="new-password"
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary w-100 bn-auth-submit mt-2" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save password'
            )}
          </button>
        </form>
      )}
    </AdminAuthLayout>
  );
}
