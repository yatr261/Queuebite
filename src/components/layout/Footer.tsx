'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ShieldCheck, Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md transition-colors py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-amber-600 dark:from-white dark:to-amber-400 bg-clip-text text-transparent">
                QUEUEBITE
              </span>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Smart Queue, Pre-Booking & Pre-Ordering System for modern restaurants, cafes, and food courts. Skip the wait, guarantee your table, and savor your meal faster.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 text-xs">
            <p className="font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider text-[11px]">
              Features
            </p>
            <ul className="space-y-1.5 text-zinc-500">
              <li>Smart Table Allocation</li>
              <li>Food Pre-Ordering & Kitchen KDS</li>
              <li>Digital QR Booking Pass</li>
              <li>Live Walk-In Queue & Tokens</li>
              <li>Overflow Smart Waitlist</li>
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-2 text-xs">
            <p className="font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider text-[11px]">
              Architecture
            </p>
            <ul className="space-y-1.5 text-zinc-500">
              <li>Next.js 15 & React 19</li>
              <li>Tailwind CSS & TypeScript</li>
              <li>Conflict-Free Table Engine</li>
              <li>Realtime Sound & Push Alerts</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <p>
            © 2026 Queuebite Ecosystem. All rights reserved. •{' '}
            <Link
              href="/admin"
              className="text-zinc-500 hover:text-amber-500 font-semibold transition-colors"
            >
              Admin Portal
            </Link>
          </p>
          <div className="flex items-center gap-1">
            <span>Built with precision & high-performance design</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
