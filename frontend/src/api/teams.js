import { get, post, put, del } from './client';

// POST /api/teams  { name, description, color }
export const createTeam = (payload) => post('/api/teams', payload);

// GET /api/teams
export const getTeams = () => get('/api/teams');

// GET /api/teams/:id
export const getTeamById = (id) => get(`/api/teams/${id}`);

// PUT /api/teams/:id  { name, description, color }
export const updateTeam = (id, payload) => put(`/api/teams/${id}`, payload);

// DELETE /api/teams/:id
export const deleteTeam = (id) => del(`/api/teams/${id}`);

// POST /api/teams/:id/members  { email }
export const addMember = (id, email) => post(`/api/teams/${id}/members`, { email });

// DELETE /api/teams/:id/members/:userId
export const removeMember = (id, userId) => del(`/api/teams/${id}/members/${userId}`);
