/**
 * Spotix — Time formatting utilities
 * All times in 12-hour AM/PM format
 */

/**
 * Format a date string to "Apr 18, 02:30 PM"
 */
export function formatDateTime(d) {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/**
 * Format time only: "2:30 PM"
 */
export function formatTime(d) {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/**
 * Format full date+time: "Fri, Apr 18, 02:30 PM"
 */
export function formatFullDateTime(d) {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/**
 * Convert 24h hour number to "9:00 AM" / "2:00 PM"
 */
export function hourTo12(h) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:00 ${suffix}`;
}

/**
 * Format hour range: "9:00 AM — 9:00 PM"
 */
export function formatHourRange(openH, closeH) {
  return `${hourTo12(openH)} — ${hourTo12(closeH)}`;
}
