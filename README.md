# x_spend — MERN Expense Tracker

A full-stack expense tracking web app built with MongoDB, Express, React, and Node.js.

## Features

- **Dashboard** — Add income & expense transactions with amount, category, note, mode, and date
- **Details** — Full transaction table with search, filter by type/date, and pagination
- **Visual** — Charts showing income vs expense (pie), category breakdown (bar), monthly trend (line)
- **Recent Activity** — Chronological activity feed with emoji icons and search
- **Search** — Search transactions by category, description, or payment mode across all views
- **Auth** — JWT-based login & registration

---

## Project Structure

```
x_spend/
├── backend/
│   ├── models/
│   │   ├── User.js           # User schema with bcrypt hashing
│   │   └── Transaction.js    # Transaction schema with balance tracking
│   ├── routes/
│   │   ├── auth.js           # Register, login, /me
│   │   ├── transactions.js   # CRUD + search + pagination
│   │   └── summary.js        # Income/expense/balance summary + breakdowns
│   ├── middleware/
│   │   └── auth.js           # JWT protect middleware
│   ├── .env                  # Environment variables
│   └── server.js             # Express app + MongoDB connection
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx   # Auth state, login, logout
    │   ├── components/
    │   │   ├── Navbar.jsx         # Top navbar with active route
    │   │   └── TransactionForm.jsx # Reusable expense/income form
    │   ├── pages/
    │   │   ├── Dashboard.jsx      # Main dashboard (slide 1)
    │   │   ├── Details.jsx        # Transaction table (slide 2)
    │   │   ├── Visual.jsx         # Charts page
    │   │   ├── RecentActivity.jsx # Activity feed
    │   │   └── Login.jsx          # Login / Register
    │   ├── App.jsx               # Router setup
    │   ├── main.jsx              # Entry point
    │   └── index.css             # All styles (matches UI design exactly)
    └── vite.config.js
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on `mongodb://localhost:27017`
  - Install: https://www.mongodb.com/docs/manual/installation/
  - Start: `mongod` or `brew services start mongodb-community`

---

## Setup & Run

### 1. Backend

```bash
cd x_spend/backend
npm install
# Edit .env if needed (MONGO_URI, JWT_SECRET, PORT)
npm run dev        # development with nodemon
# or
npm start          # production
```

Backend runs at **http://localhost:5000**

### 2. Frontend

```bash
cd x_spend/frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

> The Vite dev server proxies `/api` requests to `http://localhost:5000` automatically.

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET  | `/api/auth/me` | Get current user (protected) |

### Transactions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List with search, filter, pagination |
| GET | `/api/transactions/recent` | Last 5 transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

**GET /api/transactions query params:**
- `search` — search category, description, mode
- `type` — `income` or `expense`
- `startDate` / `endDate` — ISO date strings (YYYY-MM-DD)
- `page` / `limit` — pagination

### Summary
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/summary` | Income, expense, balance, category & monthly breakdown |

---

## Design Reference

The UI matches the wireframes exactly:
- **Background**: Blue → pink gradient (top-left to bottom-right)
- **Cards**: Semi-transparent white with rounded corners
- **Expense button**: Dark red `#8B1C1C`
- **Income button**: Olive green `#4A7C1A`
- **Responsive**: Works on mobile, tablet, and desktop

---

## Production Build

```bash
cd frontend
npm run build       # outputs to frontend/dist/

# Serve frontend from backend in production:
# Uncomment in server.js: app.use(express.static('dist'))
```
