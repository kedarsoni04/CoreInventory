import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { receiptsAPI, productsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, Trash2, CheckCircle, Edit2, X, Save } from 'lucide-react';

function StatusBadge({ status }) {
  return <span className={`badge ${status?.toLowerCase()}`}>{status}</span>;
}

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [addForm, setAddForm] = useState({ product_id: '', qty_expected: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [editHeader, setEditHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({});

  const load = () => {
    Promise.all([receiptsAPI.get(id), productsAPI.list()])
      .then(([rr, pr]) => { setReceipt(rr.data); setProducts(pr.data.products ?? []); setHeaderForm({ supplier: rr.data.supplier, scheduled_date: rr.data.scheduled_date, notes: rr.data.notes }); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleValidate = async () => {
    if (!window.confirm('Validate this receipt? Stock will be updated.')) return;
    setValidating(true);
    try {
      await receiptsAPI.validate(id);
      toast.success('Receipt validated! Stock updated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Validation failed');
    } finally { setValidating(false); }
  };

  const handleAddItem = async () => {
    if (!addForm.product_id || !addForm.qty_expected) { toast.error('Select product and quantity'); return; }
    try {
      await receiptsAPI.addItem(id, { product_id: addForm.product_id, qty_expected: parseFloat(addForm.qty_expected) });
      toast.success('Item added');
      setAddForm({ product_id: '', qty_expected: '' });
      setShowAdd(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error adding item'); }
  };

  const handleUpdateItem = async (item) => {
    try {
      await receiptsAPI.updateItem(id, item.id, editingItem);
      toast.success('Item updated');
      setEditingItem(null);
      load();
    } catch { toast.error('Error updating item'); }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await receiptsAPI.deleteItem(id, itemId);
      toast.success('Item removed');
      load();
    } catch { toast.error('Error removing item'); }
  };

  const handleSaveHeader = async () => {
    try {
      await receiptsAPI.update(id, headerForm);
      toast.success('Receipt updated');
      setEditHeader(false);
      load();
    } catch { toast.error('Error updating receipt'); }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!receipt) return <div className="page-body">Receipt not found</div>;

  const isDone = receipt.status === 'Done';
  const canEdit = !isDone;

  return (
    <>
      <div className="detail-bar">
        <button className="back-btn" onClick={() => navigate('/receipts')}><ChevronLeft size={16} /> Receipts</button>
        <span className="reference-tag">{receipt.reference}</span>
        <StatusBadge status={receipt.status} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => setEditHeader(!editHeader)}><Edit2 size={12} /> Edit</button>}
          {canEdit && receipt.items?.length > 0 && (
            <button className="btn btn-success" onClick={handleValidate} disabled={validating}>
              {validating ? <div className="spinner" /> : <><CheckCircle size={14} /> Validate</>}
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Header info */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">Receipt Details</div>
          </div>
          <div className="card-body">
            {editHeader ? (
              <div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <input className="form-control" value={headerForm.supplier} onChange={e => setHeaderForm(f => ({ ...f, supplier: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheduled Date</label>
                    <input className="form-control" type="date" value={headerForm.scheduled_date} onChange={e => setHeaderForm(f => ({ ...f, scheduled_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" value={headerForm.notes} onChange={e => setHeaderForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveHeader}><Save size={12} /> Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditHeader(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="grid-3">
                <div>
                  <div className="form-label">Supplier</div>
                  <div style={{ color: 'var(--text)', fontWeight: 500 }}>{receipt.supplier || '—'}</div>
                </div>
                <div>
                  <div className="form-label">Warehouse</div>
                  <div style={{ color: 'var(--text)', fontWeight: 500 }}>{receipt.warehouse || '—'}</div>
                </div>
                <div>
                  <div className="form-label">Scheduled Date</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{receipt.scheduled_date || '—'}</div>
                </div>
                <div>
                  <div className="form-label">Status</div>
                  <StatusBadge status={receipt.status} />
                </div>
                <div>
                  <div className="form-label">Done Date</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{receipt.done_date ? receipt.done_date.split('T')[0] : '—'}</div>
                </div>
                <div>
                  <div className="form-label">Notes</div>
                  <div style={{ color: 'var(--text3)', fontSize: 13 }}>{receipt.notes || '—'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Products</div>
            {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(!showAdd)}><Plus size={12} /> Add Product</button>}
          </div>

          {showAdd && (
            <div className="items-add-row">
              <select className="form-control" style={{ maxWidth: 260 }} value={addForm.product_id} onChange={e => setAddForm(f => ({ ...f, product_id: e.target.value }))}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <input className="form-control" style={{ maxWidth: 120 }} type="number" min={1} placeholder="Qty" value={addForm.qty_expected} onChange={e => setAddForm(f => ({ ...f, qty_expected: e.target.value }))} />
              <button className="btn btn-primary btn-sm" onClick={handleAddItem}>Add</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}><X size={13} /></button>
            </div>
          )}

          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            {receipt.items?.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><p>No products added yet</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Expected Qty</th>
                    <th>Received Qty</th>
                    <th>Unit</th>
                    {canEdit && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {receipt.items?.map(item => (
                    <tr key={item.id}>
                      <td className="text-main">{item.product_name}</td>
                      <td className="mono">{item.product_sku}</td>
                      <td>
                        {editingItem?.id === item.id
                          ? <input className="form-control" style={{ width: 90 }} type="number" value={editingItem.qty_expected} onChange={e => setEditingItem(ei => ({ ...ei, qty_expected: e.target.value }))} />
                          : <span style={{ fontFamily: 'var(--font-mono)' }}>{item.qty_expected}</span>}
                      </td>
                      <td>
                        {editingItem?.id === item.id
                          ? <input className="form-control" style={{ width: 90 }} type="number" value={editingItem.qty_received} onChange={e => setEditingItem(ei => ({ ...ei, qty_received: e.target.value }))} />
                          : <span style={{ fontFamily: 'var(--font-mono)', color: item.qty_received ? 'var(--green)' : 'var(--text3)' }}>{item.qty_received || 0}</span>}
                      </td>
                      <td style={{ color: 'var(--text3)' }}>{item.unit}</td>
                      {canEdit && (
                        <td>
                          {editingItem?.id === item.id ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleUpdateItem(item)}>Save</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingItem({ ...item })}><Edit2 size={13} /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDeleteItem(item.id)}><Trash2 size={13} /></button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {isDone && (
          <div className="alert success mt-3">
            <CheckCircle size={15} />
            <span>This receipt has been validated. Stock has been updated accordingly.</span>
          </div>
        )}
      </div>
    </>
  );
}
