import {
  Assembly,
  AssemblyDocument,
  AssemblyMinutes,
  AssemblyNote,
  AuditLog,
  Candidate,
  EmailLog,
  Owner,
  QuorumAttendance,
  ResidentialComplex,
  User,
  Vote,
  VoteRecord,
  VoterParticipation
} from '../types';

export const DEMO_COMPLEXES: ResidentialComplex[] = [
  {
    id: 'complex-1',
    name: 'Conjunto Residencial Torres del Parque P.H.',
    nit: '900.876.543-1',
    address: 'Calle 140 # 19-45',
    city: 'Bogotá D.C.',
    state: 'Cundinamarca',
    phone: '(+57) 601 745 8900',
    email: 'administracion@torresdelparque.com',
    logo: '🏢',
    totalUnits: 14,
    totalCoefficient: 100.00,
    timezone: 'America/Bogota',
    autoSendResults: true
  },
  {
    id: 'complex-2',
    name: 'Residencial Altos de la Colina P.H.',
    nit: '901.233.567-1',
    address: 'Carrera 43A # 18 Sur - 60',
    city: 'Medellín',
    state: 'Antioquia',
    phone: '(+57) 604 321 9088',
    email: 'contacto@altosdelacolina.com',
    logo: '🌲',
    totalUnits: 84,
    totalCoefficient: 100.00,
    timezone: 'America/Bogota',
    autoSendResults: true
  },
  {
    id: 'complex-3',
    name: 'Condominio Campestre Los Robles',
    nit: '900.554.890-4',
    address: 'Avenida Cañasgordas Km 4',
    city: 'Cali',
    state: 'Valle del Cauca',
    phone: '(+57) 602 555 4321',
    email: 'admin@losroblescali.com',
    logo: '🏡',
    totalUnits: 45,
    totalCoefficient: 100.00,
    timezone: 'America/Bogota',
    autoSendResults: false
  }
];

export const DEMO_COMPLEX: ResidentialComplex = DEMO_COMPLEXES[0];

export const DEMO_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Carolina Méndez Rojas',
    email: 'admin@votosmart.app',
    role: 'admin',
    phone: '+57 310 987 6543',
    documentType: 'CC',
    documentNumber: '52.987.123',
    apartment: 'Oficina Admón',
    building: 'Torre Adm',
    coefficient: 0,
    status: 'active',
    complexId: 'complex-1',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-president',
    name: 'Dr. Gustavo Petro Ortiz',
    email: 'presidente@torresdelparque.com',
    role: 'president',
    phone: '+57 315 444 3322',
    documentType: 'CC',
    documentNumber: '19.450.880',
    apartment: 'Apto 502',
    building: 'Torre B',
    coefficient: 7.45,
    status: 'active',
    complexId: 'complex-1',
    createdAt: '2026-01-12T09:30:00Z'
  },
  {
    id: 'user-accountant',
    name: 'C.P. Fernando Valdés Ruiz',
    email: 'contador@torresdelparque.com',
    role: 'accountant',
    phone: '+57 300 222 1199',
    documentType: 'CC',
    documentNumber: '79.340.111',
    apartment: 'Auditoría',
    building: 'Torre Adm',
    coefficient: 0,
    status: 'active',
    complexId: 'complex-1',
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'user-superadmin',
    name: 'Ing. Santiago Morales (Plataforma)',
    email: 'superadmin@votosmart.app',
    role: 'superadmin',
    phone: '+57 320 000 9999',
    documentType: 'CC',
    documentNumber: '80.111.222',
    status: 'active',
    complexId: 'complex-1',
    createdAt: '2026-01-01T00:00:00Z'
  },
  // Propietarios
  {
    id: 'user-owner-1',
    name: 'Carlos Arturo Ruiz',
    email: 'carlos.ruiz@gmail.com',
    role: 'owner',
    phone: '+57 312 345 6789',
    documentType: 'CC',
    documentNumber: '79.845.612',
    apartment: 'Apto 302',
    building: 'Torre A',
    coefficient: 7.85,
    status: 'active',
    complexId: 'complex-1',
    createdAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'user-owner-2',
    name: 'Elena Gómez Restrepo',
    email: 'elena.gomez@hotmail.com',
    role: 'owner',
    phone: '+57 318 765 4321',
    documentType: 'CC',
    documentNumber: '41.905.432',
    apartment: 'Apto 101',
    building: 'Torre B',
    coefficient: 8.20,
    status: 'active',
    complexId: 'complex-1',
    createdAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'user-owner-3',
    name: 'Roberto Domínguez Silva',
    email: 'roberto.dominguez@yahoo.es',
    role: 'owner',
    phone: '+57 314 555 8899',
    documentType: 'CC',
    documentNumber: '19.876.543',
    apartment: 'Apto 501',
    building: 'Torre A',
    coefficient: 6.95,
    status: 'active',
    complexId: 'complex-1',
    createdAt: '2026-01-20T10:00:00Z'
  }
];

