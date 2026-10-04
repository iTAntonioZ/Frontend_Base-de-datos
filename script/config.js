// script/config.js

// 1. Detectar si estamos ejecutando en entorno local
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.')
);

// 2. Dominio de producción (sin barra diagonal al final)
const PROD_API_URL = 'https://backdb.vercel.app';

// 3. Selección dinámica y limpieza de cualquier barra final residual
const BASE_URL = isLocalhost ? 'http://localhost:3000' : PROD_API_URL;
const API_URL = BASE_URL.replace(/\/+$/, '');

const Auth = {
  setSession(token, usuario) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  getUser() {
    const userStr = localStorage.getItem('usuario');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  hasPermission(permiso) {
    const user = this.getUser();
    if (!user) return false;
    if (user.rol === 'ADMIN') return true;
    return Array.isArray(user.permisos) && user.permisos.includes(permiso);
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    window.location.href = 'auth.html';
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'auth.html';
    }
  },

  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = 'dashboard.html';
    }
  }
};

async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Asegura exactamente una sola barra entre la base y la ruta
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  // Si da 401 pero NO es el login, entonces sí expiró el token
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