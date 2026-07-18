import { get } from './client';

// GET /api/search?q=<query>
export const globalSearch = (q) => get(`/api/search?q=${encodeURIComponent(q)}`);
