export type UserRole = 'superadmin' | 'admin' | 'president' | 'accountant' | 'secretary' | 'fiscal_auditor' | 'owner';

export type AssemblyType = 'ordinaria' | 'extraordinaria';
export type AssemblyModality = 'presencial' | 'virtual' | 'mixta';
export type AssemblyStatus = 'draft' | 'scheduled' | 'in_progress' | 'finished' | 'cancelled';

export type VoteType = 'yes_no' | 'single_choice' | 'multiple_choice' | 'candidate_election' | 'multi_position_election';
export type VoteStatus = 'draft' | 'scheduled' | 'active' | 'finished' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  apartment?: string;
  building?: string;
  coefficient?: number; // e.g. 7.25%
  status: 'active' | 'inactive';
  complexId: string;
  createdAt: string;
}

export interface ResidentialComplex {
  id: string;
  name: string;
  nit: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  logo?: string;
  totalUnits: number;
  totalCoefficient: number; // 100.00
  timezone: string;
  autoSendResults: boolean;
}

export interface Assembly {
  id: string;
  complexId: string;
  title: string;
  type: AssemblyType;
  date: string;
  time: string;
  location: string;
  modality: AssemblyModality;
  description: string;
  status: AssemblyStatus;
  administratorName: string;
  presidentName: string;
  accountantName: string;
  secretaryName?: string;
  requiredQuorum: number; // usually 50.01%
  totalOwnersInvited: number;
  representedQuorum: number; // sum of checked-in coefficients
  checkedInOwnersCount: number;
  autoSendMinutes: boolean;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface Owner {
  id: string;
  complexId: string;
  name: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  building: string;
  apartment: string;
  coefficient: number;
  status: 'active' | 'inactive';
  hasProxy?: boolean;
  proxyName?: string;
  createdAt: string;
}

export interface QuorumAttendance {
  id: string;
  assemblyId: string;
  ownerId: string;
  ownerName: string;
  apartment: string;
  building: string;
  coefficient: number;
  checkedIn: boolean;
  checkedInAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface AssemblyDocument {
  id: string;
  assemblyId: string;
  name: string;
  type: 'convocatoria' | 'acta_anterior' | 'reglamento' | 'estados_financieros' | 'propuesta' | 'otro';
  fileUrl: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AssemblyNote {
  id: string;
  assemblyId: string;
  content: string;
  authorName: string;
  authorRole: string;
  category: 'general' | 'intervencion' | 'aclaracion' | 'empate' | 'aprobacion';
  timestamp: string;
}

export interface VoteOption {
  id: string;
  label: string;
  description?: string;
  color?: string;
  candidateId?: string;
}

export interface Candidate {
  id: string;
  voteId?: string;
  name: string;
  documentNumber?: string;
  rolePostulation?: string;
  apartment: string;
  building: string;
  profileSummary: string;
  proposals: string;
  experience?: string;
  photoUrl: string;
  status: 'active' | 'inactive';
}

export interface Vote {
  id: string;
  assemblyId: string;
  title: string;
  description: string;
  question: string;
  type: VoteType;
  options: VoteOption[];
  candidates?: Candidate[];
  minSelections: number;
  maxSelections: number;
  status: VoteStatus;
  requiresCoefficient: boolean;
  isSecret: boolean;
  showLiveResults: boolean;
  allowAbstain: boolean;
  startedAt?: string;
  closedAt?: string;
  closedBy?: string;
  totalVoters?: number;
}

export interface VoteRecord {
  id: string;
  voteId: string;
  assemblyId: string;
  voterUserId?: string; // Optional if strictly anonymized
  voterApartment: string;
  voterCoefficient: number;
  selectedOptionIds: string[];
  verificationCode: string;
  timestamp: string;
}

export interface VoterParticipation {
  id: string;
  voteId: string;
  assemblyId: string;
  voterUserId: string;
  voterName: string;
  voterApartment: string;
  voterDocument: string;
  voterCoefficient: number;
  votedAt: string;
  receiptCode: string;
}

export interface OptionResult {
  optionId: string;
  label: string;
  candidate?: Candidate;
  votesCount: number;
  coefficientSum: number;
  percentageVotes: number;
  percentageCoefficient: number;
}

export interface VoteResultSummary {
  voteId: string;
  voteTitle: string;
  question: string;
  type: VoteType;
  totalVotesCount: number;
  totalCoefficientSum: number;
  isTie: boolean;
  tieOptionLabels?: string[];
  winnerOption?: OptionResult;
  topWinners?: OptionResult[]; // For multi-seat elections
  optionResults: OptionResult[];
  requiresCoefficient: boolean;
  status: VoteStatus;
  closedAt?: string;
}

export interface AssemblyMinutes {
  id: string;
  assemblyId: string;
  version: number;
  title: string;
  introText: string;
  summary: string;
  votingSummary: string;
  observations: string;
  conclusions: string;
  status: 'draft' | 'generated' | 'approved';
  generatedAt: string;
  generatedBy: string;
  signatures: {
    role: string;
    name: string;
    document: string;
  }[];
}

export interface AuditLog {
  id: string;
  assemblyId?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface EmailLog {
  id: string;
  assemblyId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  type: 'invitacion' | 'resultados' | 'acta' | 'password_reset';
  status: 'sent' | 'failed' | 'simulated';
  sentAt: string;
  errorMessage?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  complex: ResidentialComplex;
}