export const DEMO_OWNERS: Owner[] = [
  {
    id: 'owner-1',
    complexId: 'complex-1',
    name: 'Carlos Arturo Ruiz',
    documentType: 'CC',
    documentNumber: '79.845.612',
    email: 'carlos.ruiz@gmail.com',
    phone: '+57 312 345 6789',
    building: 'Torre A',
    apartment: 'Apto 302',
    coefficient: 7.8500,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-2',
    complexId: 'complex-1',
    name: 'Elena Gómez Restrepo',
    documentType: 'CC',
    documentNumber: '41.905.432',
    email: 'elena.gomez@hotmail.com',
    phone: '+57 318 765 4321',
    building: 'Torre B',
    apartment: 'Apto 101',
    coefficient: 8.2000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-3',
    complexId: 'complex-1',
    name: 'Roberto Domínguez Silva',
    documentType: 'CC',
    documentNumber: '19.876.543',
    email: 'roberto.dominguez@yahoo.es',
    phone: '+57 314 555 8899',
    building: 'Torre A',
    apartment: 'Apto 501',
    coefficient: 6.9500,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-4',
    complexId: 'complex-1',
    name: 'Gloria Patricia Ángel',
    documentType: 'CC',
    documentNumber: '51.990.234',
    email: 'gloria.angel@gmail.com',
    phone: '+57 311 223 3445',
    building: 'Torre B',
    apartment: 'Apto 402',
    coefficient: 7.5000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-5',
    complexId: 'complex-1',
    name: 'Andrés Felipe Silva Pardo',
    documentType: 'CC',
    documentNumber: '80.450.910',
    email: 'andres.silva@outlook.com',
    phone: '+57 301 998 8776',
    building: 'Torre A',
    apartment: 'Apto 204',
    coefficient: 7.1000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-6',
    complexId: 'complex-1',
    name: 'Martha Cecilia Quintero',
    documentType: 'CC',
    documentNumber: '39.870.123',
    email: 'martha.quintero@gmail.com',
    phone: '+57 316 777 4433',
    building: 'Torre B',
    apartment: 'Apto 201',
    coefficient: 6.8000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-7',
    complexId: 'complex-1',
    name: 'Dr. Gustavo Petro Ortiz',
    documentType: 'CC',
    documentNumber: '19.450.880',
    email: 'presidente@torresdelparque.com',
    phone: '+57 315 444 3322',
    building: 'Torre B',
    apartment: 'Apto 502',
    coefficient: 7.4500,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-8',
    complexId: 'complex-1',
    name: 'Inversiones & Bienes Los Sauces SAS',
    documentType: 'NIT',
    documentNumber: '901.234.567-8',
    email: 'contacto@saucesinversiones.com',
    phone: '+57 601 234 5678',
    building: 'Torre A',
    apartment: 'Apto 102',
    coefficient: 8.5000,
    status: 'active',
    hasProxy: true,
    proxyName: 'Abog. Natalia Osorio (Poder Notarial)',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-9',
    complexId: 'complex-1',
    name: 'Jorge Eliécer Gaitán Mora',
    documentType: 'CC',
    documentNumber: '79.112.334',
    email: 'jorge.gaitan@gmail.com',
    phone: '+57 317 888 9900',
    building: 'Torre A',
    apartment: 'Apto 401',
    coefficient: 6.9500,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-10',
    complexId: 'complex-1',
    name: 'Lucía Fernández Mendoza',
    documentType: 'CC',
    documentNumber: '52.765.432',
    email: 'lucia.fernandez@gmail.com',
    phone: '+57 313 444 5566',
    building: 'Torre B',
    apartment: 'Apto 301',
    coefficient: 7.6000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-11',
    complexId: 'complex-1',
    name: 'Mauricio Téllez Cárdenas',
    documentType: 'CC',
    documentNumber: '80.789.012',
    email: 'mauricio.tellez@hotmail.com',
    phone: '+57 300 665 4433',
    building: 'Torre A',
    apartment: 'Apto 201',
    coefficient: 7.2000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-12',
    complexId: 'complex-1',
    name: 'Patricia Escobar Jaramillo',
    documentType: 'CC',
    documentNumber: '43.210.987',
    email: 'patricia.escobar@gmail.com',
    phone: '+57 319 332 2110',
    building: 'Torre B',
    apartment: 'Apto 102',
    coefficient: 8.1000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-13',
    complexId: 'complex-1',
    name: 'Héctor Fabio Ramírez',
    documentType: 'CC',
    documentNumber: '14.890.123',
    email: 'hector.ramirez@yahoo.com',
    phone: '+57 310 112 3344',
    building: 'Torre A',
    apartment: 'Apto 301',
    coefficient: 7.5000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'owner-14',
    complexId: 'complex-1',
    name: 'Diana Marcela Bejarano',
    documentType: 'CC',
    documentNumber: '53.001.992',
    email: 'diana.bejarano@gmail.com',
    phone: '+57 315 990 0112',
    building: 'Torre B',
    apartment: 'Apto 401',
    coefficient: 7.0000,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z'
  }
];

