// Which teacher profile fields each role may change.
const ADMIN_PROFILE_FIELDS = [
  'phone', 'department', 'subjects', 'grades', 'employmentType', 'nic', 'dateOfBirth', 'gender',
  'address', 'emergencyContact', 'profilePhoto', 'joiningDate', 'appointmentDate', 'qualificationsText',
];
const TEACHER_PROFILE_FIELDS = ['phone', 'address', 'emergencyContact', 'profilePhoto'];

function pickAllowed(body, fields) {
  const picked = {};
  for (const field of fields) {
    if (body[field] !== undefined) picked[field] = body[field] === '' ? undefined : body[field];
  }
  return picked;
}

module.exports = { ADMIN_PROFILE_FIELDS, TEACHER_PROFILE_FIELDS, pickAllowed };
