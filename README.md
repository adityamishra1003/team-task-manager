# 🚀 Team Task Manager

A production-ready, full-stack team task management application built with React (Vite), Node.js + Express, MongoDB, and Tailwind CSS.

---

## 📸 Features

| Feature | Details |
|---|---|
| **Authentication** | JWT-based login/signup with bcrypt password hashing |
| **Role-Based Access** | Admin (full access) vs Member (view & update own tasks) |
| **Project Management** | Create, view, delete projects; add team members |
| **Task Management** | Create/edit/delete tasks with status, priority, due date, assignee |
| **Dashboard** | Stats: total, completed, in-progress, overdue tasks + progress bar |
| **Responsive UI** | Mobile-first design with collapsible sidebar |

---

## 🗂️ Project Structure

```
team-task-manager/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Auth logic (signup, login, me)
│   │   ├── projectController.js   # CRUD for projects
│   │   └── taskController.js      # CRUD for tasks + stats
│   ├── middleware/
│   │   ├── auth.js                # JWT protect, adminOnly
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema (name, email, password, role)
│   │   ├── Project.js             # Project schema (name, members, createdBy)
│   │   └── Task.js                # Task schema (title, status, assignedTo, etc.)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── utils/
│   │   └── generateToken.js       # JWT token generator
│   ├── server.js                  # Express entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js           # Axios instance + all API calls
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── components/
│   │   │   └── Layout.jsx         # Sidebar + nav layout
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   └── TasksPage.jsx
│   │   ├── App.jsx                # Routes + providers
│   │   ├── main.jsx
│   │   └── index.css              # Tailwind + custom components
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                   # Root: concurrent dev scripts
├── railway.json                   # Railway deployment config
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works) OR local MongoDB

### Step 1 — Clone & Install Dependencies

```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager

# Install all dependencies (root + backend + frontend)
npm run install:all
```

### Step 2 — Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/teamtaskmanager?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend (optional):**
```bash
cd frontend
cp .env.example .env
# Default uses Vite proxy, no changes needed for local dev
```

### Step 3 — Run Locally

From the **project root**:
```bash
npm run dev
```

This starts:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:5173

---

## 🔗 API Endpoints

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and get JWT |
| GET | `/api/auth/me` | Private | Get current user |
| GET | `/api/auth/users` | Private | List all users |

### Projects
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/projects` | Private | Get all projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Private | Get project by ID |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project + tasks |

### Tasks
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/tasks/stats` | Private | Dashboard stats |
| GET | `/api/tasks` | Private | Get all/filtered tasks |
| POST | `/api/tasks` | Admin | Create task |
| GET | `/api/tasks/:id` | Private | Get task by ID |
| PUT | `/api/tasks/:id` | Private | Update task (Admin: all; Member: status) |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

---

## 🛠️ Role-Based Access

| Action | Admin | Member |
|---|---|---|
| Create/delete projects | ✅ | ❌ |
| Add team members to project | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Assign tasks to members | ✅ | ❌ |
| View all tasks | ✅ | ❌ |
| View assigned tasks | ✅ | ✅ |
| Update task status | ✅ | ✅ (own tasks only) |

---

## 🚂 Deploy to Railway

### Backend Deployment

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select `team-task-manager` repo
4. Add environment variables in Railway dashboard:
   ```
   PORT=5000
   MONGO_URI=<your MongoDB Atlas URI>
   JWT_SECRET=<your secret>
   NODE_ENV=production
   CLIENT_URL=<your frontend URL>
   ```
5. Railway auto-detects Node.js and deploys using `railway.json`

### Frontend Deployment (Vercel/Netlify)

```bash
cd frontend
npm run build
# Upload dist/ to Vercel or Netlify
```

Set environment variable:
```
VITE_API_URL=https://your-railway-backend-url.railway.app/api
```

---

## 🌱 Seed Demo Data (Optional)

Create an admin user via signup with role: `admin`, then log in and create projects/tasks through the UI.

Or use the API directly:
```bash
# Create admin user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@demo.com","password":"password123","role":"admin"}'

# Create member user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Team Member","email":"member@demo.com","password":"password123","role":"member"}'
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Tailwind CSS v3, DM Sans font |
| State | React Context API |
| HTTP Client | Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Validation | express-validator |
| Deployment | Railway (backend), Vercel (frontend) |

---

## 📝 License

MIT © 2024
