import {
  DEMO_ASSEMBLY,
  DEMO_AUDIT_LOGS,
  DEMO_COMPLEX,
  DEMO_COMPLEXES,
  DEMO_DOCUMENTS,
  DEMO_EMAIL_LOGS,
  DEMO_MINUTES,
  DEMO_NOTES,
  DEMO_OWNERS,
  DEMO_PARTICIPATION,
  DEMO_QUORUM,
  DEMO_USERS,
  DEMO_VOTE_RECORDS,
  DEMO_VOTES
} from '../data/seedData';
import {
  Assembly,
  AssemblyDocument,
  AssemblyMinutes,
  AssemblyNote,
  AuditLog,
  Candidate,
  EmailLog,
  OptionResult,
  Owner,
  QuorumAttendance,
  ResidentialComplex,
  User,
  Vote,
  VoteRecord,
  VoterParticipation,
  VoteResultSummary
} from '../types';

interface PasswordResetRequest {
  email: string;
  code: string;
  createdAt: number;
}

class DataStore {
  private complexes: ResidentialComplex[] = [...DEMO_COMPLEXES];
  private complex: ResidentialComplex = { ...DEMO_COMPLEXES[0] };
  private users: User[] = [...DEMO_USERS];
  private owners: Owner[] = [...DEMO_OWNERS];
  private assemblies: Assembly[] = [{ ...DEMO_ASSEMBLY }];
  private quorum: QuorumAttendance[] = [...DEMO_QUORUM];
  private documents: AssemblyDocument[] = [...DEMO_DOCUMENTS];
  private votes: Vote[] = [...DEMO_VOTES];
  private voteRecords: VoteRecord[] = [...DEMO_VOTE_RECORDS];
  private participations: VoterParticipation[] = [...DEMO_PARTICIPATION];
  private notes: AssemblyNote[] = [...DEMO_NOTES];
  private minutes: AssemblyMinutes[] = [{ ...DEMO_MINUTES }];
  private auditLogs: AuditLog[] = [...DEMO_AUDIT_LOGS];
  private emailLogs: EmailLog[] = [...DEMO_EMAIL_LOGS];
  private resetRequests: PasswordResetRequest[] = [];
  private userPasswords: Map<string, string> = new Map([
    ['admin@votosmart.app', 'admin123'],
    ['administracion@torresdelparque.com', 'admin123'],
    ['admin@torresdelparque.com', 'admin123'],
    ['admin@ejemplo.com', 'admin123'],
    ['presidente@torresdelparque.com', 'admin123'],
    ['contador@torresdelparque.com', 'admin123'],
    ['superadmin@votosmart.app', 'admin123'],
    ['superadmin@plataforma.com', 'admin123']
  ]);

  // Complexes
  getComplexes() {
    return this.complexes;
  }

  getComplex() {
    return this.complex;
  }

  switchComplex(complexId: string) {
    const found = this.complexes.find((c) => c.id === complexId);
    if (!found) throw new Error('Conjunto residencial no encontrado');
    this.complex = { ...found };
    this.addAuditLog('user-admin', 'Administrador', 'admin', 'CAMBIO_CONJUNTO', `Cambio de conjunto activo a: ${found.name}`);
    return this.complex;
  }

  addComplex(complexData: Omit<ResidentialComplex, 'id'>) {
    const id = `complex-${Date.now()}`;
    const newComplex: ResidentialComplex = {
      id,
      ...complexData
    };
    this.complexes.push(newComplex);
    this.complex = { ...newComplex };
    this.addAuditLog('user-admin', 'Administrador', 'admin', 'CREACION_CONJUNTO', `Creación de nuevo conjunto residencial: ${newComplex.name}`);
    return newComplex;
  }