export const DEMO_ASSEMBLY: Assembly = {
  id: 'assembly-1',
  complexId: 'complex-1',
  title: 'Asamblea General Ordinaria de Copropietarios 2026-2027',
  type: 'ordinaria',
  date: '2026-08-28',
  time: '18:00',
  location: 'Salón Comunal & Transmisión Virtual VotoSmart',
  modality: 'mixta',
  description: 'Revisión y aprobación de Estados Financieros 2025, Presupuesto Anual 2026-2027, Elección del Consejo de Administración y Selección de Empresa de Seguridad.',
  status: 'in_progress',
  administratorName: 'Carolina Méndez Rojas',
  presidentName: 'Dr. Gustavo Petro Ortiz',
  accountantName: 'C.P. Fernando Valdés Ruiz',
  secretaryName: 'Martha Cecilia Quintero',
  requiredQuorum: 50.01,
  totalOwnersInvited: 14,
  representedQuorum: 75.75, // Over 50.01%, valid quorum
  checkedInOwnersCount: 10,
  autoSendMinutes: true,
  createdAt: '2026-08-10T10:00:00Z',
  startedAt: '2026-08-28T18:15:00Z'
};

export const DEMO_QUORUM: QuorumAttendance[] = DEMO_OWNERS.map((owner, index) => ({
  id: `quorum-${owner.id}`,
  assemblyId: 'assembly-1',
  ownerId: owner.id,
  ownerName: owner.name,
  apartment: owner.apartment,
  building: owner.building,
  coefficient: owner.coefficient,
  checkedIn: index < 10, // 10 present, total 75.75%
  checkedInAt: index < 10 ? '2026-08-28T18:10:00Z' : undefined,
  verifiedBy: index < 10 ? 'Carolina Méndez (Administración)' : undefined,
  notes: owner.hasProxy ? `Representado por apoderado: ${owner.proxyName}` : undefined
}));

