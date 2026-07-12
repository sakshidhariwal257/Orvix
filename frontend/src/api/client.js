export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  let data = {};
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

export const get = (path) => request(path, { method: 'GET' });
export const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
export const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
export const patch = (path, body) =>
  request(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
export const del = (path) => request(path, { method: 'DELETE' });
