const Settings = require('../models/Settings');

// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.current();
    // Teachers only need to know whether a location check applies, not where it is set.
    if (req.user.role !== 'admin') {
      return res.status(200).json({
        success: true,
        settings: {
          academicYear: settings.academicYear,
          lateAfter: settings.lateAfter,
          leaveLimits: settings.leaveLimits,
          location: { enabled: settings.location.enabled },
        },
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/settings
// @access  Admin
const updateSettings = async (req, res, next) => {
  try {
    const { academicYear, lateAfter, leaveLimits, location } = req.body;
    const settings = await Settings.current();

    if (academicYear !== undefined) settings.academicYear = academicYear;
    if (lateAfter !== undefined) settings.lateAfter = lateAfter;
    if (leaveLimits) {
      for (const type of Object.keys(settings.toObject().leaveLimits)) {
        if (leaveLimits[type] !== undefined) settings.leaveLimits[type] = Number(leaveLimits[type]) || 0;
      }
    }
    if (location) {
      const enabled = Boolean(location.enabled);
      const latitude = Number(location.latitude);
      const longitude = Number(location.longitude);
      const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude)
        && location.latitude !== '' && location.longitude !== ''
        && location.latitude !== null && location.longitude !== null;
      if (enabled && !hasPoint) {
        return res.status(400).json({ success: false, message: 'පාසලේ ස්ථානය ඇතුළත් කරන්න.' });
      }
      settings.location.enabled = enabled;
      if (hasPoint) {
        settings.location.latitude = latitude;
        settings.location.longitude = longitude;
      }
      if (location.radiusMeters !== undefined) settings.location.radiusMeters = Number(location.radiusMeters) || 200;
    }

    await settings.save();
    res.status(200).json({ success: true, message: 'සැකසුම් සුරකින ලදී.', settings });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
