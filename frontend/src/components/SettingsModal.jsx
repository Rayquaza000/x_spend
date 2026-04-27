import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function SettingsModal({ onClose }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ username: user?.username || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const setP = (f) => (e) => setProfile(p => ({ ...p, [f]: e.target.value }));
  const setPw = (f) => (e) => setPasswords(p => ({ ...p, [f]: e.target.value }));

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleProfileSave = async () => {
    if (!profile.username || !profile.email) return showMsg('All fields required', 'error');
    setLoading(true);
    try {
      await axios.put('/api/auth/profile', profile);
      showMsg('Profile updated successfully');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm)
      return showMsg('All password fields are required', 'error');
    if (passwords.newPass !== passwords.confirm)
      return showMsg('New passwords do not match', 'error');
    if (passwords.newPass.length < 6)
      return showMsg('Password must be at least 6 characters', 'error');
    setLoading(true);
    try {
      await axios.put('/api/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      setPasswords({ current: '', newPass: '', confirm: '' });
      showMsg('Password changed successfully');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to change password', 'error');
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account and ALL transactions? This cannot be undone.')) return;
    try {
      await axios.delete('/api/auth/account');
      logout();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to delete account', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">⚙️ Settings</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {['profile', 'password', 'account'].map(t => (
            <button
              key={t}
              className={`modal-tab${tab === t ? ' active' : ''}`}
              onClick={() => { setTab(t); setMsg({ text: '', type: '' }); }}
            >
              {t === 'profile' ? '👤 Profile' : t === 'password' ? '🔑 Password' : '⚠️ Account'}
            </button>
          ))}
        </div>

        {msg.text && (
          <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'} style={{ margin: '0 0 12px' }}>
            {msg.text}
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={profile.username} onChange={setP('username')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={profile.email} onChange={setP('email')} />
            </div>
            <button className="modal-save-btn" onClick={handleProfileSave} disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={passwords.current} onChange={setPw('current')} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={passwords.newPass} onChange={setPw('newPass')} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={passwords.confirm} onChange={setPw('confirm')} />
            </div>
            <button className="modal-save-btn" onClick={handlePasswordChange} disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        )}

        {/* Account tab */}
        {tab === 'account' && (
          <div className="modal-body">
            <div style={{ background: '#fce4e4', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#8B1C1C', marginBottom: 6 }}>Danger Zone</div>
              <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 12 }}>
                Deleting your account is permanent and will remove all your transactions.
              </div>
              <button
                onClick={handleDeleteAccount}
                style={{ background: '#8B1C1C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Delete My Account
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#777' }}>
              Logged in as <strong>{user?.email}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
