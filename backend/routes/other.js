const express = require('express');
const { findAll, findOne, insert, update, remove, adjustStock, getProductStock, db, now } = require('../db');
const { authMiddleware } = require('../middleware');
const bcrypt = require('bcryptjs');

// ── Transfers ──────────────────────────────────────────────────────────────────
const transfersRouter = express.Router();
transfersRouter.use(authMiddleware);

transfersRouter.get('/', (req, res) => {
  const transfers = findAll('transfers').map(t => ({ ...t, items: findAll('transfer_items', { transfer_id: t.id }) }));
  transfers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(transfers);
});

transfersRouter.get('/:id', (req, res) => {
  const t = findOne('transfers', { id: req.params.id });
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json({ ...t, items: findAll('transfer_items', { transfer_id: t.id }) });
});

transfersRouter.post('/', (req, res) => {
  const { from_location_id, to_location_id, scheduled_date, notes, items } = req.body;
  const fromLoc = findOne('locations', { id: from_location_id });
  const toLoc = findOne('locations', { id: to_location_id });
  const count = findAll('transfers').length + 1;
  const reference = `TRF/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;
  const transfer = insert('transfers', {
    reference, from_location_id, to_location_id,
    from_location: fromLoc?.name || '', to_location: toLoc?.name || '',
    scheduled_date, notes: notes || '', status: 'Draft'
  });
  if (items?.length) {
    items.forEach(item => {
      const product = findOne('products', { id: item.product_id });
      insert('transfer_items', { transfer_id: transfer.id, product_id: item.product_id, product_name: product?.name || '', product_sku: product?.sku || '', qty: item.qty || 0, unit: product?.unit || 'pcs' });
    });
  }
  res.status(201).json({ ...transfer, items: findAll('transfer_items', { transfer_id: transfer.id }) });
});

transfersRouter.post('/:id/validate', (req, res) => {
  const transfer = findOne('transfers', { id: req.params.id });
  if (!transfer) return res.status(404).json({ error: 'Not found' });
  if (transfer.status === 'Done') return res.status(400).json({ error: 'Already done' });
  const items = findAll('transfer_items', { transfer_id: transfer.id });
  items.forEach(item => {
    adjustStock(item.product_id, transfer.from_location_id, -item.qty);
    adjustStock(item.product_id, transfer.to_location_id, item.qty);
    insert('stock_ledger', {
      type: 'transfer', reference: transfer.reference,
      product_id: item.product_id, product_name: item.product_name, product_sku: item.product_sku,
      from_location: transfer.from_location, to_location: transfer.to_location, qty: item.qty, unit: item.unit,
      date: new Date().toISOString().split('T')[0]
    });
  });
  const updated = update('transfers', transfer.id, { status: 'Done', done_date: now() });
  res.json({ ...updated, items });
});

// ── Adjustments ────────────────────────────────────────────────────────────────
const adjustmentsRouter = express.Router();
adjustmentsRouter.use(authMiddleware);

adjustmentsRouter.get('/', (req, res) => {
  const adjustments = findAll('adjustments').map(a => ({ ...a, items: findAll('adjustment_items', { adjustment_id: a.id }) }));
  adjustments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(adjustments);
});

adjustmentsRouter.post('/', (req, res) => {
  const { location_id, notes, items } = req.body;
  const loc = findOne('locations', { id: location_id });
  const count = findAll('adjustments').length + 1;
  const reference = `ADJ/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;
  const adj = insert('adjustments', { reference, location_id, location: loc?.name || '', notes: notes || '', status: 'Draft' });
  if (items?.length) {
    items.forEach(item => {
      const product = findOne('products', { id: item.product_id });
      const currentStock = db.stock.find(s => s.product_id === item.product_id && s.location_id === location_id);
      insert('adjustment_items', {
        adjustment_id: adj.id, product_id: item.product_id, product_name: product?.name || '', product_sku: product?.sku || '',
        qty_on_hand: currentStock?.quantity || 0, qty_counted: item.qty_counted || 0, unit: product?.unit || 'pcs'
      });
    });
  }
  res.status(201).json({ ...adj, items: findAll('adjustment_items', { adjustment_id: adj.id }) });
});

