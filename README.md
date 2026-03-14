# CoreInventory — Inventory Management System

A full-stack, modular Inventory Management System (IMS) built to digitize and streamline all stock-related operations. Replaces manual registers and Excel sheets with a centralized, real-time, easy-to-use web application.

---

## 🎯 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, React Router v6, Axios, react-hot-toast, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | In-memory store (zero-config, seeds automatically) |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **Styling** | Custom CSS design system (no UI framework) |

---

## Features

- **Authentication** — Signup, Login, OTP-based password reset
- **Dashboard** — KPI cards (total products, low stock, out of stock, pending receipts/deliveries/transfers) + recent activity feed
- **Products** — Full CRUD with stock per location, low stock alerts, reorder points, SKU search
- **Receipts** — Create incoming stock orders, add/edit/remove products, validate to update stock
- **Deliveries** — Create outgoing stock orders, validate to deduct stock
- **Internal Transfers** — Move stock between any locations/warehouses
- **Stock Adjustments** — Fix physical count mismatches, auto-calculates and logs differences
- **Move History** — Complete stock ledger with filters by type, product, reference
- **Warehouses & Locations** — Multi-warehouse, multi-location support

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v16+ ([download](https://nodejs.org))
- **npm** v8+ (comes with Node.js)

### Step 1 — Clone the Repository
```bash
# Using git:
git clone https://github.com/kedarsoni04/CoreInventory.git
cd CoreInventory

# Or extract the zip file and navigate to it
cd CoreInventory
```

### Step 2 — Install Dependencies
```bash
# Install root-level development tools
npm install

# Install dependencies for both backend and frontend
npm run install:all
```

### Step 3 — Run in Development Mode
```bash
# Starts both backend (port 5000) and frontend (port 3002) concurrently
npm run dev
```

Then open your browser and navigate to: **http://localhost:3002**

### Alternative: Run Servers Separately

**Terminal 1 — Start Backend:**
```bash
cd backend
npm install
npm run dev
# Backend API running at http://localhost:5000
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm install
npm start
# Frontend running at http://localhost:3002
```

---

## 🔑 Demo Login Credentials

The database is automatically seeded with sample data on first startup.

```
Email:    admin@coreinventory.com
Password: admin123
```

### Seeded Sample Data Includes:
- **2 Warehouses:** Main Warehouse, Secondary Warehouse
- **3 Locations:** Main Store, Production Rack, Rack A
- **5 Products:** Steel Rods, Wooden Pallets, Aluminium Sheets, Plastic Crates, Iron Bolts
- **Stock Distribution:** Pre-populated across multiple locations
- **2 Sample Receipts:** 1 Done, 1 Ready to Validate
- **2 Sample Deliveries:** 1 Done, 1 Ready to Validate
- **Stock Ledger:** Complete transaction history

---

## 📡 API Endpoints Reference

### Authentication Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT token |
| `POST` | `/api/auth/reset-password` | Initiate OTP-based password reset |

### Product Management Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Retrieve all products with current stock levels |
| `GET` | `/api/products/:id` | Get details of a specific product |
| `POST` | `/api/products` | Create a new product |
| `PUT` | `/api/products/:id` | Update product information |
| `DELETE` | `/api/products/:id` | Delete a product |

### Receipts (Incoming Stock) Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/receipts` | List all receipts with pagination |
| `GET` | `/api/receipts/:id` | Get receipt details including items |
| `POST` | `/api/receipts` | Create a new receipt (header) |
| `PUT` | `/api/receipts/:id` | Update receipt header information |
| `DELETE` | `/api/receipts/:id` | Cancel a receipt |
| `POST` | `/api/receipts/:id/validate` | Validate receipt and update stock |
| `POST` | `/api/receipts/:id/items` | Add a product line to receipt |
| `PUT` | `/api/receipts/:id/items/:itemId` | Update line item quantity |
| `DELETE` | `/api/receipts/:id/items/:itemId` | Remove line item from receipt |

### Deliveries (Outgoing Stock) Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/deliveries` | List all deliveries with pagination |
| `GET` | `/api/deliveries/:id` | Get delivery details including items |
| `POST` | `/api/deliveries` | Create a new delivery (header) |
| `PUT` | `/api/deliveries/:id` | Update delivery header information |
| `DELETE` | `/api/deliveries/:id` | Cancel a delivery |
| `POST` | `/api/deliveries/:id/validate` | Validate delivery and deduct stock |
| `POST` | `/api/deliveries/:id/items` | Add a product line to delivery |
| `PUT` | `/api/deliveries/:id/items/:itemId` | Update line item quantity |
| `DELETE` | `/api/deliveries/:id/items/:itemId` | Remove line item from delivery |

### Stock Transfers Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transfers` | List all internal transfers |
| `GET` | `/api/transfers/:id` | Get transfer details |
| `POST` | `/api/transfers` | Create a new transfer |
| `PUT` | `/api/transfers/:id` | Update transfer information |
| `DELETE` | `/api/transfers/:id` | Cancel a transfer |
| `POST` | `/api/transfers/:id/validate` | Validate and execute transfer |

### Stock Adjustments Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/adjustments` | List all stock adjustments |
| `GET` | `/api/adjustments/:id` | Get adjustment details |
| `POST` | `/api/adjustments` | Create a new adjustment |
| `PUT` | `/api/adjustments/:id` | Update adjustment information |
| `DELETE` | `/api/adjustments/:id` | Cancel an adjustment |
| `POST` | `/api/adjustments/:id/validate` | Apply stock correction |

### Warehouse & Location Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/warehouses` | List all warehouses with their locations |
| `GET` | `/api/warehouses/:id` | Get specific warehouse details |
| `POST` | `/api/warehouses` | Create a new warehouse |
| `PUT` | `/api/warehouses/:id` | Update warehouse information |
| `DELETE` | `/api/warehouses/:id` | Delete a warehouse |
| `GET` | `/api/locations` | List all locations across all warehouses |
| `GET` | `/api/locations/:id` | Get specific location details |
| `POST` | `/api/locations` | Create a new location |
| `PUT` | `/api/locations/:id` | Update location information |
| `DELETE` | `/api/locations/:id` | Delete a location |

### Dashboard & Reporting Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Get dashboard KPIs and recent activity |
| `GET` | `/api/ledger` | Get complete stock movement ledger with filters |
| `GET` | `/api/ledger/export` | Export ledger to CSV/PDF |
| `GET` | `/api/reports/stock-summary` | Generate stock summary report |

---

## 📁 Project Structure

```
CoreInventory/
│
├── backend/
│   ├── server.js              # Express.js entry point and app initialization
│   ├── db.js                  # In-memory data store with seeding logic
│   ├── middleware.js          # JWT authentication and error handling middleware
│   ├── .env                   # Environment variables (JWT_SECRET, PORT, etc.)
│   │
│   └── routes/
│       ├── auth.js            # Authentication (signup, login, password reset)
│       ├── products.js        # Product CRUD and stock management
│       ├── receipts.js        # Incoming stock order management
│       ├── deliveries.js      # Outgoing stock order management
│       ├── transfers.js       # Internal stock transfers
│       ├── adjustments.js     # Stock adjustments and corrections
│       ├── warehouses.js      # Warehouse and location management
│       ├── ledger.js          # Stock movement history and reporting
│       └── dashboard.js       # Dashboard KPIs and analytics
│
├── frontend/
│   ├── public/
│   │   ├── index.html         # Main HTML entry point
│   │   └── favicon.ico        # Application icon
│   │
│   └── src/
│       ├── App.jsx                    # Main app component with routing
│       ├── index.css                  # Global styles and CSS design system
│       ├── App.css                    # Application-wide styling
│       │
│       ├── context/
│       │   └── AuthContext.jsx        # Authentication state management
│       │
│       ├── utils/
│       │   └── api.js                 # Axios API service configuration
│       │   └── helpers.js             # Utility functions
│       │   └── constants.js           # Application constants
│       │
│       ├── components/
│       │   ├── Layout.jsx             # Main layout with sidebar navigation
│       │   ├── Navbar.jsx             # Top navigation bar
│       │   ├── Sidebar.jsx            # Left sidebar menu
│       │   ├── ProtectedRoute.jsx     # Route protection component
│       │   └── LoadingSpinner.jsx     # Loading indicator
│       │
│       └── pages/
│           ├── LoginPage.jsx          # User login interface
│           ├── SignupPage.jsx         # User registration interface
│           ├── Dashboard.jsx          # Main dashboard with KPIs
│           ├── Products.jsx           # Product listing and management
│           ├── ProductForm.jsx        # Product create/edit form
│           ├── Receipts.jsx           # Receipt listing
│           ├── ReceiptDetail.jsx      # Receipt detail and line items
│           ├── Deliveries.jsx         # Delivery listing
│           ├── DeliveryDetail.jsx     # Delivery detail and line items
│           ├── Transfers.jsx          # Internal transfer management
│           ├── Adjustments.jsx        # Stock adjustment interface
│           ├── MoveHistory.jsx        # Stock movement ledger/history
│           ├── Warehouses.jsx         # Warehouse and location management
│           └── NotFoundPage.jsx       # 404 error page
│
├── package.json               # Root-level npm configuration with scripts
├── package-lock.json          # Dependency lock file
├── .gitignore                 # Git ignore patterns
└── README.md                  # This file
```

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3002

# Database (if migrating from in-memory)
DB_HOST=localhost
DB_PORT=27017
DB_NAME=coreinventory

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend Configuration

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=10000
```

---

## 🔄 Data Persistence & Production Notes

### Current Setup (Development)
- **In-memory store:** Data resets on server restart
- **Auto-seeding:** Sample data loads automatically on startup
- **Zero configuration:** No external database needed for testing

### For Production Deployment

**Database Migration:**
1. The current architecture is modular — route files require NO changes
2. Swap `db.js` with a database adapter:
   - **SQLite:** Best for small deployments
   - **PostgreSQL:** Recommended for scalability
   - **MongoDB:** Good for document-based approach
3. Update connection strings in `.env`

**Example: PostgreSQL Migration**
```javascript
// Replace db.js with PostgreSQL adapter
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
// Routes remain unchanged!
```

### Security Checklist
- [ ] Change `JWT_SECRET` in `.env` to a strong random value
- [ ] Enable HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Implement rate limiting on auth endpoints
- [ ] Use environment-specific CORS origins
- [ ] Enable database backups
- [ ] Implement logging and monitoring
- [ ] Regular security audits

### OTP Reset in Production
- **Current (Demo):** OTP returned in API response
- **Production Setup:** Integrate email service:
  - SendGrid
  - AWS SES
  - Nodemailer with Gmail/custom SMTP
  - Twilio (SMS-based OTP)

Example with Nodemailer:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

---

## 📦 NPM Scripts

### Root Level
```bash
npm run install:all      # Install dependencies for backend and frontend
npm run dev             # Run both servers concurrently
npm run build           # Build frontend for production
npm run start           # Start production server
```

### Backend
```bash
npm run dev             # Start with nodemon (auto-reload)
npm start               # Start production server
npm test                # Run tests
```

### Frontend
```bash
npm start               # Start development server
npm run build           # Build for production
npm test                # Run tests
npm run eject           # Eject from Create React App (use cautiously)
```

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t coreinventory:latest .
```

### Run Container
```bash
docker run -p 5000:5000 -p 3002:3002 \
  -e JWT_SECRET=your_secret \
  -e NODE_ENV=production \
  coreinventory:latest
```

### Docker Compose
```bash
docker-compose up -d
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Create Pull Request

---

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Dependencies Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
- Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL
- Check that backend is running on correct port

### JWT Token Errors
- Clear browser localStorage: `localStorage.clear()`
- Regenerate token by logging in again
- Check JWT_SECRET consistency between backend and frontend

---

## 📞 Support

For issues, questions, or contributions, please:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Contact: kedarsoni04@example.com

---

## 🎉 Version History

**v1.0.0** — Initial Release (2026-03-14)
- Full CRUD for all entities
- Multi-warehouse support
- Complete stock ledger
- Dashboard with KPIs
- JWT authentication

---

**Last Updated:** 2026-03-14 08:34:10
**Maintainer:** [@kedarsoni04](https://github.com/kedarsoni04)