export const DEMO_DOCUMENTS: AssemblyDocument[] = [
  {
    id: 'doc-1',
    assemblyId: 'assembly-1',
    name: 'Convocatoria_Oficial_Asamblea_2026.pdf',
    type: 'convocatoria',
    fileUrl: '#',
    fileSize: '1.4 MB',
    uploadedBy: 'Carolina Méndez',
    uploadedAt: '2026-08-10T14:30:00Z'
  },
  {
    id: 'doc-2',
    assemblyId: 'assembly-1',
    name: 'Acta_Asamblea_Anterior_No_34.pdf',
    type: 'acta_anterior',
    fileUrl: '#',
    fileSize: '3.2 MB',
    uploadedBy: 'Carolina Méndez',
    uploadedAt: '2026-08-10T14:32:00Z'
  },
  {
    id: 'doc-3',
    assemblyId: 'assembly-1',
    name: 'Estados_Financieros_Dictaminados_2025.pdf',
    type: 'estados_financieros',
    fileUrl: '#',
    fileSize: '4.8 MB',
    uploadedBy: 'C.P. Fernando Valdés',
    uploadedAt: '2026-08-12T11:20:00Z'
  },
  {
    id: 'doc-4',
    assemblyId: 'assembly-1',
    name: 'Proyecto_Presupuesto_Vigencia_2026_2027.xlsx',
    type: 'estados_financieros',
    fileUrl: '#',
    fileSize: '890 KB',
    uploadedBy: 'C.P. Fernando Valdés',
    uploadedAt: '2026-08-12T11:25:00Z'
  },
  {
    id: 'doc-5',
    assemblyId: 'assembly-1',
    name: 'Reglamento_Propiedad_Horizontal.pdf',
    type: 'reglamento',
    fileUrl: '#',
    fileSize: '5.6 MB',
    uploadedBy: 'Carolina Méndez',
    uploadedAt: '2026-08-10T14:35:00Z'
  }
];

export const DEMO_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Elena Gómez Restrepo',
    apartment: 'Apto 101',
    building: 'Torre B',
    profileSummary: 'Ingeniera Civil con 15 años de experiencia en infraestructura y mantenimiento.',
    proposals: '1. Plan preventivo de impermeabilizaciones y fachadas.\n2. Digitalización de la facturación y portería.\n3. Modernización de luminarias a tecnología LED solar en zonas comunes.',
    experience: 'Ex-miembro del Consejo 2023, Líder del Comité de Convivencia.',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'cand-2',
    name: 'Andrés Felipe Silva',
    apartment: 'Apto 204',
    building: 'Torre A',
    profileSummary: 'Administrador de Empresas y especialista en finanzas corporativas.',
    proposals: '1. Auditoría mensual de gastos comunes y cartera morosa.\n2. Fondo especial para renovación de ascensores sin cuotas extraordinarias gravosas.\n3. Negociación transparente de contratos de vigilancia.',
    experience: '10 años en gerencia financiera, copropietario desde 2019.',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'cand-3',
    name: 'Martha Cecilia Quintero',
    apartment: 'Apto 201',
    building: 'Torre B',
    profileSummary: 'Abogada especialista en Derecho Inmobiliario y Propiedad Horizontal (Ley 675).',
    proposals: '1. Actualización y blindaje jurídico del Manual de Convivencia.\n2. Mediación efectiva de conflictos vecinales y tenencia responsable de mascotas.\n3. Cumplimiento estricto del Sistema de Gestión SST.',
    experience: 'Asesora legal de copropiedades y actual Secretaria Ad-hoc.',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'cand-4',
    name: 'Roberto Domínguez Silva',
    apartment: 'Apto 501',
    building: 'Torre A',
    profileSummary: 'Arquitecto y docente universitario, enfocado en urbanismo y áreas verdes.',
    proposals: '1. Remodelación del parque infantil y zonas de esparcimiento familiar.\n2. Sistema de reciclaje eficiente y aprovechamiento de aguas lluvias.\n3. Adecuación de accesibilidad para personas mayores.',
    experience: 'Diseñador de proyectos sostenibles, copropietario fundador.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    status: 'active'
  }
];

