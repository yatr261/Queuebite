'use client';

import React, { useState } from 'react';
import { store, AppState } from '@/lib/store';
import { KitchenTicket } from '@/lib/types';
import { formatTime12h } from '@/lib/utils';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertCircle,
  Sparkles,
  UtensilsCrossed,
  Bell,
} from 'lucide-react';

export default function KitchenKDS() {
  const [state, setState] = React.useState<AppState>(store.getState());
  const [filter, setFilter] = useState<'ALL' | 'SCHEDULED' | 'COOKING' | 'READY' | 'SERVED'>('ALL');

  React.useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const tickets = state.kitchenTickets.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* KDS Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">Kitchen Display System (KDS)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                Smart Timing Active
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Auto-calculated prep timers for Pre-Booked orders & Live Walk-in orders
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-800 p-1 rounded-xl">
          {['ALL', 'SCHEDULED', 'COOKING', 'READY', 'SERVED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === f
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Grid */}
      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <ChefHat className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-500 mt-2">No active kitchen orders</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((ticket) => (
            <div
              key={ticket.ticketId}
              className={`rounded-3xl border shadow-lg overflow-hidden flex flex-col justify-between transition-all ${
                ticket.status === 'SCHEDULED'
                  ? 'bg-zinc-900 border-zinc-800 text-white'
                  : ticket.status === 'COOKING'
                  ? 'bg-amber-950/30 border-amber-500/50 text-white ring-1 ring-amber-500/50'
                  : ticket.status === 'READY'
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-white ring-1 ring-emerald-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 opacity-75'
              }`}
            >
              {/* Ticket Top Header */}
              <div className="p-4 border-b border-zinc-800 bg-black/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {ticket.ticketId}
                  </span>
                  <h3 className="text-lg font-black text-white">Table {ticket.tableNumber}</h3>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      ticket.status === 'SCHEDULED'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : ticket.status === 'COOKING'
                        ? 'bg-amber-500 text-zinc-950 animate-pulse'
                        : ticket.status === 'READY'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>

              {/* Timing Box */}
              <div className="px-4 py-2.5 bg-zinc-800/60 border-b border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Start Prep: <strong className="text-white">{formatTime12h(ticket.scheduledPrepTime)}</strong></span>
                </div>
                <div className="text-zinc-400">
                  Target Serve: <strong className="text-amber-400">{formatTime12h(ticket.targetServeTime)}</strong>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-4 space-y-2 flex-1">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Dishes to Prepare ({ticket.items.reduce((a, b) => a + b.quantity, 0)} items)
                </p>

                <div className="space-y-2">
                  {ticket.items.map((pi, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                          {pi.quantity}x
                        </span>
                        <span className="text-xs font-bold text-white">{pi.item.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        ~{pi.item.prepTimeMinutes}m
                      </span>
                    </div>
                  ))}
                </div>

                {ticket.specialNotes && (
                  <p className="text-[11px] text-amber-300/90 italic pt-1">
                    Note: {ticket.specialNotes}
                  </p>
                )}
              </div>

              {/* Bump Bar Actions */}
              <div className="p-4 border-t border-zinc-800 bg-black/40 grid grid-cols-2 gap-2">
                {ticket.status === 'SCHEDULED' && (
                  <button
                    onClick={() => store.updateKitchenTicketStatus(ticket.ticketId, 'COOKING')}
                    className="col-span-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Flame className="w-4 h-4" /> Start Cooking Now
                  </button>
                )}

                {ticket.status === 'COOKING' && (
                  <button
                    onClick={() => store.updateKitchenTicketStatus(ticket.ticketId, 'READY')}
                    className="col-span-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Order Ready
                  </button>
                )}

                {ticket.status === 'READY' && (
                  <button
                    onClick={() => store.updateKitchenTicketStatus(ticket.ticketId, 'SERVED')}
                    className="col-span-2 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <UtensilsCrossed className="w-4 h-4" /> Food Served to Table
                  </button>
                )}

                {ticket.status === 'SERVED' && (
                  <div className="col-span-2 text-center text-xs font-bold text-zinc-500 py-1">
                    ✓ Completed & Served
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
