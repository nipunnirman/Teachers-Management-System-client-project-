const Attendance = require('../models/Attendance');
const CalendarEvent = require('../models/CalendarEvent');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const ReliefAssignment = require('../models/ReliefAssignment');
const Settings = require('../models/Settings');
const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const { dateLabel, dateLabelEn, periodLabel } = require('../utils/sinhala');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Everything needed to plan cover for one date.
async function buildPlan(date) {
  const day = WEEKDAYS[date.getUTCDay()];
  const endOfDay = new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
  const holiday = await CalendarEvent.findOne({ type: 'holiday', startDate: { $lte: endOfDay }, endDate: { $gte: date } });
  const plan = { date, day, holiday: holiday ? holiday.title : null, slots: [] };
  if (holiday || day === 'Sunday') return plan;

  const { academicYear } = await Settings.current();
  const [absentRecords, leaves, teachers, dayEntries, assignments] = await Promise.all([
    Attendance.find({ date, status: 'absent' }).select('teacher'),
    Leave.find({ status: 'approved', startDate: { $lte: endOfDay }, endDate: { $gte: date } }).select('teacher'),
    Teacher.find().populate('user', 'name isActive').select('teacherId user'),
    Timetable.find({ day, academicYear, isActive: true }),
    ReliefAssignment.find({ date }),
  ]);

  const absentIds = new Set([...absentRecords, ...leaves].map((r) => String(r.teacher)));
  const activeTeachers = teachers.filter((t) => t.user && t.user.isActive);
  const nameOf = (id) => activeTeachers.find((t) => String(t._id) === String(id));

  const isBusy = (teacherId, period) =>
    dayEntries.some((e) => String(e.teacher) === String(teacherId) && e.period === period) ||
    assignments.some((a) => String(a.reliefTeacher) === String(teacherId) && a.period === period);
  const loadOf = (teacherId) =>
    dayEntries.filter((e) => String(e.teacher) === String(teacherId)).length +
    assignments.filter((a) => String(a.reliefTeacher) === String(teacherId)).length;

  plan.slots = dayEntries
    .filter((entry) => absentIds.has(String(entry.teacher)))
    .sort((a, b) => a.period - b.period)
    .map((entry) => {
      const assignment = assignments.find((a) => String(a.timetableEntry) === String(entry._id));
      const absent = nameOf(entry.teacher);
      const relief = assignment && nameOf(assignment.reliefTeacher);
      return {
        entryId: entry._id,
        period: entry.period,
        subject: entry.subject,
        className: entry.className,
        grade: entry.grade,
        startTime: entry.startTime,
        endTime: entry.endTime,
        absentTeacher: { _id: entry.teacher, name: absent ? absent.user.name : '' },
        assignment: assignment
          ? { _id: assignment._id, reliefTeacher: { _id: assignment.reliefTeacher, name: relief ? relief.user.name : '' } }
          : null,
        freeTeachers: activeTeachers
          .filter((t) => !absentIds.has(String(t._id)) && !isBusy(t._id, entry.period))
          .map((t) => ({ _id: t._id, name: t.user.name, teacherId: t.teacherId, periodsToday: loadOf(t._id) }))
          .sort((a, b) => a.periodsToday - b.periodsToday),
      };
    });
  return plan;
}

// @route   GET /api/relief?date=2026-11-09
// @access  Admin
const getReliefPlan = async (req, res, next) => {
  try {
    const date = parseDate(req.query.date || new Date().toISOString());
    if (!date) return res.status(400).json({ success: false, message: 'දිනය වලංගු නැත.' });
    res.status(200).json({ success: true, plan: await buildPlan(date) });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/relief
// @access  Admin
const assignRelief = async (req, res, next) => {
  try {
    const { date: rawDate, entryId, reliefTeacherId } = req.body;
    const date = parseDate(rawDate);
    if (!date || !entryId || !reliefTeacherId) {
      return res.status(400).json({ success: false, message: 'දිනය, පන්තිය සහ ආදේශක ගුරුවරයා අවශ්‍යයි.' });
    }

    const plan = await buildPlan(date);
    const slot = plan.slots.find((s) => String(s.entryId) === String(entryId));
    if (!slot) return res.status(404).json({ success: false, message: 'ආදේශකයක් අවශ්‍ය පන්තිය හමු නොවීය.' });
    if (slot.assignment) return res.status(400).json({ success: false, message: 'මෙම පන්තියට දැනටමත් ආදේශකයෙකු පවරා ඇත.' });
    if (!slot.freeTeachers.some((t) => String(t._id) === String(reliefTeacherId))) {
      return res.status(400).json({ success: false, message: 'මෙම ගුරුවරයා එම කාලච්ඡේදයේ නිදහස් නැත.' });
    }

    const assignment = await ReliefAssignment.create({
      date,
      timetableEntry: entryId,
      absentTeacher: slot.absentTeacher._id,
      reliefTeacher: reliefTeacherId,
      subject: slot.subject,
      grade: slot.grade,
      className: slot.className,
      period: slot.period,
      startTime: slot.startTime,
      endTime: slot.endTime,
      assignedBy: req.user.id,
    });

    const relief = await Teacher.findById(reliefTeacherId).select('user');
    await Notification.create({
      recipient: relief.user,
      type: 'timetable',
      title: 'ආදේශක පන්තියක් පවරා ඇත',
      titleEn: 'Relief class assigned',
      message: `${dateLabel(date)}, ${periodLabel(slot.period)} (${slot.startTime} - ${slot.endTime}) ${slot.className} පන්තියේ ${slot.subject} විෂයට ඔබ ආදේශකයා ලෙස පවරා ඇත.`,
      messageEn: `You are covering ${slot.subject} for ${slot.className} on ${dateLabelEn(date)}, Period ${slot.period} (${slot.startTime} - ${slot.endTime}).`,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, message: 'ආදේශක ගුරුවරයා පවරන ලදී.', assignment });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/relief/:id
// @access  Admin
const removeRelief = async (req, res, next) => {
  try {
    const assignment = await ReliefAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'ආදේශක පැවරුම හමු නොවීය.' });
    await assignment.deleteOne();

    const relief = await Teacher.findById(assignment.reliefTeacher).select('user');
    if (relief) {
      await Notification.create({
        recipient: relief.user,
        type: 'timetable',
        title: 'ආදේශක පන්තිය අවලංගු විය',
        titleEn: 'Relief class cancelled',
        message: `${dateLabel(assignment.date)}, ${periodLabel(assignment.period)} ${assignment.className} පන්තියේ ආදේශක පැවරුම අවලංගු කර ඇත.`,
        messageEn: `Your relief class for ${assignment.className} on ${dateLabelEn(assignment.date)}, Period ${assignment.period} has been cancelled.`,
        createdBy: req.user.id,
      });
    }
    res.status(200).json({ success: true, message: 'ආදේශක පැවරුම ඉවත් කරන ලදී.' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/relief/me?date=2026-11-09
// @access  Teacher
const getMyRelief = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id }).select('_id');
    if (!teacher) return res.status(404).json({ success: false, message: 'ගුරු පැතිකඩ හමු නොවීය.' });
    const date = parseDate(req.query.date || new Date().toISOString());
    if (!date) return res.status(400).json({ success: false, message: 'දිනය වලංගු නැත.' });
    const assignments = await ReliefAssignment.find({ date, reliefTeacher: teacher._id }).sort({ period: 1 });
    res.status(200).json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReliefPlan, assignRelief, removeRelief, getMyRelief };
