import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiError } from '@/services/apiClient';
import * as api from '@/services/adminUserService';
import type { ManagedUser } from '@/services/adminUserService';
import type { AdminRole } from '@/types/auth';
import './AdminUsersPage.css';

const ROLE_LABEL: Record<AdminRole, string> = { owner: 'Owner', editor: 'Menu Editor' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Pending = { kind: 'disable' | 'delete'; user: ManagedUser } | null;

/**
 * Owner-only: add admins (they receive a link to choose their password), change roles,
 * disable/enable, send a new password link, delete. The server keeps at least one active Owner.
 */
export default function AdminUsersPage() {
  useDocumentTitle('Users');
  const uid = useId();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' as AdminRole });
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});
  const [creating, setCreating] = useState(false);
  const noticeTimer = useRef<number>();

  const announce = useCallback((kind: 'success' | 'error', text: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = window.setTimeout(() => setNotice(null), 8000);
  }, []);
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const load = useCallback(async () => {
    try {
      setUsers(await api.fetchUsers());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const replace = (u: ManagedUser) => setUsers((list) => list?.map((x) => (x.id === u.id ? u : x)) ?? null);

  async function run(user: ManagedUser, action: () => Promise<string | void>) {
    setBusyId(user.id);
    try {
      const message = await action();
      if (message) announce('success', message);
    } catch (e) {
      announce('error', e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const found: typeof formErrors = {};
    if (!form.name.trim()) found.name = 'Enter the person’s name.';
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = 'Enter a valid email address.';
    setFormErrors(found);
    if (found.name || found.email) {
      document.getElementById(`${uid}-${found.name ? 'name' : 'email'}`)?.focus();
      return;
    }
    setCreating(true);
    try {
      const created = await api.createUser({ name: form.name.trim(), email: form.email.trim(), role: form.role });
      setUsers((list) => [...(list ?? []), created]);
      setForm({ name: '', email: '', role: 'editor' });
      announce('success', `Account created for ${created.email}. A link to choose a password has been emailed (valid 60 minutes).`);
    } catch (err) {
      if (err instanceof ApiError && (err.fieldErrors.email || err.fieldErrors.name)) {
        setFormErrors({ name: err.fieldErrors.name, email: err.fieldErrors.email });
      } else {
        announce('error', err instanceof Error ? err.message : 'Couldn’t create the account.');
      }
    } finally {
      setCreating(false);
    }
  }

  function changeRole(u: ManagedUser, role: AdminRole) {
    void run(u, async () => {
      const updated = await api.updateUser(u.id, { role });
      replace(updated);
      // Stepping down from Owner yourself: reload so the Owner-only pages disappear.
      if (u.isSelf && role !== 'owner') window.location.assign(ROUTES.adminHome);
      return `${u.name} is now ${ROLE_LABEL[role]}.`;
    });
  }

  function enable(u: ManagedUser) {
    void run(u, async () => {
      replace(await api.setUserActive(u.id, true));
      return `${u.name} can sign in again.`;
    });
  }

  function sendLink(u: ManagedUser) {
    void run(u, async () => (await api.sendPasswordLink(u.id)).message);
  }

  async function confirmPending() {
    if (!pending) return;
    const { kind, user } = pending;
    setPending(null);
    await run(user, async () => {
      if (kind === 'disable') {
        replace(await api.setUserActive(user.id, false));
        return `${user.name} has been disabled and signed out.`;
      }
      await api.deleteUser(user.id);
      setUsers((list) => list?.filter((x) => x.id !== user.id) ?? null);
      return `${user.name}’s account was deleted.`;
    });
  }

  return (
    <>
      <div className="bn-page-head">
        <div>
          <h1 className="bn-page-title">Users</h1>
          <p className="bn-page-sub">Owner: everything. Menu Editor: products, prices, photos and featured items.</p>
        </div>
      </div>

      <div className="bn-notice-slot" role="status" aria-live="polite">
        {notice && <div className={`alert ${notice.kind === 'success' ? 'alert-success' : 'alert-warning'} bn-notice`}>{notice.text}</div>}
      </div>

      <form className="bn-user-new" onSubmit={handleCreate} noValidate aria-labelledby={`${uid}-new-h`}>
        <h2 id={`${uid}-new-h`} className="bn-user-new__title">
          Add a person
        </h2>
        <div className="bn-user-new__grid">
          <div>
            <label htmlFor={`${uid}-name`} className="form-label">
              Name
            </label>
            <input
              id={`${uid}-name`}
              className={`form-control${formErrors.name ? ' is-invalid' : ''}`}
              value={form.name}
              maxLength={80}
              autoComplete="off"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-invalid={formErrors.name ? true : undefined}
              aria-describedby={formErrors.name ? `${uid}-name-err` : undefined}
              disabled={creating}
            />
            {formErrors.name && <div id={`${uid}-name-err`} className="invalid-feedback">{formErrors.name}</div>}
          </div>
          <div>
            <label htmlFor={`${uid}-email`} className="form-label">
              Email
            </label>
            <input
              id={`${uid}-email`}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              className={`form-control${formErrors.email ? ' is-invalid' : ''}`}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              aria-invalid={formErrors.email ? true : undefined}
              aria-describedby={formErrors.email ? `${uid}-email-err` : undefined}
              disabled={creating}
            />
            {formErrors.email && <div id={`${uid}-email-err`} className="invalid-feedback">{formErrors.email}</div>}
          </div>
          <div>
            <label htmlFor={`${uid}-role`} className="form-label">
              Role
            </label>
            <select id={`${uid}-role`} className="form-select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminRole }))} disabled={creating}>
              <option value="editor">Menu Editor</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div className="bn-user-new__submit">
            <button type="submit" className="btn btn-primary bn-btn-44 w-100" disabled={creating}>
              {creating ? 'Adding…' : 'Add and send link'}
            </button>
          </div>
        </div>
        <p className="bn-help">They receive an email with a link to choose their own password.</p>
      </form>

      {loadError && (
        <div className="bn-admin-state" role="alert">
          <p>We couldn’t load the users.</p>
          <button type="button" className="btn btn-primary bn-btn-44" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}
      {!users && !loadError && (
        <div className="bn-admin-state" role="status">
          <div className="spinner-border" aria-hidden="true" />
          <span>Loading users…</span>
        </div>
      )}

      {users && (
        <ul className="bn-user-list" aria-label="Admin accounts">
          {users.map((u) => (
            <li key={u.id} className={`bn-user${u.isActive ? '' : ' is-disabled'}`}>
              <div className="bn-user__info">
                <span className="bn-user__name">
                  {u.name}
                  {u.isSelf && <span className="bn-user__you"> (you)</span>}
                </span>
                <span className="bn-user__email">{u.email}</span>
                {!u.isActive && <span className="bn-hidden-pill">Disabled</span>}
              </div>
              <div className="bn-user__role">
                <label htmlFor={`${uid}-role-${u.id}`} className="visually-hidden">
                  Role of {u.name}
                </label>
                <select
                  id={`${uid}-role-${u.id}`}
                  className="form-select"
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value as AdminRole)}
                  disabled={busyId !== null}
                >
                  <option value="owner">Owner</option>
                  <option value="editor">Menu Editor</option>
                </select>
              </div>
              <div className="bn-user__actions">
                {u.isActive ? (
                  <>
                    <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={() => sendLink(u)} disabled={busyId !== null}>
                      Send password link<span className="visually-hidden"> to {u.name}</span>
                    </button>
                    {!u.isSelf && (
                      <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={() => setPending({ kind: 'disable', user: u })} disabled={busyId !== null}>
                        Disable<span className="visually-hidden"> {u.name}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={() => enable(u)} disabled={busyId !== null}>
                    Enable<span className="visually-hidden"> {u.name}</span>
                  </button>
                )}
                {!u.isSelf && (
                  <button type="button" className="btn btn-outline-danger bn-btn-44" onClick={() => setPending({ kind: 'delete', user: u })} disabled={busyId !== null}>
                    Delete<span className="visually-hidden"> {u.name}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === 'delete' ? `Delete ${pending.user.name}’s account?` : `Disable ${pending?.user.name ?? ''}?`}
        confirmLabel={pending?.kind === 'delete' ? 'Delete account' : 'Disable account'}
        onConfirm={() => void confirmPending()}
        onCancel={() => setPending(null)}
      >
        <p className="mb-0">
          {pending?.kind === 'delete'
            ? 'They will no longer be able to sign in. This can’t be undone.'
            : 'They will be signed out and can’t sign in until you enable the account again.'}
        </p>
      </ConfirmDialog>
    </>
  );
}
