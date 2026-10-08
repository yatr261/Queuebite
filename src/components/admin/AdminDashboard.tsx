'use client';

import React, { useState } from 'react';
import { store, AppState } from '@/lib/store';
import { Reservation, Table, QueueToken } from '@/lib/types';
import { formatDate, formatTime12h, formatCurrency, getTodayDateString } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Grid,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  UserCheck,
  Percent,
  ChefHat,
  Sparkles,
  Ticket,
} from 'lucide-react';

export default function AdminDashboard() {
  const [state, setState] = React.useState<AppState>(store.getState());
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'RESERVATIONS' | 'FLOOR_PLAN' | 'TIMELINE' | 'QUEUE' | 'SETTINGS'>('OVERVIEW');
  const [resFilter, setResFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  React.useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const restaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  // Key Analytics KPIs
  const totalReservations = state.reservations.length;
  const todayReservations = state.reservations.filter((r) => r.date === getTodayDateString());
  const seatedCount = state.reservations.filter((r) => r.bookingStatus === 'SEATED').length;
  const totalDepositCollected = state.reservations.reduce((acc, r) => acc + (r.paymentStatus === 'PAID' ? r.depositAmount : 0), 0);
  const totalFoodPreOrderRevenue = state.reservations.reduce((acc, r) => acc + r.finalAmount, 0);
  const activeWalkinQueueCount = state.queueTokens.filter((q) => q.status === 'WAITING' || q.status === 'CALLING').length;
  const cancellationCount = state.reservations.filter((r) => r.bookingStatus === 'CANCELLED').length;
  const cancellationRate = totalReservations > 0 ? Math.round((cancellationCount / totalReservations) * 100) : 0;

  // Filtered Reservations
  const filteredReservations = state.reservations.filter((res) => {
    const matchesSearch =
      res.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.reservationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.tableNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (resFilter === 'ALL') return true;
    if (resFilter === 'TODAY') return res.date === getTodayDateString();
    return res.bookingStatus === resFilter;
  });

  const timeSlots = ['12:00', '13:00', '14:00', '18:30', '19:30', '20:30', '21:30'];

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Top Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
              Admin & Table Hub
            </span>
            <span className="text-xs text-zinc-400">Live Sync Enabled</span>
          </div>
          <h1 className="text-2xl font-black mt-1">{restaurant.name} Management</h1>
          <p className="text-xs text-zinc-400">
            Control reservations, floor plan, queue pacing, kitchen tickets, and deposits
          </p>
        </div>

        {/* Restaurant selector dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={state.selectedRestaurantId}
            onChange={(e) => store.setSelectedRestaurant(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-white focus:outline-none"
          >
            {state.restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Admin Sub-Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: 'OVERVIEW', label: 'Overview Analytics', icon: TrendingUp },
          { id: 'RESERVATIONS', label: `Reservations (${state.reservations.length})`, icon: Calendar },
          { id: 'FLOOR_PLAN', label: 'Visual Floor Plan', icon: Grid },
          { id: 'TIMELINE', label: 'Table Timeline Matrix', icon: Clock },
          { id: 'QUEUE', label: `Live Queue (${activeWalkinQueueCount})`, icon: Ticket },
          { id: 'SETTINGS', label: 'Restaurant Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as 'OVERVIEW' | 'RESERVATIONS' | 'FLOOR_PLAN' | 'TIMELINE' | 'QUEUE' | 'SETTINGS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW ANALYTICS */}
      {adminTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Today&apos;s Bookings</span>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">
                {todayReservations.length} Bookings
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">
                {todayReservations.reduce((a, b) => a + b.guestCount, 0)} Total Diners
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Live Table Occupancy</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">
                {restaurant.currentOccupancy}%
              </p>
              <p className="text-[11px] text-zinc-500">
                {restaurant.availableTables} of {restaurant.totalTables} Tables Free
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Pre-Order Revenue</span>
                <DollarSign className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(totalFoodPreOrderRevenue)}
              </p>
              <p className="text-[11px] text-zinc-500">
                + {formatCurrency(totalDepositCollected)} in Deposits
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Cancellation Rate</span>
                <Percent className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">
                {cancellationRate}%
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">
                0% No-Show Rate (Grace Period Active)
              </p>
            </div>
          </div>

          {/* Graphical Insights & Heatmaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Booking Volume Heatmap */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Hourly Reservation Traffic Distribution
              </h3>

              <div className="space-y-2">
                {[
                  { time: '12:00 PM - 01:00 PM', count: 4, pct: 40 },
                  { time: '01:00 PM - 02:00 PM', count: 8, pct: 80 },
                  { time: '02:00 PM - 03:00 PM', count: 5, pct: 50 },
                  { time: '06:30 PM - 07:30 PM', count: 7, pct: 70 },
                  { time: '07:30 PM - 08:30 PM (Peak)', count: 10, pct: 100 },
                  { time: '08:30 PM - 09:30 PM', count: 8, pct: 80 },
                  { time: '09:30 PM - 10:30 PM', count: 4, pct: 40 },
                ].map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      <span>{row.time}</span>
                      <span>{row.count} Bookings</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Party Size Distribution */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Party Size & Section Preference Share
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 space-y-1">
                  <p className="font-bold text-zinc-500">2-Guest Couples</p>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-white">42%</p>
                  <p className="text-[10px] text-zinc-400">Prefers Window & Balcony</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 space-y-1">
                  <p className="font-bold text-zinc-500">4-Guest Family</p>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-white">38%</p>
                  <p className="text-[10px] text-zinc-400">Prefers AC Booths</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 space-y-1">
                  <p className="font-bold text-zinc-500">6+ Group Celebrations</p>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-white">15%</p>
                  <p className="text-[10px] text-zinc-400">Patio & VIP Lounge</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 space-y-1">
                  <p className="font-bold text-zinc-500">Pre-Order Food Attach</p>
                  <p className="text-xl font-extrabold text-emerald-600">82%</p>
                  <p className="text-[10px] text-zinc-400">Avg Pre-Order: ₹580</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESERVATION MANAGEMENT */}
      {adminTab === 'RESERVATIONS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Booking ID, Guest, Table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'TODAY', 'CONFIRMED', 'CHECKED_IN', 'SEATED', 'COMPLETED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setResFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    resFilter === f
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Booking ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Date & Slot</th>
                  <th className="p-3.5">Table</th>
                  <th className="p-3.5">Pre-Order</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredReservations.map((res) => (
                  <tr key={res.reservationId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="p-3.5 font-mono font-black text-amber-600 dark:text-amber-400">
                      {res.reservationId}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-zinc-900 dark:text-white">{res.customerName}</p>
                      <p className="text-[11px] text-zinc-400">{res.customerPhone}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">{formatDate(res.date)}</p>
                      <p className="text-[11px] text-zinc-500">{formatTime12h(res.startTime)}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-zinc-900 dark:text-white">{res.tableNumber}</span>
                      <span className="text-[11px] text-zinc-400 block">{res.guestCount} Guests • {res.tablePreference}</span>
                    </td>
                    <td className="p-3.5">
                      {res.preOrderItems.length > 0 ? (
                        <div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {res.preOrderItems.length} items ({formatCurrency(res.finalAmount)})
                          </span>
                          <span className="text-[10px] text-zinc-400 block">Prep: {formatTime12h(res.prepStartTime || '19:15')}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">None</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          res.bookingStatus === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : res.bookingStatus === 'CHECKED_IN'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : res.bookingStatus === 'SEATED'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {res.bookingStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {res.bookingStatus === 'CONFIRMED' && (
                        <button
                          onClick={() => store.checkInReservation(res.reservationId)}
                          className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-bold text-[11px] hover:bg-blue-600"
                        >
                          Check-In
                        </button>
                      )}
                      {res.bookingStatus === 'CHECKED_IN' && (
                        <button
                          onClick={() => store.seatReservation(res.reservationId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] hover:bg-emerald-600"
                        >
                          Seat Guest
                        </button>
                      )}
                      {res.bookingStatus === 'SEATED' && (
                        <button
                          onClick={() => store.completeReservation(res.reservationId)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 text-white font-bold text-[11px] hover:bg-zinc-700"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL FLOOR PLAN */}
      {adminTab === 'FLOOR_PLAN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-amber-500" />
              Interactive 2D Restaurant Floor Plan
            </h3>

            {/* Status Legend */}
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Available
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Occupied / Seated
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Reserved
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 min-h-[400px] relative overflow-hidden shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {restaurant.tables.map((table) => {
                const currentRes = state.reservations.find(
                  (r) => r.tableId === table.id && (r.bookingStatus === 'CONFIRMED' || r.bookingStatus === 'SEATED' || r.bookingStatus === 'CHECKED_IN')
                );

                return (
                  <div
                    key={table.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      table.status === 'AVAILABLE'
                        ? 'bg-zinc-800/80 border-emerald-500/50 hover:border-emerald-400'
                        : table.status === 'OCCUPIED'
                        ? 'bg-amber-950/40 border-amber-500/50'
                        : 'bg-blue-950/40 border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-white">{table.tableNumber}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          table.status === 'AVAILABLE'
                            ? 'bg-emerald-500 text-white'
                            : table.status === 'OCCUPIED'
                            ? 'bg-amber-500 text-zinc-950'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 font-bold mt-2">{table.sectionName}</p>
                    <p className="text-[11px] text-zinc-400">Capacity: {table.capacity} Diners</p>

                    {currentRes && (
                      <div className="mt-3 pt-2 border-t border-zinc-700/60 text-[11px] space-y-0.5">
                        <p className="font-bold text-amber-400">{currentRes.customerName}</p>
                        <p className="text-zinc-400">{formatTime12h(currentRes.startTime)} ({currentRes.guestCount}p)</p>
                      </div>
                    )}

                    {/* Quick status toggle button for staff */}
                    <div className="mt-3 pt-2 border-t border-zinc-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">Toggle Status:</span>
                      <button
                        onClick={() =>
                          store.updateTableStatus(
                            restaurant.id,
                            table.id,
                            table.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-bold"
                      >
                        {table.status === 'AVAILABLE' ? 'Mark Occupied' : 'Mark Available'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIMELINE MATRIX (GANTT) */}
      {adminTab === 'TIMELINE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Table Utilization Timeline
            </h3>
            <span className="text-xs text-zinc-500">Date: {formatDate(getTodayDateString())}</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400">
                  <th className="p-3 text-left">Table</th>
                  {timeSlots.map((ts) => (
                    <th key={ts} className="p-3 text-center">
                      {formatTime12h(ts)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {restaurant.tables.map((tbl) => (
                  <tr key={tbl.id}>
                    <td className="p-3 font-extrabold text-amber-600 dark:text-amber-400">
                      {tbl.tableNumber} ({tbl.capacity}p)
                    </td>
                    {timeSlots.map((slot) => {
                      const hasBooking = state.reservations.some(
                        (r) =>
                          r.tableId === tbl.id &&
                          r.date === getTodayDateString() &&
                          r.startTime.startsWith(slot.substring(0, 2)) &&
                          r.bookingStatus !== 'CANCELLED'
                      );

                      return (
                        <td key={slot} className="p-2 text-center">
                          {hasBooking ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black">
                              BOOKED
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[10px]">
                              Available
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: QUEUE MANAGER */}
      {adminTab === 'QUEUE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-500" />
              Live Walk-In Queue Manager
            </h3>

            <button
              onClick={() => store.setActiveQueueModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs"
            >
              + Issue Walk-In Token
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.queueTokens.map((token) => (
              <div
                key={token.tokenId}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-black text-emerald-600">
                    {token.tokenId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase">
                    {token.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">{token.customerName}</h4>
                  <p className="text-xs text-zinc-500">
                    {token.guestCount} Guests • Wait: ~{token.estimatedWaitMinutes} mins
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {token.status === 'WAITING' && (
                    <button
                      onClick={() => store.callQueueToken(token.tokenId, 'T-1')}
                      className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600"
                    >
                      Call Token
                    </button>
                  )}
                  {token.status === 'CALLING' && (
                    <button
                      onClick={() => store.seatQueueToken(token.tokenId)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600"
                    >
                      Mark Seated
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RESTAURANT SETTINGS */}
      {adminTab === 'SETTINGS' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5 max-w-2xl text-xs">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            Restaurant Automation Rules & Policies
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Late Arrival Grace Period</p>
                <p className="text-zinc-500">Hold table after booking time before auto-releasing</p>
              </div>
              <span className="font-black text-amber-600 text-sm">
                {restaurant.gracePeriodMinutes} Minutes
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Reservation Deposit Requirement</p>
                <p className="text-zinc-500">Mandatory upfront deposit adjusted in food bill</p>
              </div>
              <button
                onClick={() =>
                  store.updateRestaurantSettings(restaurant.id, {
                    depositRequired: !restaurant.depositRequired,
                  })
                }
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                  restaurant.depositRequired ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {restaurant.depositRequired ? 'Enabled (₹200)' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Cleaning / Turnaround Buffer</p>
                <p className="text-zinc-500">Buffer time between consecutive bookings</p>
              </div>
              <span className="font-black text-zinc-900 dark:text-white text-sm">
                {restaurant.cleaningBufferMinutes} Minutes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
