// Sinhala is written directly in the pages and is the default language.
// This file holds the English for each string.
const STORAGE_KEY = 'language';

function readLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'si';
  } catch {
    return 'si';
  }
}

const language = readLanguage();

export const getLanguage = () => language;
export const isEnglish = language === 'en';

// Module-level labels are read when the app starts, so changing language reloads it.
export function setLanguage(next) {
  if (next === language) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    return;
  }
  window.location.reload();
}

const ENGLISH = {
  // Navigation and shared
  'වසන්න': 'Close',
  'දත්ත හමු නොවීය': 'No data found',
  'මුල් පිටුව': 'Home',
  'ගුරුවරු': 'Teachers',
  'පැමිණීම': 'Attendance',
  'නිවාඩු': 'Leave',
  'කාලසටහන': 'Timetable',
  'වාර්තා': 'Reports',
  'දැනුම්දීම්': 'Notifications',
  'ස්කෑන්': 'Scan',
  'මගේ නිවාඩු': 'My Leave',
  'ප්‍රධාන මෙනුව': 'Main menu',
  'තවත්': 'More',
  'ඉවත් වන්න': 'Sign out',
  'මගේ පැමිණීම': 'My Attendance',
  'මගේ කාලසටහන': 'My Timetable',
  'භාෂාව': 'Language',
  'දැනුම්දීම්, නොකියවූ {count}ක්': 'Notifications, {count} unread',

  // Attendance
  'QR කේතය ලබාගැනීමට නොහැකි විය': 'Failed to get QR code',
  'පැමිණීම සටහන් වෙමින්...': 'Marking attendance...',
  'සාර්ථකව සටහන් විය!': 'Successfully recorded!',
  'පැමිණීම සටහන් විය!': 'Attendance marked!',
  'පැමිණීම සටහන් කිරීමට නොහැකි විය': 'Failed to mark attendance',
  'කැමරාවට ප්‍රවේශ විය නොහැක': 'Failed to access camera',
  'පැමිණීමේ දත්ත ලබාගැනීමට නොහැකි විය': 'Failed to load attendance',
  'ගුරුවරයා සහ දිනය තෝරන්න': 'Select teacher and date',
  'පැමිණීම සටහන් විය': 'Attendance marked',
  'අසාර්ථක විය': 'Failed',
  'පැමිණීම් කළමනාකරණය': 'Attendance Management',
  'මාසය': 'Month',
  'දෛනික QR': 'Daily QR',
  'සටහන් කරන්න': 'Mark',
  'QR ස්කෑන්': 'Scan QR',
  'පැමිණි': 'Present',
  'නොපැමිණි': 'Absent',
  'ප්‍රමාද': 'Late',
  'අර්ධ දින': 'Half Day',
  'පැමිණීමේ වාර්තා නොමැත': 'No attendance records',
  'සටහන් කළ පසු වාර්තා මෙහි දිස්වේ.': 'Records will appear here once marked.',
  'දිනය': 'Date',
  'සතියේ දිනය': 'Day',
  'ගුරුවරයා': 'Teacher',
  'තත්ත්වය': 'Status',
  'පැමිණි වේලාව': 'Check In',
  'පිටවූ වේලාව': 'Check Out',
  'සටහන් කළේ': 'Marked By',
  'සටහන්': 'Notes',
  'පැමිණීම සටහන් කරන්න': 'Mark Attendance',
  'අවලංගු කරන්න': 'Cancel',
  'සුරකිමින්…': 'Saving…',
  'ගුරුවරයා *': 'Teacher *',
  'ගුරුවරයා තෝරන්න…': 'Select teacher…',
  'දිනය *': 'Date *',
  'තත්ත්වය *': 'Status *',
  'අමතර සටහනක් (අවශ්‍ය නම්)…': 'Optional note…',
  'අද පැමිණීමේ QR කේතය': "Today's Attendance QR Code",
  'මෙම QR කේතය ගුරුවරුන්ට පෙන්වන්න. ඔවුන්ගේ දුරකථනයෙන් එය ස්කෑන් කර පැමිණීම සටහන් කළ හැක.': 'Show this QR code to teachers. They can scan it from their phones to mark themselves present.',
  'පැමිණීමේ QR කේතය ස්කෑන් කරන්න': 'Scan attendance QR code',
  'හරි': 'Done',
  'සාර්ථකව ස්කෑන් විය': 'Successfully scanned',
  'දෛනික QR කේතය පෙන්වන තිරය වෙත කැමරාව යොමු කරන්න.': 'Point your camera at the screen displaying the Daily QR code.',
  // Saved attendance notes, shown in the viewer's language
  'QR ස්කෑන් මගින් පැමිණීම සටහන් විය': 'Checked in via QR scan',

  // Dashboard
  'වත්මන් වේලාව': 'Current time',
  'අද පන්ති නොමැත': 'No classes scheduled for today',
  'අද තවත් පන්ති නොමැත': 'No more classes today',
  'ඊළඟ පන්තියට {wait}': 'Next class {wait}',
  'තව මිනිත්තු {m}': 'in {m} min',
  'තව පැය {h} මිනිත්තු {m}': 'in {h} hr {m} min',
  'තව පැය {h}': 'in {h} hr',
  'අද කාලසටහන': "Today's schedule",
  'ඊළඟ පන්තිය': 'Next class',
  'දැන් පැවැත්වේ': 'In progress',
  'අද පන්ති සැලසුම් කර නොමැත.': 'No classes scheduled for today.',
  'මාසයේ පැමිණි දින': 'Present This Month',
  'මාසයේ නොපැමිණි දින': 'Absent This Month',
  'අද පන්ති': "Today's Classes",
  'පොරොත්තු නිවාඩු': 'Pending Leaves',
  'සතියේ පන්ති': 'Weekly Classes',
  'සමාලෝචනය': 'Overview',
  'මුළු ගුරුවරු': 'Total Teachers',
  'අද පැමිණි': 'Present Today',
  'අද නොපැමිණි': 'Absent Today',
  'පැමිණීමේ ප්‍රවණතාව': 'Attendance trend',
  'මාසික විස්තරය · {year}': 'Monthly breakdown · {year}',
  'සුභ උදෑසනක්': 'Good morning',
  'සුභ දහවලක්': 'Good afternoon',
  'සුභ සන්ධ්‍යාවක්': 'Good evening',

  // Leave
  'නිවාඩු දත්ත ලබාගැනීමට නොහැකි විය': 'Failed to load leaves',
  'අවශ්‍ය සියලු තොරතුරු ඇතුළත් කරන්න': 'Fill all required fields',
  'නිවාඩු ඉල්ලීම යවන ලදී': 'Leave request submitted',
  'නිවාඩුව අනුමත කරන ලදී': 'Leave approved',
  'නිවාඩුව ප්‍රතික්ෂේප කරන ලදී': 'Leave rejected',
  'මෙම නිවාඩු ඉල්ලීම අවලංගු කරන්නද?': 'Cancel this leave request?',
  'අවලංගු කරන ලදී': 'Cancelled',
  'අවලංගු කිරීමට නොහැකි විය': 'Failed to cancel',
  'නිවාඩු කළමනාකරණය': 'Leave Management',
  'මගේ නිවාඩු ඉල්ලීම්': 'My Leave Requests',
  'ඉල්ලීම් {count}': '{count} requests',
  'නිවාඩු ඉල්ලන්න': 'Apply for Leave',
  'නිවාඩු ඉල්ලීම් නොමැත': 'No leave requests',
  'වර්ගය': 'Type',
  'සිට': 'From',
  'දක්වා': 'To',
  'දින': 'Days',
  'දින {days}': (v) => (Number(v.days) === 1 ? '1 day' : `${v.days} days`),
  '{type} නිවාඩු · දින {days}': (v) => `${v.type} leave · ${Number(v.days) === 1 ? '1 day' : `${v.days} days`}`,
  'හේතුව': 'Reason',
  'ක්‍රියා': 'Actions',
  'පරීක්ෂා කරන්න': 'Review',
  'නිවාඩු ඉල්ලීම': 'Apply for Leave',
  'යවමින්…': 'Submitting…',
  'ඉල්ලීම යවන්න': 'Submit Request',
  'නිවාඩු වර්ගය *': 'Leave Type *',
  'ආරම්භක දිනය *': 'Start Date *',
  'අවසන් දිනය *': 'End Date *',
  'හේතුව *': 'Reason *',
  'හේතුව කෙටියෙන් සඳහන් කරන්න…': 'Briefly describe your reason…',
  'නිවාඩු ඉල්ලීම පරීක්ෂා කිරීම': 'Review Leave Request',
  'ප්‍රතික්ෂේප': 'Reject',
  'අනුමත': 'Approve',
  'කාලය': 'Period',
  'සටහන (අවශ්‍ය නම්)': 'Note (optional)',
  'ගුරුවරයා සඳහා සටහනක් එක් කරන්න…': 'Add a note for the teacher…',

  // Notifications
  'දැනුම්දීම් ලබාගැනීමට නොහැකි විය': 'Failed to load notifications',
  'සියල්ල කියවූ ලෙස සලකුණු කරන ලදී': 'All marked as read',
  'මාතෘකාව සහ පණිවිඩය ඇතුළත් කරන්න': 'Fill title and message',
  'නිවේදනය යවන ලදී': 'Announcement sent',
  'යැවීමට නොහැකි විය': 'Failed to send',
  'නොකියවූ {count}ක්': '{count} unread',
  'සියල්ල කියවා ඇත': 'All caught up',
  'සියල්ල කියවූ ලෙස සලකුණු කරන්න': 'Mark All Read',
  'නිවේදනයක් යවන්න': 'Announce',
  'තවම දැනුම්දීම් නොමැත': 'No notifications yet',
  'නිවාඩු, පැමිණීම සහ නිවේදන පිළිබඳ දැනුම්දීම් මෙහි දිස්වේ.': 'Alerts for leave, attendance, and announcements will appear here.',
  '{title} මකන්න': 'Delete {title}',
  'නිවේදනයක් යැවීම': 'Send Announcement',
  'සියලු ගුරුවරුන්ට යවන්න': 'Send to All Teachers',
  'මෙය සියලු සක්‍රීය ගුරුවරුන්ට යෙදුම තුළ දැනුම්දීමක් ලෙස යැවේ.': 'This will send an in-app notification to all active teachers.',
  'මාතෘකාව *': 'Title *',
  'වැදගත් නිවේදනය': 'Important Announcement',
  'පණිවිඩය *': 'Message *',
  'ඔබේ පණිවිඩය මෙහි ලියන්න…': 'Write your message here…',

  // Timetable
  'කාලසටහන ලබාගැනීමට නොහැකි විය': 'Failed to load timetable',
  'පන්තිය එක් කරන ලදී': 'Entry added',
  'අසාර්ථක විය — කාල ගැටුම් පරීක්ෂා කරන්න': 'Failed — check for conflicts',
  'මෙම පන්තිය ඉවත් කරන්නද?': 'Remove this entry?',
  'ඉවත් කරන ලදී': 'Removed',
  'කාලසටහන් කළමනාකරණය': 'Timetable Management',
  'අධ්‍යයන වර්ෂය {year}': 'Academic Year {year}',
  'ගුරුවරයා අනුව පෙරන්න': 'Filter by teacher',
  'සියලු ගුරුවරු': 'All Teachers',
  'පන්තියක් එක් කරන්න': 'Add Entry',
  '{subject} ඉවත් කරන්න': 'Remove {subject}',
  '{day}, {period} සඳහා පන්තියක් එක් කරන්න': 'Add class on {day}, {period}',
  '{day} දිනට පන්ති නොමැත': 'No classes on {day}',
  'කාලච්ඡේදය': 'Period',
  'පන්තියක් එක් කිරීම': 'Add Timetable Entry',
  'එක් කරන්න': 'Add Entry',
  'විෂය *': 'Subject *',
  'ගණිතය': 'Mathematics',
  'පන්තිය *': 'Class *',
  'ශ්‍රේණිය': 'Grade',
  '10 ශ්‍රේණිය': 'Grade 10',
  'ආරම්භක වේලාව': 'Start Time',
  'අවසන් වේලාව': 'End Time',

  // Reports
  'වාර්තා ලබාගැනීමට නොහැකි විය': 'Failed to load reports',
  'වාර්තා සහ විශ්ලේෂණ': 'Reports & Analytics',
  '{year} වර්ෂයේ සාරාංශය': 'Year {year} overview',
  'මාසික වැටුප්': 'Monthly Payroll',
  'රු. {amount}': 'Rs. {amount}',
  'මාසික පැමිණි / නොපැමිණි / ප්‍රමාද · {year}': 'Monthly present / absent / late · {year}',
  'වර්ගය අනුව නිවාඩු': 'Leave by type',
  'අනුමත නිවාඩු දින · {year}': 'Approved leave days · {year}',
  'තත්ත්වය අනුව නිවාඩු': 'Leave by status',
  'සියලු ඉල්ලීම් · {year}': 'All requests · {year}',
  'වැටුප් ප්‍රවණතාව': 'Payroll trend',
  'මාසික දළ සහ ශුද්ධ වැටුප් · {year}': 'Monthly gross vs net · {year}',
  'දළ': 'Gross',
  'ශුද්ධ': 'Net',
  'ගුරු කාර්යභාරය': 'Teacher workload',
  'එක් ගුරුවරයෙකුට පවරා ඇති කාලච්ඡේද': 'Periods assigned per teacher',
  'අංකය': 'ID',
  'අංශය': 'Department',
  'විෂයයන්': 'Subjects',
  'මුළු කාලච්ඡේද': 'Total Periods',

  // Teachers
  'ගුරු දත්ත ලබාගැනීමට නොහැකි විය': 'Failed to load teachers',
  'නම සහ ඊමේල් ලිපිනය අවශ්‍යයි': 'Name and email are required',
  'ගුරු තොරතුරු යාවත්කාලීන විය': 'Teacher updated',
  'ගුරුවරයා ලියාපදිංචි විය': 'Teacher registered',
  'සුරැකීමට නොහැකි විය': 'Failed to save',
  '{name} ඉවත් කරන්නද? මෙය ආපසු හැරවිය නොහැක.': 'Remove {name}? This cannot be undone.',
  'ගුරුවරයා ඉවත් කරන ලදී': 'Teacher removed',
  'ඉවත් කිරීමට නොහැකි විය': 'Failed to remove',
  'ගුරුවරු {count}': '{count} teachers',
  'ගුරුවරයෙකු එක් කරන්න': 'Add Teacher',
  'නම, ඊමේල් හෝ අංශය සොයන්න…': 'Search name, email, department…',
  'සෙවුම මකන්න': 'Clear search',
  'ගුරුවරු හමු නොවීය': 'No teachers found',
  'බලන්න': 'View',
  'සංස්කරණය': 'Edit',
  'මකන්න': 'Remove',
  'ගුරු තොරතුරු සංස්කරණය': 'Edit Teacher',
  'නව ගුරුවරයෙකු එක් කිරීම': 'Add New Teacher',
  'සුරකින්න': 'Save Changes',
  'ලියාපදිංචි කරන්න': 'Register Teacher',
  'සම්පූර්ණ නම *': 'Full Name *',
  'කමලා පෙරේරා': 'Kamala Perera',
  'ඊමේල් ලිපිනය *': 'Email *',
  'මුරපදය *': 'Password *',
  'අවම වශයෙන් අක්ෂර 8ක්': 'Min 8 characters',
  'විද්‍යාව': 'Science',
  'දුරකථන අංකය': 'Phone',
  'විෂයයන් (කොමා යොදා වෙන් කරන්න)': 'Subjects (comma-separated)',
  'ගණිතය, විද්‍යාව': 'Mathematics, Science',
  'ශ්‍රේණි (කොමා යොදා වෙන් කරන්න)': 'Grades (comma-separated)',
  '9 ශ්‍රේණිය, 10 ශ්‍රේණිය': 'Grade 9, Grade 10',
  'සේවා වර්ගය': 'Employment Type',
  'ගුරු පැතිකඩ': 'Teacher Profile',
  'ගුරු අංකය': 'Teacher ID',
  'ශ්‍රේණි': 'Grades',
  'සේවයට එක් වූ දිනය': 'Joined',

  // Sign in
  'කරුණාකර සියලු තොරතුරු ඇතුළත් කරන්න': 'Please fill in all fields',
  'ඔබව සාදරයෙන් පිළිගනිමු!': 'Welcome back!',
  'පිවිසීම අසාර්ථක විය': 'Login failed',
  'ආයුබෝවන්': 'Welcome back',
  'ඉදිරියට යාමට ඔබගේ ගිණුමට පිවිසෙන්න': 'Sign in to your account to continue',
  'ඊමේල් ලිපිනය': 'Email address',
  'මුරපදය': 'Password',
  'ඔබගේ මුරපදය': 'Your password',
  'මුරපදය සඟවන්න': 'Hide password',
  'මුරපදය පෙන්වන්න': 'Show password',
  'පිවිසෙන්න': 'Sign in',
  'මුරපදය අමතක වූවාද? පාසල් පරිපාලකයා අමතන්න.': 'Forgot your password? Contact your administrator.',
};

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (match, name) => (vars && vars[name] !== undefined ? vars[name] : match));

// Sinhala is the key. Text that is not in the list (such as names) passes through.
export function tr(key, vars) {
  if (!isEnglish) return fill(key, vars);
  const english = ENGLISH[key];
  if (english === undefined) return fill(key, vars);
  return typeof english === 'function' ? english(vars || {}) : fill(english, vars);
}

// For saved notes that may be stored in either language.
export function trSaved(text) {
  if (!text) return text;
  if (isEnglish) return tr(text);
  const match = Object.keys(ENGLISH).find((key) => ENGLISH[key] === text);
  return match || text;
}
