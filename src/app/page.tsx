'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LandingHero from '@/components/customer/LandingHero';
import RestaurantDetail from '@/components/customer/RestaurantDetail';
import BookingWizardModal from '@/components/customer/BookingWizardModal';
import QRBookingPassModal from '@/components/customer/QRBookingPassModal';
import { ModifyBookingModal, CancelBookingModal } from '@/components/customer/ModifyCancelModal';
import LiveQueueModal from '@/components/customer/LiveQueueModal';
import WaitlistModal from '@/components/customer/WaitlistModal';
import MyBookingsView from '@/components/customer/MyBookingsView';
import AdminDashboard from '@/components/admin/AdminDashboard';
import dynamic from 'next/dynamic';
import KitchenKDS from '@/components/kitchen/KitchenKDS';
import AIAssistantModal from '@/components/ai/AIAssistantModal';
import { store, AppState } from '@/lib/store';

const StaffQRScanner = dynamic(() => import('@/components/scanner/StaffQRScanner'), {
  ssr: false,
  loading: () => (
    <div className="p-8 rounded-3xl bg-zinc-950 text-white text-center space-y-3 my-8 max-w-3xl mx-auto border border-zinc-800 shadow-xl">
      <div className="w-8 h-8 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-zinc-400">Loading Staff Entrance Scanner...</p>
    </div>
  ),
});

export default function Home() {
  const [state, setState] = useState<AppState>(store.getState());
  const [customerTab, setCustomerTab] = useState<string>('home');
  const [selectedRestDetailId, setSelectedRestDetailId] = useState<string | null>(null);

  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const currentRestaurant =
    state.restaurants.find((r) => r.id === (selectedRestDetailId || state.selectedRestaurantId)) ||
    state.restaurants[0];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Global Navigation Header */}
      <Header
        activeTab={customerTab}
        setActiveTab={(tab) => {
          setCustomerTab(tab);
          if (tab === 'home') setSelectedRestDetailId(null);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Role: CUSTOMER */}
        {state.currentRole === 'CUSTOMER' && (
          <>
            {customerTab === 'home' && (
              <>
                {selectedRestDetailId ? (
                  <RestaurantDetail
                    restaurant={currentRestaurant}
                    onBack={() => setSelectedRestDetailId(null)}
                  />
                ) : (
                  <LandingHero
                    restaurants={state.restaurants}
                    onSelectRestaurant={(restId) => setSelectedRestDetailId(restId)}
                  />
                )}
              </>
            )}

            {customerTab === 'my-bookings' && (
              <MyBookingsView onOpenBookingModal={() => store.setActiveBookingModal(true)} />
            )}
          </>
        )}

        {/* Role: RESTAURANT ADMIN */}
        {state.currentRole === 'ADMIN' && <AdminDashboard />}

        {/* Role: KITCHEN KDS */}
        {state.currentRole === 'KITCHEN' && <KitchenKDS />}

        {/* Role: STAFF QR SCANNER */}
        {state.currentRole === 'SCANNER' && <StaffQRScanner />}
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
        booking={state.selectedBookingForModify}
        onClose={() => store.setSelectedBookingForModify(null)}
      />

      <CancelBookingModal
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
