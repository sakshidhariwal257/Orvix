# Orvix Backend

Express + MongoDB + Socket.io API for the Orvix project-management app.

## Stack

- Express 5, Mongoose 8
- JWT auth (`jsonwebtoken`), password hashing (`bcryptjs`)
- Socket.io for live board/notification updates
- CommonJS throughout

## Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in real values:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pmtool
JWT_SECRET=replace_with_a_long_random_secret
```

`MONGO_URI` should point at a running MongoDB instance (local, or a connection
string from something like MongoDB Atlas). `JWT_SECRET` should be a long,
random string — rotating it invalidates every existing session (see note
below).

Run it:

```bash
npm run dev     # nodemon, auto-restarts on changes
npm start        # plain node
```

The API is then available at `http://localhost:5000` (or whatever `PORT` is
set to), and the frontend's `VITE_API_URL` should point here.

## Project structure

```
backend/
├── config/db.js               Mongoose connection
├── models/                    User, Team, Board, Task, Notification,
│                               Workspace, Project
├── controllers/                one file per resource, all business logic
├── routes/                    thin Express routers, mounted in server.js
├── middleware/authMiddleware.js   JWT verification (`protect`)
├── utils/dueDateReminder.js   background job: notifies assignees of tasks
│                               due tomorrow (runs hourly)
├── socket.js                  Socket.io init, JWT-authenticated connections
└── server.js                  wires everything together
```

## Data hierarchy

```
Workspace → Team → Project → Board → Task
```

`Workspace` and `Project` are optional/additive layers — `Team` and `Board`
still work standalone (their `workspace`/`project` fields default to `null`),
so nothing breaks if you don't use the full hierarchy.

## API routes

All routes except register/login require `Authorization: Bearer <token>`.

**Auth** — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create an account |
| POST | `/login` | Log in, get a JWT |
| GET | `/me` | Current user |
| PUT | `/me` | Update name/avatar/bio |
| PUT | `/password` | Change password |

**Workspaces** — `/api/workspaces`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create workspace |
| GET | `/` | List my workspaces |
| GET | `/:id` | Get one |
| PUT | `/:id` | Update settings |
| PATCH | `/:id/archive` / `/:id/unarchive` | Archive / restore |
| DELETE | `/:id` | Delete (owner only) |
| POST | `/:id/members` | Invite by email + role |
| PATCH | `/:id/members/:userId/role` | Change a member's role |
| DELETE | `/:id/members/:userId` | Remove a member |
| POST | `/:id/leave` | Leave (non-owners) |
| POST | `/:id/teams` | Create a team inside this workspace |
| GET | `/:id/teams` | List teams in this workspace |

**Teams** — `/api/teams`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create team |
| GET | `/` | List my teams |
| GET | `/:id` | Get one |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete (owner only) |
| POST | `/:id/members` | Add member by email |
| DELETE | `/:id/members/:userId` | Remove member (owner only) |

**Projects** — `/api/projects`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create project (needs `teamId`) |
| GET | `/?teamId=` or `?workspaceId=` | List projects |
| GET | `/:id` | Get one |
| PUT | `/:id` | Update |
| PATCH | `/:id/archive` / `/:id/unarchive` | Archive / restore |
| DELETE | `/:id` | Delete |
| POST | `/:id/duplicate` | Duplicate metadata |

**Boards** — `/api/boards`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create board (needs `teamId`) |
| GET | `/?teamId=` | List boards for a team |
| GET | `/:id` | Get one |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

**Tasks** — `/api/tasks`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create task (needs `boardId`) |
| GET | `/?boardId=` | List tasks for a board |
| GET | `/:id` | Get one |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |
| POST | `/:id/comments` | Add a comment (supports @mentions) |
| PATCH | `/reorder` | Bulk status/order update (drag-and-drop) |
| GET | `/team/:teamId` | Tasks with due dates across a team (calendar) |
| GET | `/team/:teamId/stats` | Aggregate stats across a team (analytics) |

**Notifications** — `/api/notifications`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List (most recent 50) |
| GET | `/unread-count` | Unread count |
| PATCH | `/:id/read` | Mark one read |
| PATCH | `/read-all` | Mark all read |
| DELETE | `/:id` | Delete one |

**Search** — `/api/search?q=` — global search across teams/boards/tasks/members,
scoped to the logged-in user's teams.

## Real-time events (Socket.io)

Client connects with `{ auth: { token } }`. Server joins the socket to
`user:<id>` automatically, and `board:<id>` on request (`joinBoard`/
`leaveBoard` events). Emitted events: `task:created`, `task:updated`,
`task:deleted`, `task:reordered`, `notification:new`.

## Known gaps / not implemented

- No file upload endpoint — `Task.attachments` and avatar fields store URLs
  only, there's no multipart upload or storage integration.
- No Google OAuth — email/password + JWT only.
- No AI features of any kind.
- No real billing/payment processing — `Workspace.billing.plan` is a label
  only, no Stripe (or similar) integration.