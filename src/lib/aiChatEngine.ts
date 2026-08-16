import { store } from './store';
import { getTodayDateString, getTomorrowDateString } from './utils';
import { findSmartTableAllocation } from './aiAllocation';
import { TableSection, ActionCardData } from './types';

export interface AIResponse {
  text: string;
  actionCard?: {
    type: 'BOOKING_PROPOSAL' | 'ALTERNATIVE_SLOTS' | 'PRE_ORDER_PROMPT' | 'BOOKING_SUMMARY' | 'QUEUE_TOKEN' | 'MENU_RECOMMENDATION';
    data: ActionCardData;
  };
}

export function processUserChatMessage(userQuery: string): AIResponse {
  const q = userQuery.toLowerCase().trim();
  const state = store.getState();
  const restaurant = state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  // 1. Cancellation intent
  if (q.includes('cancel') && (q.includes('booking') || q.includes('reservation') || q.includes('table') || q.includes('qb-'))) {
    const matchedRes = state.reservations.find(
      (r) =>
        r.bookingStatus === 'CONFIRMED' ||
        r.bookingStatus === 'CHECKED_IN' ||
        (r.bookingStatus !== 'CANCELLED' && q.includes(r.reservationId.toLowerCase()))
    );

    if (matchedRes) {
      store.cancelReservation(matchedRes.reservationId, 'Cancelled via AI Chat Assistant');
      return {
        text: `Your reservation **${matchedRes.reservationId}** for ${matchedRes.guestCount} guests on ${matchedRes.date} at ${matchedRes.startTime} has been **cancelled**. ${matchedRes.depositAmount > 0 ? 'Your ₹' + matchedRes.depositAmount + ' deposit refund has been processed.' : 'Your table has been released.'}`,
      };
    } else {
      return {
        text: "I couldn't find an active reservation to cancel. Please check your Booking ID or view your bookings in 'My Bookings'.",
      };
    }
  }

  // 2. Queue Status intent
  if (q.includes('queue') || q.includes('wait time') || q.includes('waiting time') || q.includes('token') || q.includes('walk in')) {
    const waitingTokens = state.queueTokens.filter((t) => t.status === 'WAITING');
    const waitTime = Math.max(5, (waitingTokens.length + 1) * 8);

    return {
      text: `Right now at **${restaurant.name}**, there are **${waitingTokens.length} groups waiting** in the live walk-in queue. The estimated waiting time is approximately **${waitTime} minutes**.`,
      actionCard: {
        type: 'QUEUE_TOKEN',
        data: {
          restaurantName: restaurant.name,
          estimatedWaitMinutes: waitTime,
          waitingCount: waitingTokens.length,
        },
      },
    };
  }

  // 3. Menu / Food Recommendation intent
  if (q.includes('recommend') || q.includes('menu') || q.includes('veg') || q.includes('special') || q.includes('popular') || q.includes('food')) {
    const popularItems = restaurant.menu.filter((m) => m.isPopular);
    return {
      text: `Here are our chef's top recommended dishes at **${restaurant.name}**! Pre-ordering during booking saves you 10% and ensures your food is fresh and piping hot upon arrival.`,
      actionCard: {
        type: 'MENU_RECOMMENDATION',
        data: {
          items: popularItems.slice(0, 4),
        },
      },
    };
  }

  // 4. Booking intent
  const isBookingQuery =
    q.includes('book') ||
    q.includes('reserve') ||
    q.includes('table for') ||
    q.includes('table at') ||
    q.includes('have a table') ||
    q.includes('reservation');

  if (isBookingQuery || q.includes('people') || q.includes('guests') || q.includes('pm') || q.includes('am')) {
    // Extract Guests
    let guestCount = 2; // default
    const guestMatch = q.match(/(\d+)\s*(people|person|guests|persons|pax|seats)/) || q.match(/for\s*(\d+)/);
    if (guestMatch) {
      guestCount = parseInt(guestMatch[1], 10);
    } else if (q.includes('couple') || q.includes('two of us')) {
      guestCount = 2;
    } else if (q.includes('family') || q.includes('four of us')) {
      guestCount = 4;
    }

    // Extract Date
    let date = getTodayDateString();
    if (q.includes('tomorrow')) {
      date = getTomorrowDateString();
    } else if (q.includes('sunday') || q.includes('saturday') || q.includes('friday')) {
      date = getTomorrowDateString();
    }

    // Extract Time
    let timeSlot = '19:30'; // default dinner
    const timeMatch = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? timeMatch[2] : '00';
      const period = timeMatch[3];
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      timeSlot = `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else if (q.includes('lunch') || q.includes('afternoon') || q.includes('noon')) {
      timeSlot = '13:00';
    } else if (q.includes('dinner') || q.includes('tonight') || q.includes('evening')) {
      timeSlot = '19:30';
    }

    // Extract Preference
    let preference: TableSection = 'ANY';
    if (q.includes('window')) preference = 'WINDOW';
    else if (q.includes('outdoor') || q.includes('garden') || q.includes('patio') || q.includes('terrace')) preference = 'OUTDOOR';
    else if (q.includes('ac') || q.includes('air condition')) preference = 'AC_SECTION';
    else if (q.includes('vip') || q.includes('lounge')) preference = 'VIP_LOUNGE';
    else if (q.includes('couple')) preference = 'COUPLE';
    else if (q.includes('family')) preference = 'FAMILY';
    else if (q.includes('indoor')) preference = 'INDOOR';

    // AI Check Allocation
    const allocation = findSmartTableAllocation({
      restaurant,
      date,
      timeSlot,
      guestCount,
      preference,
      existingReservations: state.reservations,
    });

    if (allocation.isAvailable && allocation.assignedTable) {
      const assigned = allocation.assignedTable;
      const prefText = preference !== 'ANY' ? preference.toLowerCase() : 'indoor/outdoor';
      return {
        text: `✨ **Table Available!** I found **${assigned.tableNumber}** (${assigned.capacity}-seater, ${assigned.sectionName}) for **${guestCount} guests** on **${date}** at **${timeSlot}**.\n\n${allocation.aiExplanation}`,
        actionCard: {
          type: 'BOOKING_PROPOSAL',
          data: {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            date,
            timeSlot,
            guestCount,
            preference,
            assignedTable: assigned,
          },
        },
      };
    } else {
      return {
        text: `⚠️ ${allocation.aiExplanation}\n\nWould you like to book one of the alternative time slots or join the smart waitlist?`,
        actionCard: {
          type: 'ALTERNATIVE_SLOTS',
          data: {
            restaurantId: restaurant.id,
            date,
            guestCount,
            alternativeSlots: allocation.alternativeTimeSlots || ['19:00', '20:00', '20:30'],
          },
        },
      };
    }
  }

  // 5. Default natural fallback
  return {
    text: `I'm here to help! You can try asking:\n- *"Book a table for 4 tomorrow at 8 PM"*\n- *"Do you have an outdoor table for 2 at 7:30 PM?"*\n- *"What is the live queue wait time right now?"*\n- *"Recommend best vegetarian dishes"*\n- *"Cancel my booking QB-2026-1048"*`,
  };
}
