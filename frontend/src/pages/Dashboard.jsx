import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TransactionForm from '../components/TransactionForm';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

// Default to current month
const getDefaultDates = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end   = new Date().toISOString().slice(0, 10);
  return { start, end };
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [recent, setRecent] = useState([]);
  const [dates, setDates] = useState(getDefaultDates);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    setLoadingSummary(true);
    try {
      const { data } = await axios.get(`/api/summary?startDate=${dates.start}&endDate=${dates.end}`);
      setSummary(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingSummary(false);
    }
  }, [user, dates]);

  const fetchRecent = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/transactions/recent');
      setRecent(data);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSummary();
    fetchRecent();
  }, [user, fetchSummary, fetchRecent, navigate]);

  const onSuccess = () => {
    fetchSummary();
    fetchRecent();
  };

  const formatRange = () => {
    const s = new Date(dates.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const e = new Date(dates.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${s} – ${e}`;
  };

  return (
    <div className="page-container">
      <div className="dashboard-grid">
        {/* Left: Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TransactionForm type="expense" onSuccess={onSuccess} />
          <TransactionForm type="income"  onSuccess={onSuccess} />
        </div>

        {/* Right: Summary + Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Card */}
          <div className="card">
            {/* Date Range Picker */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input
                type="date"
                className="txn-form-input"
                value={dates.start}
                onChange={e => setDates(d => ({ ...d, start: e.target.value }))}
                style={{ flex: 1, minWidth: 130 }}
              />
              <span style={{ alignSelf: 'center', color: '#888' }}>–</span>
              <input
                type="date"
                className="txn-form-input"
                value={dates.end}
                onChange={e => setDates(d => ({ ...d, end: e.target.value }))}
                style={{ flex: 1, minWidth: 130 }}
              />
            </div>

            {loadingSummary ? (
              <div className="loading">Loading…</div>
            ) : (
              <>
                <div className="summary-row">
                  <div className="summary-label">Income</div>
                  <div className="summary-value income">₹{fmt(summary.income)}</div>
                </div>
                <div className="summary-row">
                  <div className="summary-label">Expense</div>
                  <div className="summary-value expense">₹{fmt(summary.expense)}</div>
                </div>
                <div className="summary-row">
                  <div className="summary-label">Balance</div>
                  <div className={`summary-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
                    ₹{fmt(Math.abs(summary.balance))}{summary.balance < 0 ? ' (deficit)' : ''}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Activity Card */}
          <div className="card">
            <div className="card-title">Recent Activity</div>
            {recent.length === 0 ? (
              <div className="empty-state">No recent transactions</div>
            ) : (
              <div className="recent-activity-list">
                {recent.map(t => (
                  <div key={t._id} className="recent-item">
                    <div className="recent-item-left">
                      <div className="recent-item-cat">{t.category}</div>
                      <div className="recent-item-date">{fmtDate(t.date)}</div>
                    </div>
                    <div className={`recent-item-amt ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}₹{fmt(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
