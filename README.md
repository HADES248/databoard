# ⬡ DataBoard — Scalable REST API with JWT Auth & RBAC

> Built for the **Primetrade.ai Backend Intern Assignment**
> A production-ready full-stack task management system with JWT authentication, role-based access control, and a React frontend.

---

## Live Links

| | URL |
|---|---|
| Frontend | https://databoard-psi.vercel.app |
| Backend API | https://databoard-bya0.onrender.com |
| Swagger Docs | https://databoard-bya0.onrender.com/api-docs |
| Health Check | https://databoard-bya0.onrender.com/health |

> **Note:** Render's free tier spins down after inactivity. The **first request may take 20–30 seconds** to cold-start. Subsequent requests are fast.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 |
| **Framework** | Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth** | JWT (access + refresh tokens) |
| **Password Hashing** | bcryptjs (salt rounds = 12) |
| **Validation** | express-validator |
| **Security** | Helmet, CORS, express-rate-limit, mongo-sanitize |
| **Logging** | Winston |
| **API Docs** | Swagger UI (OpenAPI 3.0) |
| **Frontend** | React.js, React Router , Axios, Vite |
| **Deployment** | Render (backend) + Vercel (frontend) |

---

## How to Test (For Interviewers)

### Option 1 — Use the Live Frontend (Easiest)

1. Visit **https://databoard-psi.vercel.app**
2. Click **"Create one"** to register a new account
3. Use any email + a password like `Password123`
4. You'll be logged in and can create, edit, delete tasks from the dashboard

**To test Admin features:**
- Register a second account
- Promote it to admin via Swagger (see Option 2 below)
- Log in with the admin account to see the Admin Panel with all users and platform stats

---

### Option 2 — Use Swagger UI (Best for API testing)

1. Visit **https://databoard-bya0.onrender.com/api-docs**
2. **Register** — click `POST /api/v1/auth/register` → Try it out:
```json
{
  "name": "Test User",
  "email": "interviewer@test.com",
  "password": "Password123"
}
```
3. Copy the `accessToken` from the response
4. Click **Authorize** (top right, button) → paste `Bearer <your_token>`
5. Now all protected endpoints are unlocked — test away

---

### Option 3 — Use Postman

1. Import the file `TaskFlow_API.postman_collection.json` from the repo
2. The **Register** and **Login** requests auto-save tokens to collection variables
3. All other requests automatically use the saved token — no manual copy-paste needed

---


## API Reference

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register new user, returns JWT tokens |
| `POST` | `/login` | ❌ | Login, returns JWT tokens |
| `POST` | `/refresh` | ❌ | Get new access token using refresh token |
| `POST` | `/logout` | ✅ | Revoke refresh token server-side |
| `GET` | `/me` | ✅ | Get own profile |
| `PATCH` | `/me` | ✅ | Update own name |

### Tasks — `/api/v1/tasks`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/` | ✅ | user/admin | List tasks — users see own, admins see all |
| `POST` | `/` | ✅ | user/admin | Create a new task |
| `GET` | `/:id` | ✅ | owner/admin | Get single task |
| `PATCH` | `/:id` | ✅ | owner/admin | Update task |
| `DELETE` | `/:id` | ✅ | owner/admin | Delete task |
| `GET` | `/stats` | ✅ | **admin only** | Platform-wide statistics |

### Users — `/api/v1/users` (Admin Only)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all users (paginated, searchable) |
| `GET` | `/:id` | Get single user |
| `PATCH` | `/:id` | Update user role or active status |
| `DELETE` | `/:id` | Delete user and all their tasks |

---

## Authentication Flow

```
POST /auth/register or /auth/login
         ↓
   { accessToken, refreshToken }
         ↓
All requests → Authorization: Bearer <accessToken>
         ↓
Token expires (15 min)?
         ↓
POST /auth/refresh → { accessToken }  ← automatic via Axios interceptor
         ↓
POST /auth/logout → refreshToken revoked in DB
```

- **Access token** — expires in 15 minutes
- **Refresh token** — expires in 7 days, stored in DB (can be revoked)
- **Passwords** — hashed with bcrypt, salt rounds = 12, never returned in any response

---

## Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt with salt=12 |
| JWT access tokens | Short-lived (15min), signed with secret |
| JWT refresh tokens | Long-lived (7d), stored in DB for revocation |
| Input sanitization | `express-mongo-sanitize` prevents NoSQL injection |
| Input validation | `express-validator` on all routes before DB touch |
| Rate limiting | 100 req/15min global; 20 req/15min on auth routes |
| Security headers | `helmet` sets X-Frame-Options, CSP, etc. |
| CORS | Explicit origin whitelist |
| Body size limit | 10kb max payload |
| Error masking | Stack traces hidden in production |
| Ownership checks | Users can only access their own tasks |

---

## Run Locally

### Prerequisites
- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas URI

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — fill in MONGODB_URI and JWT secrets
npm install
npm run dev
```

Runs at `http://localhost:5000`
Swagger docs at `http://localhost:5000/api-docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs at `http://localhost:3000`

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| API Docs | http://localhost:5000/api-docs |

---

## Environment Variables

```bash
# backend/.env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
JWT_SECRET=<random 48+ char string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<another random 48+ char string>
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend.vercel.app
```

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Scalability Notes

### Current Architecture
The app is **stateless** — JWT verification requires no shared session store. Multiple backend instances can run behind a load balancer with zero config changes.

### Horizontal Scaling
```
[Load Balancer: Nginx / AWS ALB]
        ↓
[API Instance 1] [API Instance 2] [API Instance N]
        ↓
[MongoDB Atlas — replica set, auto-sharding available]
```

### Caching Layer (Redis — ready to add)
High-frequency read endpoints are ideal candidates:
```
GET /tasks/stats     → cache 60s, invalidate on any task write
GET /auth/me         → cache 120s, invalidate on profile update
GET /users (admin)   → cache 30s
```

### Microservices Extraction Path
Current modules map cleanly to independent services:
```
auth-service    → handles JWT, login, register
task-service    → owns Task model, CRUD
user-service    → admin user management
api-gateway     → routing, rate limiting, CORS
```

### Observability
- Winston logs → extend with ELK Stack / Datadog / CloudWatch
- Add `/metrics` endpoint for Prometheus scraping
- Structured JSON logging already in place for log aggregation

---

## Author
Shivansh Singh