export const DEMO_VOTES: Vote[] = [
  {
    id: 'vote-1',
    assemblyId: 'assembly-1',
    title: 'Aprobación del Presupuesto Ordinario 2026-2027',
    description: 'Se somete a votación el presupuesto general de gastos ordinarios e inversión proyectado para el periodo Septiembre 2026 - Agosto 2027 por un valor total de $145.000.000 COP, con un incremento de cuota de administración del 7.2% correspondiente al IPC.',
    question: '¿Aprueba usted el Proyecto de Presupuesto Anual 2026-2027 presentado por la Administración y dictaminado por la Contaduría?',
    type: 'yes_no',
    options: [
      { id: 'opt-1-yes', label: 'SÍ, APRUEBO EL PRESUPUESTO', color: 'emerald' },
      { id: 'opt-1-no', label: 'NO APRUEBO EL PRESUPUESTO', color: 'rose' },
      { id: 'opt-1-abs', label: 'ME ABSTENGO DE VOTAR', color: 'slate' }
    ],
    minSelections: 1,
    maxSelections: 1,
    status: 'active',
    requiresCoefficient: true,
    isSecret: false,
    showLiveResults: true,
    allowAbstain: true,
    startedAt: '2026-08-28T18:40:00Z',
    totalVoters: 10
  },
  {
    id: 'vote-2',
    assemblyId: 'assembly-1',
    title: 'Elección de Miembros del Consejo de Administración 2026-2028',
    description: 'Elección de los 3 miembros principales del Consejo de Administración para el periodo estatutario de dos años. Puede seleccionar hasta 3 candidatos.',
    question: 'Seleccione hasta tres (3) candidatos para conformar el Consejo de Administración:',
    type: 'candidate_election',
    options: [
      { id: 'opt-cand-1', label: 'Elena Gómez Restrepo (Apto 101-B)', candidateId: 'cand-1' },
      { id: 'opt-cand-2', label: 'Andrés Felipe Silva (Apto 204-A)', candidateId: 'cand-2' },
      { id: 'opt-cand-3', label: 'Martha Cecilia Quintero (Apto 201-B)', candidateId: 'cand-3' },
      { id: 'opt-cand-4', label: 'Roberto Domínguez Silva (Apto 501-A)', candidateId: 'cand-4' }
    ],
    candidates: DEMO_CANDIDATES,
    minSelections: 1,
    maxSelections: 3,
    status: 'active',
    requiresCoefficient: true,
    isSecret: true,
    showLiveResults: true,
    allowAbstain: true,
    startedAt: '2026-08-28T18:50:00Z',
    totalVoters: 10
  },
  {
    id: 'vote-3',
    assemblyId: 'assembly-1',
    title: 'Selección de Empresa de Vigilancia y Seguridad Privada',
    description: 'Evaluación de las 3 propuestas comerciales y técnicas presentadas para la prestación del servicio de seguridad 24/7 con control de acceso biométrico.',
    question: '¿Cuál empresa de seguridad considera más conveniente para el conjunto?',
    type: 'single_choice',
    options: [
      { id: 'opt-sec-a', label: 'Propuesta A: Seguridad Superior Ltda. ($14.200.000/mes)', description: 'Incluye 2 vigilantes 24/7 + botón de pánico + circuito cerrado de TV con 32 cámaras.' },
      { id: 'opt-sec-b', label: 'Propuesta B: Alianza Vigilancia Total ($13.800.000/mes)', description: 'Incluye 2 vigilantes 24/7 + rondas con patrulla motorizada + monitoreo perimetral.' },
      { id: 'opt-sec-c', label: 'Propuesta C: Guardianes Residenciales SAS ($14.900.000/mes)', description: 'Incluye 2 vigilantes armados 24/7 + sistema de detección por IA + póliza extendida.' }
    ],
    minSelections: 1,
    maxSelections: 1,
    status: 'scheduled',
    requiresCoefficient: true,
    isSecret: false,
    showLiveResults: true,
    allowAbstain: true
  }
];

