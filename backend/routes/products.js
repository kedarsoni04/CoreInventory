const express = require('express');
const { findAll, findOne, insert, update, remove, getProductStock } = require('../db');
const { authMiddleware } = require('../middleware');
const { validate, productSchema, productUpdateSchema } = require('../validation');
const router = express.Router();

router.use(authMiddleware);

// GET /api/products
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search, sort = 'name', order = 'asc' } = req.query;
  let products = findAll('products');

  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower)
    );
  }

  // Sorting
  products.sort((a, b) => {
    let aVal = a[sort];
    let bVal = b[sort];
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (order === 'desc') {
      return aVal < bVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = products.slice(startIndex, endIndex);

  const result = paginatedProducts.map(p => ({
    ...p,
    total_stock: getProductStock(p.id),
    stock_by_location: findAll('stock', { product_id: p.id }).map(s => {
      const loc = findOne('locations', { id: s.location_id });
      return { location: loc?.name || 'Unknown', location_id: s.location_id, quantity: s.quantity, unit: p.unit };
    })
  }));

  res.json({
    products: result,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: products.length,
      pages: Math.ceil(products.length / limit)
    }
  });
});

// GET /api/products/export
router.get('/export', (req, res) => {
  const products = findAll('products');
  const csvHeaders = 'ID,Name,SKU,Category,Unit,TotalStock\n';
  const csvRows = products.map(p => {
    const stock = getProductStock(p.id);
    return `${p.id},"${p.name}","${p.sku}","${p.category}",${p.unit},${stock}`;
  }).join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('products.csv');
  return res.send(csvHeaders + csvRows);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const p = findOne('products', { id: req.params.id });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ ...p, total_stock: getProductStock(p.id) });
});

// POST /api/products
router.post('/', validate(productSchema), (req, res) => {
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
router.put('/:id', validate(productUpdateSchema), (req, res) => {
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
