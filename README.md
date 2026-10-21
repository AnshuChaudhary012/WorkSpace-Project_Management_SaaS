# WorkSpace — Modern Project Management SaaS

A full-stack, production-minded project management application inspired by Linear and Trello. Built with **React 18, Vite, Tailwind CSS, Node.js, Express, and MongoDB / Mongoose**.

---
# Live link :- https://work-space-project-management-saa-s.vercel.app

## 🌟 Key Features

* **Secure Authentication & RBAC**:
  * Registration, login, session restoration via `/api/auth/me`, and logout.
  * Bcrypt salted password hashing; passwords never stored in plaintext or exposed over API.
  * Multi-tier Role-Based Access Control (**Owner**, **Admin**, **Member**).
  * Strict cross-tenant isolation: unauthorized users cannot view or manipulate private workspace resources.
* **Workspaces & Project Management**:
  * Create, switch, and manage workspaces.
  * Create and archive projects with real-time percentage progress meters.
* **Interactive Kanban Board & List Views**:
  * Dual-view project workspace: toggle between a Linear-style **Kanban Board** and a structured **List View**.
  * Native HTML5 drag-and-drop to move tasks seamlessly between status columns (`To Do`, `In Progress`, `In Review`, `Done`).
  * Instant optimistic UI updates with automatic server rollback on failure.
* **Task Management & Collaboration**:
  * Priority categorization (`Urgent`, `High`, `Medium`, `Low`).
  * Due dates with automated deadline tracking.
  * Task assignment to verified workspace members with visual avatar badges.
  * Threaded discussions and comments on tasks with timestamps and author attribution.
* **Dashboard & Analytics**:
  * Live status distribution metrics (`To Do`, `In Progress`, `In Review`, `Done`).
  * Automated overdue task alert list (`dueDate < today`).
  * Upcoming deadlines overview (next 7 days).
* **Team Members & Permissions**:
  * Invite members by email with role assignment (`Admin` or `Member`).
  * Promote, demote, or remove team members (with Owner role protection).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router v6, Lucide Icons |
| **Backend** | Node.js (v24), Express.js, MongoDB, Mongoose 8 |
| **Security** | JWT (JSON Web Tokens), Bcrypt.js, RBAC Middleware, Input Sanitization |
| **Testing** | Node.js Test Runner (`node:test`), Supertest |

---

## 📂 Project Architecture

```
WorkSpace — Project management SaaS/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # AppLayout, Sidebar, Topbar, TaskModal, TaskDetailModal, WorkspaceModal, ProjectModal
│   │   ├── context/            # AuthContext (user session, persistence, login, register, logout)
│   │   ├── pages/              # LoginPage, RegisterPage, DashboardPage, ProjectsPage, ProjectDetailPage, MembersPage, SettingsPage
│   │   ├── services/           # api.js, authService, workspaceService, projectService, taskService, memberService, commentService, dashboardService
│   │   └── App.jsx             # React Router route tree
│   ├── tailwind.config.js      # Custom theme tokens & glassmorphism
│   ├── vite.config.js          # Vite config with /api proxy to Express
│   └── package.json
├── server/                     # Backend Express + MongoDB application
│   ├── src/
│   │   ├── config/             # db.js (MongoDB connection with standalone dev fallback)
│   │   ├── controllers/        # auth, workspace, project, task, member, comment, dashboard
│   │   ├── middleware/         # authMiddleware, rbacMiddleware, validate, errorHandler
│   │   ├── models/             # User, Workspace, Membership, Project, Task, Comment
│   │   ├── routes/             # authRoutes, workspaceRoutes, projectRoutes, taskRoutes, commentRoutes
│   │   ├── utils/              # token.js (JWT sign & verify)
│   │   ├── app.js              # Express app setup with CORS, JSON body parser
│   │   └── server.js           # Server listener with graceful shutdown
│   ├── tests/                  # Automated API & E2E tests
│   │   ├── auth.test.js        # Authentication & validation tests
│   │   ├── core.test.js        # Workspace, project, task & cross-tenant security tests
│   │   └── e2e.test.js         # Master 10-step full lifecycle test
│   └── package.json
├── .env.example                # Documented environment variables template
├── .gitignore
├── README.md
└── package.json                # Root orchestration scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js**: v18 or higher (tested on Node v24)
* **MongoDB**: A running local MongoDB service (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.
  *(Note: If MongoDB is offline, the server automatically runs in a standalone in-memory development mode for instant zero-configuration testing!)*

### 2. Environment Configuration
Backend `.env` (located in `server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/workspace_saas
JWT_SECRET=workspace_dev_secret_key_2026_super_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Running the Backend Server
```powershell
cd server
npm.cmd install
npm.cmd run dev
```
The backend API starts on **http://localhost:5000** (Health check: `http://localhost:5000/api/health`).

### 4. Running the Frontend Client
In a new terminal:
```powershell
cd client
npm.cmd install
npm.cmd run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Automated Testing

WorkSpace includes 12 automated API and integration tests covering:
1. User registration with email normalization & password hashing
2. Duplicate email rejection (`409 Conflict`)
3. Request body sanitization and input validation (`400 Bad Request`)
4. Login authentication & JWT generation
5. Wrong password rejection (`401 Unauthorized`)
6. Current profile retrieval with Bearer token (`GET /api/auth/me`)
7. Protected endpoint rejection without token (`401 Unauthorized`)
8. Workspace CRUD & owner membership assignment
9. Cross-tenant access denial (`403 Forbidden`)
10. Project creation & completion progress calculation
11. Task status lifecycle updates (`todo` -> `in_progress` -> `done`)
12. **Master 10-Step E2E Lifecycle Test**: Register User A -> Login -> Create Workspace & Project -> Invite User C & Assign Task -> Update Status & Due Date -> Add Task Comment -> Verify Dashboard Updates -> Logout & Re-login -> Verify Persistence -> Verify User B Access Denial (403).

To run the complete test suite:
```powershell
cd server
npm.cmd test
```

---

## 🛡️ Security Architecture

* **Never Plaintext**: Passwords are encrypted using `bcryptjs` with salt rounds before being stored.
* **No Leaked Hashes**: Password hashes have `select: false` on the User schema and are stripped from API outputs.
* **Anti-IDOR Protection**: Every request to `/api/workspaces/:id`, `/api/projects/:id`, and `/api/tasks/:id` validates workspace membership before returning or altering data.
* **Safe Error Handling**: Internal stack traces are suppressed in production; client receives clean, structured error responses.