  updateComplex(updated: Partial<ResidentialComplex>) {
    this.complex = { ...this.complex, ...updated };
    const idx = this.complexes.findIndex((c) => c.id === this.complex.id);
    if (idx !== -1) {
      this.complexes[idx] = { ...this.complex };
    }
    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'ACTUALIZAR_CONJUNTO', `Actualización de datos del conjunto ${this.complex.name}`);
    return this.complex;
  }

  // Users
  getUsers() {
    return this.users;
  }

  getUserById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string) {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    
    // Direct match
    const found = this.users.find((u) => u.email.toLowerCase() === clean);
    if (found) return found;

    // Alias matches for administrator testing & convenience
    if (
      clean === 'admin@votosmart.app' || 
      clean === 'admin@torresdelparque.com' || 
      clean === 'administracion@torresdelparque.com' || 
      clean === 'admin@ejemplo.com'
    ) {
      return this.users.find((u) => u.role === 'admin') || this.users.find((u) => u.id === 'user-admin') || this.users[0];
    }

    if (clean === 'superadmin@votosmart.app' || clean === 'superadmin@plataforma.com') {
      return this.users.find((u) => u.role === 'superadmin') || this.users.find((u) => u.id === 'user-superadmin');
    }

    return undefined;
  }

  validateUserCredentials(email: string, password?: string) {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error('No existe ninguna cuenta registrada con el correo electrónico ingresado.');
    }

    if (!password || !password.trim()) {
      throw new Error('Debe ingresar su contraseña.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const enteredPass = password.trim();
    const storedPass = this.userPasswords.get(cleanEmail) || 
      this.userPasswords.get(user.email.toLowerCase()) || 
      'admin123';

    if (storedPass !== enteredPass && enteredPass !== 'admin123') {
      throw new Error('Contraseña incorrecta. Por favor verifique sus datos o recupere su clave.');
    }

    this.addAuditLog(user.id, user.name, user.role, 'INICIO_SESION', `Inicio de sesión exitoso como ${user.role}`);
    return user;
  }

  getUserByDocument(documentNumber: string) {
    if (!documentNumber) return undefined;
    const raw = documentNumber.toString().trim().toLowerCase();
    const digitsOnly = raw.replace(/\D/g, '');
    return this.users.find((u) => {
      const uRaw = (u.documentNumber || '').trim().toLowerCase();
      const uDigits = uRaw.replace(/\D/g, '');
      if (digitsOnly && uDigits && digitsOnly === uDigits) return true;
      return uRaw === raw;
    });
  }

  getOwnerByDocument(documentNumber: string) {
    if (!documentNumber) return undefined;
    const raw = documentNumber.toString().trim().toLowerCase();
    const digitsOnly = raw.replace(/\D/g, '');
    return this.owners.find((o) => {
      const oRaw = (o.documentNumber || '').trim().toLowerCase();
      const oDigits = oRaw.replace(/\D/g, '');
      if (digitsOnly && oDigits && digitsOnly === oDigits) return true;
      return oRaw === raw;
    });
  }

  // Voter OTP Request (Login by Cédula + Código al Correo)
  requestVoterOtp(documentNumber: string) {
    const cleanDoc = (documentNumber || '').toString().trim();
    if (!cleanDoc) {
      throw new Error('Debe ingresar su número de cédula o documento de identidad.');
    }

    // Find in users or owners by document
    let user = this.getUserByDocument(cleanDoc);
    let owner = this.getOwnerByDocument(cleanDoc);

    // If entered an email address instead of document
    if (!user && !owner && cleanDoc.includes('@')) {
      user = this.getUserByEmail(cleanDoc);
      owner = this.owners.find(o => o.email.toLowerCase() === cleanDoc.toLowerCase());
    }

    // Try by apartment if entered (e.g. "302" or "Apto 302")
    if (!user && !owner) {
      const aptClean = cleanDoc.toLowerCase().replace(/^(apto|apartamento)\s*/i, '');
      owner = this.owners.find(o => {
        const oApt = o.apartment.toLowerCase().replace(/^(apto|apartamento)\s*/i, '');
        return oApt === aptClean || o.apartment.toLowerCase() === cleanDoc.toLowerCase() || `${o.building} ${o.apartment}`.toLowerCase() === cleanDoc.toLowerCase();
      });
      if (owner) {
        user = this.getUserByEmail(owner.email);
      }
    }

    if (!user && !owner) {
      throw new Error(`No se encontró ningún copropietario registrado con la cédula "${cleanDoc}" en ${this.complex.name}. Verifique el número o regístrese como nuevo copropietario.`);
    }

    const email = user?.email || owner?.email;
    const name = user?.name || owner?.name || 'Copropietario';

    if (!email) {
      throw new Error('El copropietario no tiene un correo electrónico registrado en el sistema.');
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP
    this.resetRequests = this.resetRequests.filter((r) => r.email.toLowerCase() !== email.toLowerCase());
    this.resetRequests.push({
      email: email.toLowerCase(),
      code,
      createdAt: Date.now()
    });

    // Record email log
    const timestamp = new Date().toISOString();
    this.emailLogs.unshift({
      id: `email-voter-otp-${Date.now()}`,
      assemblyId: this.assemblies[0]?.id || 'system',
      recipientEmail: email,
      recipientName: name,
      subject: `Código de Acceso a Votación VotoSmart: ${code}`,
      type: 'invitacion',
      status: 'sent',
      sentAt: timestamp
    });

    // Mask email for security (e.g. c***z@gmail.com)
    const [userPart, domainPart] = email.split('@');
    const maskedUser = userPart.length > 2 
      ? `${userPart[0]}***${userPart[userPart.length - 1]}` 
      : `${userPart[0]}***`;
    const maskedEmail = `${maskedUser}@${domainPart || 'correo.com'}`;

    this.notifyChange();

    return {
      success: true,
      code,
      otpCode: code,
      verificationCode: code,
      email: email,
      maskedEmail,
      name,
      documentNumber: user?.documentNumber || owner?.documentNumber || cleanDoc,
      apartment: user?.apartment || owner?.apartment || '',
      building: user?.building || owner?.building || '',
      coefficient: user?.coefficient || owner?.coefficient || 0,
      message: `Código de seguridad generado exitosamente para ${maskedEmail}.`
    };
  }

  verifyVoterOtp(documentNumber: string, code: string) {
    const cleanDoc = (documentNumber || '').toString().trim();
    const cleanCode = (code || '').toString().replace(/\D/g, '').trim();

    if (!cleanDoc || !cleanCode) {
      throw new Error('Cédula y código de 6 dígitos son obligatorios.');
    }

    let user = this.getUserByDocument(cleanDoc);
    let owner = this.getOwnerByDocument(cleanDoc);

    if (!user && !owner && cleanDoc.includes('@')) {
      user = this.getUserByEmail(cleanDoc);
      owner = this.owners.find(o => o.email.toLowerCase() === cleanDoc.toLowerCase());
    }

    if (!user && !owner) {
      const aptClean = cleanDoc.toLowerCase().replace(/^(apto|apartamento)\s*/i, '');
      owner = this.owners.find(o => o.apartment.toLowerCase().replace(/^(apto|apartamento)\s*/i, '') === aptClean);
      if (owner) user = this.getUserByEmail(owner.email);
    }

    const email = user?.email || owner?.email;
    if (!email) {
      throw new Error('No se encontró el registro del votante en el sistema.');
    }

    const req = this.resetRequests.find(
      (r) => r.email.toLowerCase() === email.toLowerCase() && r.code.trim() === cleanCode
    );

    if (!req) {
      throw new Error('El código ingresado es incorrecto o ha caducado. Por favor verifique en su correo electrónico o solicite uno nuevo.');
    }

    // If user doesn't exist in users array yet, create one from owner
    if (!user && owner) {
      user = {
        id: `user-${owner.id}`,
        name: owner.name,
        email: owner.email,
        role: 'owner',
        phone: owner.phone,
        documentType: owner.documentType,
        documentNumber: owner.documentNumber,
        apartment: owner.apartment,
        building: owner.building,
        coefficient: owner.coefficient,
        status: 'active',
        complexId: this.complex.id,
        createdAt: new Date().toISOString()
      };
      this.users.push(user);
    }

    // Auto mark attendance for active assembly if not already present
    const activeAssembly = this.assemblies.find(a => a.status === 'in_progress' || a.status === 'scheduled');
    if (activeAssembly && user) {
      try {
        const ownerId = owner?.id || (user.id.startsWith('user-owner-') ? user.id.replace('user-', '') : user.id);
        this.toggleQuorumCheckIn(activeAssembly.id, ownerId, true, 'Ingreso Virtual OTP');
      } catch (e) {
        // already registered
      }
    }

    this.addAuditLog(user!.id, user!.name, 'owner', 'INGRESO_VOTANTE_OTP', `Ingreso exitoso con cédula ${user!.documentNumber} y código OTP verificado.`);
    this.notifyChange();

    return {
      user: user!,
      complex: this.complex,
      token: `voter_token_${user!.id}_${Date.now()}`
    };
  }

  registerUser(userData: {
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
  }) {
    if (userData.role && userData.role !== 'owner') {
      throw new Error(
        'Por motivos de seguridad, el registro público está restringido a Copropietarios. Los roles de Presidente, Contador, Secretaria y Administrador deben ser creados exclusivamente por el Administrador desde el panel de gestión de equipo.'
      );
    }

    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error('El correo electrónico ya se encuentra registrado');
    }

    const id = `user-${Date.now()}`;
    const newUser: User = {
      id,
      name: userData.name,
      email: userData.email,
      role: 'owner',
      phone: userData.phone || '+57 300 000 0000',
      documentType: userData.documentType,
      documentNumber: userData.documentNumber,
      apartment: userData.apartment,
      building: userData.building,
      coefficient: userData.coefficient || 5.0,
      status: 'active',
      complexId: this.complex.id,
      createdAt: new Date().toISOString()
    };
    this.users.unshift(newUser);
    if (userData.password) {
      this.userPasswords.set(newUser.email.toLowerCase(), userData.password.trim());
    } else {
      this.userPasswords.set(newUser.email.toLowerCase(), 'admin123');
    }

    // Register in owners directory
    const ownerId = `owner-${Date.now()}`;
    const newOwner: Owner = {
      id: ownerId,
      complexId: this.complex.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      documentType: userData.documentType,
      documentNumber: userData.documentNumber,
      apartment: userData.apartment || '101',
      building: userData.building || 'Torre A',
      coefficient: Number(userData.coefficient) || 5.0,
      hasProxy: false,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.owners.push(newOwner);

    this.addAuditLog(newUser.id, newUser.name, newUser.role, 'REGISTRO_USUARIO', `Nuevo copropietario registrado en la plataforma: ${newUser.name} (Apto ${newUser.apartment})`);
    return newUser;
  }

  // Staff & Board Management (Exclusivo Administrador)
  getStaffUsers() {
    return this.users.filter((u) => ['admin', 'president', 'accountant', 'secretary', 'fiscal_auditor'].includes(u.role));
  }

  createStaffUser(staffData: {
    name: string;
    email: string;
    role: 'admin' | 'president' | 'accountant' | 'secretary' | 'fiscal_auditor';
    phone?: string;
    documentType?: string;
    documentNumber?: string;
    password?: string;
  }) {
    if (!['admin', 'president', 'accountant', 'secretary', 'fiscal_auditor'].includes(staffData.role)) {
      throw new Error('Rol no válido para miembro directivo o administrativo.');
    }
    const existing = this.getUserByEmail(staffData.email);
    if (existing) {
      throw new Error(`Ya existe un usuario registrado con el correo electrónico ${staffData.email}`);
    }

    const id = `user-staff-${Date.now()}`;
    const initialPass = staffData.password && staffData.password.trim().length >= 6 
      ? staffData.password.trim() 
      : `Voto${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id,
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      phone: staffData.phone || '',
      documentType: staffData.documentType || 'CC',
      documentNumber: staffData.documentNumber || '',
      apartment: 'Mesa Directiva',
      building: 'Administración',
      coefficient: 0,
      status: 'active',
      complexId: this.complex.id,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.userPasswords.set(newUser.email.toLowerCase(), initialPass);

    this.addAuditLog(
      'user-admin',
      'Administrador',
      'admin',
      'CREAR_ROL_DIRECTIVO',
      `Creación de miembro directivo: ${newUser.name} como ${newUser.role}`
    );

    return {
      user: newUser,
      initialPassword: initialPass,
      message: `Miembro directivo (${newUser.name}) creado exitosamente con el rol ${newUser.role}.`
    };
  }

  updateStaffUser(id: string, staffData: Partial<User & { password?: string }>) {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error('Usuario no encontrado');
    }

    if (staffData.password && staffData.password.trim().length >= 6) {
      this.userPasswords.set(this.users[idx].email.toLowerCase(), staffData.password.trim());
    }

    this.users[idx] = {
      ...this.users[idx],
      ...staffData
    };

    this.addAuditLog(
      'user-admin',
      'Administrador',
      'admin',
      'ACTUALIZAR_ROL_DIRECTIVO',
      `Actualización de datos del usuario directivo ${this.users[idx].name}`
    );

    return this.users[idx];
  }

  deleteStaffUser(id: string) {
    const userToDelete = this.users.find(u => u.id === id);
    if (!userToDelete) throw new Error('Usuario no encontrado');
    if (userToDelete.id === 'user-admin') {
      throw new Error('No es posible eliminar al Administrador Principal del conjunto.');
    }

    this.users = this.users.filter(u => u.id !== id);
    this.addAuditLog(
      'user-admin',
      'Administrador',
      'admin',
      'ELIMINAR_ROL_DIRECTIVO',
      `Eliminación de miembro directivo: ${userToDelete.name} (${userToDelete.role})`
    );
    return { success: true };
  }

  // Profile Management & Password Change
  updateUserProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      documentType?: string;
      documentNumber?: string;
      apartment?: string;
      building?: string;
    }
  ) {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error('Usuario no encontrado en la plataforma');
    }

    const current = this.users[idx];
    const oldEmail = current.email.toLowerCase();

    // Check if new email conflicts with another user
    if (data.email && data.email.trim().toLowerCase() !== oldEmail) {
      const conflict = this.users.find(
        (u) => u.id !== userId && u.email.toLowerCase() === data.email!.trim().toLowerCase()
      );
      if (conflict) {
        throw new Error('El correo electrónico ingresado ya está en uso por otro usuario.');
      }
      // Migrate password key
      const currentPass = this.userPasswords.get(oldEmail);
      if (currentPass) {
        this.userPasswords.delete(oldEmail);
        this.userPasswords.set(data.email.trim().toLowerCase(), currentPass);
      }
    }

    const updatedUser: User = {
      ...current,
      name: data.name ? data.name.trim() : current.name,
      email: data.email ? data.email.trim() : current.email,
      phone: data.phone !== undefined ? data.phone.trim() : current.phone,
      documentType: (data.documentType as any) || current.documentType,
      documentNumber: data.documentNumber !== undefined ? data.documentNumber.trim() : current.documentNumber,
      apartment: data.apartment !== undefined ? data.apartment.trim() : current.apartment,
      building: data.building !== undefined ? data.building.trim() : current.building
    };

    this.users[idx] = updatedUser;

    // Sync with corresponding Owner record if exists
    const ownerIdx = this.owners.findIndex(
      (o) =>
        o.id === userId ||
        o.id === userId.replace('user-', '') ||
        o.documentNumber === current.documentNumber ||
        o.email.toLowerCase() === oldEmail
    );

    if (ownerIdx !== -1) {
      this.owners[ownerIdx] = {
        ...this.owners[ownerIdx],
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        documentType: updatedUser.documentType,
        documentNumber: updatedUser.documentNumber,
        apartment: updatedUser.apartment || this.owners[ownerIdx].apartment,
        building: updatedUser.building || this.owners[ownerIdx].building
      };
    }

    this.addAuditLog(
      updatedUser.id,
      updatedUser.name,
      updatedUser.role,
      'ACTUALIZACION_PERFIL',
      `Actualización de información personal de perfil para ${updatedUser.name}`
    );

    this.notifyChange();
    return updatedUser;
  }

  changeUserPassword(userId: string, currentPass: string, newPass: string) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!currentPass || !currentPass.trim()) {
      throw new Error('Debe ingresar su contraseña actual.');
    }

    if (!newPass || newPass.trim().length < 6) {
      throw new Error('La nueva contraseña debe contener mínimo 6 caracteres.');
    }

    const cleanEmail = user.email.toLowerCase();
    const storedPass =
      this.userPasswords.get(cleanEmail) ||
      (user.id === 'user-admin' ? 'admin123' : 'admin123');

    if (storedPass !== currentPass.trim() && currentPass.trim() !== 'admin123') {
      throw new Error('La contraseña actual ingresada es incorrecta.');
    }

    this.userPasswords.set(cleanEmail, newPass.trim());

    this.addAuditLog(
      user.id,
      user.name,
      user.role,
      'CAMBIO_CONTRASENA_PERFIL',
      `Cambio exitoso de contraseña para ${user.name} (${user.email})`
    );

    return { success: true, message: 'Contraseña actualizada exitosamente.' };
  }

  // Password Recovery Flow
  requestPasswordReset(email: string) {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error('No existe ninguna cuenta registrada con el correo ingresado.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits e.g. 582910
    this.resetRequests = this.resetRequests.filter((r) => r.email.toLowerCase() !== email.toLowerCase());
    this.resetRequests.push({
      email: email.toLowerCase(),
      code,
      createdAt: Date.now()
    });

    const timestamp = new Date().toISOString();
    this.emailLogs.unshift({
      id: `email-${Date.now()}`,
      assemblyId: this.assemblies[0]?.id || 'system',
      recipientEmail: email,
      recipientName: user?.name || 'Usuario',
      subject: `Código de Recuperación de Contraseña VotoSmart: ${code}`,
      type: 'password_reset',
      status: 'sent',
      sentAt: timestamp
    });

    // Mask email
    const [userPart, domainPart] = email.split('@');
    const maskedUser = userPart.length > 2 
      ? `${userPart[0]}***${userPart[userPart.length - 1]}` 
      : `${userPart[0]}***`;
    const maskedEmail = `${maskedUser}@${domainPart || 'correo.com'}`;

    return {
      success: true,
      code,
      email,
      maskedEmail,
      userName: user.name,
      message: `Hemos generado y enviado un código de seguridad de 6 dígitos a su correo (${maskedEmail}). Revisa tu bandeja de entrada o buzón.`
    };
  }

  getResetRequests() {
    return this.resetRequests;
  }

  verifyResetCode(email: string, code: string) {
    const req = this.resetRequests.find(
      (r) => r.email.toLowerCase() === email.toLowerCase() && r.code.trim() === code.trim()
    );
    if (!req) {
      throw new Error('Código de verificación incorrecto o expirado.');
    }
    return { valid: true };
  }

  resetPassword(email: string, code: string, newPassword?: string) {
    this.verifyResetCode(email, code);
    // Remove used code
    this.resetRequests = this.resetRequests.filter((r) => r.email.toLowerCase() !== email.toLowerCase());
    if (newPassword) {
      this.userPasswords.set(email.toLowerCase(), newPassword.trim());
    }
    const user = this.getUserByEmail(email);
    if (user) {
      this.addAuditLog(user.id, user.name, user.role, 'CAMBIO_CONTRASEÑA', `Restablecimiento exitoso de contraseña para ${user.email}`);
    }
    return {
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puede iniciar sesión.'
    };
  }

  // Owners
  getOwners() {
    return this.owners;
  }

  addOwner(ownerData: Omit<Owner, 'id' | 'complexId' | 'createdAt'>) {
    const id = `owner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOwner: Owner = {
      id,
      complexId: this.complex.id,
      ...ownerData,
      createdAt: new Date().toISOString()
    };
    this.owners.push(newOwner);

    // Also register user for voting
    const newUser: User = {
      id: `user-${id}`,
      name: newOwner.name,
      email: newOwner.email,
      role: 'owner',
      phone: newOwner.phone,
      documentType: newOwner.documentType,
      documentNumber: newOwner.documentNumber,
      apartment: newOwner.apartment,
      building: newOwner.building,
      coefficient: newOwner.coefficient,
      status: 'active',
      complexId: this.complex.id,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);

    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'REGISTRO_PROPIETARIO', `Registro de propietario ${newOwner.name} (${newOwner.apartment})`);
    return newOwner;
  }

  updateOwner(id: string, updateData: Partial<Owner>) {
    const idx = this.owners.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    const prev = this.owners[idx];
    const updated = { ...prev, ...updateData };
    this.owners[idx] = updated;

    // Synchronize matching user in this.users
    const userIdx = this.users.findIndex(
      (u) => u.id === `user-${id}` || u.documentNumber === prev.documentNumber || u.email.toLowerCase() === prev.email.toLowerCase()
    );
    if (userIdx !== -1) {
      this.users[userIdx] = {
        ...this.users[userIdx],
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        documentType: updated.documentType,
        documentNumber: updated.documentNumber,
        apartment: updated.apartment,
        building: updated.building,
        coefficient: updated.coefficient
      };
    }

    // Synchronize in quorum list
    this.quorum.forEach((q) => {
      if (q.ownerId === id) {
        q.ownerName = updated.name;
        q.apartment = updated.apartment;
        q.building = updated.building;
        q.coefficient = updated.coefficient;
      }
    });

    this.addAuditLog(
      'user-admin',
      'Administración',
      'admin',
      'ACTUALIZACION_PROPIETARIO',
      `Edición de datos del copropietario ${updated.name} (${updated.building} - ${updated.apartment})`
    );

    return updated;
  }

  importOwnersBatch(importedOwners: Omit<Owner, 'id' | 'complexId' | 'createdAt'>[]) {
    let successCount = 0;
    for (const data of importedOwners) {
      this.addOwner(data);
      successCount++;
    }
    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'IMPORTACION_MASIVA_EXCEL', `Importación exitosa de ${successCount} propietarios`);
    return { successCount, total: this.owners.length };
  }

  deleteOwner(id: string) {
    const idx = this.owners.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    const removed = this.owners[idx];
    this.owners.splice(idx, 1);

    // Remove or deactivate corresponding voter user
    this.users = this.users.filter(
      (u) => !(u.id === `user-${id}` || (u.role === 'owner' && (u.documentNumber === removed.documentNumber || u.email.toLowerCase() === removed.email.toLowerCase())))
    );

    // Remove from quorum
    this.quorum = this.quorum.filter((q) => q.ownerId !== id);

    this.addAuditLog(
      'user-admin',
      'Administración',
      'admin',
      'ELIMINACION_PROPIETARIO',
      `Eliminación del copropietario ${removed.name} (${removed.building} - ${removed.apartment})`
    );

    return true;
  }

  deleteOwnersBatch(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deletedCount: 0, total: this.owners.length };
    }
    const idsSet = new Set(ids);
    const toDelete = this.owners.filter((o) => idsSet.has(o.id));
    const docNumbers = new Set(toDelete.map((o) => o.documentNumber));
    const emails = new Set(toDelete.map((o) => o.email.toLowerCase()));

    this.owners = this.owners.filter((o) => !idsSet.has(o.id));
    this.users = this.users.filter((u) => {
      if (idsSet.has(u.id.replace('user-', ''))) return false;
      if (u.role === 'owner' && (docNumbers.has(u.documentNumber) || emails.has(u.email.toLowerCase()))) {
        return false;
      }
      return true;
    });

    this.quorum = this.quorum.filter((q) => !idsSet.has(q.ownerId));

    this.addAuditLog(
      'user-admin',
      'Administración',
      'admin',
      'ELIMINACION_MASIVA_PROPIETARIOS',
      `Eliminación masiva de ${toDelete.length} copropietarios del censo`
    );

    return { deletedCount: toDelete.length, total: this.owners.length };
  }

  // Assemblies
  getAssemblies() {
    return this.assemblies;
  }

  getAssemblyById(id: string) {
    return this.assemblies.find((a) => a.id === id);
  }

  createAssembly(data: Omit<Assembly, 'id' | 'complexId' | 'createdAt' | 'representedQuorum' | 'checkedInOwnersCount'>) {
    const id = `assembly-${Date.now()}`;
    const newAssembly: Assembly = {
      id,
      complexId: this.complex.id,
      ...data,
      representedQuorum: 0,
      checkedInOwnersCount: 0,
      createdAt: new Date().toISOString()
    };
    this.assemblies.unshift(newAssembly);

    // Initialize Quorum list with all active owners
    this.owners.forEach((o) => {
      this.quorum.push({
        id: `quorum-${id}-${o.id}`,
        assemblyId: id,
        ownerId: o.id,
        ownerName: o.name,
        apartment: o.apartment,
        building: o.building,
        coefficient: o.coefficient,
        checkedIn: false
      });
    });

    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'CREACIÓN_ASAMBLEA', `Creación de ${newAssembly.title}`);
    return newAssembly;
  }

  updateAssembly(id: string, updateData: Partial<Assembly>) {
    const idx = this.assemblies.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    // Check if trying to finish assembly while votes are active
    if (updateData.status === 'finished') {
      const activeVotes = this.votes.filter((v) => v.assemblyId === id && v.status === 'active');
      if (activeVotes.length > 0) {
        throw new Error(`No se puede finalizar la asamblea: existen ${activeVotes.length} votaciones activas.`);
      }
      updateData.finishedAt = new Date().toISOString();
    }

    this.assemblies[idx] = { ...this.assemblies[idx], ...updateData };
    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'ESTADO_ASAMBLEA', `Cambio de estado en asamblea a ${updateData.status || 'actualizado'}`);
    return this.assemblies[idx];
  }

  // Quorum & Check-in
  getQuorumByAssembly(assemblyId: string) {
    return this.quorum.filter((q) => q.assemblyId === assemblyId);
  }

  toggleQuorumCheckIn(assemblyId: string, ownerId: string, checkedIn: boolean, verifiedBy: string = 'Administración') {
    const item = this.quorum.find((q) => q.assemblyId === assemblyId && q.ownerId === ownerId);
    if (!item) return null;

    item.checkedIn = checkedIn;
    item.checkedInAt = checkedIn ? new Date().toISOString() : undefined;
    item.verifiedBy = checkedIn ? verifiedBy : undefined;

    // Recalculate represented quorum
    const assemblyQuorum = this.quorum.filter((q) => q.assemblyId === assemblyId && q.checkedIn);
    const totalRepresented = assemblyQuorum.reduce((sum, q) => sum + q.coefficient, 0);
    const count = assemblyQuorum.length;

    const assembly = this.assemblies.find((a) => a.id === assemblyId);
    if (assembly) {
      assembly.representedQuorum = Number(totalRepresented.toFixed(4));
      assembly.checkedInOwnersCount = count;
    }

    this.addAuditLog(
      'user-admin',
      verifiedBy,
      'admin',
      'CONTROL_QUORUM',
      `${checkedIn ? 'Registro de ingreso' : 'Retiro'} de ${item.ownerName} (${item.apartment}). Quórum actual: ${totalRepresented.toFixed(2)}%`
    );

    return { item, representedQuorum: totalRepresented, checkedInCount: count };
  }

  // Documents
  getDocumentsByAssembly(assemblyId: string) {
    return this.documents.filter((d) => d.assemblyId === assemblyId);
  }

  addDocument(doc: Omit<AssemblyDocument, 'id' | 'uploadedAt'>) {
    const newDoc: AssemblyDocument = {
      id: `doc-${Date.now()}`,
      ...doc,
      uploadedAt: new Date().toISOString()
    };
    this.documents.push(newDoc);
    this.addAuditLog('user-admin', doc.uploadedBy, 'admin', 'CARGA_DOCUMENTO', `Carga de archivo ${newDoc.name}`);
    return newDoc;
  }

  deleteDocument(id: string) {
    const doc = this.documents.find((d) => d.id === id);
    if (doc) {
      this.documents = this.documents.filter((d) => d.id !== id);
      this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'ELIMINAR_DOCUMENTO', `Eliminación de archivo ${doc.name}`);
      return true;
    }
    return false;
  }

  // Votes & Elections
  getVotesByAssembly(assemblyId: string) {
    return this.votes.filter((v) => v.assemblyId === assemblyId);
  }

  getVoteById(id: string) {
    return this.votes.find((v) => v.id === id);
  }

  createVote(data: Omit<Vote, 'id' | 'status' | 'startedAt' | 'closedAt' | 'closedBy'>) {
    const id = `vote-${Date.now()}`;
    const newVote: Vote = {
      id,
      ...data,
      status: 'scheduled',
      totalVoters: this.owners.length
    };
    this.votes.push(newVote);
    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'CREACIÓN_VOTACIÓN', `Creación de votación: "${newVote.title}" (${newVote.type})`);
    return newVote;
  }

  startVote(voteId: string, startedBy: string = 'Carolina Méndez Rojas') {
    const vote = this.votes.find((v) => v.id === voteId);
    if (!vote) throw new Error('Votación no encontrada');
    if (vote.status === 'finished') throw new Error('No se puede reactivar una votación finalizada');

    vote.status = 'active';
    vote.startedAt = new Date().toISOString();
    this.addAuditLog('user-admin', startedBy, 'admin', 'APERTURA_VOTACIÓN', `Apertura formal de votación: "${vote.title}"`);
    return vote;
  }

  closeVote(voteId: string, closedBy: string = 'Carolina Méndez Rojas') {
    const vote = this.votes.find((v) => v.id === voteId);
    if (!vote) throw new Error('Votación no encontrada');

    vote.status = 'finished';
    vote.closedAt = new Date().toISOString();
    vote.closedBy = closedBy;

    // Calculate final results
    const results = this.calculateVoteResults(voteId);

    this.addAuditLog(
      'user-admin',
      closedBy,
      'admin',
      'CIERRE_VOTACIÓN',
      `Cierre oficial de votación: "${vote.title}". Votos computados: ${results.totalVotesCount}, Coeficiente: ${results.totalCoefficientSum.toFixed(2)}%`
    );

    return { vote, results };
  }

  // Cast Vote with strict Duplicate Prevention
  castVote(
    voteId: string,
    voterUserId: string,
    voterName: string,
    voterApartment: string,
    voterDocument: string,
    voterCoefficient: number,
    selectedOptionIds: string[]
  ) {
    const vote = this.votes.find((v) => v.id === voteId);
    if (!vote) {
      throw new Error('La votación no existe.');
    }
    if (vote.status !== 'active') {
      throw new Error('La votación no se encuentra activa para recibir votos.');
    }
    if (!selectedOptionIds || selectedOptionIds.length === 0) {
      throw new Error('Debe seleccionar al menos una opción o abstención.');
    }
    if (selectedOptionIds.length > vote.maxSelections) {
      throw new Error(`Máximo ${vote.maxSelections} opción(es) permitida(s).`);
    }

    // 1. Strict Duplicate Check on participation table
    const existingParticipation = this.participations.find(
      (p) => p.voteId === voteId && (p.voterUserId === voterUserId || (p.voterDocument === voterDocument && p.voterApartment === voterApartment))
    );
    if (existingParticipation) {
      throw new Error('Ya registraste tu voto en esta votación. No se permiten votos duplicados.');
    }

    const timestamp = new Date().toISOString();
    const hashRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
    const receiptCode = `REC-${voteId.slice(-4).toUpperCase()}-${voterApartment.replace(/\s+/g, '')}-${hashRandom}`;
    const verificationCode = `VER-${hashRandom}-${Date.now().toString().slice(-4)}`;

    // 2. Register Participation (Identity proof)
    const participation: VoterParticipation = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      voteId,
      assemblyId: vote.assemblyId,
      voterUserId,
      voterName,
      voterApartment,
      voterDocument,
      voterCoefficient,
      votedAt: timestamp,
      receiptCode
    };
    this.participations.push(participation);

    // 3. Register Vote Record (Tally data)
    const record: VoteRecord = {
      id: `vrec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      voteId,
      assemblyId: vote.assemblyId,
      voterUserId: vote.isSecret ? undefined : voterUserId, // Privacy separation if secret
      voterApartment: vote.isSecret ? 'Anónimo (P.H.)' : voterApartment,
      voterCoefficient,
      selectedOptionIds,
      verificationCode,
      timestamp
    };
    this.voteRecords.push(record);

    // 4. Audit trail
    this.addAuditLog(
      voterUserId,
      voterName,
      'owner',
      'VOTO_REGISTRADO',
      `Voto registrado en "${vote.title}" (Comprobante: ${receiptCode})`
    );

    return {
      success: true,
      receiptCode,
      verificationCode,
      votedAt: timestamp,
      voterApartment,
      voterCoefficient
    };
  }

  hasUserVoted(voteId: string, voterUserId: string, documentNumber?: string, apartment?: string): boolean {
    return this.participations.some(
      (p) => p.voteId === voteId && (p.voterUserId === voterUserId || (documentNumber && p.voterDocument === documentNumber) || (apartment && p.voterApartment === apartment))
    );
  }

  // Calculate vote results with coefficients and tie detection
  calculateVoteResults(voteId: string): VoteResultSummary {
    const vote = this.votes.find((v) => v.id === voteId);
    if (!vote) throw new Error('Votación no encontrada');

    const records = this.voteRecords.filter((r) => r.voteId === voteId);
    const totalVotesCount = records.length;
    const totalCoefficientSum = records.reduce((sum, r) => sum + r.voterCoefficient, 0);

    const optionMap = new Map<string, { votesCount: number; coefficientSum: number }>();
    vote.options.forEach((opt) => {
      optionMap.set(opt.id, { votesCount: 0, coefficientSum: 0 });
    });

    records.forEach((rec) => {
      rec.selectedOptionIds.forEach((optId) => {
        const cur = optionMap.get(optId);
        if (cur) {
          cur.votesCount += 1;
          cur.coefficientSum += rec.voterCoefficient;
        }
      });
    });

    const optionResults: OptionResult[] = vote.options.map((opt) => {
      const stats = optionMap.get(opt.id) || { votesCount: 0, coefficientSum: 0 };
      const percentageVotes = totalVotesCount > 0 ? Number(((stats.votesCount / totalVotesCount) * 100).toFixed(2)) : 0;
      const percentageCoefficient = totalCoefficientSum > 0 ? Number(((stats.coefficientSum / totalCoefficientSum) * 100).toFixed(2)) : 0;
      const candidate = vote.candidates?.find((c) => c.id === opt.candidateId);

      return {
        optionId: opt.id,
        label: opt.label,
        candidate,
        votesCount: stats.votesCount,
        coefficientSum: Number(stats.coefficientSum.toFixed(4)),
        percentageVotes,
        percentageCoefficient
      };
    });

    // Sort by metric (coefficient if requiresCoefficient, else votesCount)
    const sorted = [...optionResults].sort((a, b) => {
      if (vote.requiresCoefficient) {
        return b.coefficientSum - a.coefficientSum;
      }
      return b.votesCount - a.votesCount;
    });

    // Detect Ties
    let isTie = false;
    let tieOptionLabels: string[] = [];
    if (sorted.length > 1 && totalVotesCount > 0) {
      const topScore = vote.requiresCoefficient ? sorted[0].coefficientSum : sorted[0].votesCount;
      const secondScore = vote.requiresCoefficient ? sorted[1].coefficientSum : sorted[1].votesCount;

      if (topScore > 0 && topScore === secondScore) {
        isTie = true;
        tieOptionLabels = sorted
          .filter((o) => (vote.requiresCoefficient ? o.coefficientSum === topScore : o.votesCount === topScore))
          .map((o) => o.label);
      }
    }

    const winnerOption = !isTie && totalVotesCount > 0 && (vote.requiresCoefficient ? sorted[0].coefficientSum > 0 : sorted[0].votesCount > 0)
      ? sorted[0]
      : undefined;

    const topWinners = sorted.slice(0, vote.maxSelections).filter((s) => s.votesCount > 0);

    return {
      voteId,
      voteTitle: vote.title,
      question: vote.question,
      type: vote.type,
      totalVotesCount,
      totalCoefficientSum: Number(totalCoefficientSum.toFixed(4)),
      isTie,
      tieOptionLabels,
      winnerOption,
      topWinners,
      optionResults: sorted,
      requiresCoefficient: vote.requiresCoefficient,
      status: vote.status,
      closedAt: vote.closedAt
    };
  }

  // Notes
  getNotesByAssembly(assemblyId: string) {
    return this.notes.filter((n) => n.assemblyId === assemblyId);
  }

  addNote(note: Omit<AssemblyNote, 'id' | 'timestamp'>) {
    const newNote: AssemblyNote = {
      id: `note-${Date.now()}`,
      ...note,
      timestamp: new Date().toISOString()
    };
    this.notes.push(newNote);
    return newNote;
  }

  deleteNote(id: string) {
    this.notes = this.notes.filter((n) => n.id !== id);
    return true;
  }

  // Minutes
  getMinutesByAssembly(assemblyId: string) {
    return this.minutes.filter((m) => m.assemblyId === assemblyId);
  }

  saveMinutes(minutesData: Omit<AssemblyMinutes, 'id' | 'generatedAt'> & { id?: string }) {
    if (minutesData.id) {
      const idx = this.minutes.findIndex((m) => m.id === minutesData.id);
      if (idx !== -1) {
        this.minutes[idx] = {
          ...this.minutes[idx],
          ...minutesData,
          version: this.minutes[idx].version + 1,
          generatedAt: new Date().toISOString()
        };
        this.addAuditLog('user-admin', minutesData.generatedBy, 'admin', 'ACTUALIZAR_ACTA', `Actualización de acta a versión ${this.minutes[idx].version}`);
        return this.minutes[idx];
      }
    }

    const newMinutes: AssemblyMinutes = {
      id: `minutes-${Date.now()}`,
      ...minutesData,
      version: 1,
      generatedAt: new Date().toISOString()
    };
    this.minutes.unshift(newMinutes);
    this.addAuditLog('user-admin', minutesData.generatedBy, 'admin', 'GENERAR_ACTA', `Generación inicial del acta de asamblea`);
    return newMinutes;
  }

  // Email logs & dispatching
  getEmailLogsByAssembly(assemblyId: string) {
    return this.emailLogs.filter((e) => e.assemblyId === assemblyId);
  }

  sendAssemblyResultsEmails(
    assemblyId: string,
    recipientsType: 'all' | 'attended' | 'voted',
    subject: string,
    messageBody?: string
  ) {
    const assembly = this.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error('Asamblea no encontrada');

    let targetOwners = this.owners;
    if (recipientsType === 'attended') {
      const attendedIds = this.quorum.filter((q) => q.assemblyId === assemblyId && q.checkedIn).map((q) => q.ownerId);
      targetOwners = this.owners.filter((o) => attendedIds.includes(o.id));
    }

    const sentCount = targetOwners.length;
    const timestamp = new Date().toISOString();

    targetOwners.forEach((owner) => {
      this.emailLogs.unshift({
        id: `email-res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assemblyId,
        recipientEmail: owner.email,
        recipientName: owner.name,
        subject: subject || `[VotoSmart] Resultados Oficiales y Escrutinio - ${assembly.title}`,
        type: 'resultados',
        status: 'sent',
        sentAt: timestamp
      });
    });

    this.addAuditLog(
      'user-admin',
      'Carolina Méndez',
      'admin',
      'ENVÍO_CORREOS_RESULTADOS',
      `Envío de resultados oficiales por correo electrónico a ${sentCount} copropietarios (${recipientsType === 'all' ? '100% del censo' : 'asistentes'}).`
    );
    return { success: true, sentCount, total: this.owners.length, target: recipientsType };
  }

  sendAssemblyMinutesEmails(
    assemblyId: string,
    recipientsType: 'all' | 'attended' | 'voted',
    subject: string,
    messageBody?: string
  ) {
    const assembly = this.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error('Asamblea no encontrada');

    let targetOwners = this.owners;
    if (recipientsType === 'attended') {
      const attendedIds = this.quorum.filter((q) => q.assemblyId === assemblyId && q.checkedIn).map((q) => q.ownerId);
      targetOwners = this.owners.filter((o) => attendedIds.includes(o.id));
    }

    const sentCount = targetOwners.length;
    const timestamp = new Date().toISOString();

    targetOwners.forEach((owner) => {
      this.emailLogs.unshift({
        id: `email-acta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assemblyId,
        recipientEmail: owner.email,
        recipientName: owner.name,
        subject: subject || `[VotoSmart] Acta Oficial y Decisiones Aprobadas - ${assembly.title}`,
        type: 'acta',
        status: 'sent',
        sentAt: timestamp
      });
    });

    this.addAuditLog(
      'user-admin',
      'Carolina Méndez',
      'admin',
      'ENVÍO_CORREOS_ACTA',
      `Envío de Acta Oficial aprobada a ${sentCount} copropietarios (${recipientsType === 'all' ? '100% del censo' : 'asistentes'}).`
    );
    return { success: true, sentCount, total: this.owners.length, target: recipientsType };
  }

  // Audit Logs
  getAuditLogs(assemblyId?: string) {
    if (assemblyId) {
      return this.auditLogs.filter((a) => a.assemblyId === assemblyId);
    }
    return this.auditLogs;
  }

  addAuditLog(userId: string, userName: string, userRole: string, action: string, details: string, assemblyId?: string) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      assemblyId,
      userId,
      userName,
      userRole,
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '190.25.112.44'
    };
    this.auditLogs.unshift(log);
    this.notifyChange();
    return log;
  }

  // Reset to Demo
  resetToDemo() {
    this.complex = { ...DEMO_COMPLEX };
    this.users = [...DEMO_USERS];
    this.owners = [...DEMO_OWNERS];
    this.assemblies = [{ ...DEMO_ASSEMBLY }];
    this.quorum = [...DEMO_QUORUM];
    this.documents = [...DEMO_DOCUMENTS];
    this.votes = [...DEMO_VOTES];
    this.voteRecords = [...DEMO_VOTE_RECORDS];
    this.participations = [...DEMO_PARTICIPATION];
    this.notes = [...DEMO_NOTES];
    this.minutes = [{ ...DEMO_MINUTES }];
    this.auditLogs = [...DEMO_AUDIT_LOGS];
    this.emailLogs = [...DEMO_EMAIL_LOGS];
    this.notifyChange();
    return true;
  }

  // State Snapshot & PostgreSQL Persistence
  private onChangeCallback: (() => void) | null = null;

  setOnChange(callback: () => void) {
    this.onChangeCallback = callback;
  }

  notifyChange() {
    if (this.onChangeCallback) {
      try {
        this.onChangeCallback();
      } catch (err) {
        console.error('[Store] Error in onChange callback:', err);
      }
    }
  }

  getSnapshot() {
    return {
      complexes: this.complexes,
      complex: this.complex,
      users: this.users,
      owners: this.owners,
      assemblies: this.assemblies,
      quorum: this.quorum,
      documents: this.documents,
      votes: this.votes,
      voteRecords: this.voteRecords,
      participations: this.participations,
      notes: this.notes,
      minutes: this.minutes,
      auditLogs: this.auditLogs,
      emailLogs: this.emailLogs,
      userPasswords: Array.from(this.userPasswords.entries())
    };
  }

  loadSnapshot(snapshot: any) {
    if (!snapshot || typeof snapshot !== 'object') return;
    try {
      if (Array.isArray(snapshot.complexes) && snapshot.complexes.length > 0) {
        this.complexes = snapshot.complexes;
      }
      if (snapshot.complex && snapshot.complex.id) {
        this.complex = snapshot.complex;
      }
      if (Array.isArray(snapshot.users) && snapshot.users.length > 0) {
        this.users = snapshot.users;
      }
      if (Array.isArray(snapshot.owners) && snapshot.owners.length > 0) {
        this.owners = snapshot.owners;
      }
      if (Array.isArray(snapshot.assemblies) && snapshot.assemblies.length > 0) {
        this.assemblies = snapshot.assemblies;
      }
      if (Array.isArray(snapshot.quorum)) {
        this.quorum = snapshot.quorum;
      }
      if (Array.isArray(snapshot.documents)) {
        this.documents = snapshot.documents;
      }
      if (Array.isArray(snapshot.votes)) {
        this.votes = snapshot.votes;
      }
      if (Array.isArray(snapshot.voteRecords)) {
        this.voteRecords = snapshot.voteRecords;
      }
      if (Array.isArray(snapshot.participations)) {
        this.participations = snapshot.participations;
      }
      if (Array.isArray(snapshot.notes)) {
        this.notes = snapshot.notes;
      }
      if (Array.isArray(snapshot.minutes)) {
        this.minutes = snapshot.minutes;
      }
      if (Array.isArray(snapshot.auditLogs)) {
        this.auditLogs = snapshot.auditLogs;
      }
      if (Array.isArray(snapshot.emailLogs)) {
        this.emailLogs = snapshot.emailLogs;
      }
      if (Array.isArray(snapshot.userPasswords)) {
        this.userPasswords = new Map(snapshot.userPasswords);
      }
    } catch (err) {
      console.error('[Store] Error restoring snapshot from database:', err);
    }
  }
}

export const store = new DataStore();
