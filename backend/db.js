const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// In-memory data store (replaces SQLite for portability)
const db = {
  users: [],
  products: [],
  warehouses: [],
  locations: [],
  receipts: [],
  receipt_items: [],
  deliveries: [],
  delivery_items: [],
  transfers: [],
  transfer_items: [],
  adjustments: [],
  adjustment_items: [],
  stock_ledger: [],
  stock: [] // { product_id, location_id, quantity }
};

// Helpers
function generateId() { return uuidv4(); }
function now() { return new Date().toISOString(); }

function findAll(table, where = {}) {
  return db[table].filter(row => {
    return Object.entries(where).every(([k, v]) => row[k] === v);
  });
}

function findOne(table, where = {}) {
  return db[table].find(row => Object.entries(where).every(([k, v]) => row[k] === v)) || null;
}

function insert(table, data) {
  const row = { id: generateId(), created_at: now(), ...data };
  db[table].push(row);
  saveDatabase();
  return row;
}

function update(table, id, data) {
  const idx = db[table].findIndex(r => r.id === id);
  if (idx === -1) return null;
  db[table][idx] = { ...db[table][idx], ...data, updated_at: now() };
  saveDatabase();
  return db[table][idx];
}

function remove(table, id) {
  const idx = db[table].findIndex(r => r.id === id);
  if (idx === -1) return false;
  db[table].splice(idx, 1);
  saveDatabase();
  return true;
}

function getStock(productId, locationId) {
  return findOne('stock', { product_id: productId, location_id: locationId });
}

function adjustStock(productId, locationId, delta) {
  const existing = getStock(productId, locationId);
  if (existing) {
    update('stock', existing.id, { quantity: (existing.quantity || 0) + delta });
  } else {
    insert('stock', { product_id: productId, location_id: locationId, quantity: delta });
  }
}

function getProductStock(productId) {
  return db.stock.filter(s => s.product_id === productId).reduce((sum, s) => sum + (s.quantity || 0), 0);
}

// Persistence functions
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      Object.assign(db, data);
      return true;
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
  return false;
}

// Seed data
async function seedDatabase() {
  if (db.users.length > 0) return; // Already seeded

  // Create admin user
  const hash = await bcrypt.hash('admin123', 10);
  insert('users', {
    name: 'Admin User',
    email: 'admin@coreinventory.com',
    password: hash,
    role: 'manager'
  });

  // Create warehouses
  const wh1 = insert('warehouses', { name: 'Main Warehouse', short_code: 'MW', address: '123 Industrial Blvd' });
  const wh2 = insert('warehouses', { name: 'Secondary Warehouse', short_code: 'SW', address: '456 Storage Ave' });

  // Create locations
  const loc1 = insert('locations', { name: 'Main Store', short_code: 'MS', warehouse_id: wh1.id, warehouse: 'Main Warehouse' });
  const loc2 = insert('locations', { name: 'Production Rack', short_code: 'PR', warehouse_id: wh1.id, warehouse: 'Main Warehouse' });
  const loc3 = insert('locations', { name: 'Rack A', short_code: 'RA', warehouse_id: wh2.id, warehouse: 'Secondary Warehouse' });

  // Create products
  const p1 = insert('products', { name: 'Steel Rods', sku: 'STL-001', category: 'Raw Materials', unit: 'kg', reorder_point: 50 });
  const p2 = insert('products', { name: 'Wooden Pallets', sku: 'WDP-002', category: 'Packaging', unit: 'pcs', reorder_point: 20 });
  const p3 = insert('products', { name: 'Aluminium Sheets', sku: 'ALM-003', category: 'Raw Materials', unit: 'kg', reorder_point: 30 });
  const p4 = insert('products', { name: 'Plastic Crates', sku: 'PLS-004', category: 'Packaging', unit: 'pcs', reorder_point: 15 });
  const p5 = insert('products', { name: 'Iron Bolts', sku: 'IRN-005', category: 'Hardware', unit: 'pcs', reorder_point: 100 });

  // Seed stock
  adjustStock(p1.id, loc1.id, 100);
  adjustStock(p2.id, loc1.id, 50);
  adjustStock(p3.id, loc2.id, 75);
  adjustStock(p4.id, loc3.id, 30);
  adjustStock(p5.id, loc1.id, 200);

  // Seed receipts
  const r1 = insert('receipts', { reference: 'RCP/2025/001', supplier: 'Steel Corp', status: 'Done', warehouse_id: wh1.id, warehouse: 'Main Warehouse', scheduled_date: '2025-06-01', done_date: '2025-06-01', notes: '' });
  insert('receipt_items', { receipt_id: r1.id, product_id: p1.id, product_name: 'Steel Rods', product_sku: 'STL-001', qty_expected: 100, qty_received: 100, unit: 'kg' });

  const r2 = insert('receipts', { reference: 'RCP/2025/002', supplier: 'Wood Suppliers Ltd', status: 'Ready', warehouse_id: wh1.id, warehouse: 'Main Warehouse', scheduled_date: '2025-06-10', done_date: null, notes: '' });
  insert('receipt_items', { receipt_id: r2.id, product_id: p2.id, product_name: 'Wooden Pallets', product_sku: 'WDP-002', qty_expected: 50, qty_received: 0, unit: 'pcs' });

  // Seed deliveries
  const d1 = insert('deliveries', { reference: 'DEL/2025/001', customer: 'Acme Corp', status: 'Done', warehouse_id: wh1.id, warehouse: 'Main Warehouse', scheduled_date: '2025-06-05', done_date: '2025-06-05', notes: '' });
  insert('delivery_items', { delivery_id: d1.id, product_id: p1.id, product_name: 'Steel Rods', product_sku: 'STL-001', qty_expected: 20, qty_done: 20, unit: 'kg' });

  const d2 = insert('deliveries', { reference: 'DEL/2025/002', customer: 'BuildRight Inc', status: 'Ready', warehouse_id: wh1.id, warehouse: 'Main Warehouse', scheduled_date: '2025-06-15', done_date: null, notes: '' });
  insert('delivery_items', { delivery_id: d2.id, product_id: p3.id, product_name: 'Aluminium Sheets', product_sku: 'ALM-003', qty_expected: 30, qty_done: 0, unit: 'kg' });

  // Seed ledger entries
  insert('stock_ledger', { type: 'receipt', reference: 'RCP/2025/001', product_id: p1.id, product_name: 'Steel Rods', product_sku: 'STL-001', from_location: 'Vendor', to_location: 'Main Store', qty: 100, unit: 'kg', date: '2025-06-01' });
  insert('stock_ledger', { type: 'delivery', reference: 'DEL/2025/001', product_id: p1.id, product_name: 'Steel Rods', product_sku: 'STL-001', from_location: 'Main Store', to_location: 'Customer', qty: -20, unit: 'kg', date: '2025-06-05' });

  console.log('✅ Database seeded successfully');
  console.log(`   Admin: admin@coreinventory.com / admin123`);

  saveDatabase();
}

module.exports = { db, insert, findAll, findOne, update, remove, adjustStock, getStock, getProductStock, generateId, now, seedDatabase, loadDatabase, saveDatabase };