adjustmentsRouter.post('/:id/validate', (req, res) => {
  const adj = findOne('adjustments', { id: req.params.id });
  if (!adj) return res.status(404).json({ error: 'Not found' });
  const items = findAll('adjustment_items', { adjustment_id: adj.id });
  items.forEach(item => {
    const diff = item.qty_counted - item.qty_on_hand;
    adjustStock(item.product_id, adj.location_id, diff);
    insert('stock_ledger', {
      type: 'adjustment', reference: adj.reference,
      product_id: item.product_id, product_name: item.product_name, product_sku: item.product_sku,
      from_location: 'System', to_location: adj.location, qty: diff, unit: item.unit,
      date: new Date().toISOString().split('T')[0]
    });
  });
  const updated = update('adjustments', adj.id, { status: 'Done', done_date: now() });
  res.json({ ...updated, items });
});

// ── Warehouses & Locations ─────────────────────────────────────────────────────
const warehousesRouter = express.Router();
warehousesRouter.use(authMiddleware);

warehousesRouter.get('/', (req, res) => {
  const warehouses = findAll('warehouses').map(wh => ({
    ...wh, locations: findAll('locations', { warehouse_id: wh.id })
  }));
  res.json(warehouses);
});

warehousesRouter.post('/', (req, res) => {
  const wh = insert('warehouses', req.body);
  res.status(201).json(wh);
});

warehousesRouter.put('/:id', (req, res) => {
  const updated = update('warehouses', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Locations
const locationsRouter = express.Router();
locationsRouter.use(authMiddleware);

locationsRouter.get('/', (req, res) => {
  const { warehouse_id } = req.query;
  let locs = findAll('locations');
  if (warehouse_id) locs = locs.filter(l => l.warehouse_id === warehouse_id);
  res.json(locs);
});

locationsRouter.post('/', (req, res) => {
  const wh = findOne('warehouses', { id: req.body.warehouse_id });
  const loc = insert('locations', { ...req.body, warehouse: wh?.name || '' });
  res.status(201).json(loc);
});

// ── Stock Ledger ───────────────────────────────────────────────────────────────
const ledgerRouter = express.Router();
ledgerRouter.use(authMiddleware);

ledgerRouter.get('/', (req, res) => {
  const { product_id, type } = req.query;
  let entries = findAll('stock_ledger');
  if (product_id) entries = entries.filter(e => e.product_id === product_id);
  if (type) entries = entries.filter(e => e.type === type);
  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(entries);
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get('/', (req, res) => {
  const products = findAll('products');
  const receipts = findAll('receipts');
  const deliveries = findAll('deliveries');
  const transfers = findAll('transfers');

  const totalProducts = products.length;
  const lowStock = products.filter(p => {
    const stock = getProductStock(p.id);
    return stock <= (p.reorder_point || 0) && stock > 0;
  }).length;
  const outOfStock = products.filter(p => getProductStock(p.id) <= 0).length;
  const pendingReceipts = receipts.filter(r => r.status === 'Ready' || r.status === 'Draft').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'Ready' || d.status === 'Draft').length;
  const pendingTransfers = transfers.filter(t => t.status === 'Draft').length;

  // Recent activity
  const recentLedger = findAll('stock_ledger').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  res.json({
    kpis: { totalProducts, lowStock, outOfStock, pendingReceipts, pendingDeliveries, pendingTransfers },
    recentActivity: recentLedger
  });
});

// ── Users ──────────────────────────────────────────────────────────────────────
const usersRouter = express.Router();
usersRouter.use(authMiddleware);

usersRouter.get('/', (req, res) => {
  const users = findAll('users').map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }));
  res.json(users);
});

usersRouter.get('/:id', (req, res) => {
  const u = findOne('users', { id: req.params.id });
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at });
});

usersRouter.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
  if (findOne('users', { email })) return res.status(409).json({ error: 'Email already exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = insert('users', { name, email, password: hash, role: role || 'manager' });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

usersRouter.put('/:id', async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = findOne('users', { id: req.params.id });
  if (!user) return res.status(404).json({ error: 'Not found' });
  const updateData = { name, email, role };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  const updated = update('users', req.params.id, updateData);
  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
});

usersRouter.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const removed = remove('users', req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = { transfersRouter, adjustmentsRouter, warehousesRouter, locationsRouter, ledgerRouter, dashboardRouter, usersRouter };
