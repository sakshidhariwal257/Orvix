import { get, post, put } from './client';

// POST /api/auth/register  { name, email, password }
export const registerUser = (payload) => post('/api/auth/register', payload);

// POST /api/auth/login  { email, password }
export const loginUser = (payload) => post('/api/auth/login', payload);

// GET /api/auth/me
export const getMe = () => get('/api/auth/me');

// PUT /api/auth/me  { name, avatar, bio }
export const updateProfile = (payload) => put('/api/auth/me', payload);

// PUT /api/auth/password  { currentPassword, newPassword }
export const changePassword = (payload) => put('/api/auth/password', payload);
