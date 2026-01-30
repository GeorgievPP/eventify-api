# 🎫 Eventify Backend API

> RESTful API for Eventify ticketing platform - Node.js, Express, MongoDB

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)

**Live API:** [https://eventify-api-wfdr.onrender.com](https://eventify-api-wfdr.onrender.com)

---

## ✨ Features

- 🔐 JWT authentication & RBAC (User/Poweruser/Admin)
- 📦 Event CRUD with image uploads
- 💳 Order management with history tracking
- 💬 Comments system with likes
- ⭐ Event ratings (1-5 stars)
- 🔒 Security: Helmet, CORS, rate limiting, bcrypt
- 📊 Order status tracking (pending → paid → completed)
- 📜 Full audit trail (EventHistory, OrderHistory, CommentHistory)
- 🎫 20+ demo events across 6 genres

---

## 🛠️ Tech Stack

- **Node.js 20** + **Express 4.21**
- **MongoDB 8** + **Mongoose 8**
- **JWT** + **bcryptjs**
- **Multer** (file uploads)

---

## 🚀 Quick Start

### 1. Install

```bash
git clone https://github.com/your-username/eventify-backend.git
cd eventify-backend
npm install
```

### 2. Configure `.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventify
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1d
```

### 3. Start

```bash
npm run dev  # Development with nodemon
npm start    # Production
```

Server: `http://localhost:5000`

### 4. Seed Database (Optional)

```bash
npm run seed  # Creates demo data
```

**Creates:**
- 4 users (admin, user, poweruser, deleted user)
- 20 events across multiple genres
- Orders with various statuses
- Comments with likes
- Event ratings
- History entries for all actions

**Demo Credentials:**
```
Admin:      admin@example.com  / admin123
User:       user1@example.com  / user123
Poweruser:  power@example.com  / power123
```

---

## 📁 Project Structure

```
src/
├── config/          # Database, logger, roles
├── models/          # User, Event, Order, Comment, Rating
│                    # EventHistory, OrderHistory, CommentHistory
├── controllers/     # Route handlers
│   ├── authController.js
│   ├── eventController.js
│   ├── commentController.js
│   ├── orderController.js
│   ├── ratingController.js
│   └── userController.js
├── routes/          # Express routes
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── commentRoutes.js
│   ├── orderRoutes.js
│   └── userRoutes.js
├── middleware/      # Auth, RBAC, errors
│   ├── auth.js
│   ├── checkRole.js
│   └── errorHandler.js
└── utils/           # Helpers
    ├── calculateOrderTotal.js
    ├── permissions.js
    ├── rating.js
    └── response.js

seeds/
└── seed.js          # Demo data script

uploads/             # Uploaded images
server.js            # Entry point
```

---

## 🔐 Authentication

**JWT Token Payload:**
```json
{
  "userId": "...",
  "email": "user@example.com",
  "role": "user"
}
```

**Role Hierarchy:**
```
admin → poweruser → user
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | - | - | Register |
| POST | `/api/auth/login` | - | - | Login |
| GET | `/api/auth/me` | ✅ | - | Current user |
| GET | `/api/events` | - | - | List events |
| GET | `/api/events/:id` | - | - | Get event |
| POST | `/api/events` | ✅ | Staff+ | Create event |
| PUT | `/api/events/:id` | ✅ | Staff+ | Update event |
| POST | `/api/events/:id/rate` | ✅ | - | Rate event |
| GET | `/api/events/:id/comments` | - | - | Get comments |
| POST | `/api/events/:id/comments` | ✅ | - | Add comment |
| PATCH | `/api/comments/:id/like` | ✅ | - | Toggle like |
| POST | `/api/orders` | ✅ | - | Create order |
| GET | `/api/orders/my-orders` | ✅ | - | User orders |
| GET | `/api/orders/:id` | ✅ | - | Get order |
| GET | `/api/orders/:id/history` | ✅ | - | Order history |
| GET | `/api/admin/users` | ✅ | Admin | List users |
| PUT | `/api/admin/users/:id/role` | ✅ | Admin | Update role |
| GET | `/api/admin/dashboard/stats` | ✅ | Staff+ | Stats |

**Response Format:**
```json
// Success: { "success": true, "data": {...} }
// Error:   { "success": false, "error": {...} }
```

---

## 🗄️ Database Models

**User:** email (unique), password (hashed), role (user/poweruser/admin), isDeleted  
**Event:** title, description, genre, eventDate, location, venue, price, totalTickets, availableTickets, imageUrl, owner, isDeleted  
**EventHistory:** eventId, userId, action, before/after  
**Order:** userId, items[], totalPrice, status (pending/processing/paid/completed/cancelled/refunded)  
**OrderHistory:** orderId, userId, action, before/after, fromStatus/toStatus  
**Comment:** eventId, userId, content, likes[], isDeleted  
**CommentHistory:** commentId, userId, action, before/after  
**Rating:** eventId, userId, value (1-5)

---

## 🌐 Deployment

### Production Stack

```
Render (Backend)
  ├─ Plan: Free (512MB RAM, 0.1 CPU)
  ├─ URL: https://eventify-api-wfdr.onrender.com
  └─ Spins down after 15min → 30-50s cold start

MongoDB Atlas (Database)
  └─ Plan: Free (M0, 512MB)
```

### Deploy to Render

1. **Create Web Service** on [render.com](https://render.com)
2. **Build:** `npm install` | **Start:** `npm start`
3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eventify
   JWT_SECRET=your-secret-key
   CORS_ORIGIN=https://eventify-one-eta.vercel.app
   ```

### MongoDB Atlas

1. Create cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Database Access → Create user
3. Network Access → `0.0.0.0/0`
4. Get connection string → Add to Render env

---

## 🔒 Security

- ✅ JWT tokens (7 day expiration)
- ✅ bcrypt password hashing (10 rounds)
- ✅ Helmet security headers
- ✅ CORS whitelist
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation
- ✅ File upload limits (5MB, JPEG/PNG/WebP)

---

## 📸 File Uploads

```http
POST /api/events
Content-Type: multipart/form-data
Authorization: Bearer <token>

image: [file]  # Max 5MB, JPEG/PNG/WebP
title: ...
description: ...
```

Storage: `uploads/events/event-{timestamp}-{random}.ext`

---

## 🔧 Troubleshooting

**MongoDB connection failed:**
```bash
sudo systemctl start mongod
# Check: MONGODB_URI=mongodb://localhost:27017/eventify
```

**Port in use:**
```bash
lsof -i :5000
kill -9 <PID>
```

**JWT invalid:**
- Check `JWT_SECRET` in .env
- Login again with fresh token

**File upload fails:**
- Check `uploads/` directory exists
- Verify permissions: `chmod 755 uploads/`

---

## 🤝 Contributing

```bash
git checkout -b feature/amazing
git commit -m 'feat: add feature'
git push origin feature/amazing
```

**Commit Convention:** `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`

---

## 📄 License

MIT License

---

## 🗺️ Roadmap

**Coming Soon:**
- [ ] WebSocket real-time updates
- [ ] Payment gateway (Stripe)
- [ ] Email notifications
- [ ] Redis caching

**Completed:**
- [x] JWT auth + RBAC
- [x] Order history tracking
- [x] Comments & ratings
- [x] Production deployment

---

**Built with ❤️ using Node.js**

*Deployed on Render & MongoDB Atlas*

Last updated: January 2026