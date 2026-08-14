import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import { 
  ShieldCheck, Scan, UserCheck, LayoutDashboard, Ticket, 
  UserPlus, Users, FileText, Volume2, VolumeX, Smartphone, 
  Menu, X, Sparkles, CheckCircle2 
} from 'lucide-react';

export default function Navbar({ 
  currentPortal, 
  setCurrentPortal, 
  currentTab, 
  setCurrentTab,
  eventInfo 
}) {
  const [muted, setMuted] = useState(sound.isMuted());
  const [attendees, setAttendees] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = () => {
    setAttendees(storage.getAttendees());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('passguard_data_change', handleDataChange);
    return () => window.removeEventListener('passguard_data_change', handleDataChange);
  }, []);

  const total = attendees.length;
  const checkedIn = attendees.filter(a => a.checkedIn).length;

  const toggleMute = () => {
    const next = !muted;
    sound.setMuted(next);
    setMuted(next);
    if (!next) sound.playClick();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Gate Scanner', icon: Scan, highlight: true },
    { id: 'tickets', label: 'E-Tickets', icon: Ticket },
    { id: 'register', label: 'Register', icon: UserPlus },
    { id: 'attendees', label: 'Directory', icon: Users },
    { id: 'logs', label: 'Scan Logs', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-3">
          {/* Brand Logo */}
          <div 
            onClick={() => { sound.playClick(); setCurrentPortal('admin'); setCurrentTab('dashboard'); }}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25 border border-cyan-400/40">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-white">
                  Pass<span className="text-cyan-400">Guard</span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[180px]">
                {eventInfo?.name || 'Entry Pass Scanner'}
              </p>
            </div>
          </div>

          {/* DUAL PORTAL SWITCHER PILL */}
          <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => { sound.playClick(); setCurrentPortal('attendee'); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentPortal === 'attendee'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Attendee Portal (My Pass)</span>
            </button>

            <button
              onClick={() => { sound.playClick(); setCurrentPortal('admin'); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentPortal === 'admin'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin / Gate Scanner</span>
            </button>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Checked In Counter */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-emerald"></span>
              <span className="text-slate-400 font-medium">Checked In:</span>
              <span className="font-bold text-white font-mono">{checkedIn}/{total}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              title={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Mobile Portal Switcher Button */}
            <button
              onClick={() => {
                sound.playClick();
                setCurrentPortal(currentPortal === 'admin' ? 'attendee' : 'admin');
              }}
              className="lg:hidden px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {currentPortal === 'admin' ? <Smartphone className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{currentPortal === 'admin' ? 'Attendee View' : 'Admin Gate'}</span>
            </button>

            {/* Mobile Menu Toggle */}
            {currentPortal === 'admin' && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* ADMIN SUBNAV (DESKTOP) */}
        {currentPortal === 'admin' && (
          <div className="hidden md:flex items-center gap-1 py-2 border-t border-slate-850 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { sound.playClick(); setCurrentTab(item.id); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? item.highlight
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive && !item.highlight ? 'text-cyan-400' : ''}`} />
                  <span>{item.label}</span>
                  {item.id === 'attendees' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 text-slate-300 font-mono">
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* MOBILE MENU ACCORDION */}
        {mobileMenuOpen && currentPortal === 'admin' && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playClick();
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'attendees' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/60 font-mono">
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
