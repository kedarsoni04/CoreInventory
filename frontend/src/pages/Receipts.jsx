import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { receiptsAPI, warehousesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, ArrowDownToLine, X } from 'lucide-react';

function StatusBadge({ status }) {
  return <span className={`badge ${status?.toLowerCase()}`}>{status}</span>;
}

function NewReceiptModal({ warehouses, onClose, onSave }) {
  const [form, setForm] = useState({ supplier: '', warehouse_id: '', scheduled_date: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const wh = warehouses.find(w => w.id === form.warehouse_id);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.warehouse_id) { toast.error('Select a warehouse'); return; }
    setLoading(true);
    try {
      const res = await receiptsAPI.create({ ...form, warehouse: wh?.name || '' });
      toast.success(`Receipt ${res.data.reference} created`);
      onSave(res.data.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Receipt</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <input className="form-control" value={form.supplier} onChange={set('supplier')} required placeholder="Vendor name" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Warehouse *</label>
                <select className="form-control" value={form.warehouse_id} onChange={set('warehouse_id')} required>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input className="form-control" type="date" value={form.scheduled_date} onChange={set('scheduled_date')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    Promise.all([receiptsAPI.list(), warehousesAPI.list()])
      .then(([rr, wr]) => { setReceipts(rr.data); setWarehouses(wr.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const statuses = ['all', 'Draft', 'Ready', 'Done', 'Canceled'];

  const filtered = receipts.filter(r => {
    const matchSearch = !search || r.reference?.toLowerCase().includes(search.toLowerCase()) || r.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Receipts</div>
          <div className="page-sub">Incoming stock from vendors</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} /> New Receipt</button>
      </div>

      <div className="page-body">
        <div className="toolbar mb-4">
          <div className="search-input">
            <Search />
            <input placeholder="Search reference, supplier..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {statuses.map(s => (
            <button key={s} className={`chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><ArrowDownToLine /><p>No receipts found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Supplier</th>
                  <th>Warehouse</th>
                  <th>Scheduled</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Done Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/receipts/${r.id}`)}>
                    <td className="mono" style={{ color: 'var(--accent)' }}>{r.reference}</td>
                    <td className="text-main">{r.supplier}</td>
                    <td style={{ color: 'var(--text3)' }}>{r.warehouse}</td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{r.scheduled_date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.items?.length || 0}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{r.done_date ? r.done_date.split('T')[0] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <NewReceiptModal
          warehouses={warehouses}
          onClose={() => setModal(false)}
          onSave={(id) => { setModal(false); navigate(`/receipts/${id}`); }}
        />
      )}
    </>
  );
}
