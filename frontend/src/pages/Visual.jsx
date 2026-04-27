import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#4A7C1A','#8B1C1C','#1976D2','#E65100','#7B1FA2','#00796B','#F57F17','#455A64'];
const fmt = (n) => '₹' + new Intl.NumberFormat('en-IN').format(n || 0);

export default function Visual() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await axios.get('/api/summary');
      setSummary(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSummary();
  }, [user, fetchSummary, navigate]);

  if (loading) return <div className="page-container"><div className="loading">Loading charts…</div></div>;
  if (!summary) return null;

  const pieData = [
    { name: 'Income', value: summary.income },
    { name: 'Expense', value: summary.expense },
  ];

  const catData = summary.categoryBreakdown
    .map(c => ({ name: c.category, income: c.income || 0, expense: c.expense || 0 }))
    .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
    .slice(0, 8);

  const monthData = summary.monthlyBreakdown.map(m => ({
    name: m.month,
    income: m.income,
    expense: m.expense,
    balance: m.income - m.expense,
  }));

  return (
    <div className="page-container">
      {/* Top summary */}
      <div className="charts-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Income', val: summary.income, cls: 'income' },
          { label: 'Total Expense', val: summary.expense, cls: 'expense' },
          { label: 'Net Balance', val: Math.abs(summary.balance), cls: summary.balance >= 0 ? 'income' : 'expense' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: '#777', fontSize: '0.85rem', marginBottom: 6 }}>{item.label}</div>
            <div className={`summary-value ${item.cls}`} style={{ fontSize: '1.4rem', border: 'none', background: 'none', padding: 0 }}>
              {fmt(item.val)}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        {/* Income vs Expense Pie */}
        <div className="card">
          <div className="card-title">Income vs Expense</div>
          {summary.income === 0 && summary.expense === 0 ? (
            <div className="empty-state">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#4A7C1A' : '#8B1C1C'} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown Bar */}
        <div className="card">
          <div className="card-title">Category Breakdown</div>
          {catData.length === 0 ? (
            <div className="empty-state">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={catData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Bar dataKey="income" fill="#4A7C1A" name="Income" radius={[3,3,0,0]} />
                <Bar dataKey="expense" fill="#8B1C1C" name="Expense" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Trend Line */}
        <div className="card" style={{ gridColumn: monthData.length > 0 ? '1 / -1' : 'auto' }}>
          <div className="card-title">Monthly Trend</div>
          {monthData.length === 0 ? (
            <div className="empty-state">No monthly data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#4A7C1A" strokeWidth={2.5} dot={{ r: 4 }} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#8B1C1C" strokeWidth={2.5} dot={{ r: 4 }} name="Expense" />
                <Line type="monotone" dataKey="balance" stroke="#1976D2" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} name="Balance" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
