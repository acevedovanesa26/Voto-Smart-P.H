import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { store } from './src/services/store';
import { dispatchEmail, getEmailHistory, getLatestEmailFor } from './server/emailService';
import { initDb, getDbStatus, saveStateNow } from './server/db';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// 1. Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VotoSmart API', timestamp: new Date().toISOString() });
});

// Database Status & Manual Sync
app.get('/api/db/status', (req, res) => {
  res.json(getDbStatus());
});

app.post('/api/db/sync', async (req, res) => {
  try {
    const success = await saveStateNow();
    res.json({ success, message: success ? 'Estado sincronizado con PostgreSQL' : 'Modo memoria (sin DATABASE_URL activa)' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Auth
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido' });
    }

    const user = store.validateUserCredentials(email, password);
    const complex = store.getComplex();
    res.json({
      user,
      token: `jwt_token_simulated_${user.id}_${Date.now()}`,
      complex
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Error de autenticación' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, role, documentType, documentNumber, apartment, building, coefficient, phone } = req.body;
    if (!name || !email || !role || !documentNumber) {
      return res.status(400).json({ error: 'Nombre, correo, documento y rol son campos obligatorios.' });
    }
    const newUser = store.registerUser(req.body);
    const complex = store.getComplex();
    res.status(201).json({
      user: newUser,
      token: `jwt_token_simulated_${newUser.id}_${Date.now()}`,
      complex
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
    }
    const result = store.requestPasswordReset(email);
    
    // Dispatch real/sandbox email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f766e; margin: 0; font-size: 24px;">VotoSmart Colombia</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Plataforma de Asambleas y Votaciones Digitales PH</p>
        </div>
        <div style="background: #f0fdfa; border: 1px solid #99f6e4; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #134e4a; font-weight: bold;">Código de Recuperación de Contraseña</p>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f766e; font-family: monospace; padding: 12px; background: #ffffff; border-radius: 8px; display: inline-block; border: 2px dashed #0d9488;">
            ${result.code}
          </div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #0f766e;">Este código expira en 15 minutos.</p>
        </div>
        <p style="font-size: 13px; color: #334155; line-height: 1.6;">
          Estimado(a) <strong>${result.userName || 'Usuario'}</strong>,<br>
          Has solicitado restablecer tu contraseña en VotoSmart para el conjunto <strong>${store.getComplex().name}</strong>.
          Ingresa este código de 6 dígitos en la aplicación para crear tu nueva contraseña.
        </p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          Si no solicitaste este cambio, puedes ignorar este mensaje con total seguridad. Conforme a Ley 675 de 2001.
        </div>
      </div>
    `;

    const dispatchRes = await dispatchEmail({
      to: result.email,
      toName: result.userName || 'Usuario',
      subject: `Código de Recuperación VotoSmart: ${result.code}`,
      type: 'password_reset',
      code: result.code,
      html: emailHtml
    });

    res.json({
      ...result,
      deliveryMode: dispatchRes.deliveryMode,
      verificationCode: result.code // provided for easy validation/preview if needed
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/verify-reset-code', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Correo y código de verificación son requeridos.' });
    }
    const result = store.verifyResetCode(email, code);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Correo, código y nueva contraseña son requeridos.' });
    }
    const result = store.resetPassword(email, code, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Voter OTP Flow (Cédula + Código al Correo)
app.post('/api/auth/voter-request-otp', async (req, res) => {
  try {
    const { documentNumber } = req.body;
    if (!documentNumber) {
      return res.status(400).json({ error: 'El número de cédula o documento es requerido' });
    }
    const result = store.requestVoterOtp(documentNumber);

    // Retrieve code from store resetRequests
    const reqItem = store.getResetRequests().find(r => r.email.toLowerCase() === result.email.toLowerCase());
    const otpCode = reqItem?.code || '123456';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f766e; margin: 0; font-size: 24px;">VotoSmart Colombia</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Ingreso Seguro a Asamblea y Votaciones PH</p>
        </div>
        <div style="background: #f0fdfa; border: 1px solid #99f6e4; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #134e4a; font-weight: bold;">Tu Código de Acceso a Votación</p>
          <div style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #0f766e; font-family: monospace; padding: 12px; background: #ffffff; border-radius: 8px; display: inline-block; border: 2px dashed #0d9488;">
            ${otpCode}
          </div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #0f766e;">Válido para la asamblea actual en ${store.getComplex().name}</p>
        </div>
        <p style="font-size: 13px; color: #334155; line-height: 1.6;">
          Estimado(a) copropietario(a) <strong>${result.name}</strong> (${result.building} ${result.apartment}),<br>
          Se ha solicitado el acceso para votación digital con tu documento <strong>${result.documentNumber}</strong>.
          Ingresa este código de 6 dígitos en la pantalla para ingresar a la sala de votación.
        </p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          Seguridad criptográfica conforme a Ley 675 de 2001 de Propiedad Horizontal en Colombia.
        </div>
      </div>
    `;

    const dispatchRes = await dispatchEmail({
      to: result.email,
      toName: result.name,
      subject: `Código de Acceso a Votación VotoSmart: ${otpCode}`,
      type: 'voter_otp',
      code: otpCode,
      html: emailHtml
    });

    res.json({
      ...result,
      deliveryMode: dispatchRes.deliveryMode,
      otpCode
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/voter-verify-otp', (req, res) => {
  try {
    const { documentNumber, code } = req.body;
    if (!documentNumber || !code) {
      return res.status(400).json({ error: 'Cédula y código son requeridos' });
    }
    const result = store.verifyVoterOtp(documentNumber, code);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Staff & Board Management (Exclusivo Administrador: Presidente, Secretaria, Contador, etc.)
app.get('/api/staff', (req, res) => {
  res.json(store.getStaffUsers());
});

app.post('/api/staff', async (req, res) => {
  try {
    const { name, email, role, phone, documentType, documentNumber, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Nombre, correo electrónico y rol son obligatorios' });
    }
    const created = store.createStaffUser(req.body);

    const roleNameMap: Record<string, string> = {
      president: 'Presidente de Asamblea',
      secretary: 'Secretaria de Asamblea',
      accountant: 'Contador / Revisor Fiscal',
      admin: 'Administrador Delegado',
      fiscal_auditor: 'Revisor Fiscal'
    };

    // Dispatch welcome email with credentials
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f766e; margin: 0; font-size: 24px;">VotoSmart Colombia</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Credenciales de Acceso a Mesa Directiva</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 12px; font-size: 15px; color: #0f172a; font-weight: bold;">
            Bienvenido(a), ${created.user.name}
          </p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">
            Has sido designado(a) como <strong>${roleNameMap[created.user.role] || created.user.role}</strong> para <strong>${store.getComplex().name}</strong>.
          </p>
          <div style="margin: 16px 0; padding: 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #334155;"><strong>Usuario / Correo:</strong> ${created.user.email}</p>
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Contraseña Asignada:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f766e;">${created.initialPassword}</span></p>
          </div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
            Ingresa a la plataforma seleccionando la opción <strong>"Soy Administrador / Mesa"</strong> con tu correo y contraseña.
          </p>
        </div>
      </div>
    `;

    await dispatchEmail({
      to: created.user.email,
      toName: created.user.name,
      subject: `Credenciales de Acceso VotoSmart: ${roleNameMap[created.user.role] || created.user.role}`,
      type: 'staff_credentials',
      html: welcomeHtml
    });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/staff/:id', (req, res) => {
  try {
    const updated = store.updateStaffUser(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/staff/:id', (req, res) => {
  try {
    const result = store.deleteStaffUser(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Emails Dispatch Center / Outbox
app.get('/api/emails', (req, res) => {
  const history = getEmailHistory();
  res.json(history);
});

app.post('/api/emails/test-send', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Dirección de correo requerida' });
    }
    const result = await dispatchEmail({
      to,
      toName: 'Destinatario de Prueba',
      subject: subject || 'Prueba de Envío de Correo VotoSmart',
      type: 'invitacion',
      html: `<div style="padding:20px; font-family:Arial,sans-serif;"><h3>Prueba de Envío VotoSmart</h3><p>${message || 'El servicio de mensajería electrónica está funcionando correctamente.'}</p><p>Conjunto: <strong>${store.getComplex().name}</strong></p></div>`
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Residential Complexes
app.get('/api/complexes', (req, res) => {
  res.json(store.getComplexes());
});

app.post('/api/complexes/switch', (req, res) => {
  try {
    const { complexId } = req.body;
    if (!complexId) return res.status(400).json({ error: 'ID del conjunto es requerido' });
    const switched = store.switchComplex(complexId);
    res.json(switched);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/complexes', (req, res) => {
  try {
    const newComplex = store.addComplex(req.body);
    res.status(201).json(newComplex);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/complex', (req, res) => {
  res.json(store.getComplex());
});

app.put('/api/complex', (req, res) => {
  try {
    const updated = store.updateComplex(req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Owners Directory
app.get('/api/owners', (req, res) => {
  res.json(store.getOwners());
});

app.post('/api/owners', (req, res) => {
  try {
    const { name, documentNumber, email, building, apartment, coefficient } = req.body;
    if (!name || !documentNumber || !email || !building || !apartment || coefficient === undefined) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
    }
    const newOwner = store.addOwner(req.body);
    res.status(201).json(newOwner);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/owners/:id', (req, res) => {
  try {
    const updated = store.updateOwner(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Propietario no encontrado' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/owners/batch', (req, res) => {
  try {
    const { owners } = req.body;
    if (!Array.isArray(owners) || owners.length === 0) {
      return res.status(400).json({ error: 'Lista de propietarios inválida para importación' });
    }
    const result = store.importOwnersBatch(owners);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Assemblies
app.get('/api/assemblies', (req, res) => {
  res.json(store.getAssemblies());
});

app.get('/api/assemblies/:id', (req, res) => {
  const assembly = store.getAssemblyById(req.params.id);
  if (!assembly) return res.status(404).json({ error: 'Asamblea no encontrada' });
  res.json(assembly);
});

app.post('/api/assemblies', (req, res) => {
  try {
    const { title, type, date, time, location, modality } = req.body;
    if (!title || !type || !date || !time || !location) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para la creación de la asamblea' });
    }
    const newAssembly = store.createAssembly(req.body);
    res.status(201).json(newAssembly);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/assemblies/:id', (req, res) => {
  try {
    const updated = store.updateAssembly(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Asamblea no encontrada' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 6. Quorum & Attendance
app.get('/api/assemblies/:id/quorum', (req, res) => {
  res.json(store.getQuorumByAssembly(req.params.id));
});

app.post('/api/assemblies/:id/quorum/check-in', (req, res) => {
  try {
    const { ownerId, checkedIn, verifiedBy } = req.body;
    const result = store.toggleQuorumCheckIn(req.params.id, ownerId, checkedIn, verifiedBy);
    if (!result) return res.status(404).json({ error: 'Registro de quórum no encontrado' });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 7. Documents
app.get('/api/assemblies/:id/documents', (req, res) => {
  res.json(store.getDocumentsByAssembly(req.params.id));
});

app.post('/api/assemblies/:id/documents', (req, res) => {
  try {
    const { name, type, fileUrl, fileSize, uploadedBy } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo de documento requeridos' });
    const doc = store.addDocument({
      assemblyId: req.params.id,
      name,
      type,
      fileUrl: fileUrl || '#',
      fileSize: fileSize || '1.2 MB',
      uploadedBy: uploadedBy || 'Administrador'
    });
    res.status(201).json(doc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/assemblies/:id/documents/:docId', (req, res) => {
  const success = store.deleteDocument(req.params.docId);
  res.json({ success });
});

// 8. Votes & Elections
app.get('/api/assemblies/:id/votes', (req, res) => {
  res.json(store.getVotesByAssembly(req.params.id));
});

app.post('/api/assemblies/:id/votes', (req, res) => {
  try {
    const { title, question, type, options } = req.body;
    if (!title || !question || !type || !options || options.length < 2) {
      return res.status(400).json({ error: 'Debe ingresar título, pregunta y al menos dos opciones' });
    }
    const newVote = store.createVote({
      assemblyId: req.params.id,
      ...req.body
    });
    res.status(201).json(newVote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/votes/:id', (req, res) => {
  const vote = store.getVoteById(req.params.id);
  if (!vote) return res.status(404).json({ error: 'Votación no encontrada' });
  res.json(vote);
});

app.post('/api/votes/:id/start', (req, res) => {
  try {
    const { startedBy } = req.body;
    const vote = store.startVote(req.params.id, startedBy);
    res.json(vote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/votes/:id/close', (req, res) => {
  try {
    const { closedBy } = req.body;
    const result = store.closeVote(req.params.id, closedBy);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cast Vote
app.post('/api/votes/:id/cast', (req, res) => {
  try {
    const { voterUserId, voterName, voterApartment, voterDocument, voterCoefficient, selectedOptionIds } = req.body;

    if (!voterUserId || !voterName || !voterApartment || voterCoefficient === undefined) {
      return res.status(400).json({ error: 'Información del votante incompleta.' });
    }

    const receipt = store.castVote(
      req.params.id,
      voterUserId,
      voterName,
      voterApartment,
      voterDocument || 'N/A',
      voterCoefficient,
      selectedOptionIds
    );

    res.json(receipt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/votes/:id/results', (req, res) => {
  try {
    const results = store.calculateVoteResults(req.params.id);
    res.json(results);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/votes/:id/has-voted', (req, res) => {
  const { userId, documentNumber, apartment } = req.query;
  const hasVoted = store.hasUserVoted(
    req.params.id,
    userId as string,
    documentNumber as string,
    apartment as string
  );
  res.json({ hasVoted });
});

// 9. Notes (Bitácora de Asamblea)
app.get('/api/assemblies/:id/notes', (req, res) => {
  res.json(store.getNotesByAssembly(req.params.id));
});

app.post('/api/assemblies/:id/notes', (req, res) => {
  try {
    const { content, authorName, authorRole, category } = req.body;
    if (!content) return res.status(400).json({ error: 'El contenido de la nota no puede estar vacío' });
    const note = store.addNote({
      assemblyId: req.params.id,
      content,
      authorName: authorName || 'Administrador',
      authorRole: authorRole || 'admin',
      category: category || 'general'
    });
    res.status(201).json(note);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/assemblies/:id/notes/:noteId', (req, res) => {
  const success = store.deleteNote(req.params.noteId);
  res.json({ success });
});

// 10. Minutes (Actas de Asamblea)
app.get('/api/assemblies/:id/minutes', (req, res) => {
  res.json(store.getMinutesByAssembly(req.params.id));
});

app.post('/api/assemblies/:id/minutes', (req, res) => {
  try {
    const minutes = store.saveMinutes({
      assemblyId: req.params.id,
      ...req.body
    });
    res.json(minutes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 11. Emails & Results Dispatching
app.get('/api/assemblies/:id/emails', (req, res) => {
  res.json(store.getEmailLogsByAssembly(req.params.id));
});

app.post('/api/assemblies/:id/send-results', (req, res) => {
  try {
    const { recipientsType, subject, messageBody } = req.body;
    const result = store.sendAssemblyResultsEmails(
      req.params.id,
      recipientsType || 'all',
      subject || 'Resultados Oficiales de la Asamblea',
      messageBody
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/assemblies/:id/send-minutes', (req, res) => {
  try {
    const { recipientsType, subject, messageBody } = req.body;
    const result = store.sendAssemblyMinutesEmails(
      req.params.id,
      recipientsType || 'all',
      subject || 'Acta Oficial Aprobada de la Asamblea',
      messageBody
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 12. Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const { assemblyId } = req.query;
  res.json(store.getAuditLogs(assemblyId as string));
});

// 13. Demo Reset
app.post('/api/demo/reset', (req, res) => {
  store.resetToDemo();
  res.json({ success: true, message: 'Datos demo restaurados con éxito' });
});

// 14. Gemini AI Summarization Endpoint (Server-Side)
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { assemblyTitle, complexName, notes, votesResults } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Fallback deterministic professional summary if API key is not configured
      const fallbackSummary = `En la asamblea "${assemblyTitle}" del ${complexName}, se constató el quórum reglamentario y se trataron los puntos del orden del día. Se registraron intervenciones de los copropietarios sobre el presupuesto y mantenimiento de zonas comunes. Las votaciones culminaron con plena trazabilidad y aprobación mayoritaria conforme a los coeficientes de propiedad horizontal.`;
      return res.json({
        summary: fallbackSummary,
        source: 'local_template'
      });
    }

    const ai = getGeminiClient();
    const prompt = `Actúa como el Secretario Jurídico y Redactor Oficial de Actas de Propiedad Horizontal en Colombia (Ley 675 de 2001).
A partir de la siguiente información registrada en la asamblea "${assemblyTitle}" del conjunto "${complexName}", redacta un RESUMEN EJECUTIVO Y OBJETIVO DE LA ASAMBLEA para ser incorporado formalmente en el Acta Oficial:

Notas e intervenciones registradas:
${JSON.stringify(notes, null, 2)}

Resultados de votaciones:
${JSON.stringify(votesResults, null, 2)}

Requisitos estrictos:
- Lenguaje formal, institucional, claro y estrictamente objetivo.
- No inventar ningún dato que no esté sustentado en la información suministrada.
- Extensión de 2 a 3 párrafos concisos.
- En español.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt
    });

    const summary = response.text || '';
    res.json({
      summary,
      source: 'gemini-3.7-flash'
    });
  } catch (error: any) {
    console.error('Gemini summarize error:', error);
    res.json({
      summary: `Resumen ejecutivo generado: Se desarrolló la asamblea con verificación del quórum reglamentario, deliberación del presupuesto e informes administrativos y registro formal de los sufragios con pleno cumplimiento estatutario.`,
      source: 'fallback'
    });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER BOOTSTRAP
// ----------------------------------------------------

async function startServer() {
  // Initialize Database connection (PostgreSQL if DATABASE_URL is set, otherwise In-Memory fallback)
  await initDb().catch((err) => {
    console.error('Error in initDb:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VotoSmart Server running on http://localhost:${PORT}`);
  });
}

startServer();
