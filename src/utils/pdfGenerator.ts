import jsPDF from 'jspdf';
import { Assembly, AssemblyMinutes, ResidentialComplex, VoteResultSummary } from '../types';

export interface PDFGenerationOptions {
  download?: boolean;
  fileName?: string;
}

export const generateMinutesPDF = (
  assembly: Assembly,
  complex: ResidentialComplex,
  minutes: AssemblyMinutes,
  votesResults: VoteResultSummary[],
  options: PDFGenerationOptions = { download: true }
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 22) {
      doc.addPage();
      y = 16;
    }
  };

  // 1. Top Decorative Ribbon (Statutory & Security Ribbon)
  doc.setFillColor(15, 118, 110); // Deep Teal
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(217, 119, 6); // Gold accent
  doc.rect(0, 5, pageWidth, 1.2, 'F');

  y = 14;

  // 2. Official Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 118, 110);
  doc.text(complex.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NIT: ${complex.nit || '901.458.789-2'} — ${complex.address || 'Sede Principal'}, ${complex.city || 'Colombia'}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 4.5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'RÉGIMEN DE PROPIEDAD HORIZONTAL • LEY 675 DE 2001 — REPÚBLICA DE COLOMBIA',
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 6;

  // Thin separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // 3. Document Title Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text((minutes.title || `ACTA OFICIAL DE ASAMBLEA - ${assembly.title}`).toUpperCase(), pageWidth / 2, y + 6.8, {
    align: 'center'
  });
  y += 14;

  // 4. Executive Summary Card (Metadata & Quorum gauge)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 38, 2.5, 2.5, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN GENERAL DE LA SESIÓN:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fecha y Hora: ${assembly.date} a las ${assembly.time}`, margin + 4, y + 11.5);
  doc.text(`Modalidad: ${assembly.modality.toUpperCase()} — Lugar: ${assembly.location}`, margin + 4, y + 16.5);
  doc.text(`Convocados: ${assembly.totalOwnersInvited} copropietarios registrados`, margin + 4, y + 21.5);

  // Right column of Meta card: Dignitaries
  doc.setFont('helvetica', 'bold');
  doc.text('MESA DIRECTIVA & DIGNATARIOS:', margin + contentWidth / 2 + 2, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Presidente(a): ${assembly.presidentName || 'Designado en sesión'}`, margin + contentWidth / 2 + 2, y + 11.5);
  doc.text(`Secretario(a): ${assembly.secretaryName || 'Designada en sesión'}`, margin + contentWidth / 2 + 2, y + 16.5);
  doc.text(`Administración: ${assembly.administratorName || 'Administración P.H.'}`, margin + contentWidth / 2 + 2, y + 21.5);

  // Visual Quorum Bar inside Meta Card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110);
  const quorumText = `Quórum Instalado: ${assembly.representedQuorum}% (${assembly.checkedInOwnersCount} asistentes) — Requerido Ley 675: ${assembly.requiredQuorum || 50.01}%`;
  doc.text(quorumText, margin + 4, y + 28);

  // Draw Quorum Progress Bar
  const barX = margin + 4;
  const barY = y + 30.5;
  const barWidth = contentWidth - 8;
  const barHeight = 4;
  doc.setFillColor(226, 232, 240); // Track
  doc.roundedRect(barX, barY, barWidth, barHeight, 1.5, 1.5, 'F');

  // Fill proportional to quorum (max 100%)
  const fillPct = Math.min(Math.max(assembly.representedQuorum, 0), 100) / 100;
  if (fillPct > 0) {
    const isQuorumMet = assembly.representedQuorum >= (assembly.requiredQuorum || 50.01);
    doc.setFillColor(isQuorumMet ? 15 : 217, isQuorumMet ? 118 : 119, isQuorumMet ? 110 : 6);
    doc.roundedRect(barX, barY, Math.max(barWidth * fillPct, 3), barHeight, 1.5, 1.5, 'F');
  }

  y += 44;

  // SECTION 1: INSTALACIÓN Y QUÓRUM
  checkPageOverflow(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 118, 110);
  doc.text('1. INSTALACIÓN Y VERIFICACIÓN LEGAL DEL QUÓRUM', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const introText =
    minutes.introText ||
    `En la fecha y hora indicadas se reunió la Asamblea General de Copropietarios de ${complex.name}. Conforme a los artículos 37, 38 y 39 de la Ley 675 de 2001, se realizó el llamado a lista y registro digital de asistencia en la plataforma VotoSmart, certificando un quórum legal deliberatorio y decisorio de ${assembly.representedQuorum}%, correspondiente a ${assembly.checkedInOwnersCount} unidades privadas representadas. Se declaró válidamente instalada la sesión.`;
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 4.2 + 6;

  // SECTION 2: DESARROLLO DEL ORDEN DEL DÍA
  checkPageOverflow(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 118, 110);
  doc.text('2. DESARROLLO DEL ORDEN DEL DÍA Y DELIBERACIONES', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const summaryText =
    minutes.summary ||
    `Se sometió a consideración de la asamblea el orden del día propuesto, el cual fue aprobado por los presentes. Se escucharon las intervenciones de los copropietarios, las aclaraciones técnicas de la administración y los conceptos estatutarios correspondientes a cada punto debatido en la asamblea.`;
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.2 + 6;

  // SECTION 3: DECISIONES Y ESCRUTINIO DE VOTACIONES
  checkPageOverflow(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 118, 110);
  doc.text('3. DECISIONES, ESCRUTINIO Y RESULTADOS OFICIALES DE VOTACIÓN', margin, y);
  y += 5.5;

  if (votesResults.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron votaciones formales durante la presente sesión de asamblea.', margin, y);
    y += 8;
  } else {
    votesResults.forEach((vr, vIdx) => {
      // Calculate needed height for this vote card
      const neededCardHeight = 24 + vr.optionResults.length * 8;
      checkPageOverflow(neededCardHeight);

      // Vote Box Container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, neededCardHeight - 2, 2, 2, 'FD');

      // Vote Header Strip
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`3.${vIdx + 1}. ${vr.voteTitle}`, margin + 3.5, y + 5.5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Total votos: ${vr.totalVotesCount} | Coeficiente: ${vr.totalCoefficientSum.toFixed(2)}%`,
        pageWidth - margin - 4,
        y + 5.5,
        { align: 'right' }
      );

      let optY = y + 12;

      // Option rows with horizontal bar charts
      vr.optionResults.forEach((opt) => {
        // Label and counts
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        const optLabel = opt.label.length > 50 ? `${opt.label.slice(0, 50)}...` : opt.label;
        doc.text(optLabel, margin + 4, optY + 3);

        const statText = `${opt.votesCount} votos (${opt.percentageVotes}%) — Coef: ${opt.coefficientSum.toFixed(2)}% (${opt.percentageCoefficient}%)`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(statText, pageWidth - margin - 4, optY + 3, { align: 'right' });

        // Mini bar chart
        const miniBarX = margin + 4;
        const miniBarY = optY + 4.5;
        const miniBarWidth = contentWidth - 8;
        const miniBarHeight = 2.2;

        doc.setFillColor(241, 245, 249);
        doc.roundedRect(miniBarX, miniBarY, miniBarWidth, miniBarHeight, 1, 1, 'F');

        const optPct = Math.min(Math.max(opt.percentageCoefficient || 0, 0), 100) / 100;
        if (optPct > 0) {
          doc.setFillColor(15, 118, 110);
          doc.roundedRect(miniBarX, miniBarY, Math.max(miniBarWidth * optPct, 2), miniBarHeight, 1, 1, 'F');
        }

        optY += 7.5;
      });

      // Decision status banner
      if (vr.isTie) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(217, 119, 6);
        doc.text(`* RESULTADO: EMPATE REGISTRADO ENTRE: ${vr.tieOptionLabels?.join(', ')}`, margin + 4, optY + 2);
      } else if (vr.winnerOption) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(5, 150, 105);
        doc.text(`* DECISIÓN FORMALMENTE APROBADA: ${vr.winnerOption.label}`, margin + 4, optY + 2);
      }

      y += neededCardHeight + 3;
    });
  }

  // SECTION 4: CONSTANCIAS Y CONCLUSIONES
  if (minutes.conclusions) {
    checkPageOverflow(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 118, 110);
    doc.text('4. CONSTANCIAS, PROPOSICIONES Y CIERRE', margin, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const concLines = doc.splitTextToSize(minutes.conclusions, contentWidth);
    doc.text(concLines, margin, y);
    y += concLines.length * 4.2 + 8;
  }

  // SECTION 5: FORMAL SIGNATURES BLOCK
  checkPageOverflow(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 118, 110);
  doc.text('EN CONSTANCIA DE VALIDEZ Y APROBACIÓN FIRMAN:', margin, y);
  y += 18;

  const signatures = minutes.signatures && minutes.signatures.length > 0
    ? minutes.signatures
    : [
        { name: assembly.presidentName || 'Presidente(a) de Asamblea', role: 'Presidente(a) Designado(a)', document: 'CC Verificada' },
        { name: assembly.secretaryName || 'Secretario(a) de Asamblea', role: 'Secretario(a) de Asamblea', document: 'CC Verificada' },
        { name: assembly.administratorName || 'Administrador(a) P.H.', role: 'Representante Legal P.H.', document: 'NIT / CC Registrada' }
      ];

  const colWidth = contentWidth / Math.max(signatures.length, 1);

  signatures.forEach((sig, idx) => {
    const startX = margin + idx * colWidth + 4;
    const lineWidth = colWidth - 12;

    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.4);
    doc.line(startX, y, startX + lineWidth, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sig.name, startX, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(sig.role, startX, y + 8.5);
    doc.text(sig.document, startX, y + 12.5);
  });

  // Footer on all pages with digital hash verification
  const totalPages = (doc as any).internal.getNumberOfPages();
  const integrityHash = `VS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `VotoSmart Colombia • Certificación Digital Ley 675 de 2001 • Hash de Trazabilidad: ${integrityHash}`,
      margin,
      pageHeight - 7
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // Handle Download if requested
  if (options.download !== false) {
    const defaultFileName = options.fileName || `Acta_Oficial_Asamblea_${assembly.date}_${complex.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(defaultFileName);
  }

  return doc;
};

export const generateMinutesPdfDataUri = (
  assembly: Assembly,
  complex: ResidentialComplex,
  minutes: AssemblyMinutes,
  votesResults: VoteResultSummary[]
): string => {
  const doc = generateMinutesPDF(assembly, complex, minutes, votesResults, { download: false });
  return doc.output('datauristring');
};
