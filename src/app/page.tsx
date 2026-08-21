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

import { store, AppState } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(store.getState());
  const [customerTab, setCustomerTab] = useState<string>('home');
  const [selectedRestDetailId, setSelectedRestDetailId] = useState<string | null>(null);

  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  // Redirect to /admin if current role is ADMIN, KITCHEN, or SCANNER
  useEffect(() => {
    const isStaff = state.currentRole === 'ADMIN' || state.currentRole === 'KITCHEN' || state.currentRole === 'SCANNER';
    if (isStaff) {
      router.push('/admin');
    }
  }, [state.currentRole, router]);

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

        {/* Redirecting fallback for staff roles */}
        {(state.currentRole === 'ADMIN' || state.currentRole === 'KITCHEN' || state.currentRole === 'SCANNER') && (
          <div className="text-center py-12">
            <p className="text-zinc-500 font-medium text-xs">Redirecting to Admin Portal...</p>
          </div>
        )}
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



      {/* Footer */}
      <Footer />
    </div>
  );
}
