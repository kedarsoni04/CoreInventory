import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import { Package, AlertTriangle, XCircle, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, TrendingUp } from 'lucide-react';

function StatusBadge({ type }) {
  const map = { receipt: 'blue', delivery: 'orange', transfer: 'yellow', adjustment: 'gray' };
  return <span className={`badge ${map[type] || 'draft'}`}>{type}</span>;
}

function QtyChip({ qty }) {
  const color = qty > 0 ? 'green' : qty < 0 ? 'red' : 'gray';
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: `var(--${color})` }}>{qty > 0 ? '+' : ''}{qty}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.get().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!data) return null;

  const { kpis, recentActivity } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Real-time snapshot of your inventory operations</div>
        </div>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text3)', alignSelf: 'flex-end' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="page-body">
        <div className="kpi-grid">
          <div className="kpi-card yellow" style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
            <div className="kpi-label">Total Products</div>
            <div className="kpi-value">{kpis.totalProducts}</div>
            <div className="kpi-icon"><Package /></div>
          </div>
          <div className="kpi-card orange" style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
            <div className="kpi-label">Low Stock</div>
            <div className="kpi-value orange" style={{ color: 'var(--orange)' }}>{kpis.lowStock}</div>
            <div className="kpi-icon"><AlertTriangle /></div>
          </div>
          <div className="kpi-card red" style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
            <div className="kpi-label">Out of Stock</div>
            <div className="kpi-value red">{kpis.outOfStock}</div>
            <div className="kpi-icon"><XCircle /></div>
          </div>
          <div className="kpi-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/receipts')}>
            <div className="kpi-label">Pending Receipts</div>
            <div className="kpi-value">{kpis.pendingReceipts}</div>
            <div className="kpi-icon"><ArrowDownToLine /></div>
          </div>
          <div className="kpi-card orange" style={{ cursor: 'pointer' }} onClick={() => navigate('/deliveries')}>
            <div className="kpi-label">Pending Deliveries</div>
            <div className="kpi-value">{kpis.pendingDeliveries}</div>
            <div className="kpi-icon"><ArrowUpFromLine /></div>
          </div>
          <div className="kpi-card green" style={{ cursor: 'pointer' }} onClick={() => navigate('/transfers')}>
            <div className="kpi-label">Pending Transfers</div>
            <div className="kpi-value green">{kpis.pendingTransfers}</div>
            <div className="kpi-icon"><ArrowLeftRight /></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} style={{ color: 'var(--accent)' }} /> Recent Activity
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>View all</button>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            {recentActivity.length === 0 ? (
              <div className="empty-state"><p>No recent activity</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Product</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Qty</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map(e => (
                    <tr key={e.id}>
                      <td><StatusBadge type={e.type} /></td>
                      <td className="mono">{e.reference}</td>
                      <td className="text-main">{e.product_name}</td>
                      <td style={{ color: 'var(--text3)' }}>{e.from_location}</td>
                      <td style={{ color: 'var(--text3)' }}>{e.to_location}</td>
                      <td><QtyChip qty={e.qty} /></td>
                      <td className="mono" style={{ color: 'var(--text3)' }}>{e.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
