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
    { name: 'Income', value: summary.income || 0 },
    { name: 'Expense', value: summary.expense || 0 },
  ];

  const catData = Array.isArray(summary.categoryBreakdown)
    ? summary.categoryBreakdown
        .map(c => ({ name: c.category, income: c.income || 0, expense: c.expense || 0 }))
        .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
        .slice(0, 8)
    : [];

  const monthData = Array.isArray(summary.monthlyBreakdown)
    ? summary.monthlyBreakdown.map(m => ({
        name: m.month,
        income: m.income,
        expense: m.expense,
        balance: m.income - m.expense,
      }))
    : [];

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

        {/* Modes of Payment Breakdown Bar Chart */}
        <div className="card">
          <div className="card-title">Modes of Payment Breakdown</div>
          {!Array.isArray(summary.modeBreakdown) || summary.modeBreakdown.length === 0 ? (
            <div className="empty-state">No payment mode data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={summary.modeBreakdown.map(m => ({
                name: m.mode.replace('_', ' '),
                income: m.income,
                expense: m.expense,
                balance: m.balance
              })).sort((a, b) => (b.income + b.expense) - (a.income + a.expense))} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} style={{ textTransform: 'capitalize' }} />
                <YAxis tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Bar dataKey="income" fill="#4A7C1A" name="Income" radius={[3,3,0,0]} />
                <Bar dataKey="expense" fill="#8B1C1C" name="Expense" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Modes Balance Table */}
        <div className="card">
          <div className="card-title">Payment Modes Balance</div>
          {!Array.isArray(summary.modeBreakdown) || summary.modeBreakdown.length === 0 ? (
            <div className="empty-state">No payment mode data available</div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
              <table className="txn-table" style={{ minWidth: 'auto', width: '100%', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'transparent' }}>
                    <th style={{ padding: '8px 10px', background: 'transparent' }}>Mode</th>
                    <th style={{ padding: '8px 10px', background: 'transparent', textAlign: 'right' }}>Income</th>
                    <th style={{ padding: '8px 10px', background: 'transparent', textAlign: 'right' }}>Expense</th>
                    <th style={{ padding: '8px 10px', background: 'transparent', textAlign: 'right' }}>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.modeBreakdown
                    .slice()
                    .sort((a, b) => b.income + b.expense - (a.income + a.expense))
                    .map(item => (
                      <tr key={item.mode}>
                        <td style={{ padding: '8px 10px', textTransform: 'capitalize', fontWeight: 600 }}>
                          {item.mode.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--income-color)', fontWeight: 600 }}>
                          {fmt(item.income).replace('₹', '')}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--expense-color)', fontWeight: 600 }}>
                          {fmt(item.expense).replace('₹', '')}
                        </td>
                        <td style={{
                          padding: '8px 10px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: item.balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)'
                        }}>
                          {item.balance < 0 ? '-' : ''}{fmt(Math.abs(item.balance)).replace('₹', '')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
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
