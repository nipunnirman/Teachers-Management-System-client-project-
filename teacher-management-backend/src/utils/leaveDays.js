const CalendarEvent = require('../models/CalendarEvent');

const DAY = 24 * 60 * 60 * 1000;

const toUtcDay = (value) => {
  const d = new Date(value);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

// Leave days counted between two dates, leaving out Saturdays, Sundays and
// holidays on the school calendar.
async function countLeaveDays(startDate, endDate) {
  const start = toUtcDay(startDate);
  const end = toUtcDay(endDate);
  const holidays = await CalendarEvent.find({
    type: 'holiday',
    startDate: { $lte: new Date(end) },
    endDate: { $gte: new Date(start) },
  });

  let days = 0;
  for (let day = start; day <= end; day += DAY) {
    const weekday = new Date(day).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const isHoliday = holidays.some((h) => toUtcDay(h.startDate) <= day && day <= toUtcDay(h.endDate));
    if (!isHoliday) days += 1;
  }
  return days;
}

module.exports = { countLeaveDays };
