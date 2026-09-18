// Expose one helper for all fetch calls
export const API_BASE = import.meta.env.VITE_API_BASE || '';

const TOKEN_KEY = 'wla_token';

// localStorage can be blocked (private window), the app then just forgets the login on reload
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // nothing to do
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401 && token) {
    // the token expired or the user is gone, AuthProvider listens to this
    setToken(null);
    window.dispatchEvent(new Event('auth:logout'));
  }
  return res;
}
