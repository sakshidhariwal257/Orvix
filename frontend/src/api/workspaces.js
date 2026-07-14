import { get, post, put, patch, del } from './client';

// POST /api/workspaces  { name, description, type, color }
export const createWorkspace = (payload) => post('/api/workspaces', payload);

// GET /api/workspaces
export const getWorkspaces = () => get('/api/workspaces');

// GET /api/workspaces/:id
export const getWorkspaceById = (id) => get(`/api/workspaces/${id}`);

// PUT /api/workspaces/:id  { name, description, color, settings }
export const updateWorkspace = (id, payload) => put(`/api/workspaces/${id}`, payload);

// PATCH /api/workspaces/:id/archive
export const archiveWorkspace = (id) => patch(`/api/workspaces/${id}/archive`);

// PATCH /api/workspaces/:id/unarchive
export const unarchiveWorkspace = (id) => patch(`/api/workspaces/${id}/unarchive`);

// DELETE /api/workspaces/:id
export const deleteWorkspace = (id) => del(`/api/workspaces/${id}`);

// POST /api/workspaces/:id/members  { email, role }
export const inviteWorkspaceMember = (id, email, role) =>
  post(`/api/workspaces/${id}/members`, { email, role });

// PATCH /api/workspaces/:id/members/:userId/role  { role }
export const updateMemberRole = (id, userId, role) =>
  patch(`/api/workspaces/${id}/members/${userId}/role`, { role });

// DELETE /api/workspaces/:id/members/:userId
export const removeWorkspaceMember = (id, userId) => del(`/api/workspaces/${id}/members/${userId}`);

// POST /api/workspaces/:id/leave
export const leaveWorkspace = (id) => post(`/api/workspaces/${id}/leave`);

// POST /api/workspaces/:id/teams  { name, description, color }
export const createTeamInWorkspace = (id, payload) => post(`/api/workspaces/${id}/teams`, payload);

// GET /api/workspaces/:id/teams
export const getWorkspaceTeams = (id) => get(`/api/workspaces/${id}/teams`);
