import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { sound } from './services/audio';
import { Moon, Sun } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import UserPortal from './components/UserPortal';
import AdminPortal from './components/AdminPortal';
import PublicRegistration from './components/PublicRegistration';

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
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (['landing', 'auth', 'user', 'admin', 'public_register'].includes(hash)) {
      if (hash === 'user' && !storage.getActiveUser()) {
        return 'auth';
      }
      return hash;
    }
    return 'landing';
  });
  const [adminRole, setAdminRole] = useState(null); // 'admin' | 'bouncer'
  const [authOpts, setAuthOpts] = useState({});
  const [scanCode, setScanCode] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // Initialize storage and sync with browser history
  useEffect(() => {
    storage.ensureInitialized();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page }, '', `#${page}`);
    }

    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        let dest = event.state.page;
        if (dest === 'user' && !storage.getActiveUser()) {
          dest = 'auth';
        }
        if (dest === 'admin' && !event.state.adminRole && !adminRole) {
          dest = 'auth';
        }
        setPage(dest);
        if (event.state.opts) setAuthOpts(event.state.opts);
        if (event.state.adminRole) setAdminRole(event.state.adminRole);
      } else {
        const hash = window.location.hash.replace('#', '');
        let dest = hash || 'landing';
        if (dest === 'user' && !storage.getActiveUser()) {
          dest = 'auth';
        }
        setPage(dest);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [adminRole]);

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
    let target = dest;
    if (target === 'user' && !storage.getActiveUser()) {
      target = 'auth';
    }
    if (target === 'admin' && !adminRole) {
      target = 'auth';
      opts = { ...opts, defaultTab: 'admin' };
    }
    setAuthOpts(opts);
    setPage(target);
    window.history.pushState({ page: target, opts, adminRole }, '', `#${target}`);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('landing');
    }
  };

  const handleLoginSuccess = (role, user = null) => {
    if (role === 'admin' || role === 'bouncer') {
      setAdminRole(role);
      navigate('admin');
    } else {
      if (user) storage.setActiveUser(user);
      navigate('user');
    }
  };

  const handleLogout = () => {
    storage.clearActiveUser();
    setAdminRole(null);
    navigate('landing');
    setScanCode(null);
  };

  const switchToAdmin = (code = null) => {
    setScanCode(code);
    navigate('admin');
  };

  const switchToUser = () => {
    navigate('user');
  };

  return (
    <>
      {page === 'landing' && (
        <LandingPage
          onNavigate={navigate}
        />
      )}

      {page === 'public_register' && (
        <PublicRegistration
          onNavigate={navigate}
          onBack={goBack}
        />
      )}

      {page === 'auth' && (
        <AuthPage
          onNavigate={navigate}
          onBack={goBack}
          onLoginSuccess={handleLoginSuccess}
          defaultTab={authOpts.defaultTab || 'attendee'}
        />
      )}

      {page === 'user' && (
        <UserPortal
          eventInfo={EVENT_INFO}
          onLogout={handleLogout}
          onBack={goBack}
          onNavigate={navigate}
          onSwitchToAdmin={switchToAdmin}
        />
      )}

      {page === 'admin' && (
        <AdminPortal
          eventInfo={EVENT_INFO}
          onLogout={handleLogout}
          onBack={goBack}
          onSwitchToAttendee={switchToUser}
          initialScanCode={scanCode}
          adminRole={adminRole}
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
