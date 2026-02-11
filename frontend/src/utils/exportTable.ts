import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCSV(headers: string[], rows: string[][], filename: string) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  const csv = [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function exportToExcel(
  headers: string[],
  rows: string[][],
  filename: string,
  sheetName = 'Datos',
) {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const baseName = filename.replace(/\.xlsx?$/i, '');
  XLSX.writeFile(wb, `${baseName}.xlsx`);
}

export function exportToPDF(
  headers: string[],
  rows: string[][],
  filename: string,
  title?: string,
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  if (title) {
    doc.setFontSize(14);
    doc.text(title, 14, 12);
  }
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 18 : 14,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [71, 85, 105] },
  });
  const baseName = filename.replace(/\.pdf$/i, '');
  doc.save(`${baseName}.pdf`);
}
