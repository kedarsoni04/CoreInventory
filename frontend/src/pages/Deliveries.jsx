import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveriesAPI, warehousesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, ArrowUpFromLine, X, Trash2 } from 'lucide-react';

function StatusBadge({ status }) {
  return <span className={`badge ${status?.toLowerCase()}`}>{status}</span>;
}

function NewDeliveryModal({ warehouses, onClose, onSave }) {
  const [form, setForm] = useState({ customer: '', warehouse_id: '', scheduled_date: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.warehouse_id) { toast.error('Select a warehouse'); return; }
    setLoading(true);
    try {
      const wh = warehouses.find(w => w.id === form.warehouse_id);
      const res = await deliveriesAPI.create({ ...form, warehouse: wh?.name || '' });
      toast.success(`Delivery ${res.data.reference} created`);
      onSave(res.data.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Delivery Order</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <input className="form-control" value={form.customer} onChange={set('customer')} required placeholder="Customer name" />
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
              <textarea className="form-control" value={form.notes} onChange={set('notes')} rows={2} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    Promise.all([deliveriesAPI.list(), warehousesAPI.list()])
      .then(([dr, wr]) => { setDeliveries(dr.data); setWarehouses(wr.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, reference, status, e) => {
    e.stopPropagation();
    
    if (status === 'Done') {
      toast.error('Cannot delete a validated delivery');
      return;
    }

    if (!window.confirm(`Delete delivery ${reference}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deliveriesAPI.delete(id);
      toast.success(`Delivery ${reference} deleted`);
      setDeliveries(deliveries.filter(d => d.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete delivery');
    }
  };

  const filtered = deliveries.filter(d => {
    const matchSearch = !search || d.reference?.toLowerCase().includes(search.toLowerCase()) || d.customer?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Deliveries</div>
          <div className="page-sub">Outgoing stock to customers</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} /> New Delivery</button>
      </div>

      <div className="page-body">
        <div className="toolbar mb-4">
          <div className="search-input">
            <Search />
            <input placeholder="Search reference, customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['all', 'Draft', 'Ready', 'Done', 'Canceled'].map(s => (
            <button key={s} className={`chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><ArrowUpFromLine /><p>No deliveries found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Warehouse</th>
                  <th>Scheduled</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Done Date</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/deliveries/${d.id}`)}>
                    <td className="mono" style={{ color: 'var(--accent)' }}>{d.reference}</td>
                    <td className="text-main">{d.customer}</td>
                    <td style={{ color: 'var(--text3)' }}>{d.warehouse}</td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{d.scheduled_date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{d.items?.length || 0}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{d.done_date ? d.done_date.split('T')[0] : '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-ghost btn-icon" 
                        onClick={(e) => handleDelete(d.id, d.reference, d.status, e)}
                        title={d.status === 'Done' ? 'Cannot delete validated delivery' : 'Delete delivery'}
                        style={{ opacity: d.status === 'Done' ? 0.5 : 1, pointerEvents: d.status === 'Done' ? 'none' : 'auto' }}
                      >
                        <Trash2 size={16} color="var(--red)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <NewDeliveryModal
          warehouses={warehouses}
          onClose={() => setModal(false)}
          onSave={(id) => { setModal(false); navigate(`/deliveries/${id}`); }}
        />
      )}
    </>
  );
}
