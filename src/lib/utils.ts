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

/**
 * Converts Google Drive share/view links to direct lh3.googleusercontent CDN image URLs.
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  
  // Check if it's a Google Drive link
  if (trimmed.includes("drive.google.com")) {
    const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/) || trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  
  return trimmed;
}
