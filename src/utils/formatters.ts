/**
 * Formats any time input (e.g., "10:38:43.241", "10:38:43", "10:38", "2026-10-07T10:38:43.241")
 * into a clean 12-hour AM/PM formatted string like "10:38:43 AM" or "10:38 AM".
 */
export function formatTime(timeInput?: string | Date | null, includeSeconds: boolean = true): string {
  if (!timeInput) return '--:--';

  let str: string;
  if (timeInput instanceof Date) {
    return timeInput.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    });
  } else {
    str = String(timeInput).trim();
  }

  // If already formatted like "10:38 AM" or "10:38:43 AM", clean & return
  if (/^\d{1,2}:\d{2}(:\d{2})?\s?(AM|PM|am|pm)$/i.test(str)) {
    return str.toUpperCase();
  }

  try {
    // Full ISO date-time string
    if (str.includes('T')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: includeSeconds ? '2-digit' : undefined,
          hour12: true,
        });
      }
    }

    // Split HH:mm:ss or HH:mm:ss.SSS
    const cleanTime = str.split('.')[0]; // Strip nanoseconds/milliseconds (.241)
    const parts = cleanTime.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;

      if (isNaN(hours) || isNaN(minutes)) return str;

      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12

      const hStr = hours < 10 ? `0${hours}` : `${hours}`;
      const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const sStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

      if (includeSeconds) {
        return `${hStr}:${mStr}:${sStr} ${ampm}`;
      }
      return `${hStr}:${mStr} ${ampm}`;
    }
  } catch {
    // Fallback
  }

  return str;
}
