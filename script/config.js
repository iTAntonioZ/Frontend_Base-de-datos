const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.')
);

const TUNNEL_API_URL = 'https://gore-wilson-warranty-convention.trycloudflare.com/';
const API_URL = isLocalhost ? 'http://localhost:3000' : TUNNEL_API_URL;

const SESSION_MAX_AGE_MS = 1 * 60 * 1000; 

const Auth = {
  setSession(token, usuario) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('session_created_at', Date.now().toString());
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  getUser() {
    const userStr = localStorage.getItem('usuario');
    return userStr ? JSON.parse(userStr) : null;
  },

  getSessionCreatedAt() {
    const timeStr = localStorage.getItem('session_created_at');
    return timeStr ? parseInt(timeStr, 10) : null;
  },

  isSessionValid() {
    const token = this.getToken();
    const createdAt = this.getSessionCreatedAt();

    if (!token || !createdAt) {
      return false;
    }

    const elapsed = Date.now() - createdAt;
    return elapsed < SESSION_MAX_AGE_MS;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('session_created_at');
    window.location.href = 'auth.html';
  },

  requireAuth() {
    if (!this.isSessionValid()) {
      this.logout();
    }
  },

  redirectIfAuthenticated() {
    if (this.isSessionValid()) {
      window.location.href = 'dashboard.html';
    } else {
      // Si el token es antiguo, se limpia para que no interfiera
      localStorage.removeItem('access_token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('session_created_at');
    }
  }
};

// ==========================================
// CONTROL DE INACTIVIDAD (8 MINUTOS)
// ==========================================
(function initInactivityTracker() {
  const INACTIVITY_TIMEOUT_MS = 8 * 60 * 1000; 
  let timer;

  function resetTimer() {
    clearTimeout(timer);
    if (Auth.isAuthenticated() && !window.location.pathname.endsWith('auth.html')) {
      timer = setTimeout(() => {
        alert('Tu sesión ha expirado por inactividad.');
        Auth.logout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }

  const userEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  userEvents.forEach((event) => {
    window.addEventListener(event, resetTimer, { passive: true });
  });

  resetTimer();
})();

async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !cleanEndpoint.includes('/auth/login')) {
    Auth.logout();
    throw new Error('Sesión expirada o no autorizada');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}