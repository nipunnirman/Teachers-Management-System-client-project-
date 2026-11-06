import { settingsAPI } from '../api';

let cached = null;

// School settings, fetched once and shared across pages.
export function loadSettings(force = false) {
  if (!cached || force) {
    cached = settingsAPI.get()
      .then((res) => res.data.settings)
      .catch((error) => {
        cached = null;
        throw error;
      });
  }
  return cached;
}

export function clearSettings() {
  cached = null;
}

// YYYY-MM-DD for the device's current day.
export function dateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export const eventCoversDate = (event, key) =>
  event.startDate.slice(0, 10) <= key && key <= event.endDate.slice(0, 10);
