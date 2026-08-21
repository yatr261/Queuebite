'use client';

import React from 'react';
import { store } from '@/lib/store';
import { Restaurant } from '@/lib/types';
import {
  Sparkles,
  Clock,
  UtensilsCrossed,
  ShieldCheck,
  Zap,
  ChefHat,
  QrCode,
  CheckCircle2,
  Users,
  MapPin,
  Star,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';

export default function LandingHero({
  restaurants,
  onSelectRestaurant,
}: {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurantId: string) => void;
}) {
  const steps = [
    { title: '1. Select Table', desc: 'Choose Date, Time & Preferences', icon: Sparkles },
    { title: '2. Smart Match', desc: 'Instant conflict-free allocation', icon: ShieldCheck },
    { title: '3. Pre-Order Meal', desc: 'Save 10% on food cart', icon: UtensilsCrossed },
    { title: '4. Kitchen Prep', desc: 'Timed cooking before arrival', icon: ChefHat },
    { title: '5. Smart Check-In', desc: '1-tap QR scan at entrance', icon: QrCode },
    { title: '6. Table Ready', desc: 'Zero wait, hot food served', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-amber-950 text-white p-6 sm:p-12 lg:p-16 border border-zinc-800 shadow-2xl">
        {/* Background glow & accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            AI-POWERED PRE-BOOKING & QUEUE ECOSYSTEM
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            Skip the Queue.{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              Book Your Table.
            </span>{' '}
            Enjoy Your Meal.
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
            Queuebite combines AI-powered reservations, smart queue management and food pre-ordering
            into one seamless restaurant experience. No more standing outside busy diners.
          </p>

          {/* Primary Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => store.setActiveBookingModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Book a Table
            </button>

            <button
              onClick={() => store.setActiveQueueModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-100 font-bold text-sm sm:text-base border border-zinc-700 hover:border-zinc-500 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <Clock className="w-5 h-5 text-emerald-400" />
              Join Live Queue
            </button>

          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">0 Mins</p>
                <p className="text-[11px] text-zinc-400">Average Table Wait</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">10% OFF</p>
                <p className="text-[11px] text-zinc-400">On Food Pre-Orders</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">100% Guaranteed</p>
                <p className="text-[11px] text-zinc-400">Conflict-Free Table</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Journey Progression Flow */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
            End-To-End Dining Automation
          </h2>
          <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
            How Pre-Booking + Smart Queue Works
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow relative group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{step.title}</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Restaurants Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              Featured Restaurants
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Select a restaurant to book your table in advance or join live walk-in queue
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((rest) => (
            <div
              key={rest.id}
              onClick={() => {
                store.setSelectedRestaurant(rest.id);
                onSelectRestaurant(rest.id);
              }}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* Restaurant Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                <img
                  src={rest.image}
                  alt={rest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {rest.rating}
                  <span className="text-[10px] text-zinc-300">({rest.reviewCount})</span>
                </div>

                {/* Offers Badge */}
                {rest.offers && rest.offers.length > 0 && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-amber-500 text-zinc-950 text-[11px] font-extrabold shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {rest.offers[0].title}
                  </div>
                )}

                {/* Bottom info on image */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-xl font-extrabold">{rest.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-zinc-300 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span className="truncate">{rest.location}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Cuisines */}
                <div className="flex flex-wrap gap-1.5">
                  {rest.cuisines.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Live Occupancy & Wait Time */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Available Tables</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      {rest.availableTables} of {rest.totalTables} free
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Queue Wait Time</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      ~{rest.estimatedQueueWaitMinutes} mins
                    </p>
                  </div>
                </div>

                {/* Dual Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.setSelectedRestaurant(rest.id);
                      store.setActiveBookingModal(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Book Table
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.setSelectedRestaurant(rest.id);
                      store.setActiveQueueModal(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Live Queue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
