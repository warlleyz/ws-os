const AUTH_ENDPOINT = '/api/auth';

let session = null;

let sessionExpirationTimer = null;

let sessionVersion = 0;
let loginRequestVersion = 0;

export function getAdminSessionVersion() {
  return sessionVersion;
}

const sessionListeners = new Set();

function notifySessionChange() {
  sessionVersion += 1;

  for (const listener of sessionListeners) {
    listener();
  }
}

function clearSessionExpirationTimer() {
  if (sessionExpirationTimer !== null) {
    clearTimeout(sessionExpirationTimer);
    sessionExpirationTimer = null;
  }
}

function clearAdminSession() {
  clearSessionExpirationTimer();

  if (session === null) return;

  session = null;
  notifySessionChange();
}

export function invalidateAdminSession(expectedVersion) {
  if (getAdminSessionVersion() === expectedVersion) clearAdminSession();
}

function scheduleSessionExpiration() {
  clearSessionExpirationTimer();

  if (!session) return;

  const expectedSession = session;
  const remaining = session.expiresAt - Date.now();

  if (remaining <= 0) {
    clearAdminSession();
    return;
  }

  sessionExpirationTimer = setTimeout(
    () => {
      sessionExpirationTimer = null;

      if (session !== expectedSession) return;

      if (Date.now() >= session.expiresAt) {
        clearAdminSession();
      } else {
        scheduleSessionExpiration();
      }
    },
    Math.min(remaining, 2_147_483_647),
  );
}

export function subscribeAdminSession(listener) {
  sessionListeners.add(listener);

  return () => {
    sessionListeners.delete(listener);
  };
}

async function authRequest(path, options = {}) {
  const response = await fetch(`${AUTH_ENDPOINT}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Falha na autenticação.');
  }

  return data;
}

export async function loginAdmin(email, password) {
  if (!email?.trim() || !password) {
    throw new Error('Informe o e-mail e a senha.');
  }

  const requestVersion = ++loginRequestVersion;
  const data = await authRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  if (requestVersion !== loginRequestVersion) {
    throw new Error('Solicitação de login cancelada.');
  }
  if (
    typeof data.access_token !== 'string' ||
    !data.access_token.trim() ||
    !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0
  ) {
    throw new Error('Resposta de autenticação inválida.');
  }

  session = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  scheduleSessionExpiration();
  notifySessionChange();

  return true;
}

export function getAdminAccessToken() {
  if (!session) return null;

  if (Date.now() >= session.expiresAt) {
    clearAdminSession();
    return null;
  }

  return session.accessToken;
}

export async function verifyAdminSession() {
  const token = getAdminAccessToken();
  if (!token) return false;

  const sessionVersion = getAdminSessionVersion();

  try {
    const data = await authRequest('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (getAdminSessionVersion() !== sessionVersion) {
      return false;
    }

    if (data.admin !== true) {
      clearAdminSession();
      return false;
    }

    return true;
  } catch {
    if (getAdminSessionVersion() === sessionVersion) {
      clearAdminSession();
    }

    return false;
  }
}

export function isAdminAuthenticated() {
  return getAdminAccessToken() !== null;
}

export function getAdminSessionExpiresAt() {
  return getAdminAccessToken() ? session.expiresAt : null;
}

export async function logoutAdmin() {
  loginRequestVersion += 1;
  const token = getAdminAccessToken();

  clearAdminSession();

  if (!token) return true;

  try {
    await authRequest('/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return true;
  } catch {
    return false;
  }
}