export const DEMO_VOTE_RECORDS: VoteRecord[] = [
  // 6 initial votes cast in Vote 1 to show realistic live progress
  {
    id: 'vrec-1',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterApartment: 'Apto 101',
    voterCoefficient: 8.2000,
    selectedOptionIds: ['opt-1-yes'],
    verificationCode: 'VREC-77A9B-101',
    timestamp: '2026-08-28T18:42:15Z'
  },
  {
    id: 'vrec-2',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterApartment: 'Apto 501',
    voterCoefficient: 6.9500,
    selectedOptionIds: ['opt-1-yes'],
    verificationCode: 'VREC-44C1D-501',
    timestamp: '2026-08-28T18:43:00Z'
  },
  {
    id: 'vrec-3',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterApartment: 'Apto 402',
    voterCoefficient: 7.5000,
    selectedOptionIds: ['opt-1-yes'],
    verificationCode: 'VREC-99E8F-402',
    timestamp: '2026-08-28T18:43:40Z'
  },
  {
    id: 'vrec-4',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterApartment: 'Apto 204',
    voterCoefficient: 7.1000,
    selectedOptionIds: ['opt-1-no'],
    verificationCode: 'VREC-33X2Y-204',
    timestamp: '2026-08-28T18:44:10Z'
  },
  {
    id: 'vrec-5',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterApartment: 'Apto 502',
    voterCoefficient: 7.4500,
    selectedOptionIds: ['opt-1-yes'],
    verificationCode: 'VREC-11K0L-502',
    timestamp: '2026-08-28T18:45:00Z'
  },
  {
    id: 'vrec-6',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterApartment: 'Apto 102',
    voterCoefficient: 8.5000,
    selectedOptionIds: ['opt-1-yes'],
    verificationCode: 'VREC-88Z7W-102',
    timestamp: '2026-08-28T18:45:30Z'
  }
];

export const DEMO_PARTICIPATION: VoterParticipation[] = [
  {
    id: 'part-1',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterUserId: 'user-owner-2',
    voterName: 'Elena Gómez Restrepo',
    voterApartment: 'Apto 101',
    voterDocument: '41.905.432',
    voterCoefficient: 8.2000,
    votedAt: '2026-08-28T18:42:15Z',
    receiptCode: 'REC-VT1-EG101-992'
  },
  {
    id: 'part-2',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterUserId: 'user-owner-3',
    voterName: 'Roberto Domínguez Silva',
    voterApartment: 'Apto 501',
    voterDocument: '19.876.543',
    voterCoefficient: 6.9500,
    votedAt: '2026-08-28T18:43:00Z',
    receiptCode: 'REC-VT1-RD501-441'
  },
  {
    id: 'part-3',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterUserId: 'owner-4',
    voterName: 'Gloria Patricia Ángel',
    voterApartment: 'Apto 402',
    voterDocument: '51.990.234',
    voterCoefficient: 7.5000,
    votedAt: '2026-08-28T18:43:40Z',
    receiptCode: 'REC-VT1-GA402-778'
  },
  {
    id: 'part-4',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterUserId: 'owner-5',
    voterName: 'Andrés Felipe Silva',
    voterApartment: 'Apto 204',
    voterDocument: '80.450.910',
    voterCoefficient: 7.1000,
    votedAt: '2026-08-28T18:44:10Z',
    receiptCode: 'REC-VT1-AS204-125'
  },
  {
    id: 'part-5',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterUserId: 'user-president',
    voterName: 'Dr. Gustavo Petro Ortiz',
    voterApartment: 'Apto 502',
    voterDocument: '19.450.880',
    voterCoefficient: 7.4500,
    votedAt: '2026-08-28T18:45:00Z',
    receiptCode: 'REC-VT1-GP502-330'
  },
  {
    id: 'part-6',
    voteId: 'vote-1',
    assemblyId: 'assembly-1',
    voterUserId: 'owner-8',
    voterName: 'Inversiones Los Sauces (Apoderado)',
    voterApartment: 'Apto 102',
    voterDocument: '901.234.567-8',
    voterCoefficient: 8.5000,
    votedAt: '2026-08-28T18:45:30Z',
    receiptCode: 'REC-VT1-LS102-887'
  }
];

