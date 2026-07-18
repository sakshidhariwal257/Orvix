import { get, patch, del } from './client';

// GET /api/notifications
export const getNotifications = () => get('/api/notifications');

// GET /api/notifications/unread-count
export const getUnreadCount = () => get('/api/notifications/unread-count');

// PATCH /api/notifications/:id/read
export const markAsRead = (id) => patch(`/api/notifications/${id}/read`);

// PATCH /api/notifications/read-all
export const markAllAsRead = () => patch('/api/notifications/read-all');

// DELETE /api/notifications/:id
export const deleteNotification = (id) => del(`/api/notifications/${id}`);
