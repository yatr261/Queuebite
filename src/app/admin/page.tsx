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
import { PortalUser } from '@/lib/types';
import { Eye, EyeOff, Lock, ArrowLeft, ShieldAlert, LayoutDashboard, ChefHat, QrCode, Mail, User, ShieldCheck } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(store.getState());
  
  // Auth state initialized from sessionStorage
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => {
    if (typeof window !== 'undefined') {
      const userStr = sessionStorage.getItem('queuebite_active_user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('queuebite_admin_auth') === 'true';
    }
    return false;
  });

  // Login form state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Registration form state
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'ADMIN' | 'KITCHEN' | 'SCANNER'>('ADMIN');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Sub-tab view state (defaulting based on role)
  const [activePortalTab, setActivePortalTab] = useState<'DASHBOARD' | 'KITCHEN' | 'SCANNER'>(() => {
    if (currentUser) {
      if (currentUser.role === 'KITCHEN') return 'KITCHEN';
      if (currentUser.role === 'SCANNER') return 'SCANNER';
    }
    return 'DASHBOARD';
  });

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });
    return unsubscribe;
  }, []);

  // Sync role to store on mount/auth change
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      store.setRole(currentUser.role);
      store.setCurrentUser(currentUser);
    }
  }, [isAuthenticated, currentUser]);

  // If role is switched back to CUSTOMER, redirect to homepage /
  useEffect(() => {
    if (isAuthenticated && state.currentRole === 'CUSTOMER') {
      // Clear session auth
      sessionStorage.removeItem('queuebite_admin_auth');
      sessionStorage.removeItem('queuebite_active_user');
      store.setCurrentUser(null);
      router.push('/');
    }
  }, [state.currentRole, isAuthenticated, router]);

  // Normalize role to current authenticated user's role if they are in `/admin`
  useEffect(() => {
    if (isAuthenticated && currentUser && state.currentRole !== currentUser.role) {
      store.setRole(currentUser.role);
    }
  }, [isAuthenticated, currentUser, state.currentRole]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegSuccessMsg(null);

    // Look for matching user credentials
    const foundUser = state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );

    if (foundUser) {
      sessionStorage.setItem('queuebite_admin_auth', 'true');
      sessionStorage.setItem('queuebite_active_user', JSON.stringify(foundUser));
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      store.setCurrentUser(foundUser);
      store.setRole(foundUser.role);
      
      // Default view tab based on logged-in role
      if (foundUser.role === 'KITCHEN') {
        setActivePortalTab('KITCHEN');
      } else if (foundUser.role === 'SCANNER') {
        setActivePortalTab('SCANNER');
      } else {
        setActivePortalTab('DASHBOARD');
      }
    } else {
      setErrorMsg('Invalid credentials. Check email/passcode.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Please fill out all registration fields.');
      return;
    }

    // Check if email already registered
    const exists = state.users.some(
      (u) => u.email.toLowerCase() === regEmail.toLowerCase()
    );

    if (exists) {
      setErrorMsg('This email is already registered.');
      return;
    }

    const newUser: PortalUser = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      passwordHash: regPassword,
      role: regRole,
    };

    store.registerUser(newUser);
    setRegSuccessMsg(`Registration successful! You can now log in as ${regRole}.`);
    
    // Reset inputs and return to login screen
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegRole('ADMIN');
    setIsRegisterMode(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Top bar header */}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </div>

        {/* Auth Forms Screen */}
        <div className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header branding */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-xl font-black">Staff Portal Access</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isRegisterMode ? 'Register a new staff/administrator account' : 'Authentication required to access dashboards'}
              </p>
            </div>

            {/* Form Mode Tabs Selector */}
            <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMsg(null);
                  setRegSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isRegisterMode
                    ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMsg(null);
                  setRegSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isRegisterMode
                    ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 flex items-center gap-2.5 text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
            )}

            {regSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
                <p className="font-semibold">{regSuccessMsg}</p>
              </div>
            )}

            {/* Login Mode */}
            {!isRegisterMode ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                      required
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                      required
                    />
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all transform active:scale-98 cursor-pointer"
                >
                  Authenticate Sign In
                </button>

                <div className="text-[10px] text-zinc-400 text-center dark:text-zinc-500 pt-1">
                  Default credentials: <span className="font-semibold text-zinc-600 dark:text-zinc-300">admin@queuebite.com</span> / <span className="font-semibold text-zinc-600 dark:text-zinc-300">admin123</span>
                </div>
              </form>
            ) : (
              /* Register Mode */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                      required
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                      required
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Password Code"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                      required
                    />
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
                      Assigned Portal Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as typeof regRole)}
                      className="w-full px-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold transition-all text-zinc-700 dark:text-zinc-200"
                    >
                      <option value="ADMIN">System Admin (Full Access)</option>
                      <option value="KITCHEN">Kitchen Staff (KDS Only)</option>
                      <option value="SCANNER">Scanner Staff (QR Scanner Only)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all transform active:scale-98 cursor-pointer"
                >
                  Register Account
                </button>
              </form>
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // authenticated portal role-based views
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header
        activeTab=""
        setActiveTab={() => {}}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Render Tab Switcher ONLY for Admin Role */}
        {isAdmin && (
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
        )}

        {/* Tab Views based on Role access */}
        {activePortalTab === 'DASHBOARD' && isAdmin && <AdminDashboard />}
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
