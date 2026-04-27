import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const shortId = (id) => id?.slice(-8).toUpperCase();

export default function Details() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)     params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (startDate)  params.set('startDate', startDate);
      if (endDate)    params.set('endDate', endDate);

      const { data } = await axios.get(`/api/transactions?${params}`);
      setTransactions(data.transactions);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user, search, typeFilter, startDate, endDate, page]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchTransactions();
  }, [user, fetchTransactions, navigate]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, typeFilter, startDate, endDate]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/transactions/${id}`);
      fetchTransactions();
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="page-container">
      {/* Search & filters */}
      <div className="details-header">
        <div className="search-bar">
          <span>🔍</span>
          <input
            placeholder="Search by category, description, mode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
            >✕</button>
          )}
        </div>

        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          type="date"
          className="filter-select"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          title="From date"
        />
        <input
          type="date"
          className="filter-select"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          title="To date"
        />

        {(search || typeFilter || startDate || endDate) && (
          <button
            className="filter-select"
            onClick={() => { setSearch(''); setTypeFilter(''); setStartDate(''); setEndDate(''); }}
            style={{ cursor: 'pointer', color: '#8B1C1C' }}
          >
            Clear
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#777', whiteSpace: 'nowrap' }}>
          {total} transaction{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading">Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            {search || typeFilter || startDate || endDate
              ? 'No transactions match your search'
              : 'No transactions yet. Add one from the Dashboard!'}
          </div>
        ) : (
          <table className="txn-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{shortId(t._id)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                  <td>{t.description || '—'}</td>
                  <td>
                    <span className={`badge badge-${t.type}`}>{t.category}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: t.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)' }}>
                    {t.type === 'income' ? '+' : '-'}₹{fmt(t.amount)}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{t.mode?.replace('_', ' ')}</td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>₹{fmt(t.balance)}</td>
                  <td>
                    <button
                      className="del-btn"
                      onClick={() => handleDelete(t._id)}
                      disabled={deleting === t._id}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button
            className="filter-select"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ cursor: 'pointer' }}
          >← Prev</button>
          <span style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.6)', borderRadius: 9, fontSize: '0.88rem' }}>
            {page} / {pages}
          </span>
          <button
            className="filter-select"
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            style={{ cursor: 'pointer' }}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
