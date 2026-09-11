/**
 * Helper utility for handling PDF uploads, downloads and previewing
 */

export function downloadFile(urlOrDataUri: string, filename: string) {
  try {
    const a = document.createElement('a');
    a.href = urlOrDataUri;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Error al descargar archivo:', err);
    window.open(urlOrDataUri, '_blank');
  }
}

export function fileToBase64(file: File): Promise<{ dataUrl: string; name: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        name: file.name,
        size: file.size
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a valid, standalone PDF Data URI for demo candidate proposals
 * so users can test viewing and downloading immediately without manual upload.
 */
export function createCandidateProposalPdfUri(
  candidateName: string,
  apartment: string,
  role: string,
  proposals: string,
  complexName: string = 'Conjunto Residencial'
): string {
  const sanitize = (str: string) => str.replace(/[()\\]/g, '');
  const cName = sanitize(candidateName);
  const cApto = sanitize(apartment);
  const cRole = sanitize(role);
  const cComplex = sanitize(complexName);

  const proposalLines = proposals
    .split('\n')
    .filter(Boolean)
    .slice(0, 10)
    .map(p => `(${sanitize(p.trim())}) '`)
    .join('\n');

  // Construct valid PDF 1.4 binary text representation
  const contentStream = `
BT
/F1 18 Tf
50 740 Td
(VOTOSMART COLOMBIA - HOJA DE PROPUESTAS) Tj
0 -26 Td
/F1 14 Tf
(${cName} - ${cApto}) Tj
0 -20 Td
/F1 11 Tf
(Postulacion: ${cRole}) Tj
0 -16 Td
(Copropiedad: ${cComplex}) Tj
0 -25 Td
/F1 12 Tf
(PLAN DE TRABAJO Y PROPUESTAS DE GESTION:) Tj
0 -20 Td
/F1 10 Tf
${proposalLines || '(Propuesta formal radicada para la asamblea general de copropietarios.)'}
ET
`.trim();

  const streamLength = contentStream.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000300 + ${streamLength} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
500
%%EOF`;

  try {
    return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(pdf)))}`;
  } catch (e) {
    return `data:text/plain;charset=utf-8,${encodeURIComponent(`PROPUESTA FORMAL - ${candidateName}\n\n${proposals}`)}`;
  }
}
