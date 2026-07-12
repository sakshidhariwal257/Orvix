// Mirrors the enums defined in models/Task.js - do not rename these values,
// they are sent to and stored by the backend exactly as-is.
export const TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High'];
export const TASK_LABELS = ['Bug', 'Feature', 'Documentation', 'Urgent'];

export const STATUS_BADGE_CLASS = {
  Todo: 'badge-Todo',
  'In Progress': 'badge-InProgress',
  Review: 'badge-Review',
  Done: 'badge-Done',
};

export const PRIORITY_BADGE_CLASS = {
  Low: 'badge-Low',
  Medium: 'badge-Medium',
  High: 'badge-High',
};

// Mirrors the enum in models/Notification.js
export const NOTIFICATION_COLORS = {
  'Task Assigned': 'bg-blue-500/15 text-blue-300',
  'Task Completed': 'bg-green-500/15 text-green-300',
  'Due Tomorrow': 'bg-amber-500/15 text-amber-300',
  'Mentioned in Comment': 'bg-purple-500/15 text-purple-300',
  'Added to Team': 'bg-pink-500/15 text-pink-300',
  'Workspace Invite': 'bg-purple-500/15 text-purple-300',
  'Role Changed': 'bg-cyan-500/15 text-cyan-300',
};

// Mirrors the enum in models/Workspace.js
export const WORKSPACE_TYPES = ['Personal', 'Team', 'Organization'];
export const WORKSPACE_ROLES = ['Owner', 'Admin', 'Manager', 'Member', 'Guest'];
export const WORKSPACE_ROLE_BADGE_CLASS = {
  Owner: 'badge-Owner',
  Admin: 'badge-Admin',
  Manager: 'badge-Manager',
  Member: 'badge-Member',
  Guest: 'badge-Guest',
};

// Mirrors the enum in models/Project.js
export const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'];
export const PROJECT_STATUS_BADGE_CLASS = {
  Planning: 'badge-Planning',
  Active: 'badge-Active',
  'On Hold': 'badge-OnHold',
  Completed: 'badge-Completed',
  Archived: 'badge-Archived',
};
export const PROJECT_VISIBILITY = ['Private', 'Team', 'Workspace'];

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
}
