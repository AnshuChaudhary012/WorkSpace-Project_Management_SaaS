# WorkSpace — Project Management SaaS

A modern full-stack project management application inspired by Trello and Linear.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Security & Auth**: JWT (JSON Web Tokens), Bcrypt.js salted password hashing, RBAC middleware
- **Testing**: Node.js test runner (`node:test`), Supertest

---

## 📂 Project Structure

```
WorkSpace — Project management SaaS/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Reusable UI components & ProtectedRoute
│   │   ├── context/            # AuthContext (session, login, register, logout)
│   │   ├── pages/              # LoginPage, RegisterPage, DashboardPage
│   │   ├── services/           # api.js fetch client with Bearer auth injection
│   │   └── App.jsx             # Router definition
│   └── package.json
├── server/                     # Backend Express + MongoDB application
│   ├── src/
│   │   ├── config/             # Database connection (db.js)
│   │   ├── controllers/        # authController
│   │   ├── middleware/         # authMiddleware, validate, errorHandler
│   │   ├── models/             # User, Workspace, Membership
│   │   ├── routes/             # authRoutes
│   │   ├── utils/              # token generator & verifier
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── tests/                  # Automated API test suite
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: A running local MongoDB instance (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.

### 2. Backend Setup
1. Open terminal in `server/`:
   ```bash
   cd server
   npm install
   ```
2. Configure `.env` (a template is pre-populated):
   ```bash
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/workspace_saas
   JWT_SECRET=workspace_dev_secret_key_2026_super_secure
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```
3. Run backend automated tests:
   ```bash
   npm test
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal in `client/`:
   ```bash
   cd client
   npm install
   ```
2. Start Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing

The backend includes automated integration tests covering:
- User registration (`POST /api/auth/register`)
- Duplicate email rejection (`409 Conflict`)
- Field-level validation (`400 Bad Request`)
- Authentication (`POST /api/auth/login`)
- Incorrect credentials rejection (`401 Unauthorized`)
- Profile retrieval with token (`GET /api/auth/me`)
- Missing/invalid token rejection (`401 Unauthorized`)

To run the tests:
```bash
cd server
npm test
```
