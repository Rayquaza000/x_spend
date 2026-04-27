import { useState } from 'react';
import axios from 'axios';

const CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'],
  income:  ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Rental', 'Other'],
};

const MODES = ['cash', 'card', 'upi', 'bank_transfer', 'other'];

const formatDateTime = (d) => {
  const opts = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(d).toLocaleString('en-IN', opts);
};

export default function TransactionForm({ type, onSuccess }) {
  const isExpense = type === 'expense';
  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    mode: 'cash',
    date: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.amount || !form.category) {
      setError('Amount and category are required');
      return;
    }
    if (isNaN(form.amount) || Number(form.amount) <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/transactions', { ...form, type });
      setForm({ amount: '', category: '', description: '', mode: 'cash', date: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 16) });
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">{isExpense ? 'Expense' : 'Income'}</div>
      {error && <div className="error-msg">{error}</div>}
      <div className="txn-form">
        {/* Col 1, Row 1 */}
        <input
          className="txn-form-input"
          placeholder="amount"
          type="number"
          min="0"
          value={form.amount}
          onChange={set('amount')}
        />

        {/* Col 2 rows 1-2: Note textarea */}
        <textarea
          className="txn-form-input txn-form-note"
          placeholder="Note"
          value={form.description}
          onChange={set('description')}
        />

        {/* Col 1, Row 2 */}
        <select
          className="txn-form-input"
          value={form.category}
          onChange={set('category')}
          style={{ gridColumn: '1/2' }}
        >
          <option value="">category</option>
          {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Col 3, Row 2: Mode */}
        <select
          className="txn-form-input txn-form-mode"
          value={form.mode}
          onChange={set('mode')}
        >
          {MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
        </select>

        {/* Row 3: date-time spanning cols 1-2 */}
        <input
          className="txn-form-input txn-form-date"
          type="datetime-local"
          value={form.date}
          onChange={set('date')}
          style={{ gridColumn: '1/3' }}
        />

        {/* Footer row */}
        <div className="txn-form-footer">
          <button
            className={`add-btn ${isExpense ? 'add-btn-expense' : 'add-btn-income'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Adding…' : `+Add`}
          </button>
        </div>
      </div>
    </div>
  );
}
