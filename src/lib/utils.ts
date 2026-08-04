/**
 * Converts a UTC time string (HH:MM:SS or HH:MM) to WIB (Waktu Indonesia Barat / UTC+7).
 */
export function formatUTCtoWIB(utcTimeStr: string): string {
  if (!utcTimeStr) return "--:--";
  const parts = utcTimeStr.split(':');
  if (parts.length < 2) return utcTimeStr;
  
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  
  hour = (hour + 7) % 24;
  
  return `${String(hour).padStart(2, '0')}:${minute}`;
}
