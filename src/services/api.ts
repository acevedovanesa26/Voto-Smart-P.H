import {
  Assembly,
  AssemblyDocument,
  AssemblyMinutes,
  AssemblyNote,
  AuditLog,
  AuthResponse,
  EmailLog,
  Owner,
  QuorumAttendance,
  ResidentialComplex,
  User,
  Vote,
  VoteResultSummary
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(identifier: string, password?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, documentNumber: identifier, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al iniciar sesión');
    }
    return res.json();
  },

  async register(userData: {
    name: string;
    email: string;
    role: 'admin' | 'president' | 'accountant' | 'owner';
    phone?: string;
    documentType: 'CC' | 'CE' | 'NIT' | 'PAS';
    documentNumber: string;
    apartment?: string;
    building?: string;
    coefficient?: number;
    password?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar usuario');
    }
    return res.json();
  },

  // Check voter census status and if password is set
  async checkVoterStatus(documentNumber: string): Promise<{
    success: boolean;
    exists: boolean;
    hasPassword: boolean;
    name: string;
    maskedEmail: string;
    documentNumber: string;
    apartment: string;
    building: string;
    coefficient: number;
  }> {
    const res = await fetch(`${API_BASE}/auth/voter/check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentNumber })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se encontró el copropietario en el censo.');
    }
    return res.json();
  },

  // Request 6-digit activation code to registered email to create password
  async requestVoterActivation(documentNumber: string): Promise<{
    success: boolean;
    maskedEmail: string;
    name: string;
    documentNumber: string;
    apartment: string;
    building: string;
    message: string;
    deliveryMode?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/voter/request-activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentNumber })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al solicitar código de activación');
    }
    return res.json();
  },

  // Verify 6-digit code and register new password
  async registerVoterPassword(documentNumber: string, code: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/voter/register-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentNumber, code, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar contraseña');
    }
    return res.json();
  },

  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string; maskedEmail?: string; userName?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, documentNumber: identifier })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al solicitar código de recuperación');
    }
    return res.json();
  },

  async verifyResetCode(identifier: string, code: string): Promise<{ valid: boolean }> {
    const res = await fetch(`${API_BASE}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, documentNumber: identifier, code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Código incorrecto');
    }
    return res.json();
  },

  async resetPassword(identifier: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, documentNumber: identifier, code, newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al restablecer contraseña');
    }
    return res.json();
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar información del perfil');
    }
    return res.json();
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al cambiar contraseña');
    }
    return res.json();
  },

  // Voter OTP (Cédula + Código al Correo)
  async requestVoterOtp(documentNumber: string): Promise<{
    success: boolean;
    email: string;
    maskedEmail: string;
    name: string;
    documentNumber: string;
    apartment: string;
    building: string;
    coefficient: number;
    verificationCode?: string;
    otpCode?: string;
    code?: string;
    deliveryMode?: 'real_smtp' | 'sandbox_inbox';
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/voter-request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentNumber })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo enviar el código de verificación.');
    }
    return res.json();
  },

  async verifyVoterOtp(documentNumber: string, code: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/voter-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentNumber, code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Código incorrecto o expirado.');
    }
    return res.json();
  },

  // Complex
  async getComplexes(): Promise<ResidentialComplex[]> {
    const res = await fetch(`${API_BASE}/complexes`);
    return res.json();
  },

  async switchComplex(complexId: string): Promise<ResidentialComplex> {
    const res = await fetch(`${API_BASE}/complexes/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complexId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al cambiar conjunto');
    }
    return res.json();
  },

  async addComplex(data: Omit<ResidentialComplex, 'id'>): Promise<ResidentialComplex> {
    const res = await fetch(`${API_BASE}/complexes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear conjunto');
    }
    return res.json();
  },

  async getComplex(): Promise<ResidentialComplex> {
    const res = await fetch(`${API_BASE}/complex`);
    return res.json();
  },

  async updateComplex(data: Partial<ResidentialComplex>): Promise<ResidentialComplex> {
    const res = await fetch(`${API_BASE}/complex`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Owners
  async getOwners(complexId?: string): Promise<Owner[]> {
    const url = complexId ? `${API_BASE}/owners?complexId=${encodeURIComponent(complexId)}` : `${API_BASE}/owners`;
    const res = await fetch(url);
    return res.json();
  },

  async getCouncilMembers(complexId?: string): Promise<Owner[]> {
    const url = complexId ? `${API_BASE}/owners/council?complexId=${encodeURIComponent(complexId)}` : `${API_BASE}/owners/council`;
    const res = await fetch(url);
    return res.json();
  },

  async toggleCouncilMember(id: string, isCouncilMember: boolean, councilRole?: string): Promise<{ success: boolean; owner: Owner }> {
    const res = await fetch(`${API_BASE}/owners/${id}/toggle-council`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCouncilMember, councilRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar estado en el consejo');
    }
    return res.json();
  },

  async addOwner(owner: Omit<Owner, 'id' | 'complexId' | 'createdAt'>, complexId?: string): Promise<Owner> {
    const res = await fetch(`${API_BASE}/owners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...owner, complexId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear propietario');
    }
    return res.json();
  },

  async updateOwner(id: string, owner: Partial<Owner>): Promise<Owner> {
    const res = await fetch(`${API_BASE}/owners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(owner)
    });
    return res.json();
  },

  async importOwnersBatch(owners: Omit<Owner, 'id' | 'complexId' | 'createdAt'>[], complexId?: string): Promise<{ successCount: number; total: number }> {
    const res = await fetch(`${API_BASE}/owners/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owners, complexId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al importar propietarios');
    }
    return res.json();
  },

  async deleteOwner(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/owners/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar propietario');
    }
    return true;
  },

  async deleteOwnersBatch(ids: string[], complexId?: string): Promise<{ success: boolean; deletedCount: number; total: number }> {
    const res = await fetch(`${API_BASE}/owners/delete-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, complexId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar los propietarios seleccionados');
    }
    return res.json();
  },

  // Assemblies
  async getAssemblies(complexId?: string): Promise<Assembly[]> {
    const url = complexId ? `${API_BASE}/assemblies?complexId=${encodeURIComponent(complexId)}` : `${API_BASE}/assemblies`;
    const res = await fetch(url);
    return res.json();
  },

  async getAssembly(id: string): Promise<Assembly> {
    const res = await fetch(`${API_BASE}/assemblies/${id}`);
    if (!res.ok) throw new Error('Asamblea no encontrada');
    return res.json();
  },

  async createAssembly(data: Partial<Assembly>): Promise<Assembly> {
    const res = await fetch(`${API_BASE}/assemblies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear asamblea');
    }
    return res.json();
  },

  async updateAssembly(id: string, data: Partial<Assembly>): Promise<Assembly> {
    const res = await fetch(`${API_BASE}/assemblies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar asamblea');
    }
    return res.json();
  },

  // Quorum
  async getQuorum(assemblyId: string): Promise<QuorumAttendance[]> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/quorum`);
    return res.json();
  },

  async toggleQuorum(assemblyId: string, ownerId: string, checkedIn: boolean, verifiedBy: string): Promise<any> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/quorum/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, checkedIn, verifiedBy })
    });
    return res.json();
  },

  // Documents
  async getDocuments(assemblyId: string): Promise<AssemblyDocument[]> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/documents`);
    return res.json();
  },

  async addDocument(assemblyId: string, doc: Partial<AssemblyDocument>): Promise<AssemblyDocument> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    return res.json();
  },

  async deleteDocument(assemblyId: string, docId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/documents/${docId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return data.success;
  },

  // Votes
  async getVotes(assemblyId: string): Promise<Vote[]> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/votes`);
    return res.json();
  },

  async getVote(voteId: string): Promise<Vote> {
    const res = await fetch(`${API_BASE}/votes/${voteId}`);
    return res.json();
  },

  async createVote(assemblyId: string, voteData: Partial<Vote>): Promise<Vote> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear votación');
    }
    return res.json();
  },

  async updateVote(voteId: string, voteData: Partial<Vote>): Promise<Vote> {
    const res = await fetch(`${API_BASE}/votes/${voteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar votación');
    }
    return res.json();
  },

  async deleteVote(voteId: string, deletedBy?: string): Promise<{ success: boolean; deletedVoteId: string }> {
    const res = await fetch(`${API_BASE}/votes/${voteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedBy })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar votación');
    }
    return res.json();
  },

  async resetVote(voteId: string, resetBy?: string): Promise<Vote> {
    const res = await fetch(`${API_BASE}/votes/${voteId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetBy })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al reiniciar votación');
    }
    return res.json();
  },

  async startVote(voteId: string, startedBy: string): Promise<Vote> {
    const res = await fetch(`${API_BASE}/votes/${voteId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startedBy })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al iniciar votación');
    }
    return res.json();
  },

  async closeVote(voteId: string, closedBy: string): Promise<{ vote: Vote; results: VoteResultSummary }> {
    const res = await fetch(`${API_BASE}/votes/${voteId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closedBy })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al cerrar votación');
    }
    return res.json();
  },

  async castVote(voteId: string, payload: {
    voterUserId: string;
    voterName: string;
    voterApartment: string;
    voterDocument?: string;
    voterCoefficient: number;
    selectedOptionIds: string[];
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/votes/${voteId}/cast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar el voto');
    }
    return res.json();
  },

  async getVoteResults(voteId: string): Promise<VoteResultSummary> {
    const res = await fetch(`${API_BASE}/votes/${voteId}/results`);
    return res.json();
  },

  async checkHasVoted(voteId: string, userId: string, documentNumber?: string, apartment?: string): Promise<boolean> {
    const params = new URLSearchParams({
      userId,
      documentNumber: documentNumber || '',
      apartment: apartment || ''
    });
    const res = await fetch(`${API_BASE}/votes/${voteId}/has-voted?${params.toString()}`);
    const data = await res.json();
    return !!data.hasVoted;
  },

  async checkVoterEligibility(voteId: string, userId: string, documentNumber?: string): Promise<{ eligible: boolean; reason?: string; owner?: Owner }> {
    const params = new URLSearchParams({
      userId,
      documentNumber: documentNumber || ''
    });
    const res = await fetch(`${API_BASE}/votes/${voteId}/eligibility?${params.toString()}`);
    return res.json();
  },

  // Notes
  async getNotes(assemblyId: string): Promise<AssemblyNote[]> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/notes`);
    return res.json();
  },

  async addNote(assemblyId: string, note: Partial<AssemblyNote>): Promise<AssemblyNote> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    return res.json();
  },

  async deleteNote(assemblyId: string, noteId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/notes/${noteId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return data.success;
  },

  // Minutes
  async getMinutes(assemblyId: string): Promise<AssemblyMinutes[]> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/minutes`);
    return res.json();
  },

  async saveMinutes(assemblyId: string, minutes: Partial<AssemblyMinutes>): Promise<AssemblyMinutes> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/minutes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minutes)
    });
    return res.json();
  },

  // Emails
  async getEmails(assemblyId: string): Promise<EmailLog[]> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/emails`);
    return res.json();
  },

  async sendResultsEmails(
    assemblyId: string,
    recipientsType: 'all' | 'attended' | 'voted' | 'specific',
    subject: string,
    messageBody?: string,
    selectedOwnerIds?: string[],
    attachment?: { name: string; size?: string; dataUri?: string }
  ): Promise<{ success?: boolean; sentCount: number; total: number; attachment?: { name: string; size?: string } }> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/send-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientsType, subject, messageBody, selectedOwnerIds, attachment })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al enviar correos de resultados');
    }
    return res.json();
  },

  async sendMinutesEmails(
    assemblyId: string,
    recipientsType: 'all' | 'attended' | 'voted' | 'specific',
    subject: string,
    messageBody?: string,
    selectedOwnerIds?: string[],
    attachment?: { name: string; size?: string; dataUri?: string }
  ): Promise<{ success?: boolean; sentCount: number; total: number; attachment?: { name: string; size?: string } }> {
    const res = await fetch(`${API_BASE}/assemblies/${assemblyId}/send-minutes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientsType, subject, messageBody, selectedOwnerIds, attachment })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al enviar correos del acta');
    }
    return res.json();
  },

  // Staff & Directiva
  async getStaffUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/staff`);
    return res.json();
  },

  async createStaffUser(staffData: {
    ownerId?: string;
    name: string;
    email: string;
    role: 'admin' | 'president' | 'accountant' | 'secretary' | 'fiscal_auditor';
    phone?: string;
    documentType?: string;
    documentNumber?: string;
    password?: string;
  }): Promise<{ user: User; initialPassword: string; message: string; isExistingOwner?: boolean }> {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear miembro directivo');
    }
    return res.json();
  },

  async updateStaffUser(id: string, staffData: Partial<User & { password?: string }>): Promise<User> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar miembro directivo');
    }
    return res.json();
  },

  async deleteStaffUser(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar miembro directivo');
    }
    return res.json();
  },

  // Emails Center
  async getEmailRecords(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/emails`);
    return res.json();
  },

  async testSendEmail(to: string, subject?: string, message?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/emails/test-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al enviar correo de prueba');
    }
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(assemblyId?: string, complexId?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (assemblyId) params.append('assemblyId', assemblyId);
    if (complexId) params.append('complexId', complexId);
    const qs = params.toString();
    const url = qs ? `${API_BASE}/audit-logs?${qs}` : `${API_BASE}/audit-logs`;
    const res = await fetch(url);
    return res.json();
  },

  // Reset Demo
  async resetDemo(): Promise<void> {
    await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  },

  // Database & Persistence
  async getDbStatus(): Promise<{
    connected: boolean;
    type: string;
    error: string | null;
    databaseUrlSet: boolean;
    timestamp: string;
  }> {
    const res = await fetch(`${API_BASE}/db/status`);
    return res.json();
  },

  async syncDb(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/db/sync`, { method: 'POST' });
    return res.json();
  },

  // Gemini AI Summarization
  async generateAiSummary(payload: {
    assemblyTitle: string;
    complexName: string;
    notes: AssemblyNote[];
    votesResults: any[];
  }): Promise<{ summary: string; source: string }> {
    const res = await fetch(`${API_BASE}/gemini/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Email Service & SMTP Diagnostics
  async getEmailServiceStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/email-service/status`);
    return res.json();
  },

  async updateEmailConfig(config: {
    brevoApiKey?: string;
    brevoSenderEmail?: string;
    emailHost?: string;
    emailPort?: number;
    emailUsername?: string;
    emailPassword?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/email-service/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar configuración de correo');
    }
    return res.json();
  },

  async verifySmtp(): Promise<{ success: boolean; message: string; durationMs: number }> {
    const res = await fetch(`${API_BASE}/email-service/verify`, { method: 'POST' });
    return res.json();
  },

  async testSendDiagnosticEmail(to: string, message?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/email-service/test-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al enviar correo de prueba');
    }
    return res.json();
  },

  async getEmailHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/email-service/history`);
    return res.json();
  },

  async getLatestEmail(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/email-service/latest?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  async retryEmail(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/email-service/retry/${id}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al reintentar envío');
    }
    return res.json();
  }
};
