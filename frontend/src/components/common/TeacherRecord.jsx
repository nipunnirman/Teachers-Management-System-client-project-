import PrintArea from './PrintArea';
import { tr } from '../../utils/i18n';
import { APP_NAME, STATUS_LABELS, formatDate } from '../../utils/locale';

const dateOrDash = (value) => (value ? formatDate(value) : '—');

export const teacherDetails = (teacher) => [
  [tr('ගුරු අංකය'), teacher.teacherId],
  [tr('ජාතික හැඳුනුම්පත් අංකය'), teacher.nic || '—'],
  [tr('උපන් දිනය'), dateOrDash(teacher.dateOfBirth)],
  [tr('දුරකථන අංකය'), teacher.phone || '—'],
  [tr('ලිපිනය'), teacher.address?.street || '—'],
  [tr('හදිසි අවස්ථාවක අමතන්න'), [teacher.emergencyContact?.name, teacher.emergencyContact?.phone].filter(Boolean).join(' · ') || '—'],
  [tr('අංශය'), teacher.department || '—'],
  [tr('සේවා වර්ගය'), STATUS_LABELS[teacher.employmentType] || teacher.employmentType || '—'],
  [tr('පත්වීම් දිනය'), dateOrDash(teacher.appointmentDate)],
  [tr('සේවයට එක් වූ දිනය'), dateOrDash(teacher.joiningDate)],
  [tr('විෂයයන්'), teacher.subjects?.join(', ') || '—'],
  [tr('ශ්‍රේණි'), teacher.grades?.join(', ') || '—'],
  [tr('සුදුසුකම්'), teacher.qualificationsText || '—'],
];

// The printable staff record.
export default function TeacherRecord({ teacher }) {
  return (
    <PrintArea>
      <p className="print-school">{APP_NAME}</p>
      <h1>{tr('ගුරු වාර්තාව')}</h1>
      <div className="print-person">
        {teacher.profilePhoto && <img src={teacher.profilePhoto} alt="" />}
        <div>
          <h2>{teacher.user?.name}</h2>
          <p>{teacher.user?.email}</p>
        </div>
      </div>
      <table>
        <tbody>
          {teacherDetails(teacher).map(([label, value]) => (
            <tr key={label}><th>{label}</th><td>{value}</td></tr>
          ))}
        </tbody>
      </table>
    </PrintArea>
  );
}
