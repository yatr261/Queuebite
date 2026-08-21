'use client';

import React, { useState, useEffect } from 'react';
import { store, AppState } from '@/lib/store';
import { AppViewRole } from '@/lib/types';
import {
  Sparkles,
  Bot,
  QrCode,
  UtensilsCrossed,
  LayoutDashboard,
  ChefHat,
  User,
  RotateCcw,
  Bell,
  Clock,
  CalendarCheck,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const [state, setState] = useState<AppState>(store.getState());
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const activeReservationsCount = state.reservations.filter(
    (r) => r.bookingStatus === 'CONFIRMED' || r.bookingStatus === 'CHECKED_IN'
  ).length;

  const activeQueueCount = state.queueTokens.filter(
    (q) => q.status === 'WAITING' || q.status === 'CALLING'
  ).length;

  const unreadNotifs = state.notifications.filter((n) => !n.read).length;

  const selectedRestaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  const roleLabels: Record<AppViewRole, { label: string; icon: LucideIcon; color: string }> = {
    CUSTOMER: { label: 'Customer View', icon: User, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    ADMIN: { label: 'Admin Panel', icon: LayoutDashboard, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    KITCHEN: { label: 'Kitchen KDS', icon: ChefHat, color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
    SCANNER: { label: 'Staff QR Scanner', icon: QrCode, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  };

  const currentRoleInfo = roleLabels[state.currentRole];
  const RoleIcon = currentRoleInfo.icon;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              store.setRole('CUSTOMER');
              setActiveTab('home');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zinc-900 via-amber-600 to-orange-600 dark:from-white dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  QUEUEBITE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Smart Pre-Book
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Book Smart • Skip the Queue • Eat Faster
              </p>
            </div>
          </div>

          {/* Navigation Links for Customer */}
          {state.currentRole === 'CUSTOMER' && (
            <nav className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'home'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Restaurants
              </button>
              <button
                onClick={() => store.setActiveBookingModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Book Table
              </button>
              <button
                onClick={() => store.setActiveQueueModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Join Queue
              </button>
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'my-bookings'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                My Bookings
                {activeReservationsCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeReservationsCount}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                        Notifications ({state.notifications.length})
                      </span>
                    </div>
                    {state.notifications.length > 0 && (
                      <button
                        onClick={() => store.clearAllNotifications()}
                        className="text-[11px] text-zinc-500 hover:text-rose-500 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto mt-2 space-y-2 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {state.notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">No notifications yet.</p>
                    ) : (
                      state.notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => store.markNotificationRead(notif.id)}
                          className={`pt-2 cursor-pointer transition-colors ${
                            notif.read ? 'opacity-70' : 'opacity-100 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(notif.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm transition-all ${currentRoleInfo.color}`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {state.currentUser && state.currentRole !== 'CUSTOMER'
                    ? `${state.jobRoles?.find(r => r.code === state.currentUser?.role)?.name || state.currentUser.role}`
                    : currentRoleInfo.label}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 px-3 py-1.5 tracking-wider">
                    Switch App Role
                  </p>
                  {(['CUSTOMER', 'ADMIN'] as const).map((roleKey) => {
                    const item = roleLabels[roleKey];
                    const Icon = item.icon;
                    const isSelected = state.currentRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        onClick={() => {
                          store.setRole(roleKey);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {isSelected && <span className="ml-auto text-amber-500">✓</span>}
                      </button>
                    );
                  })}

                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        store.resetToDefaults();
                        setShowRoleDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Demo Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
