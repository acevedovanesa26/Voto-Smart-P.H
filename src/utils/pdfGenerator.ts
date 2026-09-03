import jsPDF from 'jspdf';
import { Assembly, AssemblyMinutes, ResidentialComplex, VoteResultSummary } from '../types';

export const generateMinutesPDF = (
  assembly: Assembly,
  complex: ResidentialComplex,
  minutes: AssemblyMinutes,
  votesResults: VoteResultSummary[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 22;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110); // Teal primary #0f766e
  doc.text(complex.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`NIT: ${complex.nit} — ${complex.address}, ${complex.city}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(minutes.title, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Assembly Meta Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha y Hora:', margin + 4, y + 6);
  doc.text('Modalidad:', margin + 4, y + 12);
  doc.text('Quórum Representado:', margin + 4, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.text(`${assembly.date} a las ${assembly.time}`, margin + 45, y + 6);
  doc.text(`${assembly.modality.toUpperCase()} — ${assembly.location}`, margin + 45, y + 12);
  doc.text(`${assembly.representedQuorum}% (${assembly.checkedInOwnersCount} de ${assembly.totalOwnersInvited} propietarios convocados)`, margin + 45, y + 18);

  y += 30;

  // Section 1: Intro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text('1. INSTALACIÓN Y VERIFICACIÓN DE QUÓRUM', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const introLines = doc.splitTextToSize(minutes.introText || '', contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 4.8 + 6;

  // Section 2: Summary
  checkPageOverflow(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text('2. DESARROLLO DEL ORDEN DEL DÍA Y DELIBERACIONES', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(minutes.summary || '', contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.8 + 6;

  // Section 3: Voting Results
  checkPageOverflow(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text('3. DECISIONES Y RESULTADOS OFICIALES DE VOTACIÓN', margin, y);
  y += 6;

  if (votesResults.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron votaciones formales durante la sesión.', margin, y);
    y += 8;
  } else {
    votesResults.forEach((vr, vIdx) => {
      checkPageOverflow(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`3.${vIdx + 1}. ${vr.voteTitle}`, margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total votos: ${vr.totalVotesCount} | Coeficiente acumulado: ${vr.totalCoefficientSum.toFixed(2)}%`, margin, y);
      y += 5;

      // Table options
      vr.optionResults.forEach((opt) => {
        checkPageOverflow(7);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(opt.label.slice(0, 48), margin + 3, y + 4.2);

        doc.setFont('helvetica', 'normal');
        const statText = `${opt.votesCount} votos (${opt.percentageVotes}%) — Coef: ${opt.coefficientSum.toFixed(2)}% (${opt.percentageCoefficient}%)`;
        doc.text(statText, pageWidth - margin - 3, y + 4.2, { align: 'right' });
        y += 7.5;
      });

      if (vr.isTie) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(225, 29, 72);
        doc.text(`* EMPATE REGISTRADO ENTRE: ${vr.tieOptionLabels?.join(', ')}`, margin + 2, y + 4);
        y += 7;
      } else if (vr.winnerOption) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(5, 150, 105);
        doc.text(`* DECISIÓN APROBADA: ${vr.winnerOption.label}`, margin + 2, y + 4);
        y += 7;
      }
      y += 3;
    });
  }

  // Section 4: Observations & Conclusions
  if (minutes.conclusions) {
    checkPageOverflow(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 118, 110);
    doc.text('4. CONSTANCIAS Y CONCLUSIONES', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const concLines = doc.splitTextToSize(minutes.conclusions || '', contentWidth);
    doc.text(concLines, margin, y);
    y += concLines.length * 4.8 + 12;
  }

  // Signatures Box
  checkPageOverflow(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 118, 110);
  doc.text('EN CONSTANCIA FIRMAN:', margin, y);
  y += 18;

  const signatures = minutes.signatures || [];
  const colWidth = contentWidth / Math.max(signatures.length, 1);

  signatures.forEach((sig, idx) => {
    const startX = margin + idx * colWidth + 5;
    doc.setDrawColor(71, 85, 105);
    doc.line(startX, y, startX + colWidth - 15, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(sig.name, startX, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(sig.role, startX, y + 9);
    doc.text(sig.document, startX, y + 13);
  });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `VotoSmart - Trazabilidad y Seguridad en Asambleas | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      288,
      { align: 'center' }
    );
  }

  // Download
  doc.save(`Acta_Asamblea_${assembly.date}_${complex.name.replace(/\s+/g, '_')}.pdf`);
};
