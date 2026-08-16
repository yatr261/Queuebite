'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdminDashboard from '@/components/admin/AdminDashboard';
import BookingWizardModal from '@/components/customer/BookingWizardModal';
import QRBookingPassModal from '@/components/customer/QRBookingPassModal';
import { ModifyBookingModal, CancelBookingModal } from '@/components/customer/ModifyCancelModal';
import LiveQueueModal from '@/components/customer/LiveQueueModal';
import WaitlistModal from '@/components/customer/WaitlistModal';
import AIAssistantModal from '@/components/ai/AIAssistantModal';
import KitchenKDS from '@/components/kitchen/KitchenKDS';
import StaffQRScanner from '@/components/scanner/StaffQRScanner';
import { store, AppState } from '@/lib/store';
import { Eye, EyeOff, Lock, ArrowLeft, ShieldAlert, LayoutDashboard, ChefHat, QrCode } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(store.getState());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('queuebite_admin_auth') === 'true';
    }
    return false;
  });
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<'DASHBOARD' | 'KITCHEN' | 'SCANNER'>(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('queuebite_state_v1');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.currentRole === 'KITCHEN') return 'KITCHEN';
          if (parsed.currentRole === 'SCANNER') return 'SCANNER';
        } catch (e) {
          // ignore
        }
      }
    }
    return 'DASHBOARD';
  });

  useEffect(() => {
    if (isAuthenticated) {
      store.setRole('ADMIN');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });
    return unsubscribe;
  }, []);

  // If role is switched back to CUSTOMER, redirect to homepage /
  useEffect(() => {
    if (isAuthenticated && state.currentRole === 'CUSTOMER') {
      router.push('/');
    }
  }, [state.currentRole, isAuthenticated, router]);

  // Normalize KITCHEN or SCANNER role to ADMIN
  useEffect(() => {
    if (isAuthenticated && (state.currentRole === 'KITCHEN' || state.currentRole === 'SCANNER')) {
      store.setRole('ADMIN');
    }
  }, [isAuthenticated, state.currentRole]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('queuebite_admin_auth', 'true');
      setIsAuthenticated(true);
      store.setRole('ADMIN');
      setErrorMsg(null);
    } else {
      setErrorMsg('Invalid admin credential passcode.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Simple top bar */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zinc-900 via-amber-600 to-orange-600 dark:from-white dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              QUEUEBITE
            </span>
          </div>
          <button
            onClick={() => {
              store.setRole('CUSTOMER');
              router.push('/');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </div>

        {/* Lock Screen */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-300">
            {/* Lock Circle Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-black">Admin Authentication Required</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Please enter your administrator passcode to gain secure access
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 flex items-center gap-2.5 text-xs text-left">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter administrator passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all transform active:scale-98"
              >
                Authenticate Portal
              </button>
            </form>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Renders the Admin view once logged in successfully
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header
        activeTab=""
        setActiveTab={() => {}}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Admin Portal Tab Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner gap-1">
            {[
              { id: 'DASHBOARD', label: 'Admin Dashboard', icon: LayoutDashboard },
              { id: 'KITCHEN', label: 'Kitchen KDS', icon: ChefHat },
              { id: 'SCANNER', label: 'Staff QR Scanner', icon: QrCode },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activePortalTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePortalTab(tab.id as typeof activePortalTab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Views */}
        {activePortalTab === 'DASHBOARD' && <AdminDashboard />}
        {activePortalTab === 'KITCHEN' && <KitchenKDS />}
        {activePortalTab === 'SCANNER' && <StaffQRScanner />}
      </main>

      {/* Global Modals */}
      <BookingWizardModal
        isOpen={state.activeBookingModal}
        onClose={() => store.setActiveBookingModal(false)}
      />

      <QRBookingPassModal
        booking={state.selectedBookingForQR}
        onClose={() => store.setSelectedBookingForQR(null)}
      />

      <ModifyBookingModal
        key={state.selectedBookingForModify?.reservationId || 'modify-none'}
        booking={state.selectedBookingForModify}
        onClose={() => store.setSelectedBookingForModify(null)}
      />

      <CancelBookingModal
        key={state.selectedBookingForCancel?.reservationId || 'cancel-none'}
        booking={state.selectedBookingForCancel}
        onClose={() => store.setSelectedBookingForCancel(null)}
      />

      <LiveQueueModal
        isOpen={state.activeQueueModal}
        onClose={() => store.setActiveQueueModal(false)}
      />

      <WaitlistModal
        isOpen={state.activeWaitlistModal}
        onClose={() => store.setActiveWaitlistModal(false)}
      />

      <AIAssistantModal />

      <Footer />
    </div>
  );
}
