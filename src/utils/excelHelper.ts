import * as XLSX from 'xlsx';
import { Owner, QuorumAttendance, VoteResultSummary, VoteAttendanceDetails } from '../types';

// Export Owners to Excel
export const exportOwnersToExcel = (owners: Owner[], complexName: string) => {
  const data = owners.map((o) => ({
    'Nombre Completo': o.name,
    'Tipo Documento': o.documentType,
    'Número Documento': o.documentNumber,
    'Correo Electrónico': o.email,
    'Teléfono': o.phone,
    'Torre / Bloque': o.building,
    'Apartamento / Unidad': o.apartment,
    'Coeficiente (%)': o.coefficient,
    'Estado': o.status === 'active' ? 'Activo' : 'Inactivo',
    'Apoderado / Representante': o.hasProxy ? o.proxyName || 'Sí' : 'No'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Propietarios');

  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length + 5, 16) }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `Censo_Propietarios_${complexName.replace(/\s+/g, '_')}.xlsx`);
};

// Export Quorum Attendance to Excel
export const exportQuorumToExcel = (quorum: QuorumAttendance[], assemblyTitle: string) => {
  const data = quorum.map((q) => ({
    'Inmueble': `${q.building} - ${q.apartment}`,
    'Propietario': q.ownerName,
    'Coeficiente (%)': q.coefficient,
    'Asistencia': q.checkedIn ? 'PRESENTE' : 'AUSENTE',
    'Hora de Registro': q.checkedInAt ? new Date(q.checkedInAt).toLocaleTimeString() : 'N/A',
    'Verificado Por': q.verifiedBy || 'N/A',
    'Observaciones': q.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quórum');

  XLSX.writeFile(workbook, `Quorum_${assemblyTitle.replace(/\s+/g, '_').slice(0, 30)}.xlsx`);
};

// Export Vote Results to Excel
export const exportVoteResultsToExcel = (results: VoteResultSummary[], assemblyTitle: string) => {
  const workbook = XLSX.utils.book_new();

  results.forEach((r, idx) => {
    const sheetData = r.optionResults.map((opt) => ({
      'Opción / Candidato': opt.label,
      'Cantidad Votos': opt.votesCount,
      '% Sobre Votantes': `${opt.percentageVotes}%`,
      'Coeficiente Acumulado (%)': opt.coefficientSum,
      '% Sobre Coeficiente': `${opt.percentageCoefficient}%`
    }));

    // Add summary row
    sheetData.push({
      'Opción / Candidato': 'TOTAL COMPUTADO',
      'Cantidad Votos': r.totalVotesCount,
      '% Sobre Votantes': '100%',
      'Coeficiente Acumulado (%)': r.totalCoefficientSum,
      '% Sobre Coeficiente': '100%'
    });

    const sheetName = `Votacion_${idx + 1}`.slice(0, 31);
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, `Resultados_Votaciones_${assemblyTitle.replace(/\s+/g, '_').slice(0, 25)}.xlsx`);
};

// Parse Excel File for Owners Import
export const parseOwnersExcel = async (file: File): Promise<Omit<Owner, 'id' | 'complexId' | 'createdAt'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonRows || jsonRows.length === 0) {
          throw new Error('El archivo Excel está vacío.');
        }

        const owners: Omit<Owner, 'id' | 'complexId' | 'createdAt'>[] = jsonRows.map((row, index) => {
          const name = row['Nombre Completo'] || row['Nombre'] || row['Propietario'] || row['nombre'];
          const docType = row['Tipo Documento'] || row['TipoDoc'] || 'CC';
          const docNum = String(row['Número Documento'] || row['Documento'] || row['Cedula'] || row['NIT'] || '');
          const email = String(row['Correo Electrónico'] || row['Correo'] || row['Email'] || '').trim();
          const phone = String(row['Teléfono'] || row['Celular'] || row['Telefono'] || '');
          const building = String(row['Torre / Bloque'] || row['Torre'] || row['Bloque'] || 'Torre 1');
          const apartment = String(row['Apartamento / Unidad'] || row['Apartamento'] || row['Apto'] || row['Unidad'] || '');
          const coefficient = parseFloat(row['Coeficiente (%)'] || row['Coeficiente'] || row['coeficiente'] || '0');

          if (!name || !apartment) {
            throw new Error(`Fila ${index + 2}: Nombre y Apartamento son requeridos.`);
          }

          return {
            name: String(name).trim(),
            documentType: String(docType).trim(),
            documentNumber: docNum,
            email: email || `propietario.${apartment.toLowerCase().replace(/[^a-z0-9]/g, '')}@ejemplo.com`,
            phone,
            building: building.trim(),
            apartment: apartment.trim(),
            coefficient: isNaN(coefficient) ? 0 : coefficient,
            status: 'active' as const,
            hasProxy: false
          };
        });

        resolve(owners);
      } catch (err: any) {
        reject(new Error(err.message || 'Error al procesar el archivo Excel'));
      }
    };

    reader.onerror = () => reject(new Error('Error de lectura del archivo'));
    reader.readAsArrayBuffer(file);
  });
};

// Export Vote Attendance & Quorum Details to Excel
export const exportVoteAttendanceToExcel = (details: VoteAttendanceDetails, assemblyTitle: string) => {
  const data = details.attendees.map((item) => ({
    'Inmueble': `${item.building ? item.building + ' - ' : ''}${item.apartment}`,
    'Copropietario': item.name,
    'Coeficiente (%)': item.coefficient,
    'Estado en esta Votación': item.hasVoted ? 'VOTO EJERCIDO' : 'PENDIENTE',
    'Hora de Sufragio': item.votedAt ? new Date(item.votedAt).toLocaleString() : '—',
    'Código Comprobante': item.receiptCode || '—',
    'Consejo de Administración': item.isCouncilMember ? item.councilRole || 'Sí' : 'No'
  }));

  // Add Summary Header Row
  const summaryRows = [
    {
      'Inmueble': 'RESUMEN DE QUÓRUM',
      'Copropietario': `Votación: ${details.voteTitle}`,
      'Coeficiente (%)': details.summary.totalCoefficientVoted,
      'Estado en esta Votación': `Quórum: ${details.summary.quorumPercentage}%`,
      'Hora de Sufragio': details.summary.isQuorumMet ? 'QUÓRUM ALCANZADO' : 'QUÓRUM PENDIENTE',
      'Código Comprobante': `${details.summary.totalVotersCount} de ${details.summary.totalEligibleCount} votaron`,
      'Consejo de Administración': ''
    },
    ...data
  ];

  const worksheet = XLSX.utils.json_to_sheet(summaryRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia Votacion');

  const colWidths = [
    { wch: 18 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 24 }
  ];
  worksheet['!cols'] = colWidths;

  const safeTitle = details.voteTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
  XLSX.writeFile(workbook, `Asistencia_Votacion_${safeTitle}.xlsx`);
};
