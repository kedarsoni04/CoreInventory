const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.sqlite');
const db = new Database(DB_FILE);

// Helpers
function generateId() { return uuidv4(); }
function now() { return new Date().toISOString(); }

// Initialize Database schema
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, name TEXT, email TEXT, password TEXT, role TEXT);
    CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, name TEXT, short_code TEXT, address TEXT);
    CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, name TEXT, short_code TEXT, warehouse_id TEXT, warehouse TEXT);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, name TEXT, sku TEXT, category TEXT, unit TEXT, reorder_point INTEGER);
    CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, reference TEXT, supplier TEXT, status TEXT, warehouse_id TEXT, warehouse TEXT, scheduled_date TEXT, done_date TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS receipt_items (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, receipt_id TEXT, product_id TEXT, product_name TEXT, product_sku TEXT, qty_expected REAL, qty_received REAL, unit TEXT);
    CREATE TABLE IF NOT EXISTS deliveries (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, reference TEXT, customer TEXT, status TEXT, warehouse_id TEXT, warehouse TEXT, scheduled_date TEXT, done_date TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS delivery_items (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, delivery_id TEXT, product_id TEXT, product_name TEXT, product_sku TEXT, qty_expected REAL, qty_done REAL, unit TEXT);
    CREATE TABLE IF NOT EXISTS transfers (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, reference TEXT, from_location_id TEXT, to_location_id TEXT, from_location TEXT, to_location TEXT, scheduled_date TEXT, done_date TEXT, status TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS transfer_items (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, transfer_id TEXT, product_id TEXT, product_name TEXT, product_sku TEXT, qty REAL, unit TEXT);
    CREATE TABLE IF NOT EXISTS adjustments (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, reference TEXT, location_id TEXT, location TEXT, scheduled_date TEXT, done_date TEXT, status TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS adjustment_items (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, adjustment_id TEXT, product_id TEXT, product_name TEXT, product_sku TEXT, qty_on_hand REAL, qty_counted REAL, unit TEXT);
    CREATE TABLE IF NOT EXISTS stock_ledger (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, type TEXT, reference TEXT, product_id TEXT, product_name TEXT, product_sku TEXT, from_location TEXT, to_location TEXT, qty REAL, unit TEXT, date TEXT);
    CREATE TABLE IF NOT EXISTS stock (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, product_id TEXT, location_id TEXT, quantity REAL);
    CREATE TABLE IF NOT EXISTS password_reset_otp (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, email TEXT, otp TEXT, expires_at TEXT, verified INTEGER DEFAULT 0);
  `);
}
initDb();

// Migration: add missing columns to existing databases
function runMigrations() {
  const migrations = [
    `ALTER TABLE password_reset_otp ADD COLUMN updated_at TEXT`,
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (_) { /* column already exists, ignore */ }
  }
}
runMigrations();

function findAll(table, where = {}) {
  const keys = Object.keys(where);
  if (keys.length === 0) {
    return db.prepare(`SELECT * FROM ${table}`).all();
  }
  const conditions = keys.map(k => `${k} = ?`).join(' AND ');
  return db.prepare(`SELECT * FROM ${table} WHERE ${conditions}`).all(...keys.map(k => where[k]));
}

function findOne(table, where = {}) {
  const keys = Object.keys(where);
  if (keys.length === 0) {
    return db.prepare(`SELECT * FROM ${table} LIMIT 1`).get() || null;
  }
  const conditions = keys.map(k => `${k} = ?`).join(' AND ');
  return db.prepare(`SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`).get(...keys.map(k => where[k])) || null;
}

function insert(table, data) {
  const row = { id: generateId(), created_at: now(), ...data };
  
  // Filter out any incoming undefined fields or ones not handled by placeholders cleanly
  const validKeys = Object.keys(row).filter(k => row[k] !== undefined);
  const placeholders = validKeys.map(() => '?').join(', ');
  
  const stmt = db.prepare(`INSERT INTO ${table} (${validKeys.join(', ')}) VALUES (${placeholders})`);
  stmt.run(...validKeys.map(k => row[k]));
  return row;
}

function update(table, id, data) {
  const row = { ...data, updated_at: now() };
  const validKeys = Object.keys(row).filter(k => row[k] !== undefined);
  
  if (validKeys.length === 0) return findOne(table, { id });
  const setString = validKeys.map(k => `${k} = ?`).join(', ');
  
  const stmt = db.prepare(`UPDATE ${table} SET ${setString} WHERE id = ?`);
  const changes = stmt.run(...validKeys.map(k => row[k]), id).changes;
  if (changes === 0) return null;
  return findOne(table, { id });
}

function remove(table, id) {
  const changes = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id).changes;
  return changes > 0;
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
  const row = db.prepare(`SELECT SUM(quantity) as total FROM stock WHERE product_id = ?`).get(productId);
  return row?.total || 0;
}

// Dummy loadDatabase as we persist instantly now
function loadDatabase() {
  return true;
}

function saveDatabase() {
  // SQLite persists instantly
}

// Seed data
async function seedDatabase() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (existingUsers > 0) return; // Already seeded

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

  console.log('✅ SQLite Database seeded successfully');
  console.log(`   Admin: admin@coreinventory.com / admin123`);
}

module.exports = { db, insert, findAll, findOne, update, remove, adjustStock, getStock, getProductStock, generateId, now, seedDatabase, loadDatabase, saveDatabase };
