import React, { useEffect, useState } from 'react';
import { transfersAPI, locationsAPI, productsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, ArrowLeftRight, X, CheckCircle } from 'lucide-react';

function StatusBadge({ status }) {
  return <span className={`badge ${status?.toLowerCase()}`}>{status}</span>;
}

function NewTransferModal({ locations, products, onClose, onSave }) {
  const [form, setForm] = useState({ from_location_id: '', to_location_id: '', scheduled_date: new Date().toISOString().split('T')[0], notes: '' });
  const [items, setItems] = useState([{ product_id: '', qty: '' }]);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const setItem = (i, k, v) => setItems(it => it.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItemRow = () => setItems(it => [...it, { product_id: '', qty: '' }]);
  const removeItemRow = (i) => setItems(it => it.filter((_, idx) => idx !== i));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.from_location_id || !form.to_location_id) { toast.error('Select both locations'); return; }
    if (form.from_location_id === form.to_location_id) { toast.error('Source and destination must differ'); return; }
    const validItems = items.filter(it => it.product_id && it.qty);
    if (!validItems.length) { toast.error('Add at least one product'); return; }
    setLoading(true);
    try {
      await transfersAPI.create({ ...form, items: validItems.map(it => ({ product_id: it.product_id, qty: parseFloat(it.qty) })) });
      toast.success('Transfer created');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div className="modal-title">New Internal Transfer</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">From Location *</label>
                <select className="form-control" value={form.from_location_id} onChange={set('from_location_id')} required>
                  <option value="">Select source</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.warehouse})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">To Location *</label>
                <select className="form-control" value={form.to_location_id} onChange={set('to_location_id')} required>
                  <option value="">Select destination</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.warehouse})</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled Date</label>
              <input className="form-control" type="date" value={form.scheduled_date} onChange={set('scheduled_date')} />
            </div>

            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ margin: 0 }}>Products</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addItemRow}><Plus size={12} /> Add row</button>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select className="form-control" value={item.product_id} onChange={e => setItem(i, 'product_id', e.target.value)}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input className="form-control" style={{ maxWidth: 100 }} type="number" min={1} placeholder="Qty" value={item.qty} onChange={e => setItem(i, 'qty', e.target.value)} />
                {items.length > 1 && <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeItemRow(i)}><X size={13} /></button>}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);

  const load = () => {
    Promise.all([transfersAPI.list(), locationsAPI.list(), productsAPI.list()])
      .then(([tr, lr, pr]) => { setTransfers(tr.data); setLocations(lr.data); setProducts(pr.data.products); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleValidate = async (id) => {
    if (!window.confirm('Validate this transfer? Stock will be moved.')) return;
    try {
      await transfersAPI.validate(id);
      toast.success('Transfer validated! Stock moved.');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const filtered = transfers.filter(t =>
    !search || t.reference?.toLowerCase().includes(search.toLowerCase()) ||
    t.from_location?.toLowerCase().includes(search.toLowerCase()) ||
    t.to_location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Internal Transfers</div>
          <div className="page-sub">Move stock between locations & warehouses</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} /> New Transfer</button>
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
            <div className="empty-state"><ArrowLeftRight /><p>No transfers found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>From</th>
                  <th>→</th>
                  <th>To</th>
                  <th>Items</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td className="mono" style={{ color: 'var(--accent)' }}>{t.reference}</td>
                    <td className="text-main">{t.from_location}</td>
                    <td style={{ color: 'var(--text3)' }}>→</td>
                    <td className="text-main">{t.to_location}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{t.items?.length || 0}</td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{t.scheduled_date}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      {t.status !== 'Done' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleValidate(t.id)}>
                          <CheckCircle size={12} /> Validate
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
        <NewTransferModal
          locations={locations}
          products={products}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); load(); }}
        />
      )}
    </>
  );
}
