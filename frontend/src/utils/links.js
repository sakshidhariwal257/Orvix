// The backend stores notification.link as either `/boards/:id` (task-related
// notifications) or `/dashboard` (added-to-team). Since the app now lives
// under the /dashboard prefix, this maps those stored values to real routes
// without needing to touch the backend's controllers.
export function resolveNotificationLink(link) {
  if (!link) return null;
  if (link.startsWith('/boards/')) return `/dashboard${link}`;
  if (link === '/dashboard') return '/dashboard';
  return link;
}
