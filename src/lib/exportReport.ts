// Berisi fungsi ekspor laporan bulanan ke berkas PDF, DOCX, dan XLSX secara langsung di browser.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import * as XLSX from 'xlsx';
import { MonthlyReport, Profile } from '../types';
import { buildExportFileName, formatDateID, formatMonthYearID } from './format';

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportReportToPDF(
  report: MonthlyReport,
  profile: Profile,
  unitName: string,
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const content = report.report_content;
  const periodLabel = formatMonthYearID(report.month, report.year);
  const fileName = buildExportFileName(profile.full_name, report.month, report.year, 'pdf');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(content.header_title, 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${periodLabel}`, 105, 25, { align: 'center' });

  let y = 34;
  const identityLines = [
    `Nama      : ${profile.full_name}`,
    `NIP       : ${profile.nip}`,
    `Jabatan   : ${profile.job_title}`,
    `Unit Kerja: ${unitName}`,
  ];
  for (const line of identityLines) {
    doc.text(line, 14, y);
    y += 5.5;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('1. Ringkasan Pelaksanaan Tugas', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(content.executive_summary, 182);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 5 + 6;

  doc.setFont('helvetica', 'bold');
  doc.text('2. Tabel Aktivitas Harian', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['No', 'Tanggal', 'Kegiatan', 'Output / Hasil', 'Target Kinerja']],
    body:
      content.activities_table.length > 0
        ? content.activities_table.map((row, idx) => [
            String(idx + 1),
            formatDateID(row.activity_date),
            row.title,
            row.output_text,
            row.target_title,
          ])
        : [['-', '-', 'Belum ada aktivitas pada periode ini', '-', '-']],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [29, 78, 216] },
  });

  const afterActY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  let nextY = afterActY + 8;

  if (nextY > 250) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('3. Capaian Target Kinerja', 14, nextY);
  nextY += 3;

  autoTable(doc, {
    startY: nextY,
    head: [['Target Kinerja', 'Indikator', 'Target', 'Realisasi Tercatat', 'Aktivitas Pendukung']],
    body:
      content.targets_table.length > 0
        ? content.targets_table.map((t) => [
            t.target_title,
            t.indicator,
            t.target_display,
            t.realization_display,
            String(t.supporting_count),
          ])
        : [['Belum ada target aktif pada periode ini', '-', '-', '-', '0']],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [29, 78, 216] },
  });

  const afterTgtY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? nextY + 20;
  let endY = afterTgtY + 8;
  if (endY > 245) {
    doc.addPage();
    endY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('4. Rekap Output', 14, endY);
  endY += 5;
  doc.setFont('helvetica', 'normal');
  const recapLines = doc.splitTextToSize(content.output_recap, 182);
  doc.text(recapLines, 14, endY);
  endY += recapLines.length * 5 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text('5. Kendala dan Tindak Lanjut', 14, endY);
  endY += 5;
  doc.setFont('helvetica', 'normal');
  if (content.challenges_list.length === 0) {
    doc.text('Belum ada kendala yang dicatat pada periode ini.', 14, endY);
    endY += 7;
  } else {
    for (const c of content.challenges_list) {
      const chText = doc.splitTextToSize(
        `- ${formatDateID(c.activity_date)} (${c.activity_title}): ${c.challenge} Tindak lanjut: ${c.follow_up}`,
        182,
      );
      doc.text(chText, 14, endY);
      endY += chText.length * 4.8 + 2;
    }
  }

  endY += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('6. Penutup', 14, endY);
  endY += 5;
  doc.setFont('helvetica', 'normal');
  const closeLines = doc.splitTextToSize(content.closing_note, 182);
  doc.text(closeLines, 14, endY);

  doc.save(fileName);
  return fileName;
}

export async function exportReportToDOCX(
  report: MonthlyReport,
  profile: Profile,
  unitName: string,
): Promise<string> {
  const content = report.report_content;
  const periodLabel = formatMonthYearID(report.month, report.year);
  const fileName = buildExportFileName(profile.full_name, report.month, report.year, 'docx');

  const activityRows = [
    new TableRow({
      children: ['No', 'Tanggal', 'Kegiatan', 'Output / Hasil', 'Target Kinerja'].map(
        (h) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
          }),
      ),
    }),
    ...content.activities_table.map(
      (row, idx) =>
        new TableRow({
          children: [
            String(idx + 1),
            formatDateID(row.activity_date),
            row.title,
            row.output_text,
            row.target_title,
          ].map((val) => new TableCell({ children: [new Paragraph(val)] })),
        }),
    ),
  ];

  const targetRows = [
    new TableRow({
      children: ['Target Kinerja', 'Indikator', 'Target', 'Realisasi', 'Aktivitas'].map(
        (h) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
          }),
      ),
    }),
    ...content.targets_table.map(
      (t) =>
        new TableRow({
          children: [
            t.target_title,
            t.indicator,
            t.target_display,
            t.realization_display,
            String(t.supporting_count),
          ].map((val) => new TableCell({ children: [new Paragraph(val)] })),
        }),
    ),
  ];

  const challengeParagraphs =
    content.challenges_list.length === 0
      ? [new Paragraph('Belum ada kendala yang dicatat pada periode ini.')]
      : content.challenges_list.map(
          (c) =>
            new Paragraph(
              `- ${formatDateID(c.activity_date)} (${c.activity_title}): ${c.challenge} Tindak lanjut: ${c.follow_up}`,
            ),
        );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: content.header_title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph(`Periode: ${periodLabel}`),
          new Paragraph(`Nama: ${profile.full_name}`),
          new Paragraph(`NIP: ${profile.nip}`),
          new Paragraph(`Jabatan: ${profile.job_title}`),
          new Paragraph(`Unit Kerja: ${unitName}`),
          new Paragraph({ text: 'Ringkasan Pelaksanaan Tugas', heading: HeadingLevel.HEADING_2 }),
          new Paragraph(content.executive_summary),
          new Paragraph({ text: 'Tabel Aktivitas', heading: HeadingLevel.HEADING_2 }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: activityRows }),
          new Paragraph({ text: 'Capaian Target Kinerja', heading: HeadingLevel.HEADING_2 }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: targetRows }),
          new Paragraph({ text: 'Rekap Output', heading: HeadingLevel.HEADING_2 }),
          new Paragraph(content.output_recap),
          new Paragraph({ text: 'Kendala dan Tindak Lanjut', heading: HeadingLevel.HEADING_2 }),
          ...challengeParagraphs,
          new Paragraph({ text: 'Penutup', heading: HeadingLevel.HEADING_2 }),
          new Paragraph(content.closing_note),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBrowserDownload(blob, fileName);
  return fileName;
}

export function exportReportToXLSX(
  report: MonthlyReport,
  profile: Profile,
  unitName: string,
): string {
  const content = report.report_content;
  const periodLabel = formatMonthYearID(report.month, report.year);
  const fileName = buildExportFileName(profile.full_name, report.month, report.year, 'xlsx');

  const wb = XLSX.utils.book_new();

  const infoSheet = XLSX.utils.aoa_to_sheet([
    [content.header_title],
    ['Periode', periodLabel],
    ['Nama', profile.full_name],
    ['NIP', profile.nip],
    ['Jabatan', profile.job_title],
    ['Unit Kerja', unitName],
    ['Status', report.status],
    [],
    ['Ringkasan Pelaksanaan Tugas', content.executive_summary],
    ['Rekap Output', content.output_recap],
    ['Penutup', content.closing_note],
  ]);
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Identitas & Ringkasan');

  const actData = content.activities_table.map((row, idx) => ({
    No: idx + 1,
    Tanggal: formatDateID(row.activity_date),
    Kegiatan: row.title,
    'Output / Hasil': row.output_text,
    'Target Kinerja': row.target_title,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actData), 'Aktivitas');

  const tgtData = content.targets_table.map((t) => ({
    'Target Kinerja': t.target_title,
    Indikator: t.indicator,
    Target: t.target_display,
    'Realisasi Tercatat': t.realization_display,
    'Aktivitas Pendukung': t.supporting_count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tgtData), 'Capaian Target');

  const chData =
    content.challenges_list.length > 0
      ? content.challenges_list.map((c) => ({
          Tanggal: formatDateID(c.activity_date),
          Kegiatan: c.activity_title,
          Kendala: c.challenge,
          'Tindak Lanjut': c.follow_up,
        }))
      : [{ Keterangan: 'Belum ada kendala yang dicatat pada periode ini.' }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(chData), 'Kendala');

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBrowserDownload(blob, fileName);
  return fileName;
}
