# 🏨 HOS (Hotel Operating System) — Backend API Server

A modular, production-ready REST API backend for the **Hotel Operating System (HOS)** platform built with **Express.js**, **JWT authentication**, and **Role-Based Access Control (RBAC)**.

---

## 🚀 Quick Start (Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already prepared):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=hos_super_secret_jwt_key_development_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

Health check endpoint: `http://localhost:5000/api/health`

---

## 📂 Project Architecture

```
backend/
├── src/
│   ├── data/
│   │   └── mockData.js          # In-memory mock DB seed (replace with Prisma/PostgreSQL/MongoDB)
│   ├── middleware/
│   │   └── auth.js              # verifyToken and requireRole RBAC middleware
│   ├── routes/
│   │   ├── auth.routes.js       # /api/auth (login, register, me, logout)
│   │   ├── organizations.routes.js # /api/organizations (Super Admin)
│   │   ├── hotels.routes.js     # /api/hotels (Hotel Admin & Area Manager)
│   │   ├── reservations.routes.js # /api/reservations (Operations PMS & Guest)
│   │   ├── housekeeping.routes.js # /api/housekeeping (Room cleaning & status)
│   │   ├── pos.routes.js        # /api/pos/orders (Restaurant orders & billing)
│   │   └── ai.routes.js         # /api/ai/conversations (AI Receptionist chat)
│   └── server.js                # Main Express server entry point & CORS
├── .env.example
├── .env
├── package.json
└── README.md
```

---

## 🔐 Authentication & Roles

The API issues standard **JWT Bearer Tokens** in the response of `/api/auth/login` and `/api/auth/register`.

### Role Types:
1. `super_admin`: Platform owner (multi-tenant management).
2. `hotel_admin`: Chain / property owner (organization & hotels).
3. `area_manager`: Regional manager (multi-hotel oversight).
4. `hotel_manager`: Front desk & property operations.
5. `customer`: Guest booking & reservations.
6. `ai_receptionist`: AI Concierge agent.

---

## 🔌 Connecting to Database (Next Steps)

You can easily integrate **PostgreSQL (Prisma / TypeORM / Sequelize)** or **MongoDB (Mongoose)**:
1. Install ORM: `npm install prisma @prisma/client` or `npm install mongoose`
2. Replace mock data reads and writes in `src/routes/*.routes.js` with your DB query calls.
3. Hash passwords using `bcryptjs` on user registration.
