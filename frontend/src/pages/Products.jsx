import React, { useEffect, useState } from 'react';
import { productsAPI, locationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Package, Edit2, Trash2, X } from 'lucide-react';

function StockBadge({ qty, reorder }) {
  if (qty <= 0) return <span className="badge out">Out of Stock</span>;
  if (qty <= reorder) return <span className="badge low">Low Stock</span>;
  return <span className="badge ok">In Stock</span>;
}

function ProductModal({ product, locations, onClose, onSave }) {
  const [form, setForm] = useState(product || { name: '', sku: '', category: '', unit: 'pcs', reorder_point: 0, initial_stock: '', location_id: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        await productsAPI.update(product.id, form);
        toast.success('Product updated');
      } else {
        await productsAPI.create(form);
        toast.success('Product created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving product');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{product ? 'Edit Product' : 'New Product'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-control" value={form.name} onChange={set('name')} required placeholder="Steel Rods" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU / Code *</label>
                <input className="form-control" value={form.sku} onChange={set('sku')} required placeholder="STL-001" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-control" value={form.category} onChange={set('category')} placeholder="Raw Materials" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit of Measure</label>
                <select className="form-control" value={form.unit} onChange={set('unit')}>
                  {['pcs', 'kg', 'g', 'ltr', 'ml', 'm', 'box', 'roll', 'set'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reorder Point</label>
              <input className="form-control" type="number" value={form.reorder_point} onChange={set('reorder_point')} min={0} />
            </div>
            {!product && (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Initial Stock (optional)</label>
                  <input className="form-control" type="number" value={form.initial_stock} onChange={set('initial_stock')} min={0} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select className="form-control" value={form.location_id} onChange={set('location_id')}>
                    <option value="">Select location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | product obj
  const [filterStatus, setFilterStatus] = useState('all');

  const load = () => {
    Promise.all([productsAPI.list(), locationsAPI.list()])
      .then(([pr, lr]) => { setProducts(pr.data); setLocations(lr.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'low' && p.total_stock > 0 && p.total_stock <= p.reorder_point) || (filterStatus === 'out' && p.total_stock <= 0) || (filterStatus === 'ok' && p.total_stock > p.reorder_point);
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-sub">{products.length} products · Manage catalog & stock levels</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={14} /> New Product</button>
      </div>

      <div className="page-body">
        <div className="toolbar mb-4">
          <div className="search-input">
            <Search />
            <input placeholder="Search by name, SKU, category..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['all', 'ok', 'low', 'out'].map(s => (
            <button key={s} className={`chip${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All' : s === 'ok' ? 'In Stock' : s === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Package /><p>No products found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Total Stock</th>
                  <th>Reorder At</th>
                  <th>Status</th>
                  <th>Stock by Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="text-main">{p.name}</td>
                    <td className="mono">{p.sku}</td>
                    <td style={{ color: 'var(--text3)' }}>{p.category || '—'}</td>
                    <td style={{ color: 'var(--text3)' }}>{p.unit}</td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.total_stock}</span> <span style={{ color: 'var(--text3)', fontSize: 11 }}>{p.unit}</span></td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{p.reorder_point}</td>
                    <td><StockBadge qty={p.total_stock} reorder={p.reorder_point} /></td>
                    <td style={{ fontSize: 12 }}>
                      {(p.stock_by_location || []).map((s, i) => (
                        <span key={i} style={{ display: 'inline-block', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 7px', marginRight: 4, marginBottom: 2, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                          {s.location}: <strong style={{ color: 'var(--text)' }}>{s.quantity}</strong>
                        </span>
                      ))}
                      {(!p.stock_by_location || p.stock_by_location.length === 0) && <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(p)} title="Edit"><Edit2 size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(p.id)} title="Delete" style={{ color: 'var(--red)' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          locations={locations}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}
