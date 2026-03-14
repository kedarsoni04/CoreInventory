const express = require('express');
const { findAll, findOne, insert, update, remove, adjustStock, db, now } = require('../db');
const { authMiddleware } = require('../middleware');
const router = express.Router();

router.use(authMiddleware);

function enrichDelivery(d) {
  const items = findAll('delivery_items', { delivery_id: d.id });
  return { ...d, items };
}

// GET /api/deliveries
router.get('/', (req, res) => {
  const { status } = req.query;
  let deliveries = findAll('deliveries');
  if (status) deliveries = deliveries.filter(d => d.status === status);
  deliveries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(deliveries.map(enrichDelivery));
});

// GET /api/deliveries/:id
router.get('/:id', (req, res) => {
  const d = findOne('deliveries', { id: req.params.id });
  if (!d) return res.status(404).json({ error: 'Not found' });
  res.json(enrichDelivery(d));
});

// POST /api/deliveries
router.post('/', (req, res) => {
  const { customer, warehouse_id, warehouse, scheduled_date, notes, items } = req.body;
  const count = findAll('deliveries').length + 1;
  const reference = `DEL/${new Date().getFullYear()}/${String(count).padStart(3, '0')}`;
  const delivery = insert('deliveries', { reference, customer, warehouse_id, warehouse, scheduled_date, notes: notes || '', status: 'Draft', done_date: null });
  if (items?.length) {
    items.forEach(item => {
      const product = findOne('products', { id: item.product_id });
      insert('delivery_items', {
        delivery_id: delivery.id,
        product_id: item.product_id,
        product_name: product?.name || '',
        product_sku: product?.sku || '',
        qty_expected: item.qty_expected || 0,
        qty_done: 0,
        unit: product?.unit || 'pcs'
      });
    });
  }
  res.status(201).json(enrichDelivery(delivery));
});

// PUT /api/deliveries/:id
router.put('/:id', (req, res) => {
  const updated = update('deliveries', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(enrichDelivery(updated));
});

// POST /api/deliveries/:id/validate
router.post('/:id/validate', (req, res) => {
  const delivery = findOne('deliveries', { id: req.params.id });
  if (!delivery) return res.status(404).json({ error: 'Not found' });
  if (delivery.status === 'Done') return res.status(400).json({ error: 'Already validated' });

  const items = findAll('delivery_items', { delivery_id: delivery.id });
  const locations = findAll('locations', { warehouse_id: delivery.warehouse_id });
  const defaultLoc = locations[0];

  items.forEach(item => {
    const qty = item.qty_expected;
    if (defaultLoc) {
      adjustStock(item.product_id, defaultLoc.id, -qty);
      insert('stock_ledger', {
        type: 'delivery', reference: delivery.reference,
        product_id: item.product_id, product_name: item.product_name, product_sku: item.product_sku,
        from_location: defaultLoc.name, to_location: 'Customer', qty: -qty, unit: item.unit,
        date: new Date().toISOString().split('T')[0]
      });
    }
    update('delivery_items', item.id, { qty_done: qty });
  });

  const updated = update('deliveries', delivery.id, { status: 'Done', done_date: now() });
  res.json(enrichDelivery(updated));
});

// POST /api/deliveries/:id/items
router.post('/:id/items', (req, res) => {
  const delivery = findOne('deliveries', { id: req.params.id });
  if (!delivery) return res.status(404).json({ error: 'Not found' });
  const product = findOne('products', { id: req.body.product_id });
  const item = insert('delivery_items', {
    delivery_id: delivery.id,
    product_id: req.body.product_id,
    product_name: product?.name || '',
    product_sku: product?.sku || '',
    qty_expected: req.body.qty_expected || 0,
    qty_done: 0,
    unit: product?.unit || 'pcs'
  });
  res.status(201).json(item);
});

// PUT /api/deliveries/:id/items/:itemId
router.put('/:id/items/:itemId', (req, res) => {
  const updated = update('delivery_items', req.params.itemId, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// DELETE /api/deliveries/:id/items/:itemId
router.delete('/:id/items/:itemId', (req, res) => {
  remove('delivery_items', req.params.itemId);
  res.json({ success: true });
});

module.exports = router;
