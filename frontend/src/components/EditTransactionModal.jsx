import { useState } from 'react';
import axios from 'axios';
import { CategorySelector, ModeSelector } from './TransactionForm';

const formatForDateTimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function EditTransactionModal({ transaction, onClose, onSuccess }) {
  const [type, setType] = useState(transaction?.type || 'expense');
  const [amount, setAmount] = useState(transaction?.amount ?? '');
  const [category, setCategory] = useState(transaction?.category || '');
  const [mode, setMode] = useState(transaction?.mode || 'cash');
  const [description, setDescription] = useState(transaction?.description || '');
  const [date, setDate] = useState(() => formatForDateTimeLocal(transaction?.date));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await axios.put(`/api/transactions/${transaction._id}`, {
        type,
        amount: Number(amount),
        category,
        mode,
        description,
        date: date ? new Date(date) : new Date(),
      });
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">✏️ Edit Transaction</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Type Toggle Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`modal-tab ${type === 'expense' ? 'active' : ''}`}
            style={{
              flex: 1,
              textAlign: 'center',
              borderColor: type === 'expense' ? 'var(--expense-color)' : '#ddd',
              color: type === 'expense' ? 'var(--expense-color)' : 'var(--text-mid)',
              fontWeight: type === 'expense' ? 700 : 500,
            }}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
          <button
            type="button"
            className={`modal-tab ${type === 'income' ? 'active' : ''}`}
            style={{
              flex: 1,
              textAlign: 'center',
              borderColor: type === 'income' ? 'var(--income-color)' : '#ddd',
              color: type === 'income' ? 'var(--income-color)' : 'var(--text-mid)',
              fontWeight: type === 'income' ? 700 : 500,
            }}
            onClick={() => setType('income')}
          >
            Income
          </button>
        </div>

        {error && (
          <div className="error-msg" style={{ margin: '0 0 12px' }}>
            {error}
          </div>
        )}

        <div className="modal-body" style={{ gap: 12 }}>
          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              min="0"
              className="form-input"
              placeholder="e.g. 500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <CategorySelector
              type={type}
              value={category}
              onChange={setCategory}
            />
          </div>

          {/* Payment Mode */}
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <ModeSelector
              value={mode}
              onChange={setMode}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Note / Description</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="Optional description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Date & Time */}
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            className="modal-save-btn"
            onClick={handleSave}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
