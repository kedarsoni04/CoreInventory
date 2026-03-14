const express = require('express');
const { findAll, findOne, insert, update, adjustStock, getProductStock, db, now } = require('../db');
const { authMiddleware } = require('../middleware');
const router = express.Router();

router.use(authMiddleware);

function enrichReceipt(r) {
  const items = findAll('receipt_items', { receipt_id: r.id });
  return { ...r, items };
}

// GET /api/receipts
router.get('/', (req, res) => {
  const { status, warehouse_id } = req.query;
  let receipts = findAll('receipts');
  if (status) receipts = receipts.filter(r => r.status === status);
  if (warehouse_id) receipts = receipts.filter(r => r.warehouse_id === warehouse_id);
  receipts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(receipts.map(enrichReceipt));
});

// GET /api/receipts/:id
router.get('/:id', (req, res) => {
  const r = findOne('receipts', { id: req.params.id });
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(enrichReceipt(r));
});

// POST /api/receipts
router.post('/', (req, res) => {
  const { supplier, warehouse_id, warehouse, scheduled_date, notes, items } = req.body;
  const count = findAll('receipts').length + 1;
  const reference = `RCP/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;
  const receipt = insert('receipts', { reference, supplier, warehouse_id, warehouse, scheduled_date, notes: notes || '', status: 'Draft', done_date: null });
  if (items?.length) {
    items.forEach(item => {
      const product = findOne('products', { id: item.product_id });
      insert('receipt_items', {
        receipt_id: receipt.id,
        product_id: item.product_id,
        product_name: product?.name || '',
        product_sku: product?.sku || '',
        qty_expected: item.qty_expected || 0,
        qty_received: 0,
        unit: product?.unit || 'pcs'
      });
    });
  }
  res.status(201).json(enrichReceipt(receipt));
});

// PUT /api/receipts/:id
router.put('/:id', (req, res) => {
  const receipt = findOne('receipts', { id: req.params.id });
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  const updated = update('receipts', req.params.id, req.body);
  res.json(enrichReceipt(updated));
});

// POST /api/receipts/:id/validate
router.post('/:id/validate', (req, res) => {
  const receipt = findOne('receipts', { id: req.params.id });
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  if (receipt.status === 'Done') return res.status(400).json({ error: 'Already validated' });

  const items = findAll('receipt_items', { receipt_id: receipt.id });
  const wh = findOne('warehouses', { id: receipt.warehouse_id });
  const locations = findAll('locations', { warehouse_id: receipt.warehouse_id });
  const defaultLoc = locations[0];

  items.forEach(item => {
    const qty = item.qty_received || item.qty_expected;
    if (defaultLoc) {
      adjustStock(item.product_id, defaultLoc.id, qty);
      insert('stock_ledger', {
        type: 'receipt', reference: receipt.reference,
        product_id: item.product_id, product_name: item.product_name, product_sku: item.product_sku,
        from_location: 'Vendor', to_location: defaultLoc.name, qty: qty, unit: item.unit,
        date: new Date().toISOString().split('T')[0]
      });
    }
    update('receipt_items', item.id, { qty_received: qty });
  });

  const updated = update('receipts', receipt.id, { status: 'Done', done_date: now() });
  res.json(enrichReceipt(updated));
});

// POST /api/receipts/:id/items
router.post('/:id/items', (req, res) => {
  const receipt = findOne('receipts', { id: req.params.id });
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  const product = findOne('products', { id: req.body.product_id });
  const item = insert('receipt_items', {
    receipt_id: receipt.id,
    product_id: req.body.product_id,
    product_name: product?.name || '',
    product_sku: product?.sku || '',
    qty_expected: req.body.qty_expected || 0,
    qty_received: 0,
    unit: product?.unit || 'pcs'
  });
  res.status(201).json(item);
});

// PUT /api/receipts/:id/items/:itemId
router.put('/:id/items/:itemId', (req, res) => {
  const updated = update('receipt_items', req.params.itemId, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// DELETE /api/receipts/:id/items/:itemId
router.delete('/:id/items/:itemId', (req, res) => {
  const { remove } = require('../db');
  remove('receipt_items', req.params.itemId);
  res.json({ success: true });
});

module.exports = router;
