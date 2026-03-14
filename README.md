# CoreInventory — Inventory Management System

A full-stack, modular Inventory Management System (IMS) built to digitize and streamline all stock-related operations. Replaces manual registers and Excel sheets with a centralized, real-time, easy-to-use web application.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, React Router v6, Axios, react-hot-toast, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | In-memory store (zero-config, seeds automatically) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Styling** | Custom CSS design system (no UI framework) |

---

## Features

- **Authentication** — Signup, Login, **OTP-based password reset via email**
- **Dashboard** — KPI cards (total products, low stock, out of stock, pending receipts/deliveries/transfers) + recent activity feed
- **Products** — Full CRUD with stock per location, low stock alerts, reorder points, SKU search
- **Receipts** — Create incoming stock orders, add/edit/remove products, validate to update stock
- **Deliveries** — Create outgoing stock orders, validate to deduct stock
- **Internal Transfers** — Move stock between any locations/warehouses
- **Stock Adjustments** — Fix physical count mismatches, auto-calculates and logs differences
- **Move History** — Complete stock ledger with filters by type, product, reference
- **Warehouses & Locations** — Multi-warehouse, multi-location support
- **Remote Access** — Deploy and access from anywhere (configured for remote IP connectivity)

---

## Quick Start

### Prerequisites
- **Node.js** v16+ ([download](https://nodejs.org))
- **npm** v8+

### Step 1 — Clone / Download
```bash
# If using git:
git clone <repo-url>
cd coreinventory

# Or extract the zip and navigate to the folder
cd coreinventory
```

### Step 2 — Install Dependencies
```bash
# Install root dev tools
npm install

# Install backend + frontend dependencies
npm run install:all
```

### Step 3 — Run (Development Mode)
```bash
# Starts both backend (port 5000) and frontend (port 3002) concurrently
npm run dev
```

Then open: **http://localhost:3002**

### Alternative: Run servers separately

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
# App running at http://localhost:3002
```

---

## Demo Login

The database is automatically seeded with sample data on startup.

```
Email:    admin@coreinventory.com
Password: admin123
```

### Seeded Data Includes:
- 2 Warehouses (Main Warehouse, Secondary Warehouse)
- 3 Locations (Main Store, Production Rack, Rack A)
- 5 Products (Steel Rods, Wooden Pallets, Aluminium Sheets, Plastic Crates, Iron Bolts)
- Stock distributed across locations
- 2 sample Receipts (1 Done, 1 Ready)
- 2 sample Deliveries (1 Done, 1 Ready)
- Stock ledger entries

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/reset-password` | OTP reset (demo returns OTP) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products with stock |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List receipts |
| POST | `/api/receipts` | Create receipt |
| PUT | `/api/receipts/:id` | Update header |
| POST | `/api/receipts/:id/validate` | Validate (updates stock) |
| POST | `/api/receipts/:id/items` | Add product line |
| PUT | `/api/receipts/:id/items/:itemId` | Update line qty |
| DELETE | `/api/receipts/:id/items/:itemId` | Remove line |

### Deliveries
| Same structure as Receipts | `/api/deliveries/...` | Deducts stock on validate |

### Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transfers` | List transfers |
| POST | `/api/transfers` | Create transfer |
| POST | `/api/transfers/:id/validate` | Move stock between locations |

### Adjustments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adjustments` | List adjustments |
| POST | `/api/adjustments` | Create adjustment |
| POST | `/api/adjustments/:id/validate` | Apply stock correction |

### Warehouses & Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/warehouses` | List warehouses with locations |
| POST | `/api/warehouses` | Create warehouse |
| GET | `/api/locations` | List all locations |
| POST | `/api/locations` | Create location |

### Dashboard & Ledger
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | KPIs + recent activity |
| GET | `/api/ledger` | Full stock movement log |

---

## Project Structure

```
coreinventory/
├── backend/
│   ├── server.js          # Express entry point
│   ├── db.js              # In-memory data store + seed
│   ├── middleware.js       # JWT auth middleware
│   └── routes/
│       ├── auth.js        # Login, signup, reset
│       ├── products.js    # Product CRUD
│       ├── receipts.js    # Incoming stock
│       ├── deliveries.js  # Outgoing stock
│       └── other.js       # Transfers, adjustments, warehouses, locations, ledger, dashboard
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx                    # Router + providers
│       ├── index.css                  # Full design system
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── utils/
│       │   └── api.js                 # Axios API service
│       ├── components/
│       │   └── Layout.jsx             # Sidebar + shell
│       └── pages/
│           ├── LoginPage.jsx
│           ├── Dashboard.jsx
│           ├── Products.jsx
│           ├── Receipts.jsx
│           ├── ReceiptDetail.jsx
│           ├── Deliveries.jsx
│           ├── DeliveryDetail.jsx
│           ├── Transfers.jsx
│           ├── Adjustments.jsx
│           ├── MoveHistory.jsx
│           └── Warehouses.jsx
│
├── package.json           # Root scripts (concurrently)
└── README.md
```

---

## Notes

- **Data persistence**: The in-memory store resets on server restart. For production, swap `db.js` with a SQLite/PostgreSQL adapter — the route files need no changes.
- **OTP reset**: In demo mode the API returns the OTP in the response. In production, integrate SendGrid/Nodemailer to email it.
- **JWT secret**: Change `JWT_SECRET` in `backend/.env` before deploying.
