import { get, post, put, patch, del } from './client';

// POST /api/tasks  { title, description, status, priority, dueDate, assignee, boardId, labels, attachments }
export const createTask = (payload) => post('/api/tasks', payload);

// GET /api/tasks?boardId=<id>
export const getTasks = (boardId) => get(`/api/tasks?boardId=${boardId}`);

// GET /api/tasks/:id
export const getTaskById = (id) => get(`/api/tasks/${id}`);

// PUT /api/tasks/:id
export const updateTask = (id, payload) => put(`/api/tasks/${id}`, payload);

// DELETE /api/tasks/:id
export const deleteTask = (id) => del(`/api/tasks/${id}`);

// POST /api/tasks/:id/comments  { text }
export const addComment = (id, text) => post(`/api/tasks/${id}/comments`, { text });

// PATCH /api/tasks/reorder  { updates: [{ id, status, order }] }
export const reorderTasks = (updates) => patch('/api/tasks/reorder', { updates });

// GET /api/tasks/team/:teamId
export const getTeamTasks = (teamId) => get(`/api/tasks/team/${teamId}`);

// GET /api/tasks/team/:teamId/stats
export const getTeamStats = (teamId) => get(`/api/tasks/team/${teamId}/stats`);
