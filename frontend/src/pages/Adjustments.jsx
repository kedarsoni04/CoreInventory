import React, { useEffect, useState } from 'react';
import { adjustmentsAPI, locationsAPI, productsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, ClipboardList, X, CheckCircle } from 'lucide-react';

function StatusBadge({ status }) {
  return <span className={`badge ${status?.toLowerCase()}`}>{status}</span>;
}

function NewAdjustmentModal({ locations, products, onClose, onSave }) {
  const [form, setForm] = useState({ location_id: '', notes: '' });
  const [items, setItems] = useState([{ product_id: '', qty_counted: '' }]);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setItem = (i, k, v) => setItems(it => it.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.location_id) { toast.error('Select a location'); return; }
    const validItems = items.filter(it => it.product_id && it.qty_counted !== '');
    if (!validItems.length) { toast.error('Add at least one product'); return; }
    setLoading(true);
    try {
      await adjustmentsAPI.create({ ...form, items: validItems.map(it => ({ product_id: it.product_id, qty_counted: parseFloat(it.qty_counted) })) });
      toast.success('Adjustment created');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div className="modal-title">New Stock Adjustment</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="alert info mb-3">
              <ClipboardList size={14} />
              <span>Enter the physically counted quantity. The system will auto-calculate the difference.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <select className="form-control" value={form.location_id} onChange={set('location_id')} required>
                <option value="">Select location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.warehouse})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-control" value={form.notes} onChange={set('notes')} placeholder="Reason for adjustment..." />
            </div>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ margin: 0 }}>Products</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItems(it => [...it, { product_id: '', qty_counted: '' }])}><Plus size={12} /> Add row</button>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select className="form-control" value={item.product_id} onChange={e => setItem(i, 'product_id', e.target.value)}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input className="form-control" style={{ maxWidth: 130 }} type="number" min={0} placeholder="Counted qty" value={item.qty_counted} onChange={e => setItem(i, 'qty_counted', e.target.value)} />
                {items.length > 1 && <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setItems(it => it.filter((_, idx) => idx !== i))}><X size={13} /></button>}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);

  const load = () => {
    Promise.all([adjustmentsAPI.list(), locationsAPI.list(), productsAPI.list()])
      .then(([ar, lr, pr]) => { setAdjustments(ar.data); setLocations(lr.data); setProducts(pr.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleValidate = async (id) => {
    if (!window.confirm('Apply this adjustment? Stock will be updated.')) return;
    try {
      await adjustmentsAPI.validate(id);
      toast.success('Adjustment applied!');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const filtered = adjustments.filter(a =>
    !search || a.reference?.toLowerCase().includes(search.toLowerCase()) || a.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Stock Adjustments</div>
          <div className="page-sub">Fix mismatches between recorded and physical stock</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} /> New Adjustment</button>
      </div>

      <div className="page-body">
        <div className="toolbar mb-4">
          <div className="search-input">
            <Search />
            <input placeholder="Search reference, location..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><ClipboardList /><p>No adjustments found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Location</th>
                  <th>Items</th>
                  <th>Notes</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td className="mono" style={{ color: 'var(--accent)' }}>{a.reference}</td>
                    <td className="text-main">{a.location}</td>
                    <td>
                      {a.items?.map(item => (
                        <div key={item.id} style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                          {item.product_name}: {item.qty_on_hand} → <strong style={{ color: item.qty_counted !== item.qty_on_hand ? 'var(--accent)' : 'var(--text)' }}>{item.qty_counted}</strong>
                          {item.qty_counted !== item.qty_on_hand && (
                            <span style={{ color: item.qty_counted > item.qty_on_hand ? 'var(--green)' : 'var(--red)', marginLeft: 4 }}>
                              ({item.qty_counted > item.qty_on_hand ? '+' : ''}{item.qty_counted - item.qty_on_hand})
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{a.notes || '—'}</td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{a.created_at?.split('T')[0]}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      {a.status !== 'Done' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleValidate(a.id)}>
                          <CheckCircle size={12} /> Apply
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <NewAdjustmentModal
          locations={locations}
          products={products}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); load(); }}
        />
      )}
    </>
  );
}
