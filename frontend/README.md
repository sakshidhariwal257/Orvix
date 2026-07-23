# Orvix Frontend

React + Vite + Tailwind CSS frontend for the Orvix project-management backend.

## Setup

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` and point it at your backend:

```
VITE_API_URL=http://localhost:5000
```

Run the dev server:

```bash
npm run dev
```

This expects the Orvix Express backend running at the URL above (see
`backend/README.md`).

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | public | Landing page |
| `/login` | public | Sign in |
| `/register` | public | Create account |
| `/dashboard` | protected | Dashboard |
| `/dashboard/workspaces` | protected | Workspaces list |
| `/dashboard/workspaces/:id` | protected | Workspace detail (teams / members / settings) |
| `/dashboard/projects` | protected | Projects for a team (`?teamId=`) |
| `/dashboard/teams` | protected | Teams list |
| `/dashboard/boards` | protected | Boards, grouped by team |
| `/dashboard/boards/:id` | protected | Kanban board |
| `/dashboard/tasks` | protected | All tasks, searchable/filterable table |
| `/dashboard/calendar` | protected | Month view of tasks with due dates |
| `/dashboard/analytics` | protected | Per-team stats and charts |
| `/dashboard/notifications` | protected | Full notifications list |
| `/dashboard/settings` | protected | Profile settings |

Protected routes redirect to `/login` if there's no valid session
(`components/common/ProtectedRoute.jsx`, backed by `context/AuthContext.jsx`).

## What's implemented

- **Landing page** — hero (with a real background image + a CSS-tilted
  dashboard screenshot, no external image-tilting library needed), a
  two-row auto-scrolling logo marquee, a two-column features section with
  hover effects, stats bar, "how it works" steps, an FAQ accordion, and a
  footer — all with on-scroll fade/slide-in motion via a small
  `IntersectionObserver`-based `<Reveal>` wrapper
  (`components/common/Reveal.jsx`). Pricing and testimonials sections were
  intentionally left out per project scope.
- **Auth**: Login, Register — call `authController.loginUser` /
  `registerUser` exactly, store the returned `token` in `localStorage` (if
  "Remember me" is checked) or `sessionStorage`. Both pages have a
  "← Back to home" link to the landing page.
- **Dashboard**: aggregates real data from `getTeams`, `getTeamStats`, and
  `getTeamTasks` across every team you belong to — stat cards, status donut
  chart, weekly-completions line chart, and upcoming deadlines are computed
  from actual tasks.
- **Workspaces**: create Personal/Team/Organization workspaces, invite
  members with role assignment (Owner/Admin/Manager/Member/Guest), change
  roles, remove members, leave, archive/delete, and create teams inside a
  workspace.
- **Projects**: create/list/update/archive/duplicate/delete projects
  scoped to a team.
- **Teams**: list, create, delete (owner only), invite/remove members.
- **Boards**: grouped by team, task count + % complete computed from real
  tasks per board.
- **Board detail (Kanban)**: native HTML5 drag-and-drop between the 4 real
  status columns (`Todo`, `In Progress`, `Review`, `Done`), calls
  `reorderTasks` with the exact `{ id, status, order }` shape the backend
  expects. Task modal edits all real Task fields (status, priority,
  assignee, due date, labels) and supports comments.
- **Tasks**: all tasks across all your boards in one searchable/filterable/
  paginated table.
- **Calendar**: month view of tasks with due dates, using
  `getTeamTasks(teamId)`.
- **Analytics**: per-team stats from `getTeamStats` — status/priority
  breakdowns, tasks by member, completed-per-week trend.
- **Notifications**: full page + topbar dropdown.
- **Profile Settings**: name, avatar (as a URL — no upload endpoint), bio,
  and change password.

## Intentionally left out (no fake data, no unbuilt features)

- **No Google OAuth** — email/password only.
- **No AI features of any kind.**
- **No file upload** — avatar and any image fields (project cover image,
  etc.) are URL strings only; there's no multipart upload UI or endpoint.
- **No real billing/payment UI** — workspace billing shows a plan label
  only, no checkout flow.
- **"% from last week" and a live Recent Activity feed on the dashboard** —
  the backend doesn't store historical snapshots or an activity log, so
  these show an honest empty state instead of invented numbers.
- **Other users show initials, not photos** — every `populate()` in the
  backend controllers selects `'name email'` only, never `avatar`, for
  anyone but the logged-in user.

## Structure

```
frontend/
├── public/
│   └── assets/                 landing page images (hero bg, dashboard
│                                 mockup, FAQ illustration)
├── src/
│   ├── api/                    one file per backend controller — function
│   │                            names/params match the routes 1:1
│   │   ├── client.js            fetch wrapper: attaches JWT, auto-logs-out
│   │   │                        and redirects to /login on a 401
│   │   ├── auth.js  workspaces.js  teams.js  projects.js  boards.js
│   │   ├── tasks.js  notifications.js  search.js
│   ├── components/
│   │   ├── common/             Avatar, Misc (badges/Modal/EmptyState/
│   │   │                        Spinner), ProtectedRoute, Reveal
│   │   ├── layout/              Sidebar, Topbar, AppLayout (the shell every
│   │   │                        protected page renders inside)
│   │   ├── notifications/       NotificationsDropdown
│   │   └── search/              SearchDropdown
│   ├── context/
│   │   └── AuthContext.jsx      current user + login/logout/session
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx  RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── WorkspacesPage.jsx  WorkspaceDetailPage.jsx  ProjectsPage.jsx
│   │   ├── TeamsPage.jsx  BoardsPage.jsx  BoardDetailPage.jsx
│   │   ├── TasksPage.jsx  CalendarPage.jsx  AnalyticsPage.jsx
│   │   └── NotificationsPage.jsx  SettingsPage.jsx
│   ├── utils/
│   │   ├── constants.js         enums mirrored from backend models, badge
│   │   │                        class maps
│   │   └── date.js              formatting helpers
│   ├── App.jsx  main.jsx  index.css
├── tailwind.config.js  postcss.config.js  vite.config.js
├── package.json  .env.example
```