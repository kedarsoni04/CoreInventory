const express = require('express');
const { findAll, findOne, insert, update, remove, getProductStock, db } = require('../db');
const { authMiddleware } = require('../middleware');
const router = express.Router();

router.use(authMiddleware);

// GET /api/products
router.get('/', (req, res) => {
  const products = findAll('products');
  const result = products.map(p => ({
    ...p,
    total_stock: getProductStock(p.id),
    stock_by_location: db.stock.filter(s => s.product_id === p.id).map(s => {
      const loc = findOne('locations', { id: s.location_id });
      return { location: loc?.name || 'Unknown', location_id: s.location_id, quantity: s.quantity, unit: p.unit };
    })
  }));
  res.json(result);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const p = findOne('products', { id: req.params.id });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ ...p, total_stock: getProductStock(p.id) });
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, sku, category, unit, reorder_point, initial_stock, location_id } = req.body;
  if (!name || !sku) return res.status(400).json({ error: 'Name and SKU required' });
  if (findOne('products', { sku })) return res.status(409).json({ error: 'SKU already exists' });
  const product = insert('products', { name, sku, category: category || 'General', unit: unit || 'pcs', reorder_point: reorder_point || 0 });
  if (initial_stock && location_id) {
    const { adjustStock } = require('../db');
    adjustStock(product.id, location_id, parseInt(initial_stock));
  }
  res.status(201).json(product);
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const updated = update('products', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const removed = remove('products', req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
