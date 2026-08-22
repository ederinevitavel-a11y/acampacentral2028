import React, { useState, useEffect } from 'react';
import { WeeklyBulletin, AuthorizedUser } from './types';
import { INITIAL_BULLETIN } from './data/mockData';
import { Navbar } from './components/Navbar';
import { PublicView } from './components/PublicView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { QrPosterModal } from './components/QrPosterModal';
import {
  subscribeToBulletin,
  saveBulletinToFirestore,
  observeAuthState,
  logoutFirebase,
} from './services/firebase';

export default function App() {
  // Load bulletin from localStorage or default initial
  const [bulletin, setBulletin] = useState<WeeklyBulletin>(() => {
    const saved = localStorage.getItem('comunica_bulletin_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.events)) {
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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthorizedUser | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Real-time Firestore sync for Bulletin
  useEffect(() => {
    const unsubscribeFirestore = subscribeToBulletin((remoteData) => {
      if (remoteData && remoteData.events) {
        setBulletin(remoteData);
        localStorage.setItem('comunica_bulletin_v2', JSON.stringify(remoteData));
      }
    });

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Real-time Firebase Auth state observer
  useEffect(() => {
    const unsubscribeAuth = observeAuthState((user) => {
      if (user) {
        setIsAdminAuthenticated(true);
        setAuthenticatedUser(user);
      } else {
        setIsAdminAuthenticated(false);
        setAuthenticatedUser(null);
        if (viewMode === 'admin') {
          setViewMode('public');
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [viewMode]);

  // Handle bulletin updates (local state + Firestore push)
  const handleUpdateBulletin = (updated: WeeklyBulletin | ((prev: WeeklyBulletin) => WeeklyBulletin)) => {
    setBulletin((prev) => {
      const nextBulletin = typeof updated === 'function' ? updated(prev) : updated;
      localStorage.setItem('comunica_bulletin_v2', JSON.stringify(nextBulletin));
      
      // Save to Firebase Firestore
      saveBulletinToFirestore(nextBulletin).catch((err) => {
        console.warn('Erro ao salvar no Firestore:', err);
      });

      return nextBulletin;
    });
  };

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
    setViewMode('admin');
  };

  // Handle admin logout
  const handleLogoutAdmin = async () => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.warn('Erro ao deslogar do Firebase:', err);
    }
    setIsAdminAuthenticated(false);
    setAuthenticatedUser(null);
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
          onUpdateBulletin={handleUpdateBulletin}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />
      )}

      {/* Auth Modal for Admin Access with Google Firebase */}
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