export const DEMO_NOTES: AssemblyNote[] = [
  {
    id: 'note-1',
    assemblyId: 'assembly-1',
    content: 'Se da inicio a la asamblea siendo las 18:15 horas. Se verificó el quórum deliberatorio y decisorio con el 75.75% del coeficiente total del conjunto, superando el 50.01% requerido por la Ley 675 de 2001.',
    authorName: 'Martha Cecilia Quintero',
    authorRole: 'Secretaria Ad-hoc',
    category: 'general',
    timestamp: '2026-08-28T18:16:00Z'
  },
  {
    id: 'note-2',
    assemblyId: 'assembly-1',
    content: 'El C.P. Fernando Valdés presenta el informe de estados financieros y aclara la destinación del fondo de imprevistos para mantenimiento locativo de bombas de agua.',
    authorName: 'Carolina Méndez Rojas',
    authorRole: 'Administradora',
    category: 'aclaracion',
    timestamp: '2026-08-28T18:35:00Z'
  },
  {
    id: 'note-3',
    assemblyId: 'assembly-1',
    content: 'El propietario del Apto 302 (Carlos Ruiz) solicita que el incremento de administración se revise en función de las obras prioritarias de fachada.',
    authorName: 'Dr. Gustavo Petro Ortiz',
    authorRole: 'Presidente de Asamblea',
    category: 'intervencion',
    timestamp: '2026-08-28T18:38:00Z'
  }
];

