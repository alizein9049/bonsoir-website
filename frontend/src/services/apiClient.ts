/**
 * Small fetch wrapper for the Laravel API (same origin: Vite proxies /api,
 * /sanctum and /storage to Laravel in development; same domain in production).
 *
 * - Sends the session cookie and the Sanctum CSRF token (X-XSRF-TOKEN).
 * - Turns error answers into ApiError with a friendly, server-written message.
 * - Announces 401 (signed out / session expired) so the admin returns to sign-in.
 */

export const API_BASE = '/api/v1';
export const UNAUTHORIZED_EVENT = 'bonsoir:unauthorized';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** machine-readable reason from the server, e.g. "last_owner", "not_empty" */
    public readonly code?: string,
    /** field → first validation message (422) */
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const NETWORK_MESSAGE = 'We couldn’t reach the server. Check that it is running and try again.';

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

let csrfReady: Promise<void> | null = null;

/** Gets the CSRF cookie once (and again after sign-in/out or a 419). */
export function ensureCsrf(force = false): Promise<void> {
  if (force || !csrfReady || !readCookie('XSRF-TOKEN')) {
    csrfReady = fetch('/sanctum/csrf-cookie', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((r) => {
        if (!r.ok) throw new ApiError(r.status, NETWORK_MESSAGE);
      })
      .catch((e) => {
        csrfReady = null;
        throw e instanceof ApiError ? e : new ApiError(0, NETWORK_MESSAGE);
      });
  }
  return csrfReady;
}

type Body = FormData | Record<string, unknown> | undefined;

async function send(method: string, path: string, body: Body, retried = false): Promise<Response> {
  const isWrite = method !== 'GET';
  if (isWrite) await ensureCsrf();

  const headers: Record<string, string> = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  const token = readCookie('XSRF-TOKEN');
  if (isWrite && token) headers['X-XSRF-TOKEN'] = token;

  let payload: BodyInit | undefined;
  let httpMethod = method;
  if (body instanceof FormData) {
    // PHP only reads uploaded files on POST, so PATCH travels as POST + _method.
    if (method !== 'POST') {
      body.set('_method', method);
      httpMethod = 'POST';
    }
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: httpMethod, headers, body: payload, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, NETWORK_MESSAGE);
  }

  if (res.status === 419 && !retried) {
    // CSRF token expired (e.g. the tab was open for hours): refresh once and retry.
    await ensureCsrf(true);
    return send(method, path, body, true);
  }
  return res;
}

async function toError(res: Response): Promise<ApiError> {
  let data: { message?: string; code?: string; errors?: Record<string, string[]> } = {};
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }
  const fieldErrors: Record<string, string> = {};
  for (const [field, msgs] of Object.entries(data.errors ?? {})) {
    if (msgs?.[0]) fieldErrors[field] = msgs[0];
  }
  const firstField = Object.values(fieldErrors)[0];

  let message: string;
  switch (res.status) {
    case 401:
      message = 'Your session has ended. Please sign in again.';
      break;
    case 413:
      message = 'This file is too large to upload.';
      break;
    case 422:
      message = firstField ?? data.message ?? 'Please check the highlighted fields.';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      message = 'Something went wrong on the server. Please try again.';
      break;
    default:
      message = data.message ?? 'Something went wrong. Please try again.';
  }
  return new ApiError(res.status, message, data.code, fieldErrors);
}

export async function api<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: Body): Promise<T> {
  const res = await send(method, path, body);
  if (!res.ok) {
    const error = await toError(res);
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw error;
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as Record<string, unknown>;
  return ('data' in json ? json.data : json) as T;
}
