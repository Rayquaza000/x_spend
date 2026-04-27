import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Details', path: '/details' },
  { label: 'Visual', path: '/visual' },
  { label: 'Recent Activity', path: '/recent' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">x_spend</div>

        <div className="navbar-links">
          {NAV_LINKS.map(link => (
            <button
              key={link.path}
              className={`navbar-link${location.pathname === link.path ? ' active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="navbar-spacer" />

        <div className="navbar-actions">
          <button
            className={`navbar-icon-btn${showSettings ? ' active' : ''}`}
            title="Settings"
            onClick={() => user ? setShowSettings(true) : navigate('/login')}
          >
            ⚙️
          </button>
          {user ? (
            <button className="navbar-login-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="navbar-login-btn" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </nav>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
