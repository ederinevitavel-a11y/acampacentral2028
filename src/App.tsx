import React, { useState, useEffect } from 'react';
import { WeeklyBulletin, AuthorizedUser } from './types';
import { INITIAL_BULLETIN, INITIAL_AUTHORIZED_USERS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { PublicView } from './components/PublicView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { QrPosterModal } from './components/QrPosterModal';

export default function App() {
  // Load bulletin from localStorage or default
  const [bulletin, setBulletin] = useState<WeeklyBulletin>(() => {
    const saved = localStorage.getItem('comunica_bulletin_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.events) && parsed.events.length >= 8) {
          return { ...parsed, churchName: 'IBCIP' };
        }
      } catch (e) {
        console.error('Erro ao ler boletim do localStorage', e);
      }
    }
    return INITIAL_BULLETIN;
  });

  // View state
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('comunica_admin_session') === 'true';
  });
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthorizedUser | null>(() => {
    const saved = localStorage.getItem('comunica_admin_session');
    if (saved === 'true') {
      return INITIAL_AUTHORIZED_USERS[0];
    }
    return null;
  });

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Sync bulletin to localStorage
  useEffect(() => {
    localStorage.setItem('comunica_bulletin_v2', JSON.stringify(bulletin));
  }, [bulletin]);

  // Handle mode toggle
  const handleToggleViewMode = (targetMode: 'public' | 'admin') => {
    if (targetMode === 'admin' && !isAdminAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setViewMode(targetMode);
  };

  // Handle successful login
  const handleSuccessLogin = (user: AuthorizedUser) => {
    setIsAdminAuthenticated(true);
    setAuthenticatedUser(user);
    localStorage.setItem('comunica_admin_session', 'true');
    setViewMode('admin');
  };

  // Handle admin logout
  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAuthenticatedUser(null);
    localStorage.removeItem('comunica_admin_session');
    setViewMode('public');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Global Navbar */}
      <Navbar
        bulletin={bulletin}
        isAdmin={isAdminAuthenticated}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        userEmail={authenticatedUser?.email}
      />

      {/* Main View Area */}
      {viewMode === 'public' ? (
        <PublicView bulletin={bulletin} />
      ) : (
        <AdminPanel
          bulletin={bulletin}
          onUpdateBulletin={setBulletin}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />
      )}

      {/* Auth Modal for Admin Access */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessLogin={handleSuccessLogin}
      />

      {/* Printable QR Code Poster Modal for Church Display */}
      <QrPosterModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        bulletin={bulletin}
      />

    </div>
  );
}
