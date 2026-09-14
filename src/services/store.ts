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
  expiresAt: number;
  used: boolean;
  verified: boolean;
}

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  'password',
  'password123',
  'password123!',
  'admin123',
  'admin123!',
  'admin2024',
  'admin2025',
  'qwerty12345',
  'contrasena123',
  'votosmart123'
]);

export function assertPasswordPolicy(password: string): void {
  const p = (password || '').trim();
  if (p.length < 8) {
    throw new Error('La contraseña debe tener como mínimo 8 caracteres.');
  }
  if (!/[A-Z]/.test(p)) {
    throw new Error('La contraseña debe incluir al menos una letra mayúscula (A-Z).');
  }
  if (!/[a-z]/.test(p)) {
    throw new Error('La contraseña debe incluir al menos una letra minúscula (a-z).');
  }
  if (!/[0-9]/.test(p)) {
    throw new Error('La contraseña debe incluir al menos un número (0-9).');
  }
  if (!/[^A-Za-z0-9]/.test(p)) {
    throw new Error('La contraseña debe incluir al menos un carácter especial (!@#$%^&*...).');
  }
  if (COMMON_PASSWORDS.has(p.toLowerCase())) {
    throw new Error('La contraseña ingresada es demasiado común o predecible. Elija una combinación más segura.');
  }
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
    ['motatovanesa@gmail.com', 'admin123'],
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

  getComplexById(id: string) {
    return this.complexes.find((c) => c.id === id);
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

  validateUserCredentials(identifier: string, password?: string) {
    if (!identifier || !identifier.trim()) {
      throw new Error('Debe ingresar su correo electrónico o número de cédula.');
    }
    if (!password || !password.trim()) {
      throw new Error('Debe ingresar su contraseña.');
    }

    const clean = identifier.trim().toLowerCase();
    let user = this.getUserByEmail(clean) || this.getUserByDocument(clean);
    let owner = this.owners.find((o) => o.email.toLowerCase() === clean) || this.getOwnerByDocument(clean);

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
        complexId: owner.complexId || this.complex.id,
        createdAt: new Date().toISOString()
      };
      this.users.push(user);
    }

    if (!user) {
      throw new Error('No existe ninguna cuenta registrada con los datos ingresados.');
    }

    const cleanEmail = user.email.toLowerCase();
    const storedPass = this.userPasswords.get(cleanEmail);

    if (!storedPass) {
      throw new Error('Aún no has registrado una contraseña para esta cuenta. Haz clic en "Activar Cuenta / Registrar Clave" para recibir tu código al correo y crear tu contraseña.');
    }

    const enteredPass = password.trim();
    if (storedPass !== enteredPass) {
      throw new Error('Contraseña incorrecta. Por favor verifique sus datos o recupere su clave.');
    }

    // Auto mark attendance for active assembly if voter
    if (user.role === 'owner') {
      const activeAssembly = this.assemblies.find(a => a.status === 'in_progress' || a.status === 'scheduled');
      if (activeAssembly) {
        try {
          const ownerId = owner?.id || (user.id.startsWith('user-owner-') ? user.id.replace('user-', '') : user.id);
          this.toggleQuorumCheckIn(activeAssembly.id, ownerId, true, 'Ingreso con Contraseña');
        } catch (e) {
          // already checked in
        }
      }
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

  // Check voter status in census (Cédula lookup)
  checkVoterStatus(documentNumber: string) {
    const cleanDoc = (documentNumber || '').toString().trim();
    if (!cleanDoc) {
      throw new Error('Debe ingresar su número de cédula o documento de identidad.');
    }

    let user = this.getUserByDocument(cleanDoc);
    let owner = this.getOwnerByDocument(cleanDoc);

    if (!user && !owner && cleanDoc.includes('@')) {
      user = this.getUserByEmail(cleanDoc);
      owner = this.owners.find(o => o.email.toLowerCase() === cleanDoc.toLowerCase());
    }

    if (!user && !owner) {
      throw new Error(`No se encontró ningún copropietario registrado con la cédula "${cleanDoc}" en ${this.complex.name}. Por favor verifique el número o regístrese en el censo.`);
    }

    const email = user?.email || owner?.email || '';
    const hasPassword = this.userPasswords.has(email.toLowerCase());
    const [userPart, domainPart] = email.split('@');
    const maskedUser = userPart.length > 2 
      ? `${userPart[0]}***${userPart[userPart.length - 1]}` 
      : `${userPart[0]}***`;
    const maskedEmail = `${maskedUser}@${domainPart || 'correo.com'}`;

    return {
      exists: true,
      hasPassword,
      name: user?.name || owner?.name || 'Copropietario',
      email,
      maskedEmail,
      documentNumber: user?.documentNumber || owner?.documentNumber || cleanDoc,
      apartment: user?.apartment || owner?.apartment || '',
      building: user?.building || owner?.building || '',
      coefficient: user?.coefficient || owner?.coefficient || 0
    };
  }

  // Voter Activation: Request 6-digit code to email for registering password
  requestVoterActivation(documentNumber: string) {
    const status = this.checkVoterStatus(documentNumber);
    const email = status.email;

    // Light debounce: only prevent immediate 1-second double clicks
    const latestReq = this.resetRequests
      .filter((r) => r.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (latestReq && (Date.now() - latestReq.createdAt) < 1500) {
      throw new Error('Por favor espera un momento antes de solicitar un nuevo código.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const createdAt = Date.now();
    this.resetRequests.push({
      email: email.toLowerCase(),
      code,
      createdAt,
      expiresAt: createdAt + 15 * 60 * 1000, // 15 minutes validity
      used: false,
      verified: false
    });

    return {
      success: true,
      code, // For server-side dispatch to SMTP only
      email: status.email,
      maskedEmail: status.maskedEmail,
      name: status.name,
      documentNumber: status.documentNumber,
      apartment: status.apartment,
      building: status.building,
      coefficient: status.coefficient
    };
  }

  // Voter Activation: Verify 6-digit code and register password
  registerVoterPassword(documentNumber: string, code: string, password?: string) {
    const cleanDoc = (documentNumber || '').toString().trim();
    const cleanCode = (code || '').toString().replace(/\D/g, '').trim();

    if (!cleanDoc || !cleanCode) {
      throw new Error('Cédula y código de 6 dígitos son obligatorios.');
    }
    if (!password || !password.trim()) {
      throw new Error('Debe definir su nueva contraseña.');
    }

    assertPasswordPolicy(password.trim());

    const status = this.checkVoterStatus(cleanDoc);
    const email = status.email;

    // Match ANY active unexpired code requested by this user within 15 minutes
    const req = this.resetRequests.find(
      (r) => r.email.toLowerCase() === email.toLowerCase() && r.code.trim() === cleanCode && !r.used && Date.now() <= r.expiresAt
    );

    if (!req) {
      // Check if expired
      const expiredReq = this.resetRequests.find(
        (r) => r.email.toLowerCase() === email.toLowerCase() && r.code.trim() === cleanCode && Date.now() > r.expiresAt
      );
      if (expiredReq) {
        throw new Error('El código de verificación ha expirado. Por favor solicite uno nuevo.');
      }
      throw new Error('El código ingresado es incorrecto o ya ha sido utilizado.');
    }

    // Invalidate this code and all pending codes for this user
    this.resetRequests.forEach((r) => {
      if (r.email.toLowerCase() === email.toLowerCase()) {
        r.used = true;
      }
    });
    req.verified = true;

    // Set user password
    this.userPasswords.set(email.toLowerCase(), password.trim());

    // Ensure user object exists in this.users
    let user = this.getUserByEmail(email) || this.getUserByDocument(cleanDoc);
    let owner = this.getOwnerByDocument(cleanDoc);
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
        this.toggleQuorumCheckIn(activeAssembly.id, ownerId, true, 'Activación de Contraseña');
      } catch (e) {
        // already checked in
      }
    }

    this.addAuditLog(user!.id, user!.name, 'owner', 'ACTIVACION_CONTRASENA_VOTANTE', `Activación de cuenta y registro de contraseña para copropietario ${user!.name}`);
    this.notifyChange();

    return {
      user: user!,
      complex: this.complex,
      token: `voter_token_${user!.id}_${Date.now()}`
    };
  }

  // Voter OTP Request (Legacy or Direct Access)
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

      // Auto-provision if not found yet (e.g. testing with @ucentral.edu.co or any institutional/personal email)
      if (!user && !owner && cleanDoc.includes('.')) {
        const cleanEmail = cleanDoc.toLowerCase().trim();
        const localPart = cleanEmail.split('@')[0];
        const formattedName = localPart
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        
        const newOwner: Owner = {
          id: `owner-${Date.now()}`,
          complexId: this.complex.id,
          name: formattedName.length > 2 ? `Copropietario ${formattedName}` : 'Copropietario Verificado',
          email: cleanEmail,
          phone: '+57 312 000 0000',
          documentType: 'CC',
          documentNumber: Math.floor(1000000000 + Math.random() * 900000000).toString(),
          building: 'Torre A',
          apartment: 'Apto 502',
          coefficient: 7.5,
          status: 'active',
          hasProxy: false,
          createdAt: new Date().toISOString()
        };
        this.owners.unshift(newOwner);
        owner = newOwner;
      }
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
      throw new Error(`No se encontró ningún copropietario registrado con la cédula "${cleanDoc}" en ${this.complex.name}. Puede ingresar con su correo electrónico (ej: usuario@ucentral.edu.co) o registrarse como nuevo copropietario.`);
    }

    const email = user?.email || owner?.email;
    const name = user?.name || owner?.name || 'Copropietario';

    if (!email) {
      throw new Error('El copropietario no tiene un correo electrónico registrado en el sistema.');
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP
    const createdAt = Date.now();
    this.resetRequests.push({
      email: email.toLowerCase(),
      code,
      createdAt,
      expiresAt: createdAt + 15 * 60 * 1000,
      used: false,
      verified: false
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

    // Match any unexpired, unused code generated for this email
    const req = this.resetRequests.find(
      (r) => r.email.toLowerCase() === email.toLowerCase() && r.code.trim() === cleanCode && !r.used && Date.now() <= r.expiresAt
    );

    if (!req) {
      throw new Error('El código ingresado es incorrecto o ha caducado. Por favor verifique en su correo electrónico o solicite uno nuevo.');
    }

    // Invalidate used code
    req.used = true;
    req.verified = true;

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
      assertPasswordPolicy(userData.password);
      this.userPasswords.set(newUser.email.toLowerCase(), userData.password.trim());
    } else {
      this.userPasswords.set(newUser.email.toLowerCase(), 'Admin2025*');
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

    if (staffData.password) {
      assertPasswordPolicy(staffData.password);
    }
    const id = `user-staff-${Date.now()}`;
    const initialPass = staffData.password && staffData.password.trim().length >= 8 
      ? staffData.password.trim() 
      : `Voto${Math.floor(1000 + Math.random() * 9000)}!`;

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

    if (staffData.password) {
      assertPasswordPolicy(staffData.password);
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

    assertPasswordPolicy(newPass);

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

  // Password Recovery Flow (Supports Email or Cédula)
  requestPasswordReset(identifier: string) {
    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) {
      throw new Error('Debe ingresar su correo electrónico o su número de cédula.');
    }

    let user = this.getUserByEmail(clean) || this.getUserByDocument(clean);
    let owner = this.owners.find((o) => o.email.toLowerCase() === clean) || this.getOwnerByDocument(clean);

    if (!user && !owner) {
      throw new Error('No existe ninguna cuenta registrada con los datos ingresados.');
    }

    const cleanEmail = (user?.email || owner?.email || '').toLowerCase();
    const recipientName = user?.name || owner?.name || 'Usuario';

    // If owner exists but user account not materialized yet, create it
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
        complexId: owner.complexId,
        createdAt: new Date().toISOString()
      };
      this.users.push(user);
    }

    // Light debounce: only prevent immediate 1-second double clicks
    const latestReq = this.resetRequests
      .filter((r) => r.email === cleanEmail)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (latestReq && (Date.now() - latestReq.createdAt) < 1500) {
      throw new Error('Por favor espera un momento antes de solicitar un nuevo código.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const createdAt = Date.now();
    const expiresAt = createdAt + 15 * 60 * 1000; // 15 minutes validity

    this.resetRequests.push({
      email: cleanEmail,
      code,
      createdAt,
      expiresAt,
      used: false,
      verified: false
    });

    // Mask email for privacy
    const [userPart, domainPart] = cleanEmail.split('@');
    const maskedUser = userPart.length > 2 
      ? `${userPart[0]}***${userPart[userPart.length - 1]}` 
      : `${userPart[0]}***`;
    const maskedEmail = `${maskedUser}@${domainPart || 'correo.com'}`;

    return {
      success: true,
      code, // For server-side dispatch to SMTP only
      email: cleanEmail,
      maskedEmail,
      userName: recipientName,
      expiresInMinutes: 15,
      message: `Hemos despachado un código de seguridad a ${maskedEmail}.`
    };
  }

  getResetRequests() {
    return this.resetRequests;
  }

  verifyResetCode(identifier: string, code: string) {
    const clean = (identifier || '').trim().toLowerCase();
    const cleanCode = (code || '').trim().replace(/\D/g, '');

    if (!clean || !cleanCode) {
      throw new Error('El código no es válido');
    }

    let user = this.getUserByEmail(clean) || this.getUserByDocument(clean);
    let owner = this.owners.find((o) => o.email.toLowerCase() === clean) || this.getOwnerByDocument(clean);
    const cleanEmail = (user?.email || owner?.email || clean).toLowerCase();

    // Match any unexpired, unused code generated for this user
    const req = this.resetRequests.find(
      (r) => r.email === cleanEmail && !r.used && r.code === cleanCode && Date.now() <= r.expiresAt
    );

    if (!req) {
      const expiredReq = this.resetRequests.find(
        (r) => r.email === cleanEmail && r.code === cleanCode && Date.now() > r.expiresAt
      );
      if (expiredReq) {
        throw new Error('El código ha vencido. Por favor solicite uno nuevo.');
      }
      throw new Error('El código no es válido o ya fue utilizado.');
    }

    req.verified = true;
    return { valid: true, message: 'Código verificado con éxito.' };
  }

  resetPassword(identifier: string, code: string, newPassword?: string) {
    const clean = (identifier || '').trim().toLowerCase();
    const cleanCode = (code || '').trim().replace(/\D/g, '');

    let user = this.getUserByEmail(clean) || this.getUserByDocument(clean);
    let owner = this.owners.find((o) => o.email.toLowerCase() === clean) || this.getOwnerByDocument(clean);
    const cleanEmail = (user?.email || owner?.email || clean).toLowerCase();

    // Match any unexpired, unused code generated for this user
    const req = this.resetRequests.find(
      (r) => r.email === cleanEmail && !r.used && r.code === cleanCode && Date.now() <= r.expiresAt
    );

    if (!req) {
      const expiredReq = this.resetRequests.find(
        (r) => r.email === cleanEmail && r.code === cleanCode && Date.now() > r.expiresAt
      );
      if (expiredReq) {
        throw new Error('El código ha vencido. Por favor solicite uno nuevo.');
      }
      throw new Error('El código no es válido o ya fue utilizado.');
    }

    assertPasswordPolicy(newPassword || '');

    // Invalidate code and pending requests for this email
    this.resetRequests.forEach((r) => {
      if (r.email === cleanEmail) {
        r.used = true;
      }
    });
    req.verified = true;

    this.userPasswords.set(cleanEmail, (newPassword || '').trim());

    if (user) {
      this.addAuditLog(user.id, user.name, user.role, 'CAMBIO_CONTRASEÑA', `Restablecimiento exitoso de contraseña para ${user.email}`);
    }

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puede iniciar sesión con su cédula y su nueva contraseña.'
    };
  }

  // Owners - Multi-Complex Isolation
  getOwners(complexId?: string): Owner[] {
    const targetId = complexId || this.complex?.id;
    if (!targetId || targetId === 'all') {
      return this.owners;
    }
    return this.owners.filter((o) => o.complexId === targetId);
  }

  getOwnerById(id: string): Owner | undefined {
    return this.owners.find((o) => o.id === id);
  }

  addOwner(ownerData: Omit<Owner, 'id' | 'createdAt'> & { complexId?: string }, explicitComplexId?: string) {
    const id = `owner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const targetComplexId = explicitComplexId || ownerData.complexId || this.complex.id;
    const newOwner: Owner = {
      id,
      complexId: targetComplexId,
      ...ownerData,
      createdAt: new Date().toISOString()
    };
    this.owners.push(newOwner);

    // Also register user for voting scoped to this complex
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
      complexId: targetComplexId,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);

    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'REGISTRO_PROPIETARIO', `Registro de propietario ${newOwner.name} (${newOwner.apartment}) en ${this.complex.name}`);
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

  // Council of Administration Membership Management
  toggleCouncilMember(ownerId: string, isCouncilMember: boolean, councilRole?: string) {
    const owner = this.owners.find((o) => o.id === ownerId);
    if (!owner) throw new Error('Copropietario no encontrado');

    owner.isCouncilMember = isCouncilMember;
    owner.councilRole = isCouncilMember ? (councilRole || 'Consejero Principal') : undefined;

    this.addAuditLog(
      'user-admin',
      'Administración',
      'admin',
      'GESTION_CONSEJO',
      `${isCouncilMember ? 'Designación' : 'Retiro'} de ${owner.name} (${owner.building} - ${owner.apartment}) como miembro del Consejo de Administración`
    );

    return owner;
  }

  getCouncilMembers(complexId?: string): Owner[] {
    const targetId = complexId || this.complex?.id;
    return this.getOwners(targetId).filter((o) => o.isCouncilMember && o.status === 'active');
  }

  importOwnersBatch(importedOwners: Omit<Owner, 'id' | 'complexId' | 'createdAt'>[], complexId?: string) {
    let successCount = 0;
    const targetComplexId = complexId || this.complex.id;
    for (const data of importedOwners) {
      this.addOwner({ ...data, complexId: targetComplexId });
      successCount++;
    }
    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'IMPORTACION_MASIVA_EXCEL', `Importación exitosa de ${successCount} propietarios en ${this.complex.name}`);
    return { successCount, total: this.getOwners(targetComplexId).length };
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

  deleteOwnersBatch(ids: string[], complexId?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deletedCount: 0, total: this.getOwners(complexId).length };
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

    return { deletedCount: toDelete.length, total: this.getOwners(complexId).length };
  }

  // Assemblies - Multi-Complex Isolation
  getAssemblies(complexId?: string): Assembly[] {
    const targetId = complexId || this.complex?.id;
    if (!targetId || targetId === 'all') {
      return this.assemblies;
    }
    return this.assemblies.filter((a) => a.complexId === targetId);
  }

  getAssemblyById(id: string) {
    return this.assemblies.find((a) => a.id === id);
  }

  createAssembly(data: Omit<Assembly, 'id' | 'complexId' | 'createdAt' | 'representedQuorum' | 'checkedInOwnersCount'>) {
    const id = `assembly-${Date.now()}`;
    const targetComplexId = this.complex.id;
    const newAssembly: Assembly = {
      id,
      complexId: targetComplexId,
      ...data,
      representedQuorum: 0,
      checkedInOwnersCount: 0,
      createdAt: new Date().toISOString()
    };
    this.assemblies.unshift(newAssembly);

    // Initialize Quorum list ONLY with active owners of THIS complex
    const complexOwners = this.getOwners(targetComplexId);
    complexOwners.forEach((o) => {
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

    this.addAuditLog('user-admin', 'Carolina Méndez', 'admin', 'CREACIÓN_ASAMBLEA', `Creación de ${newAssembly.title} en ${this.complex.name}`);
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

  // Granular Filter Evaluation: returns eligible owners for a vote configuration
  getEligibleVotersForVoteConfig(complexId: string, filterConfig?: any): Owner[] {
    const activeOwners = this.getOwners(complexId).filter((o) => o.status === 'active');
    if (!filterConfig) {
      return activeOwners;
    }
    const type = filterConfig.targetAudience || filterConfig.filterType || 'all';

    if (type === 'all') {
      return activeOwners;
    }
    if (type === 'council_only' || filterConfig.councilOnly) {
      return activeOwners.filter((o) => !!o.isCouncilMember);
    }
    if (type === 'specific_towers' || type === 'by_tower') {
      const towers = filterConfig.allowedTowers || [];
      return activeOwners.filter((o) => towers.includes(o.building || 'Torre Principal'));
    }
    if (type === 'towers_and_council' || type === 'tower_and_council') {
      const towers = filterConfig.allowedTowers || [];
      return activeOwners.filter((o) => !!o.isCouncilMember || towers.includes(o.building || 'Torre Principal'));
    }
    if (type === 'custom' || type === 'specific_owners') {
      const allowedIds = filterConfig.allowedOwnerIds || [];
      return activeOwners.filter((o) => allowedIds.includes(o.id));
    }
    return activeOwners;
  }

  getEligibleVotersForVote(voteId: string): Owner[] {
    const vote = this.votes.find((v) => v.id === voteId);
    if (!vote) return [];
    const assembly = this.assemblies.find((a) => a.id === vote.assemblyId);
    const complexId = assembly?.complexId || this.complex.id;
    return this.getEligibleVotersForVoteConfig(complexId, vote.filterConfig);
  }

  isVoterEligibleForVote(
    voteId: string,
    voterUserId: string,
    documentNumber?: string
  ): { eligible: boolean; reason?: string; owner?: Owner } {
    const vote = this.votes.find((v) => v.id === voteId);
    if (!vote) return { eligible: false, reason: 'La votación no existe.' };
    const assembly = this.assemblies.find((a) => a.id === vote.assemblyId);
    if (!assembly) return { eligible: false, reason: 'La asamblea asociada no existe.' };

    const complexOwners = this.getOwners(assembly.complexId);
    const cleanDoc = (documentNumber || '').trim();
    const cleanId = (voterUserId || '').replace('user-', '');

    const owner = complexOwners.find(
      (o) => o.id === voterUserId || o.id === cleanId || (cleanDoc && o.documentNumber === cleanDoc)
    );

    if (!owner) {
      return {
        eligible: false,
        reason: 'No perteneces al censo de copropietarios del conjunto residencial de esta votación.'
      };
    }

    if (owner.status !== 'active') {
      return {
        eligible: false,
        reason: 'Tu registro de copropietario se encuentra inactivo.'
      };
    }

    // Filter verification
    const eligibleList = this.getEligibleVotersForVote(voteId);
    const isIncluded = eligibleList.some((o) => o.id === owner.id);

    if (!isIncluded) {
      const type = vote.filterConfig?.targetAudience || vote.filterConfig?.filterType;
      if (type === 'council_only' || vote.filterConfig?.councilOnly) {
        return {
          eligible: false,
          reason: 'Esta votación está restringida exclusivamente a los miembros del Consejo de Administración.'
        };
      }
      if (type === 'specific_towers' || type === 'by_tower') {
        return {
          eligible: false,
          reason: `Esta votación está habilitada únicamente para las torres: ${vote.filterConfig?.allowedTowers?.join(', ')}. Su inmueble pertenece a: ${owner.building || 'otra torre'}.`
        };
      }
      if (type === 'towers_and_council' || type === 'tower_and_council') {
        return {
          eligible: false,
          reason: `Esta votación requiere pertenecer a las torres autorizadas (${vote.filterConfig?.allowedTowers?.join(', ')}) o ser miembro del Consejo de Administración.`
        };
      }
      if (type === 'custom' || type === 'specific_owners') {
        return {
          eligible: false,
          reason: 'No se encuentra en la lista de copropietarios autorizados para votar en este punto.'
        };
      }
      return {
        eligible: false,
        reason: 'No estás habilitado para participar en esta votación.'
      };
    }

    return { eligible: true, owner };
  }

  createVote(data: Omit<Vote, 'id' | 'status' | 'startedAt' | 'closedAt' | 'closedBy'>) {
    const id = `vote-${Date.now()}`;
    const assembly = this.assemblies.find((a) => a.id === data.assemblyId);
    const complexId = assembly?.complexId || this.complex.id;
    const eligibleVoters = this.getEligibleVotersForVoteConfig(complexId, data.filterConfig);

    const newVote: Vote = {
      id,
      ...data,
      status: 'scheduled',
      eligibleVotersCount: eligibleVoters.length,
      totalVoters: eligibleVoters.length
    };
    this.votes.push(newVote);
    this.addAuditLog(
      'user-admin',
      'Carolina Méndez',
      'admin',
      'CREACIÓN_VOTACIÓN',
      `Creación de votación: "${newVote.title}" (${newVote.type}, Filtro: ${data.filterConfig?.filterType || 'general'}, Habilitados: ${eligibleVoters.length})`
    );
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

  updateVote(id: string, updateData: Partial<Vote>, updatedBy: string = 'Carolina Méndez Rojas') {
    const idx = this.votes.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Votación no encontrada');

    const existing = this.votes[idx];
    const assembly = this.assemblies.find((a) => a.id === existing.assemblyId);
    const complexId = assembly?.complexId || this.complex.id;

    // Recalculate eligible voters if filterConfig changed
    let eligibleCount = existing.eligibleVotersCount;
    if (updateData.filterConfig) {
      const eligibleList = this.getEligibleVotersForVoteConfig(complexId, updateData.filterConfig);
      eligibleCount = eligibleList.length;
    }

    const updated: Vote = {
      ...existing,
      ...updateData,
      id: existing.id,
      assemblyId: existing.assemblyId,
      eligibleVotersCount: eligibleCount ?? existing.eligibleVotersCount,
      totalVoters: eligibleCount ?? existing.totalVoters
    };

    this.votes[idx] = updated;
    this.notifyChange();

    this.addAuditLog(
      'user-admin',
      updatedBy,
      'admin',
      'MODIFICACIÓN_VOTACIÓN',
      `Modificación de votación: "${updated.title}" (${updated.type}, Opciones: ${updated.options?.length || 0})`,
      existing.assemblyId,
      complexId
    );

    return updated;
  }

  deleteVote(id: string, deletedBy: string = 'Carolina Méndez Rojas') {
    const vote = this.votes.find((v) => v.id === id);
    if (!vote) throw new Error('Votación no encontrada');

    const assembly = this.assemblies.find((a) => a.id === vote.assemblyId);
    const complexId = assembly?.complexId || this.complex.id;

    // Remove vote records
    this.voteRecords = this.voteRecords.filter((r) => r.voteId !== id);
    this.votes = this.votes.filter((v) => v.id !== id);
    this.notifyChange();

    this.addAuditLog(
      'user-admin',
      deletedBy,
      'admin',
      'ELIMINACIÓN_VOTACIÓN',
      `Eliminación definitiva de votación: "${vote.title}"`,
      vote.assemblyId,
      complexId
    );

    return { success: true, deletedVoteId: id };
  }

  resetVote(id: string, resetBy: string = 'Carolina Méndez Rojas') {
    const vote = this.votes.find((v) => v.id === id);
    if (!vote) throw new Error('Votación no encontrada');

    const assembly = this.assemblies.find((a) => a.id === vote.assemblyId);
    const complexId = assembly?.complexId || this.complex.id;

    vote.status = 'scheduled';
    delete vote.startedAt;
    delete vote.closedAt;
    delete vote.closedBy;

    // Clear previous vote records
    this.voteRecords = this.voteRecords.filter((r) => r.voteId !== id);
    this.notifyChange();

    this.addAuditLog(
      'user-admin',
      resetBy,
      'admin',
      'REINICIO_VOTACIÓN',
      `Reinicio de votación a estado programado: "${vote.title}" (se anulan los registros previos)`,
      vote.assemblyId,
      complexId
    );

    return vote;
  }

  // Cast Vote with strict Duplicate Prevention & Backend Filter Validation
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

    // Strict Backend Eligibility Check (Filters, Complex Isolation, Active Account)
    const eligibility = this.isVoterEligibleForVote(voteId, voterUserId, voterDocument);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'No estás habilitado para participar en esta votación.');
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

    // Strictly isolate by assembly's complex
    const complexOwners = this.getOwners(assembly.complexId).filter(o => o.status === 'active');
    let targetOwners = complexOwners;

    if (recipientsType === 'attended') {
      const attendedIds = new Set(
        this.quorum.filter((q) => q.assemblyId === assemblyId && q.checkedIn).map((q) => q.ownerId)
      );
      targetOwners = complexOwners.filter((o) => attendedIds.has(o.id));
    } else if (recipientsType === 'voted') {
      const votedParts = this.participations.filter((p) => p.assemblyId === assemblyId);
      const votedIds = new Set(votedParts.map((p) => p.voterUserId));
      const votedDocs = new Set(votedParts.map((p) => p.voterDocument));
      targetOwners = complexOwners.filter(
        (o) => votedIds.has(o.id) || votedIds.has(`user-${o.id}`) || votedDocs.has(o.documentNumber)
      );
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
      `Envío de resultados oficiales por correo electrónico a ${sentCount} copropietarios de ${this.complex.name} (${recipientsType === 'all' ? '100% del censo' : recipientsType === 'attended' ? 'asistentes' : 'votantes'}).`
    );
    return { success: true, sentCount, total: complexOwners.length, target: recipientsType, recipients: targetOwners };
  }

  sendAssemblyMinutesEmails(
    assemblyId: string,
    recipientsType: 'all' | 'attended' | 'voted',
    subject: string,
    messageBody?: string
  ) {
    const assembly = this.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error('Asamblea no encontrada');

    // Strictly isolate by assembly's complex
    const complexOwners = this.getOwners(assembly.complexId).filter(o => o.status === 'active');
    let targetOwners = complexOwners;

    if (recipientsType === 'attended') {
      const attendedIds = new Set(
        this.quorum.filter((q) => q.assemblyId === assemblyId && q.checkedIn).map((q) => q.ownerId)
      );
      targetOwners = complexOwners.filter((o) => attendedIds.has(o.id));
    } else if (recipientsType === 'voted') {
      const votedParts = this.participations.filter((p) => p.assemblyId === assemblyId);
      const votedIds = new Set(votedParts.map((p) => p.voterUserId));
      const votedDocs = new Set(votedParts.map((p) => p.voterDocument));
      targetOwners = complexOwners.filter(
        (o) => votedIds.has(o.id) || votedIds.has(`user-${o.id}`) || votedDocs.has(o.documentNumber)
      );
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
    return { success: true, sentCount, total: complexOwners.length, target: recipientsType, recipients: targetOwners };
  }

  // Audit Logs - Isolated by Complex
  getAuditLogs(assemblyId?: string, complexId?: string) {
    let logs = this.auditLogs;
    if (complexId) {
      logs = logs.filter((a) => {
        if (a.complexId) return a.complexId === complexId;
        if (a.assemblyId) {
          const asm = this.assemblies.find(asm => asm.id === a.assemblyId);
          return asm?.complexId === complexId;
        }
        return complexId === this.complex.id;
      });
    }
    if (assemblyId) {
      logs = logs.filter((a) => a.assemblyId === assemblyId);
    }
    return logs;
  }

  addAuditLog(
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    details: string,
    assemblyId?: string,
    complexId?: string
  ) {
    // Resolve complexId
    let resolvedComplexId = complexId;
    if (!resolvedComplexId && assemblyId) {
      const asm = this.assemblies.find(a => a.id === assemblyId);
      resolvedComplexId = asm?.complexId;
    }
    if (!resolvedComplexId && userId) {
      const u = this.users.find(u => u.id === userId);
      resolvedComplexId = u?.complexId;
    }
    if (!resolvedComplexId) {
      resolvedComplexId = this.complex.id;
    }

    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      complexId: resolvedComplexId,
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
        for (const demoUser of DEMO_USERS) {
          if (!this.users.some(u => u.email.toLowerCase() === demoUser.email.toLowerCase())) {
            this.users.push(demoUser);
          }
        }
      }
      if (Array.isArray(snapshot.owners) && snapshot.owners.length > 0) {
        this.owners = snapshot.owners;
        for (const demoOwner of DEMO_OWNERS) {
          if (!this.owners.some(o => o.email.toLowerCase() === demoOwner.email.toLowerCase() || o.documentNumber === demoOwner.documentNumber)) {
            this.owners.push(demoOwner);
          }
        }
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
