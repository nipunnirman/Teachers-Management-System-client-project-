// Messages are written in Sinhala. English is sent when the app asks for it with
// the X-Language header. Sri Lanka time is set explicitly so times are correct
// even when the server runs in another time zone.
const TIME_ZONE = 'Asia/Colombo';

const MONTHS = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = {
  Monday: 'සඳුදා',
  Tuesday: 'අඟහරුවාදා',
  Wednesday: 'බදාදා',
  Thursday: 'බ්‍රහස්පතින්දා',
  Friday: 'සිකුරාදා',
  Saturday: 'සෙනසුරාදා',
};

const ENGLISH = {
  'පාසලේ ස්ථානය ඇතුළත් කරන්න.': 'Enter the school location.',
  'සැකසුම් සුරකින ලදී.': 'Settings saved.',
  'මාතෘකාව සහ දිනය අවශ්‍යයි.': 'Title and date are required.',
  'අවසන් දිනය ආරම්භක දිනයට පෙර විය නොහැක.': 'The end date cannot be before the start date.',
  'සිදුවීම හමු නොවීය.': 'Event not found.',
  'සිදුවීම එක් කරන ලදී.': 'Event added.',
  'සිදුවීම යාවත්කාලීන විය.': 'Event updated.',
  'සිදුවීම ඉවත් කරන ලදී.': 'Event removed.',
  'දිනය වලංගු නැත.': 'The date is not valid.',
  'දිනය, පන්තිය සහ ආදේශක ගුරුවරයා අවශ්‍යයි.': 'Date, class and relief teacher are required.',
  'ආදේශකයක් අවශ්‍ය පන්තිය හමු නොවීය.': 'That class does not need relief on this date.',
  'මෙම පන්තියට දැනටමත් ආදේශකයෙකු පවරා ඇත.': 'This class already has a relief teacher.',
  'මෙම ගුරුවරයා එම කාලච්ඡේදයේ නිදහස් නැත.': 'This teacher is not free in that period.',
  'ආදේශක ගුරුවරයා පවරන ලදී.': 'Relief teacher assigned.',
  'ආදේශක පැවරුම හමු නොවීය.': 'Relief assignment not found.',
  'ආදේශක පැවරුම ඉවත් කරන ලදී.': 'Relief assignment removed.',
  'දැනුම්දීම් සක්‍රීය කිරීමට නොහැකි විය.': 'Could not turn on notifications.',
  'දැනුම්දීම් සක්‍රීය විය.': 'Notifications turned on.',
  'දැනුම්දීම් අක්‍රීය විය.': 'Notifications turned off.',
  'වත්මන් මුරපදය සහ නව මුරපදය අවශ්‍යයි.': 'Current and new passwords are required.',
  'වත්මන් මුරපදය වැරදියි.': 'The current password is incorrect.',
  'ඡායාරූපය වලංගු නැත.': 'The photo is not valid.',
  'පැමිණීම සටහන් කිරීමට ඔබගේ ස්ථානයට අවසර දෙන්න.': 'Allow location access to mark attendance.',
  'ඔබ පාසල් භූමියේ නොමැති බැවින් පැමිණීම සටහන් කළ නොහැක.': 'You are not at the school, so attendance cannot be marked.',
  'QR ස්කෑන් මගින් පැමිණීම සටහන් විය. ඔබ අද ප්‍රමාද වී ඇත.': 'Checked in via QR scan. You are marked late today.',
  'තෝරාගත් දිනවල පාසල් දින නොමැත.': 'There are no school days in the dates you chose.',
  'පන්තිය එක් කරන ලදී.': 'Timetable entry created.',
  'ගුරු පැතිකඩ හමු නොවීය.': 'Teacher profile not found.',
  'කාලසටහන් තොරතුර හමු නොවීය.': 'Timetable entry not found.',
  'කාලසටහන යාවත්කාලීන විය.': 'Timetable entry updated.',
  'පන්තිය ඉවත් කරන ලදී.': 'Timetable entry removed.',
  'පරිශීලකයා සාර්ථකව ලියාපදිංචි විය.': 'User registered successfully.',
  'ඊමේල් ලිපිනය සහ මුරපදය අවශ්‍යයි.': 'Email and password are required.',
  'ඊමේල් ලිපිනය හෝ මුරපදය වැරදියි.': 'Invalid email or password.',
  'මෙම ගිණුම අක්‍රීය කර ඇත.': 'This account has been deactivated.',
  'පිවිසීම සාර්ථකයි.': 'Login successful.',
  'එම ඊමේල් ලිපිනය සහිත පරිශීලකයෙකු හමු නොවීය.': 'No user found with that email.',
  'මුරපදය යළි සැකසීමේ ඊමේල් පණිවිඩය යවන ලදී.': 'Password reset email sent.',
  'සබැඳිය වලංගු නැත හෝ කල් ඉකුත් වී ඇත.': 'Token is invalid or has expired.',
  'මුරපදය සාර්ථකව යළි සකසන ලදී.': 'Password reset successful.',
  'පරිශීලකයා හමු නොවීය.': 'User not found.',
  'මුරපදය සාර්ථකව යාවත්කාලීන විය.': 'Password updated successfully.',
  'නිවාඩු ඉල්ලීම යවන ලදී.': 'Leave request submitted.',
  'තත්ත්වය අනුමත හෝ ප්‍රතික්ෂේප විය යුතුය.': 'Status must be approved or rejected.',
  'නිවාඩු ඉල්ලීම හමු නොවීය.': 'Leave request not found.',
  'මෙම ඉල්ලීම දැනටමත් පරීක්ෂා කර ඇත.': 'This request has already been reviewed.',
  'නිවාඩුව අනුමත කරන ලදී.': 'Leave approved.',
  'නිවාඩුව ප්‍රතික්ෂේප කරන ලදී.': 'Leave rejected.',
  'පොරොත්තුවෙන් පවතින ඉල්ලීම් පමණක් අවලංගු කළ හැක.': 'Only pending requests can be cancelled.',
  'නිවාඩු ඉල්ලීම අවලංගු කරන ලදී.': 'Leave request cancelled.',
  'පැමිණීම සටහන් විය.': 'Attendance marked.',
  'පැමිණීමේ වාර්තාව හමු නොවීය.': 'Attendance record not found.',
  'පැමිණීම යාවත්කාලීන විය.': 'Attendance updated.',
  'QR කේතය අවශ්‍යයි.': 'QR token is required.',
  'QR කේතය වලංගු නැත හෝ කල් ඉකුත් වී ඇත.': 'Invalid or expired QR code.',
  'මෙම පරිශීලකයාට ගුරු පැතිකඩක් හමු නොවීය.': 'Teacher profile not found for this user.',
  'QR ස්කෑන් මගින් පිටවීම සාර්ථකව සටහන් විය.': 'Check-out marked successfully via QR scan.',
  'ඔබ අද පැමිණීම සහ පිටවීම දැනටමත් සටහන් කර ඇත.': 'You have already checked in and checked out for today.',
  'QR ස්කෑන් මගින් පැමිණීම සාර්ථකව සටහන් විය.': 'Check-in marked successfully via QR scan.',
  'ගුරුවරයා හමු නොවීය.': 'Teacher not found.',
  'ගුරු තොරතුරු සාර්ථකව යාවත්කාලීන විය.': 'Teacher updated successfully.',
  'ගුරුවරයා සාර්ථකව ඉවත් කරන ලදී.': 'Teacher removed successfully.',
  'දැනුම්දීම හමු නොවීය.': 'Notification not found.',
  'සියලු දැනුම්දීම් කියවූ ලෙස සලකුණු කරන ලදී.': 'All notifications marked as read.',
  'දැනුම්දීම මකන ලදී.': 'Notification deleted.',
  'සේවාදායක දෝෂයක් ඇති විය.': 'Internal Server Error',
  'මෙම ඊමේල් ලිපිනය දැනටමත් භාවිතයේ ඇත.': 'Email already exists.',
  'මෙම තොරතුර දැනටමත් පවතී.': 'This record already exists.',
  'ප්‍රවේශ යතුර වලංගු නැත.': 'Invalid token.',
  'සැසිය කල් ඉකුත් වී ඇත. කරුණාකර නැවත පිවිසෙන්න.': 'Token expired. Please log in again.',
  'අදාළ තොරතුර හමු නොවීය.': 'Resource not found.',
  'ප්‍රවේශයට අවසර නැත. කරුණාකර පිවිසෙන්න.': 'Not authorized. No token provided.',
  'මෙම පරිශීලකයා තවදුරටත් නොමැත.': 'User no longer exists.',
  'ප්‍රවේශයට අවසර නැත. කරුණාකර නැවත පිවිසෙන්න.': 'Not authorized. Invalid token.',
  'මෙම ක්‍රියාව සඳහා ඔබට අවසර නැත.': 'You are not authorized to do this.',
  'නම අවශ්‍යයි': 'Name is required',
  'ඊමේල් ලිපිනය අවශ්‍යයි': 'Email is required',
  'කරුණාකර වලංගු ඊමේල් ලිපිනයක් ඇතුළත් කරන්න': 'Please enter a valid email',
  'මුරපදය අවශ්‍යයි': 'Password is required',
  'මුරපදයේ අවම වශයෙන් අක්ෂර 8ක් තිබිය යුතුය': 'Password must be at least 8 characters',
};

