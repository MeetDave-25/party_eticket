import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { sound } from './services/audio';
import { Moon, Sun } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import UserPortal from './components/UserPortal';
import AdminPortal from './components/AdminPortal';

const EVENT_INFO = {
  name: 'VASTEGUNA HUIYAA',
  subtitle: 'FRESHERS EDITION',
  date: 'Coming Soon',
  time: 'Prepare Your Best Outfit',
  venue: 'Main Campus Ground',
  organizers: 'Dhawan Satani & Jadav Dashrath',
  contact: '9714509181, 9624487630',
};

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'auth' | 'user' | 'admin'
  const [authOpts, setAuthOpts] = useState({});
  const [scanCode, setScanCode] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // Initialize storage with demo data on first load
  useEffect(() => {
    storage.ensureInitialized();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    sound.playClick();
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const navigate = (dest, opts = {}) => {
    setAuthOpts(opts);
    setPage(dest);
    window.scrollTo(0, 0);
  };

  const quickLogin = (attendeeId) => {
    const attendees = storage.getAttendees();
    const found = attendees.find(a => a.id === attendeeId);
    if (found) {
      storage.setActiveUser(found);
      setPage('user');
    }
  };

  const handleLoginSuccess = (role, user = null) => {
    if (role === 'admin') {
      setPage('admin');
    } else {
      if (user) storage.setActiveUser(user);
      setPage('user');
    }
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    storage.clearActiveUser();
    setPage('landing');
    setScanCode(null);
    window.scrollTo(0, 0);
  };

  const switchToAdmin = (code = null) => {
    setScanCode(code);
    setPage('admin');
    window.scrollTo(0, 0);
  };

  const switchToUser = () => {
    setPage('user');
    window.scrollTo(0, 0);
  };

  return (
    <>
      {page === 'landing' && (
        <LandingPage
          onNavigate={navigate}
          onQuickLogin={quickLogin}
        />
      )}

      {page === 'auth' && (
        <AuthPage
          onNavigate={navigate}
          onLoginSuccess={handleLoginSuccess}
          defaultTab={authOpts.defaultTab || 'attendee'}
        />
      )}

      {page === 'user' && (
        <UserPortal
          eventInfo={EVENT_INFO}
          onLogout={handleLogout}
          onSwitchToAdmin={switchToAdmin}
        />
      )}

      {page === 'admin' && (
        <AdminPortal
          eventInfo={EVENT_INFO}
          onLogout={handleLogout}
          onSwitchToAttendee={switchToUser}
          initialScanCode={scanCode}
        />
      )}

      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="btn-secondary"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 50,
          height: 50,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 0
        }}
        title="Toggle Theme"
      >
        {isDark ? <Sun size={24} color="var(--purple-main)" /> : <Moon size={24} color="var(--purple-main)" />}
      </button>
    </>
  );
}
