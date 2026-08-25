import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'],
  income:  ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Rental', 'Other'],
};

const DEFAULT_MODES = ['cash', 'card', 'upi', 'bank_transfer', 'other'];

const getNowIST = () => {
  const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istDate.toISOString().slice(0, 16);
};

function CategorySelector({ type, value, onChange }) {
  const defaultCats = CATEGORIES[type] || [];
  const [categories, setCategories] = useState(defaultCats);
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [adding, setAdding] = useState(false);
  const ref = useRef();

  useEffect(() => {
    axios.get('/api/auth/categories')
      .then(({ data }) => {
        const customForType = (data && data[type]) ? data[type] : [];
        const merged = [...defaultCats, ...customForType.filter(c => !defaultCats.some(d => d.toLowerCase() === c.toLowerCase()))];
        setCategories(merged);
      })
      .catch(() => {});
  }, [type]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (c) => {
    onChange(c);
    setOpen(false);
  };

  const handleAddCustom = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    setAdding(true);
    try {
      const { data } = await axios.post('/api/auth/categories', { category: formatted, type });
      const customForType = (data && data[type]) ? data[type] : [];
      const merged = [...defaultCats, ...customForType.filter(c => !defaultCats.some(d => d.toLowerCase() === c.toLowerCase()))];
      setCategories(merged);
      onChange(formatted);
      setCustomInput('');
      setOpen(false);
    } catch {}
    finally { setAdding(false); }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="txn-form-input"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left', cursor: 'pointer', background: '#fff',
          color: value ? 'var(--text-dark)' : 'var(--text-light)'
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || 'category'}
        </span>
        <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--text-light)' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid #ddd', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 250, overflowY: 'auto'
        }}>
          {/* Existing categories */}
          {categories.map(c => (
            <div
              key={c}
              onClick={() => handleSelect(c)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: '0.88rem',
                background: value === c ? '#f0f0f0' : '#fff',
                fontWeight: value === c ? 600 : 400
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = value === c ? '#f0f0f0' : '#fff'}
            >
              {c}
            </div>
          ))}

          {/* Custom category input */}
          <div style={{ borderTop: '1px solid #eee', padding: '8px', background: '#fff', position: 'sticky', bottom: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>+ Add custom category</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                style={{ flex: 1, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.83rem', outline: 'none' }}
                placeholder={type === 'expense' ? 'e.g. Groceries' : 'e.g. Bonus'}
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={adding || !customInput.trim()}
                style={{
                  background: '#333', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                }}
              >
                {adding ? '…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeSelector({ value, onChange }) {
  const [modes, setModes] = useState(DEFAULT_MODES);
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [adding, setAdding] = useState(false);
  const ref = useRef();

  useEffect(() => {
    axios.get('/api/auth/modes')
      .then(({ data }) => {
        const merged = [...DEFAULT_MODES, ...data.filter(m => !DEFAULT_MODES.includes(m))];
        setModes(merged);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (m) => {
    onChange(m);
    setOpen(false);
  };

  const handleAddCustom = async () => {
    const trimmed = customInput.trim().toLowerCase();
    if (!trimmed) return;
    setAdding(true);
    try {
      const { data } = await axios.post('/api/auth/modes', { mode: trimmed });
      const merged = [...DEFAULT_MODES, ...data.filter(m => !DEFAULT_MODES.includes(m))];
      setModes(merged);
      onChange(trimmed);
      setCustomInput('');
      setOpen(false);
    } catch {}
    finally { setAdding(false); }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="txn-form-input"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left', cursor: 'pointer', textTransform: 'capitalize', background: '#fff'
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(value || 'cash').replace('_', ' ')}
        </span>
        <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--text-light)' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid #ddd', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 250, overflowY: 'auto'
        }}>
          {/* Existing modes */}
          {modes.map(m => (
            <div
              key={m}
              onClick={() => handleSelect(m)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: '0.88rem',
                textTransform: 'capitalize', background: value === m ? '#f0f0f0' : '#fff',
                fontWeight: value === m ? 600 : 400
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = value === m ? '#f0f0f0' : '#fff'}
            >
              {m.replace('_', ' ')}
            </div>
          ))}

          {/* Custom mode input */}
          <div style={{ borderTop: '1px solid #eee', padding: '8px', background: '#fff', position: 'sticky', bottom: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>+ Add custom mode</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                style={{ flex: 1, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.83rem', outline: 'none' }}
                placeholder="e.g. cheque"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={adding || !customInput.trim()}
                style={{
                  background: '#333', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                }}
              >
                {adding ? '…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionForm({ type, onSuccess }) {
  const isExpense = type === 'expense';
  const [form, setForm] = useState({
    amount: '', category: '', description: '', mode: 'cash', date: getNowIST(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.amount || !form.category) { setError('Amount and category are required'); return; }
    if (isNaN(form.amount) || Number(form.amount) <= 0) { setError('Enter a valid positive amount'); return; }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/transactions', { ...form, type });
      setForm({ amount: '', category: '', description: '', mode: 'cash', date: getNowIST() });
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add transaction');
    } finally { setLoading(false); }
  };

  return (
    <div className="card">
      <div className="card-title">{isExpense ? 'Expense' : 'Income'}</div>
      {error && <div className="error-msg">{error}</div>}
      <div className="txn-form">
        <input
          className="txn-form-input"
          placeholder="amount"
          type="number"
          min="0"
          value={form.amount}
          onChange={set('amount')}
        />
        <CategorySelector
          type={type}
          value={form.category}
          onChange={category => setForm(f => ({ ...f, category }))}
        />
        <ModeSelector
          value={form.mode}
          onChange={mode => setForm(f => ({ ...f, mode }))}
        />
        <textarea
          className="txn-form-input txn-form-note"
          placeholder="Note"
          value={form.description}
          onChange={set('description')}
        />
        <input
          className="txn-form-input txn-form-date"
          type="datetime-local"
          value={form.date}
          onChange={set('date')}
        />
        <div className="txn-form-footer">
          <button
            className={`add-btn ${isExpense ? 'add-btn-expense' : 'add-btn-income'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Adding…' : '+Add'}
          </button>
        </div>
      </div>
    </div>
  );
}