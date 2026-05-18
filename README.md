# 📚 LibraryHub — Full Stack Library Management System

A complete **MERN Stack** Library Management System with a modern, responsive UI. Built as a realistic student-level project with clean code, understandable architecture, and impressive features.

---

## ✨ Features

### User Side
- 🔐 JWT Authentication (Login / Register / Forgot Password)
- 📖 Browse & search books with filters
- 📂 Filter by category, availability, rating, popularity
- 🏠 Borrow & return books (max 3 at a time, 14-day period)
- ❤️ Wishlist / Favorites
- 📋 Borrow history with fine tracking
- 🔔 Real-time notifications (Socket.io)
- 👤 User profile with avatar upload
- 🌙 Dark / Light mode

### Admin Side
- 📊 Dashboard with charts (Recharts)
- ➕ Add / Edit / Delete books
- 📷 Book cover image & PDF upload (Multer)
- 🏷️ Manage categories (icon + color picker)
- 👥 Manage users (activate / deactivate)
- 📑 All borrow records with status tracking
- 💰 Fine management (₹5/day for late returns)
- 📈 Monthly borrow chart + category pie chart
- 🔁 Auto-update overdue records

### Extra Features
- QR Code generation for each book
- PDF ebook upload & download
- Book ratings & reviews (only for users who borrowed)
- Pagination everywhere
- Mobile responsive sidebar navigation
- Loading skeletons
- Toast notifications

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Routing | React Router DOM v6 |
| State | Context API |
| HTTP | Axios |
| Icons | React Icons (HeroIcons) |
| Charts | Recharts |
| Real-time | Socket.io |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Email | Nodemailer |
| QR Code | qrcode npm package |

---

## 📁 Project Structure

```
library-management/
├── client/                      # React frontend (Vite)
│   └── src/
│       ├── api/                 # Axios instance
│       ├── assets/
│       ├── components/
│       │   └── books/           # BookCard, etc.
│       ├── context/             # AuthContext, ThemeContext
│       ├── hooks/               # Custom hooks (if any)
│       ├── layouts/             # UserLayout, AdminLayout
│       ├── pages/
│       │   ├── auth/            # Login, Register, ForgotPassword, ResetPassword
│       │   ├── user/            # Home, Books, BookDetail, MyBooks, Wishlist, Profile, Notifications
│       │   └── admin/           # Dashboard, Books, Users, Categories, Borrows
│       └── utils/
│
└── server/                      # Node.js + Express backend
    ├── config/                  # db.js (MongoDB connection)
    ├── controllers/             # Business logic
    ├── middleware/              # Auth, Upload middleware
    ├── models/                  # Mongoose schemas
    ├── routes/                  # Express routes
    ├── uploads/                 # File storage (gitignored)
    └── utils/                   # sendEmail helper
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (free tier works fine)
- Gmail account for email features (optional)

---

### Step 1 — Clone the project

```bash
git clone <your-repo-url>
cd library-management
```

---

### Step 2 — Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/libraryDB?retryWrites=true&w=majority
JWT_SECRET=make_this_long_and_random_abc123xyz
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM=LibraryHub <your.email@gmail.com>

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend:

```bash
npm run dev     # development (nodemon)
# or
npm start       # production
```

Backend runs on: `http://localhost:5000`

---

### Step 3 — Setup the Frontend

```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` folder:

```env
VITE_SERVER_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

### Step 4 — Create Admin Account

There's no admin registration UI (intentional). Create an admin manually:

**Option A — MongoDB Atlas UI**
1. Go to your Atlas cluster → Browse Collections → `users`
2. Find your registered user and change `role` from `"user"` to `"admin"`

**Option B — MongoDB Compass**
- Connect with your MONGO_URI and update the role field

**Option C — One-time seed script** (run once, then delete):

```js
// server/seed-admin.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await User.create({
    name: "Admin",
    email: "admin@library.com",
    password: "admin123",
    role: "admin",
  });
  console.log("Admin created!");
  process.exit();
});
```

```bash
node seed-admin.js
```

---

## 🌐 Connecting MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster (M0)
3. In Security → Database Access: Add a user with password
4. In Security → Network Access: Add `0.0.0.0/0` (allows all IPs, fine for dev)
5. Connect → Connect your application → Copy the connection string
6. Replace `<username>` and `<password>` in your `.env` MONGO_URI

---

## 📧 Setting Up Gmail for Password Reset

1. Go to your Google Account → Security
2. Enable **2-Step Verification**
3. Then go to Security → **App Passwords**
4. Generate a password for "Mail" → "Other (Custom name)"
5. Use that 16-character password as `EMAIL_PASS` in your `.env`

---

## 🌍 Deploying the Project

### Deploy Backend (Render — free)

1. Push your `server/` folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Build Command: `npm install`
5. Start Command: `node index.js`
6. Add all `.env` variables in Render's Environment tab
7. Deploy!

### Deploy Frontend (Vercel — free)

1. Push your `client/` folder to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Framework preset: Vite
4. Add environment variable: `VITE_SERVER_URL=https://your-render-backend.onrender.com`
5. In `vite.config.js`, update the proxy target if needed, or switch to full URL in production
6. Deploy!

### Important for Production
Update `client/src/api/axios.js` base URL for production:
```js
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});
```

---

## 📌 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/me` | Get current user |

### Books
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/books` | Public | Get all books (filter/search/paginate) |
| GET | `/api/books/featured` | Public | Popular books |
| GET | `/api/books/:id` | Public | Single book detail |
| POST | `/api/books` | Admin | Add book |
| PUT | `/api/books/:id` | Admin | Update book |
| DELETE | `/api/books/:id` | Admin | Delete book |

### Borrow
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/borrow/:bookId` | User | Borrow a book |
| PUT | `/api/borrow/return/:recordId` | User/Admin | Return a book |
| GET | `/api/borrow/my-history` | User | Borrow history |
| GET | `/api/borrow/all` | Admin | All borrow records |
| PUT | `/api/borrow/pay-fine/:recordId` | Admin | Mark fine paid |

### Users
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile` | User | Get profile |
| PUT | `/api/users/profile` | User | Update profile |
| PUT | `/api/users/change-password` | User | Change password |
| POST | `/api/users/wishlist/:bookId` | User | Toggle wishlist |
| GET | `/api/users` | Admin | All users |
| PUT | `/api/users/:id/status` | Admin | Toggle active status |

### Others
- `GET /api/categories` — All categories
- `POST /api/categories` — Add category (admin)
- `GET /api/reviews/:bookId` — Book reviews
- `POST /api/reviews/:bookId` — Add review
- `GET /api/notifications` — My notifications
- `GET /api/admin/stats` — Dashboard stats (admin)

---

## 🤝 Contributing

This is a student project — feel free to fork, improve, and build on top of it!

Some ideas to extend it:
- AI book recommendations using OpenAI API
- Export borrow reports as CSV/PDF
- Email reminders for due dates (cron job)
- Book reservation system
- Multiple library branches
- Barcode scanning (mobile)

---

## 📄 License

MIT License — free to use for learning and personal projects.

---

Made with ❤️ using the MERN Stack
