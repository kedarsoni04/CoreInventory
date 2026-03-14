require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { seedDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/deliveries', require('./routes/deliveries'));

const { transfersRouter, adjustmentsRouter, warehousesRouter, locationsRouter, ledgerRouter, dashboardRouter, usersRouter } = require('./routes/other');
app.use('/api/transfers', transfersRouter);
app.use('/api/adjustments', adjustmentsRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const { loadDatabase } = require('./db');

loadDatabase();
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CoreInventory API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
});
