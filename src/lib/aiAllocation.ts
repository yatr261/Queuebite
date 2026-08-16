import { Restaurant, Table, Reservation, TableSection } from './types';
import { calculateEndTime } from './utils';

export interface AllocationResult {
  isAvailable: boolean;
  assignedTable?: Table;
  aiExplanation: string;
  isExactPreferenceMatch: boolean;
  alternativeTable?: Table;
  alternativeTimeSlots?: string[];
  conflictReason?: string;
  requiresWaitlist?: boolean;
}

export function parseMinutes(time24: string): number {
  const [hours, minutes] = time24.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
  bufferMinutes = 15
): boolean {
  const aStart = parseMinutes(startA);
  const aEnd = parseMinutes(endA) + bufferMinutes;
  const bStart = parseMinutes(startB);
  const bEnd = parseMinutes(endB) + bufferMinutes;

  return aStart < bEnd && aEnd > bStart;
}

export function findSmartTableAllocation(params: {
  restaurant: Restaurant;
  date: string;
  timeSlot: string; // "19:30"
  guestCount: number;
  preference: TableSection;
  existingReservations: Reservation[];
  excludeReservationId?: string;
}): AllocationResult {
  const {
    restaurant,
    date,
    timeSlot,
    guestCount,
    preference,
    existingReservations,
    excludeReservationId,
  } = params;

  const slotDuration = restaurant.slotDurationMinutes || 90;
  const bufferTime = restaurant.cleaningBufferMinutes || 15;
  const reqEndTime = calculateEndTime(timeSlot, slotDuration);

  // 1. Validate restaurant hours
  const reqStartMin = parseMinutes(timeSlot);
  const reqEndMin = parseMinutes(reqEndTime);
  const openMin = parseMinutes(restaurant.openingTime);
  const closeMin = parseMinutes(restaurant.closingTime);

  if (reqStartMin < openMin || reqEndMin > closeMin) {
    return {
      isAvailable: false,
      aiExplanation: `${restaurant.name} operates between ${restaurant.openingTime} and ${restaurant.closingTime}. The requested slot is outside dining hours.`,
      isExactPreferenceMatch: false,
      conflictReason: 'OUTSIDE_HOURS',
    };
  }

  // 2. Active reservations on that date
  const activeReservations = existingReservations.filter(
    (r) =>
      r.restaurantId === restaurant.id &&
      r.date === date &&
      r.bookingStatus !== 'CANCELLED' &&
      r.bookingStatus !== 'NO_SHOW' &&
      r.reservationId !== excludeReservationId
  );

  // 3. Filter tables with sufficient capacity
  const eligibleTables = restaurant.tables.filter(
    (t) => t.capacity >= guestCount && t.status !== 'BLOCKED'
  );

  if (eligibleTables.length === 0) {
    return {
      isAvailable: false,
      aiExplanation: `We don't have tables configured for groups of ${guestCount}. Max single table capacity is 8. Please split into multiple bookings or join waitlist.`,
      isExactPreferenceMatch: false,
      conflictReason: 'CAPACITY_EXCEEDED',
    };
  }

  // 4. Find all free tables at requested time
  const freeTables: Table[] = [];
  for (const table of eligibleTables) {
    const hasOverlap = activeReservations.some(
      (res) =>
        res.tableId === table.id &&
        isTimeOverlapping(timeSlot, reqEndTime, res.startTime, res.endTime, bufferTime)
    );

    if (!hasOverlap) {
      freeTables.push(table);
    }
  }

  // Sort free tables by closest capacity match (efficiency)
  freeTables.sort((a, b) => a.capacity - b.capacity);

  // 5. If free tables exist, check preference match
  if (freeTables.length > 0) {
    // Exact preference match
    const exactMatches = freeTables.filter(
      (t) => preference === 'ANY' || t.section === preference
    );

    if (exactMatches.length > 0) {
      const bestTable = exactMatches[0];
      const sectionName = bestTable.section.toLowerCase().replace('_', ' ');
      return {
        isAvailable: true,
        assignedTable: bestTable,
        aiExplanation: `Great news! AI allocated ${bestTable.tableNumber} (${bestTable.capacity}-seater ${sectionName}) for ${guestCount} guests at ${timeSlot}.`,
        isExactPreferenceMatch: true,
      };
    }

    // Free table in another section at the EXACT same time
    const alternativeTable = freeTables[0];
    const altSection = alternativeTable.section.toLowerCase().replace('_', ' ');
    const requestedSection = preference.toLowerCase().replace('_', ' ');

    return {
      isAvailable: true,
      assignedTable: alternativeTable,
      aiExplanation: `${requestedSection.toUpperCase()} tables are fully booked for ${timeSlot}. AI found an excellent alternative: ${alternativeTable.tableNumber} (${alternativeTable.capacity}-seat ${altSection}) at the same time.`,
      isExactPreferenceMatch: false,
      alternativeTable,
    };
  }

  // 6. If no table is available at this time, search nearby time slots
  const allTimeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
    '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

  const alternativeSlots: string[] = [];
  for (const slot of allTimeSlots) {
    if (slot === timeSlot) continue;
    const slotEnd = calculateEndTime(slot, slotDuration);
    const slotFree = eligibleTables.some((tbl) => {
      const hasConflict = activeReservations.some(
        (res) =>
          res.tableId === tbl.id &&
          isTimeOverlapping(slot, slotEnd, res.startTime, res.endTime, bufferTime)
      );
      return !hasConflict && (preference === 'ANY' || tbl.section === preference);
    });

    if (slotFree) {
      alternativeSlots.push(slot);
      if (alternativeSlots.length >= 3) break;
    }
  }

  return {
    isAvailable: false,
    aiExplanation: `All suitable tables are fully booked for ${timeSlot}. AI recommends nearby available slots or joining the live waitlist.`,
    isExactPreferenceMatch: false,
    alternativeTimeSlots: alternativeSlots,
    conflictReason: 'SLOT_FULL',
    requiresWaitlist: true,
  };
}

export function getSlotAvailabilityStatus(
  restaurant: Restaurant,
  date: string,
  timeSlot: string,
  guestCount: number,
  existingReservations: Reservation[]
): 'AVAILABLE' | 'LIMITED' | 'FULL' {
  const slotDuration = restaurant.slotDurationMinutes || 90;
  const bufferTime = restaurant.cleaningBufferMinutes || 15;
  const endTime = calculateEndTime(timeSlot, slotDuration);

  const activeReservations = existingReservations.filter(
    (r) =>
      r.restaurantId === restaurant.id &&
      r.date === date &&
      r.bookingStatus !== 'CANCELLED' &&
      r.bookingStatus !== 'NO_SHOW'
  );

  const eligibleTables = restaurant.tables.filter(
    (t) => t.capacity >= guestCount && t.status !== 'BLOCKED'
  );

  if (eligibleTables.length === 0) return 'FULL';

  let freeCount = 0;
  for (const table of eligibleTables) {
    const hasOverlap = activeReservations.some(
      (res) =>
        res.tableId === table.id &&
        isTimeOverlapping(timeSlot, endTime, res.startTime, res.endTime, bufferTime)
    );
    if (!hasOverlap) {
      freeCount++;
    }
  }

  if (freeCount === 0) return 'FULL';
  if (freeCount <= 2) return 'LIMITED';
  return 'AVAILABLE';
}
