const CalendarEvent = require('../models/CalendarEvent');

const EVENT_NOT_FOUND = 'සිදුවීම හමු නොවීය.';

function readEvent(body) {
  const { title, type, startDate, endDate, notes } = body;
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  if (!title || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { error: 'මාතෘකාව සහ දිනය අවශ්‍යයි.' };
  if (end < start) return { error: 'අවසන් දිනය ආරම්භක දිනයට පෙර විය නොහැක.' };
  return { event: { title, type, startDate: start, endDate: end, notes } };
}

// @route   GET /api/calendar?year=2026&month=11
// @access  Private
const getEvents = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
    const month = parseInt(req.query.month, 10);
    const from = month ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, 0, 1));
    const to = month ? new Date(Date.UTC(year, month, 0, 23, 59, 59)) : new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    const events = await CalendarEvent.find({ startDate: { $lte: to }, endDate: { $gte: from } }).sort({ startDate: 1 });
    res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/calendar
// @access  Admin
const createEvent = async (req, res, next) => {
  try {
    const { event, error } = readEvent(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const created = await CalendarEvent.create({ ...event, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'සිදුවීම එක් කරන ලදී.', event: created });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/calendar/:id
// @access  Admin
const updateEvent = async (req, res, next) => {
  try {
    const { event, error } = readEvent(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const updated = await CalendarEvent.findByIdAndUpdate(req.params.id, event, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: EVENT_NOT_FOUND });
    res.status(200).json({ success: true, message: 'සිදුවීම යාවත්කාලීන විය.', event: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/calendar/:id
// @access  Admin
const deleteEvent = async (req, res, next) => {
  try {
    const deleted = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: EVENT_NOT_FOUND });
    res.status(200).json({ success: true, message: 'සිදුවීම ඉවත් කරන ලදී.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
