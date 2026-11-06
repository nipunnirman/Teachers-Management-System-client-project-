// Labels and date wording in the chosen language. Stored values stay in English;
// these only change what people see.
import { isEnglish } from './i18n';

const pick = (si, en) => (isEnglish ? en : si);

export const APP_NAME = pick('ගුරු කළමනාකරණ පද්ධතිය', 'Teachers Management System');

export const MONTHS_FULL = pick(
  ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'],
  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
);
export const MONTHS_SHORT = pick(
  ['ජන', 'පෙබ', 'මාර්', 'අප්‍රේ', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝ', 'සැප්', 'ඔක්', 'නොවැ', 'දෙසැ'],
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
);

export const DAY_LABELS = pick(
  { Monday: 'සඳුදා', Tuesday: 'අඟහරුවාදා', Wednesday: 'බදාදා', Thursday: 'බ්‍රහස්පතින්දා', Friday: 'සිකුරාදා', Saturday: 'සෙනසුරාදා' },
  { Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday' },
);
export const DAY_LABELS_SHORT = pick(
  { Monday: 'සඳු', Tuesday: 'අඟ', Wednesday: 'බදා', Thursday: 'බ්‍රහ', Friday: 'සිකු', Saturday: 'සෙන' },
  { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' },
);

export const STATUS_LABELS = pick(
  {
    all: 'සියල්ල', present: 'පැමිණි', absent: 'නොපැමිණි', late: 'ප්‍රමාද', 'half-day': 'අර්ධ දින',
    approved: 'අනුමතයි', rejected: 'ප්‍රතික්ෂේපිතයි', pending: 'පොරොත්තුවෙන්', cancelled: 'අවලංගුයි',
    paid: 'ගෙවා ඇත', processed: 'සකසා ඇත', draft: 'කෙටුම්පත',
    permanent: 'ස්ථිර', temporary: 'තාවකාලික', 'part-time': 'අර්ධ කාලීන',
    active: 'සක්‍රීය', inactive: 'අක්‍රීය', holiday: 'නිවාඩු දිනය', weekend: 'සති අන්තය',
  },
  {
    all: 'All', present: 'Present', absent: 'Absent', late: 'Late', 'half-day': 'Half Day',
    approved: 'Approved', rejected: 'Rejected', pending: 'Pending', cancelled: 'Cancelled',
    paid: 'Paid', processed: 'Processed', draft: 'Draft',
    permanent: 'Permanent', temporary: 'Temporary', 'part-time': 'Part-time',
    active: 'Active', inactive: 'Inactive', holiday: 'Holiday', weekend: 'Weekend',
  },
);

export const LEAVE_TYPE_LABELS = pick(
  { annual: 'වාර්ෂික', sick: 'අසනීප', casual: 'අනියම්', maternity: 'මාතෘ', paternity: 'පීතෘ', unpaid: 'වැටුප් රහිත', other: 'වෙනත්' },
  { annual: 'Annual', sick: 'Sick', casual: 'Casual', maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid', other: 'Other' },
);

export const ROLE_LABELS = pick({ admin: 'පරිපාලක', teacher: 'ගුරුවරයා' }, { admin: 'Admin', teacher: 'Teacher' });

export const periodLabel = (period) => pick(`${period} වන කාලච්ඡේදය`, `Period ${period}`);

const WEEKDAYS_FULL = pick(
  ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'],
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
);
const WEEKDAYS_SHORT = pick(
  ['ඉරි', 'සඳු', 'අඟ', 'බදා', 'බ්‍රහ', 'සිකු', 'සෙන'],
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
);

// 2026 නොවැම්බර් 7, සෙනසුරාදා / Saturday, November 7, 2026
export function formatFullDate(value) {
  const d = new Date(value);
  const [year, month, day, weekday] = [d.getFullYear(), MONTHS_FULL[d.getMonth()], d.getDate(), WEEKDAYS_FULL[d.getDay()]];
  return pick(`${year} ${month} ${day}, ${weekday}`, `${weekday}, ${month} ${day}, ${year}`);
}

// නොවැම්බර් 7, සෙනසුරාදා / Saturday, November 7
export function formatDayDate(value) {
  const d = new Date(value);
  const [month, day, weekday] = [MONTHS_FULL[d.getMonth()], d.getDate(), WEEKDAYS_FULL[d.getDay()]];
  return pick(`${month} ${day}, ${weekday}`, `${weekday}, ${month} ${day}`);
}

// නොවැ 7, සෙන / Sat, Nov 7
export function formatShortDayDate(value) {
  const d = new Date(value);
  const [month, day, weekday] = [MONTHS_SHORT[d.getMonth()], d.getDate(), WEEKDAYS_SHORT[d.getDay()]];
  return pick(`${month} ${day}, ${weekday}`, `${weekday}, ${month} ${day}`);
}

// 2026 නොවැ 7 / Nov 7, 2026
export function formatDate(value) {
  const d = new Date(value);
  const [year, month, day] = [d.getFullYear(), MONTHS_SHORT[d.getMonth()], d.getDate()];
  return pick(`${year} ${month} ${day}`, `${month} ${day}, ${year}`);
}

// පෙ.ව. 1:37 / 1:37 AM
export function formatTime(value) {
  const d = new Date(value);
  const hours = d.getHours();
  const clock = `${hours % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
  return pick(`${hours < 12 ? 'පෙ.ව.' : 'ප.ව.'} ${clock}`, `${clock} ${hours < 12 ? 'AM' : 'PM'}`);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'} ago`;

// පැය 3කට පෙර / 3 hours ago
export function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return pick('මේ දැන්', 'just now');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return pick(`මිනිත්තු ${minutes}කට පෙර`, plural(minutes, 'minute'));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return pick(`පැය ${hours}කට පෙර`, plural(hours, 'hour'));
  const days = Math.floor(hours / 24);
  if (days === 1) return pick('ඊයේ', 'yesterday');
  if (days < 30) return pick(`දින ${days}කට පෙර`, plural(days, 'day'));
  const months = Math.floor(days / 30);
  if (months < 12) return pick(`මාස ${months}කට පෙර`, plural(months, 'month'));
  const years = Math.floor(months / 12);
  return pick(`වසර ${years}කට පෙර`, plural(years, 'year'));
}
