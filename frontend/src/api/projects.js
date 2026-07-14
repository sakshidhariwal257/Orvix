import { get, post, put, patch, del } from './client';

// POST /api/projects  { name, description, coverImage, status, priority, dueDate, labels, tags, visibility, teamId }
export const createProject = (payload) => post('/api/projects', payload);

// GET /api/projects?teamId=<id>  or  ?workspaceId=<id>
export const getProjectsByTeam = (teamId) => get(`/api/projects?teamId=${teamId}`);
export const getProjectsByWorkspace = (workspaceId) => get(`/api/projects?workspaceId=${workspaceId}`);

// GET /api/projects/:id
export const getProjectById = (id) => get(`/api/projects/${id}`);

// PUT /api/projects/:id
export const updateProject = (id, payload) => put(`/api/projects/${id}`, payload);

// PATCH /api/projects/:id/archive
export const archiveProject = (id) => patch(`/api/projects/${id}/archive`);

// PATCH /api/projects/:id/unarchive
export const unarchiveProject = (id) => patch(`/api/projects/${id}/unarchive`);

// DELETE /api/projects/:id
export const deleteProject = (id) => del(`/api/projects/${id}`);

// POST /api/projects/:id/duplicate
export const duplicateProject = (id) => post(`/api/projects/${id}/duplicate`);
