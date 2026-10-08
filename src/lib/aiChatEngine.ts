import { store } from './store';
import { getTodayDateString, getTomorrowDateString } from './utils';
import { findSmartTableAllocation } from './aiAllocation';
import { TableSection } from './types';

export interface AIResponse {
  text: string;
  actionCard?: {
    type:
      | 'BOOKING_PROPOSAL'
      | 'ALTERNATIVE_SLOTS'
      | 'PRE_ORDER_PROMPT'
      | 'BOOKING_SUMMARY'
      | 'QUEUE_TOKEN'
      | 'MENU_RECOMMENDATION'
      | 'LOCATION_INFO'
      | 'OFFERS_INFO';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  };
}

export function processUserChatMessage(userQuery: string): AIResponse {
  const rawQ = userQuery.trim();
  const q = rawQ.toLowerCase();
  const state = store.getState();
  const restaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  // 0. Greetings & Friendly Small Talk
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'namaste' ||
    q === 'kaise ho' ||
    q === 'help' ||
    q === 'kya kar sakte ho' ||
    q.startsWith('hi ') ||
    q.startsWith('hello ')
  ) {
    return {
      text: `👋 **Namaste! Welcome to ${restaurant.name} AI Assistant!**\n\nI can seamlessly assist you in **English** or **Hinglish** with:\n\n• 🍽️ **Table Booking:** *"Book a table for 4 tomorrow at 8 PM"* or *"4 log ke liye table book karo"*\n• 🎟️ **Live Walk-in Queue:** *"What is the current wait time?"* or *"Queue check karo"*\n• 🍕 **Chef Recommendations:** *"Suggest top vegetarian dishes"*\n• 🏷️ **Discounts & Offers:** *"Any active promo codes?"*\n• 📍 **Location & Hours:** *"Where is the restaurant located?"*\n• ❌ **Manage Bookings:** *"Cancel my booking QB-2026-1048"*`,
    };
  }

  // 1. Cancellation intent (English & Hinglish)
  const isCancelIntent =
    q.includes('cancel') ||
    q.includes('radd') ||
    q.includes('hatao') ||
    q.includes('delete booking');

  if (
    isCancelIntent &&
    (q.includes('booking') ||
      q.includes('reservation') ||
      q.includes('table') ||
      q.includes('qb-') ||
      q.includes('mera') ||
      q.includes('karo'))
  ) {
    // Try matching specific booking ID e.g. QB-2026-1048
    const idMatch = rawQ.match(/QB-\d{4}-\d+/i);
    let matchedRes = idMatch
      ? state.reservations.find(
          (r) => r.reservationId.toLowerCase() === idMatch[0].toLowerCase()
        )
      : null;

    if (!matchedRes) {
      // Find latest confirmed booking
      matchedRes = state.reservations.find(
        (r) => r.bookingStatus === 'CONFIRMED' || r.bookingStatus === 'CHECKED_IN'
      ) || null;
    }

    if (matchedRes) {
      store.cancelReservation(matchedRes.reservationId, 'Cancelled via AI Chatbot Assistant');
      return {
        text: `✅ Your reservation **${matchedRes.reservationId}** for **${matchedRes.guestCount} guests** on **${matchedRes.date}** at **${matchedRes.startTime}** has been **CANCELLED**.\n\n${
          matchedRes.depositAmount > 0
            ? '💰 Refund of ₹' + matchedRes.depositAmount + ' has been initiated.'
            : 'Your reserved table has been released.'
        }`,
      };
    } else {
      return {
        text: `⚠️ I couldn't find an active reservation to cancel. Please double-check your Booking ID (e.g. QB-2026-1048) or check the 'My Bookings' tab.`,
      };
    }
  }

  // 2. Location, Hours, & Contact info intent
  if (
    q.includes('location') ||
    q.includes('address') ||
    q.includes('kahan') ||
    q.includes('where is') ||
    q.includes('timing') ||
    q.includes('open') ||
    q.includes('hours') ||
    q.includes('phone') ||
    q.includes('contact') ||
    q.includes('direction')
  ) {
    return {
      text: `📍 **${restaurant.name}**\n\n• **Address:** ${restaurant.address}\n• **Opening Hours:** ${restaurant.openingTime} - ${restaurant.closingTime} (Daily)\n• **Phone:** ${restaurant.phone}\n• **Cuisines:** ${restaurant.cuisines.join(', ')}\n• **Rating:** ⭐ ${restaurant.rating} (${restaurant.reviewCount} reviews)`,
      actionCard: {
        type: 'LOCATION_INFO',
        data: {
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          openingTime: restaurant.openingTime,
          closingTime: restaurant.closingTime,
          rating: restaurant.rating,
        },
      },
    };
  }

  // 3. Offers & Discounts intent
  if (
    q.includes('offer') ||
    q.includes('discount') ||
    q.includes('coupon') ||
    q.includes('code') ||
    q.includes('promo') ||
    q.includes('sasta') ||
    q.includes('deal')
  ) {
    return {
      text: `🏷️ **Active AI Pre-Booking Offers at ${restaurant.name}:**\n\n• **PREORDER10**: Get **10% OFF** when you pre-order dishes during table reservation.\n• **FEAST100**: **Flat ₹100 OFF** on pre-orders above ₹799.\n• **FREEBEV**: Free complimentary beverage on bill above ₹600!`,
      actionCard: {
        type: 'OFFERS_INFO',
        data: {
          offers: restaurant.offers || [
            { code: 'PREORDER10', title: '10% OFF Pre-Orders', description: 'Save 10% on pre-ordered meals' },
            { code: 'FEAST100', title: '₹100 Flat Discount', description: 'On orders above ₹799' },
          ],
        },
      },
    };
  }

  // 4. Live Queue Status / Wait time intent
  if (
    q.includes('queue') ||
    q.includes('wait time') ||
    q.includes('waiting time') ||
    q.includes('token') ||
    q.includes('walk in') ||
    q.includes('kitna time') ||
    q.includes('kitni waiting') ||
    q.includes('line') ||
    q.includes('kitna der')
  ) {
    const waitingTokens = state.queueTokens.filter((t) => t.status === 'WAITING');
    const waitTime = Math.max(5, (waitingTokens.length + 1) * 8);

    return {
      text: `🎟️ **Live Walk-in Queue Update at ${restaurant.name}:**\n\n• **Waiting Groups:** ${waitingTokens.length} in line\n• **Estimated Wait:** ~${waitTime} minutes\n\nWould you like to generate a live walk-in queue token right now?`,
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

  // 5. Menu / Food Recommendation intent
  if (
    q.includes('recommend') ||
    q.includes('menu') ||
    q.includes('veg') ||
    q.includes('food') ||
    q.includes('dish') ||
    q.includes('khaana') ||
    q.includes('special') ||
    q.includes('popular') ||
    q.includes('starter') ||
    q.includes('dosa') ||
    q.includes('paneer')
  ) {
    const popularItems = restaurant.menu.filter((m) => m.isPopular);
    return {
      text: `🍽️ **Chef's Special Recommendations at ${restaurant.name}:**\n\nPre-ordering dishes when reserving your table saves you **10% OFF** and guarantees immediate service upon arrival!`,
      actionCard: {
        type: 'MENU_RECOMMENDATION',
        data: {
          items: popularItems.length > 0 ? popularItems.slice(0, 4) : restaurant.menu.slice(0, 4),
        },
      },
    };
  }

  // 6. Booking / Reservation intent (English & Hinglish)
  const isBookingQuery =
    q.includes('book') ||
    q.includes('reserve') ||
    q.includes('table for') ||
    q.includes('table at') ||
    q.includes('have a table') ||
    q.includes('reservation') ||
    q.includes('table chahiye') ||
    q.includes('seat chahiye') ||
    q.includes('table book') ||
    q.includes('seat book');

  const containsGuests =
    q.includes('people') ||
    q.includes('person') ||
    q.includes('guests') ||
    q.includes('persons') ||
    q.includes('pax') ||
    q.includes('seats') ||
    q.includes('log') ||
    q.includes('logon') ||
    q.includes('bande');

  const containsTime =
    q.includes('pm') ||
    q.includes('am') ||
    q.includes('baje') ||
    q.includes('clock') ||
    q.includes('o\'clock') ||
    q.includes('tonight') ||
    q.includes('evening') ||
    q.includes('lunch') ||
    q.includes('dinner');

  if (isBookingQuery || containsGuests || containsTime) {
    // --- Guest Count Extraction ---
    let guestCount = 2; // default
    const guestMatch =
      q.match(/(\d+)\s*(people|person|guests|persons|pax|seats|log|logon|bande)/i) ||
      q.match(/for\s*(\d+)/i) ||
      q.match(/(\d+)\s*log/i);

    if (guestMatch) {
      guestCount = parseInt(guestMatch[1], 10);
    } else if (q.includes('couple') || q.includes('do log') || q.includes('two of us') || q.includes('2 log')) {
      guestCount = 2;
    } else if (q.includes('family') || q.includes('char log') || q.includes('chaar log') || q.includes('four of us') || q.includes('4 log')) {
      guestCount = 4;
    }

    // --- Date Extraction ---
    let date = getTodayDateString();
    if (q.includes('tomorrow') || q.includes('kal')) {
      date = getTomorrowDateString();
    } else if (q.includes('sunday') || q.includes('saturday') || q.includes('friday')) {
      date = getTomorrowDateString();
    }

    // --- Time Extraction ---
    let timeSlot = '19:30'; // default dinner
    const timeDigitMatch = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)?/i);

    if (timeDigitMatch) {
      let hours = parseInt(timeDigitMatch[1], 10);
      const minutes = timeDigitMatch[2] ? timeDigitMatch[2] : '00';
      const period = (timeDigitMatch[3] || '').toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      // Smart handling for "8 baje" or "8" without explicit am/pm
      if (!period || period === 'baje') {
        if (hours >= 1 && hours <= 6) hours += 12; // 1 to 6 baje -> 13:00 to 18:00
        else if (hours >= 7 && hours <= 11) {
          if (q.includes('subah') || q.includes('morning')) hours = hours;
          else hours += 12; // 7 to 11 baje -> 19:00 to 23:00
        }
      }

      if (hours >= 0 && hours <= 23) {
        timeSlot = `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    } else if (q.includes('lunch') || q.includes('dopahar')) {
      timeSlot = '13:00';
    } else if (q.includes('dinner') || q.includes('tonight') || q.includes('raat') || q.includes('shaam')) {
      timeSlot = '19:30';
    }

    // --- Table Preference Extraction ---
    let preference: TableSection = 'ANY';
    if (q.includes('window') || q.includes('khidki')) preference = 'WINDOW';
    else if (
      q.includes('outdoor') ||
      q.includes('garden') ||
      q.includes('patio') ||
      q.includes('terrace') ||
      q.includes('baahar') ||
      q.includes('open air')
    )
      preference = 'OUTDOOR';
    else if (q.includes('ac') || q.includes('air condition') || q.includes('thanda')) preference = 'AC_SECTION';
    else if (q.includes('vip') || q.includes('lounge') || q.includes('private')) preference = 'VIP_LOUNGE';
    else if (q.includes('couple')) preference = 'COUPLE';
    else if (q.includes('family')) preference = 'FAMILY';
    else if (q.includes('indoor') || q.includes('andar')) preference = 'INDOOR';

    // AI Smart Table Allocation calculation
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
      return {
        text: `✨ **Table Reserved & Allocated!**\n\nI have locked Table **${assigned.tableNumber}** (${assigned.capacity}-seater, ${assigned.sectionName}) at **${restaurant.name}** for **${guestCount} guests** on **${date}** at **${timeSlot}**.\n\n🤖 *AI Engine Rationale:* ${allocation.aiExplanation}`,
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
        text: `⚠️ **Time Slot Unavailable**\n\n${allocation.aiExplanation}\n\nHere are the closest available alternative slots calculated by AI for ${guestCount} guests:`,
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

  // 7. Intelligent Default Fallback with Quick Suggestions
  return {
    text: `I'm here to help! You can ask me anything in English or Hinglish like:\n\n• *"Book a table for 4 tomorrow at 8 PM"*\n• *"4 log ke liye aaj shaam 8 baje table"* \n• *"What is the live queue wait time?"*\n• *"Recommend best vegetarian starters"*\n• *"What discount coupons are available?"*\n• *"Cancel my booking QB-2026-1048"*`,
  };
}
