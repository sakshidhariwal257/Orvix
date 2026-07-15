import { get, post, put, del } from './client';

// POST /api/boards  { name, description, teamId }
export const createBoard = (payload) => post('/api/boards', payload);

// GET /api/boards?teamId=<id>
export const getBoards = (teamId) => get(`/api/boards?teamId=${teamId}`);

// GET /api/boards/:id
export const getBoardById = (id) => get(`/api/boards/${id}`);

// PUT /api/boards/:id  { name, description }
export const updateBoard = (id, payload) => put(`/api/boards/${id}`, payload);

// DELETE /api/boards/:id
export const deleteBoard = (id) => del(`/api/boards/${id}`);