function colomboParts(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type) => Number(parts.find((p) => p.type === type).value);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') };
}

const dayLabel = (day) => DAY_LABELS[day] || day;
const periodLabel = (period) => `${period} වන කාලච්ඡේදය`;

function timeLabel(date) {
  const { hour, minute } = colomboParts(date);
  return `${hour < 12 ? 'පෙ.ව.' : 'ප.ව.'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`;
}

function timeLabelEn(date) {
  const { hour, minute } = colomboParts(date);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

function dateLabel(date) {
  const { year, month, day } = colomboParts(date);
  return `${year} ${MONTHS[month - 1]} ${day}`;
}

function dateLabelEn(date) {
  const { year, month, day } = colomboParts(date);
  return `${MONTHS_EN[month - 1]} ${day}, ${year}`;
}

// Minutes since midnight in Sri Lanka.
function colomboMinutes(date) {
  const { hour, minute } = colomboParts(date);
  return hour * 60 + minute;
}

const wantsEnglish = (req) => req.get('X-Language') === 'en';

// For messages with values inside them.
const pick = (req, sinhala, english) => (wantsEnglish(req) ? english : sinhala);

// Sends fixed messages in the language the app asked for.
function localizeResponses(req, res, next) {
  if (wantsEnglish(req)) {
    const send = res.json.bind(res);
    res.json = (body) => {
      if (body && typeof body.message === 'string') {
        const message = ENGLISH[body.message] || body.message.split(', ').map((part) => ENGLISH[part] || part).join(', ');
        return send({ ...body, message });
      }
      return send(body);
    };
  }
  next();
}

module.exports = { colomboMinutes, dayLabel, periodLabel, timeLabel, timeLabelEn, dateLabel, dateLabelEn, pick, localizeResponses };