export const DEMO_MINUTES: AssemblyMinutes = {
  id: 'minutes-1',
  assemblyId: 'assembly-1',
  version: 1,
  title: 'Acta No. 35 - Asamblea General Ordinaria de Copropietarios 2026',
  introText: 'En la ciudad de Bogotá D.C., siendo las 18:15 horas del día 28 de agosto de 2026, previa convocatoria enviada por la administración el día 10 de agosto de 2026 de conformidad con los estatutos del Conjunto Residencial Torres del Parque P.H. y la Ley 675 de 2001, se reunieron los copropietarios en modalidad mixta.',
  summary: 'Se desarrolló el orden del día con quórum verificado del 75.75%. Se sustentaron los estados financieros 2025 y se presentó el proyecto de presupuesto para el nuevo periodo. Se procedió a las votaciones digitales reglamentarias mediante la plataforma VotoSmart.',
  votingSummary: '1. Presupuesto 2026-2027: Aprobado mayoritariamente.\n2. Elección Consejo de Administración: Proceso digital secreto en curso con participación activa de la asamblea.',
  observations: 'La asamblea transcurrió en completa normalidad y cordialidad, garantizando la trazabilidad y voto secreto de los asistentes.',
  conclusions: 'Se faculta a la Administración para protocolizar el presupuesto aprobado y coordinar el empalme con el nuevo Consejo de Administración electo.',
  status: 'draft',
  generatedAt: '2026-08-28T18:55:00Z',
  generatedBy: 'Carolina Méndez Rojas',
  signatures: [
    { role: 'Presidente de Asamblea', name: 'Dr. Gustavo Petro Ortiz', document: 'CC 19.450.880' },
    { role: 'Secretaria Ad-hoc', name: 'Martha Cecilia Quintero', document: 'CC 39.870.123' },
    { role: 'Administradora', name: 'Carolina Méndez Rojas', document: 'CC 52.987.123' }
  ]
};

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    assemblyId: 'assembly-1',
    userId: 'user-admin',
    userName: 'Carolina Méndez Rojas',
    userRole: 'admin',
    action: 'CREACIÓN_ASAMBLEA',
    details: 'Creación de Asamblea Ordinaria 2026-2027 con fecha 28/08/2026',
    timestamp: '2026-08-10T10:00:00Z',
    ipAddress: '190.25.112.44'
  },
  {
    id: 'audit-2',
    assemblyId: 'assembly-1',
    userId: 'user-admin',
    userName: 'Carolina Méndez Rojas',
    userRole: 'admin',
    action: 'CARGA_DOCUMENTOS',
    details: 'Carga de Convocatoria Oficial y Estados Financieros',
    timestamp: '2026-08-10T14:35:00Z',
    ipAddress: '190.25.112.44'
  },
  {
    id: 'audit-3',
    assemblyId: 'assembly-1',
    userId: 'user-admin',
    userName: 'Carolina Méndez Rojas',
    userRole: 'admin',
    action: 'INICIO_ASAMBLEA',
    details: 'Apertura oficial de la asamblea con quórum del 75.75%',
    timestamp: '2026-08-28T18:15:00Z',
    ipAddress: '190.25.112.44'
  },
  {
    id: 'audit-4',
    assemblyId: 'assembly-1',
    userId: 'user-admin',
    userName: 'Carolina Méndez Rojas',
    userRole: 'admin',
    action: 'APERTURA_VOTACIÓN',
    details: 'Apertura de votación: Aprobación del Presupuesto Ordinario 2026-2027',
    timestamp: '2026-08-28T18:40:00Z',
    ipAddress: '190.25.112.44'
  },
  {
    id: 'audit-5',
    assemblyId: 'assembly-1',
    userId: 'user-admin',
    userName: 'Carolina Méndez Rojas',
    userRole: 'admin',
    action: 'APERTURA_ELECCIÓN',
    details: 'Apertura de elección: Elección de Miembros del Consejo de Administración 2026-2028',
    timestamp: '2026-08-28T18:50:00Z',
    ipAddress: '190.25.112.44'
  }
];

export const DEMO_EMAIL_LOGS: EmailLog[] = [
  {
    id: 'email-1',
    assemblyId: 'assembly-1',
    recipientEmail: 'carlos.ruiz@gmail.com',
    recipientName: 'Carlos Arturo Ruiz',
    subject: 'Convocatoria Oficial: Asamblea General Ordinaria 2026 - Torres del Parque',
    type: 'invitacion',
    status: 'sent',
    sentAt: '2026-08-10T15:00:00Z'
  },
  {
    id: 'email-2',
    assemblyId: 'assembly-1',
    recipientEmail: 'elena.gomez@hotmail.com',
    recipientName: 'Elena Gómez Restrepo',
    subject: 'Convocatoria Oficial: Asamblea General Ordinaria 2026 - Torres del Parque',
    type: 'invitacion',
    status: 'sent',
    sentAt: '2026-08-10T15:00:00Z'
  },
  {
    id: 'email-3',
    assemblyId: 'assembly-1',
    recipientEmail: 'roberto.dominguez@yahoo.es',
    recipientName: 'Roberto Domínguez Silva',
    subject: 'Convocatoria Oficial: Asamblea General Ordinaria 2026 - Torres del Parque',
    type: 'invitacion',
    status: 'sent',
    sentAt: '2026-08-10T15:00:00Z'
  }
];
