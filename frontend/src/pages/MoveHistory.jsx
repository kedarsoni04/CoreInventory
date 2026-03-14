import React, { useEffect, useState } from 'react';
import { ledgerAPI, productsAPI } from '../utils/api';
import { Search, History } from 'lucide-react';

function TypeBadge({ type }) {
  const map = { receipt: 'blue', delivery: 'orange', transfer: 'yellow', adjustment: 'gray' };
  return <span className={`badge ${map[type] || 'draft'}`}>{type}</span>;
}

export default function MoveHistory() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('');

  useEffect(() => {
    Promise.all([ledgerAPI.list(), productsAPI.list()])
      .then(([lr, pr]) => { setEntries(lr.data); setProducts(pr.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.reference?.toLowerCase().includes(search.toLowerCase()) || e.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    const matchProduct = !productFilter || e.product_id === productFilter;
    return matchSearch && matchType && matchProduct;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Move History</div>
          <div className="page-sub">Complete stock ledger of all movements</div>
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar mb-4">
          <div className="search-input">
            <Search />
            <input placeholder="Search reference, product..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['all', 'receipt', 'delivery', 'transfer', 'adjustment'].map(t => (
            <button key={t} className={`chip${typeFilter === t ? ' active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <select className="form-control" style={{ maxWidth: 200 }} value={productFilter} onChange={e => setProductFilter(e.target.value)}>
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><History /><p>No history entries found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Qty</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{e.date}</td>
                    <td><TypeBadge type={e.type} /></td>
                    <td className="mono" style={{ color: 'var(--accent)', fontSize: 12 }}>{e.reference}</td>
                    <td className="text-main">{e.product_name}</td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{e.product_sku}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>{e.from_location}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>{e.to_location}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: e.qty > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {e.qty > 0 ? '+' : ''}{e.qty}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{e.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
