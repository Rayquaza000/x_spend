import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

const ICONS = {
  income:  { Food: '🍔', Salary: '💼', Freelance: '💻', Investment: '📈', Business: '🏢', Gift: '🎁', Rental: '🏠', Other: '💰' },
  expense: { Food: '🍔', Transport: '🚗', Shopping: '🛍', Entertainment: '🎬', Bills: '📄', Health: '❤️', Education: '📚', Other: '💸' },
};

const getIcon = (type, cat) => ICONS[type]?.[cat] || (type === 'income' ? '💰' : '💸');

export default function RecentActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 30 });
      if (search) params.set('search', search);
      const { data } = await axios.get(`/api/transactions?${params}`);
      setTransactions(data.transactions);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user, search]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAll();
  }, [user, fetchAll, navigate]);

  return (
    <div className="page-container">
      {/* Search bar */}
      <div className="details-header" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span>🔍</span>
          <input
            placeholder="Search recent activity…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>✕</button>
          )}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#777' }}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loading">Loading activity…</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          {search ? 'No transactions match your search' : 'No transactions yet'}
        </div>
      ) : (
        <div className="activity-list">
          {transactions.map(t => (
            <div key={t._id} className="activity-item">
              <div className={`activity-icon ${t.type}`}>
                {getIcon(t.type, t.category)}
              </div>
              <div className="activity-info">
                <div className="activity-cat">{t.category}</div>
                {t.description && <div className="activity-desc">{t.description}</div>}
                <div className="activity-desc" style={{ marginTop: 2 }}>
                  via {t.mode?.replace('_', ' ')}
                </div>
              </div>
              <div className="activity-meta">
                <div className={`activity-amt ${t.type}`} style={{ color: t.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)' }}>
                  {t.type === 'income' ? '+' : '-'}₹{fmt(t.amount)}
                </div>
                <div className="activity-date">{fmtDate(t.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
