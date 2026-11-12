export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let token = null;

export function getToken() {
  if (token) return token;
  if (typeof window !== 'undefined') token = localStorage.getItem('pyq_token');
  return token;
}

export function setToken(t) {
  token = t;
  if (typeof window !== 'undefined') {
    if (t) localStorage.setItem('pyq_token', t);
    else localStorage.removeItem('pyq_token');
  }
}

async function send(path, { method = 'GET', body, headers = {} } = {}) {
  const h = { ...headers };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  let payload = body;
  if (body && !(body instanceof FormData)) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  return fetch(API_URL + path, { method, headers: h, body: payload, credentials: 'include' });
}

// Calls the API. On 401 it tries one silent token refresh (httpOnly cookie) and retries.
export async function api(path, opts = {}) {
  let res = await send(path, opts);
  const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/refresh');
  if (res.status === 401 && !isAuthCall) {
    const r = await send('/auth/refresh', { method: 'POST' });
    if (r.ok) {
      setToken((await r.json()).token);
      res = await send(path, opts);
    } else {
      setToken(null);
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}
