import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Printer } from 'lucide-react';
import { attendanceAPI, leaveAPI } from '../../api';
import PrintArea from './PrintArea';
import { tr } from '../../utils/i18n';
import { APP_NAME, LEAVE_TYPE_LABELS, MONTHS_FULL, STATUS_LABELS, formatDate, formatShortDayDate, formatTime } from '../../utils/locale';
import { dateKey } from '../../utils/settings';

async function buildAttendance(year, month) {
  const { data } = await attendanceAPI.getAll({ month, year }, { cacheMode: 'network' });
  const byTeacher = new Map();
  for (const r of data.records) {
    const name = r.teacher?.user?.name || '—';
    const row = byTeacher.get(name) || { id: r.teacher?.teacherId || '—', present: 0, late: 0, absent: 0, half: 0 };
    if (r.status === 'present') row.present += 1;
    if (r.status === 'late') row.late += 1;
    if (r.status === 'absent') row.absent += 1;
    if (r.status === 'half-day') row.half += 1;
    byTeacher.set(name, row);
  }
  return {
    summaryHeaders: [tr('ගුරුවරයා'), tr('අංකය'), tr('පැමිණි'), tr('ප්‍රමාද'), tr('නොපැමිණි'), tr('අර්ධ දින')],
    summaryRows: [...byTeacher.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, r]) => [name, r.id, r.present, r.late, r.absent, r.half]),
    headers: [tr('දිනය'), tr('ගුරුවරයා'), tr('අංකය'), tr('තත්ත්වය'), tr('පැමිණි වේලාව'), tr('පිටවූ වේලාව')],
    rows: [...data.records]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((r) => [
        formatShortDayDate(r.date),
        r.teacher?.user?.name || '—',
        r.teacher?.teacherId || '—',
        STATUS_LABELS[r.status] || r.status,
        r.checkIn ? formatTime(r.checkIn) : '—',
        r.checkOut ? formatTime(r.checkOut) : '—',
      ]),
  };
}

async function buildLeave(year, month) {
  const { data } = await leaveAPI.getAll(undefined, { cacheMode: 'network' });
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to = `${year}-${String(month).padStart(2, '0')}-31`;
  const leaves = data.leaves
    .filter((l) => l.startDate.slice(0, 10) <= to && l.endDate.slice(0, 10) >= from)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return {
    summaryHeaders: null,
    summaryRows: null,
    headers: [tr('ගුරුවරයා'), tr('වර්ගය'), tr('සිට'), tr('දක්වා'), tr('දින'), tr('තත්ත්වය'), tr('හේතුව')],
    rows: leaves.map((l) => [
      l.teacher?.user?.name || '—',
      LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
      formatDate(l.startDate),
      formatDate(l.endDate),
      l.totalDays,
      STATUS_LABELS[l.status] || l.status,
      l.reason,
    ]),
  };
}

function addSheet(workbook, name, headers, rows) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(headers).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((column, i) => {
    const longest = Math.max(String(headers[i]).length, ...rows.map((row) => String(row[i] ?? '').length));
    column.width = Math.min(50, longest + 4);
  });
}

export default function ReportExport() {
  const [month, setMonth] = useState(dateKey().slice(0, 7));
  const [kind, setKind] = useState('attendance');
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(null);

  const kindLabel = kind === 'attendance' ? tr('පැමිණීම') : tr('නිවාඩු');
  const load = async () => {
    const [year, monthNumber] = month.split('-').map(Number);
    const report = await (kind === 'attendance' ? buildAttendance : buildLeave)(year, monthNumber);
    return { ...report, title: `${kindLabel} · ${year} ${MONTHS_FULL[monthNumber - 1]}` };
  };

  const downloadExcel = async () => {
    if (!month) return;
    setBusy(true);
    try {
      const report = await load();
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      if (report.summaryRows) addSheet(workbook, tr('සාරාංශය'), report.summaryHeaders, report.summaryRows);
      addSheet(workbook, tr('විස්තර'), report.headers, report.rows);
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${kind}-report-${month}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(tr('වාර්තාව සකස් කිරීමට නොහැකි විය'));
    } finally {
      setBusy(false);
    }
  };

  const printPdf = async () => {
    if (!month) return;
    setBusy(true);
    try {
      setPrinting(await load());
      // Let the report render before the print dialog opens.
      setTimeout(() => window.print(), 150);
    } catch {
      toast.error(tr('වාර්තාව සකස් කිරීමට නොහැකි විය'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="card-title">{tr('වාර්තා බාගත කිරීම')}</h2>
      <p className="card-sub" style={{ marginBottom: 16 }}>{tr('මාසික වාර්තාව Excel හෝ PDF ලෙස ලබාගන්න')}</p>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="report-kind">{tr('වාර්තාව')}</label>
          <select id="report-kind" className="form-select" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="attendance">{tr('පැමිණීම')}</option>
            <option value="leave">{tr('නිවාඩු')}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="report-month">{tr('මාසය')}</label>
          <input id="report-month" className="form-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>
      <div className="button-row">
        <button className="btn btn-ghost" onClick={downloadExcel} disabled={busy || !month}><Download size={16}/> Excel</button>
        <button className="btn btn-primary" onClick={printPdf} disabled={busy || !month}><Printer size={16}/> PDF</button>
      </div>

      {printing && (
        <PrintArea>
          <p className="print-school">{APP_NAME}</p>
          <h1>{printing.title}</h1>
          {printing.summaryRows && (
            <>
              <h2>{tr('සාරාංශය')}</h2>
              <table>
                <thead><tr>{printing.summaryHeaders.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{printing.summaryRows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
              </table>
              <h2>{tr('විස්තර')}</h2>
            </>
          )}
          <table>
            <thead><tr>{printing.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {printing.rows.length === 0
                ? <tr><td colSpan={printing.headers.length}>{tr('දත්ත හමු නොවීය')}</td></tr>
                : printing.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
            </tbody>
          </table>
        </PrintArea>
      )}
    </div>
  );
}
