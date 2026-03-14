import React, { useEffect, useState } from 'react';
import { warehousesAPI, locationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Warehouse, MapPin, X, Edit2, Save } from 'lucide-react';

function WhModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', short_code: '', address: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await warehousesAPI.create(form);
      toast.success('Warehouse created');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Warehouse</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" value={form.name} onChange={set('name')} required placeholder="Main Warehouse" />
              </div>
              <div className="form-group">
                <label className="form-label">Short Code *</label>
                <input className="form-control" value={form.short_code} onChange={set('short_code')} required placeholder="MW" maxLength={5} style={{ textTransform: 'uppercase' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-control" value={form.address} onChange={set('address')} placeholder="123 Industrial Ave" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <div className="spinner" /> : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LocModal({ warehouses, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', short_code: '', warehouse_id: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.warehouse_id) { toast.error('Select a warehouse'); return; }
    setLoading(true);
    try {
      await locationsAPI.create(form);
      toast.success('Location created');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Location</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Warehouse *</label>
              <select className="form-control" value={form.warehouse_id} onChange={set('warehouse_id')} required>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Location Name *</label>
                <input className="form-control" value={form.name} onChange={set('name')} required placeholder="Rack A" />
              </div>
              <div className="form-group">
                <label className="form-label">Short Code</label>
                <input className="form-control" value={form.short_code} onChange={set('short_code')} placeholder="RA" maxLength={5} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <div className="spinner" /> : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'wh' | 'loc' | null

  const load = () => {
    warehousesAPI.list().then(r => setWarehouses(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const allWarehouses = warehouses.map(w => ({ ...w }));

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Warehouses & Locations</div>
          <div className="page-sub">Manage your storage infrastructure</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setModal('loc')}><Plus size={14} /> New Location</button>
          <button className="btn btn-primary" onClick={() => setModal('wh')}><Plus size={14} /> New Warehouse</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : warehouses.length === 0 ? (
          <div className="empty-state"><Warehouse /><p>No warehouses configured</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {warehouses.map(wh => (
              <div className="card" key={wh.id}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Warehouse size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{wh.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Code: {wh.short_code}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{wh.address}</div>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: 10, fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)' }}>Locations ({wh.locations?.length || 0})</div>
                  {wh.locations?.length === 0 ? (
                    <div style={{ color: 'var(--text3)', fontSize: 13 }}>No locations defined. <button className="btn btn-ghost btn-sm" onClick={() => setModal('loc')} style={{ display: 'inline-flex' }}><Plus size={11} /> Add location</button></div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {wh.locations.map(loc => (
                        <div key={loc.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MapPin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{loc.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{loc.short_code}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal === 'wh' && <WhModal onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
      {modal === 'loc' && <LocModal warehouses={allWarehouses} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
    </>
  );
}
