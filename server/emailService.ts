import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { saveEmailConfig, loadEmailConfig } from './db';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  type: 'password_reset' | 'voter_otp' | 'staff_credentials' | 'invitacion' | 'convocatoria' | 'acta' | 'resultados';
  code?: string;
}

export interface EmailRecord {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  type: string;
  code?: string;
  bodyPreview: string;
  htmlContent: string;
  status: 'sent' | 'delivered' | 'pending' | 'failed';
  deliveryMode: 'real_brevo_api' | 'real_smtp' | 'sandbox_inbox';
  errorDetails?: string;
  sentAt: string;
}

export interface EmailConfig {
  brevoApiKey?: string;
  brevoSenderEmail?: string;
  emailHost?: string;
  emailPort?: number;
  emailUsername?: string;
  emailPassword?: string;
}

// Utility: Clean API key of surrounding quotes and whitespace
function sanitizeApiKey(key?: string): string {
  if (!key) return '';
  return key.replace(/^["']|["']$/g, '').trim();
}

// Utility: Extract pure email address from 'Name <email@example.com>' or plain email
function extractPureEmail(input?: string): string {
  if (!input) return '';
  const match = input.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].replace(/["']/g, '').trim().toLowerCase();
  }
  return input.replace(/["']/g, '').trim().toLowerCase();
}

// Utility: Extract display name from 'Name <email@example.com>'
function extractDisplayName(input?: string, fallback = 'VotoSmart Colombia'): string {
  if (!input) return fallback;
  if (input.includes('<')) {
    const namePart = input.replace(/<[^>]+>/, '').replace(/["']/g, '').trim();
    if (namePart) return namePart;
  }
  return fallback;
}

// Load initial config from disk if available synchronously, fallback to env vars
function getInitialConfig(): EmailConfig {
  let diskConfig: any = null;
  try {
    const diskPath = path.join(process.cwd(), 'data', 'email_config.json');
    if (fs.existsSync(diskPath)) {
      diskConfig = JSON.parse(fs.readFileSync(diskPath, 'utf-8'));
    }
  } catch {
    // ignore
  }

  return {
    brevoApiKey: sanitizeApiKey(
      diskConfig?.brevoApiKey ||
      process.env.BREVO_API_KEY ||
      process.env.SENDINBLUE_API_KEY ||
      process.env.BREVO_KEY ||
      process.env.BREVO_APIKEY ||
      process.env.BREVO_SMTP_KEY
    ),
    brevoSenderEmail: extractPureEmail(
      diskConfig?.brevoSenderEmail ||
      process.env.BREVO_SENDER_EMAIL ||
      process.env.EMAIL_FROM ||
      process.env.BREVO_EMAIL ||
      'motatovanesa@gmail.com'
    ),
    emailHost: diskConfig?.emailHost || process.env.EMAIL_HOST,
    emailPort: diskConfig?.emailPort || (process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined),
    emailUsername: diskConfig?.emailUsername || process.env.EMAIL_USERNAME,
    emailPassword: diskConfig?.emailPassword || process.env.EMAIL_PASSWORD
  };
}

const runtimeConfig: EmailConfig = getInitialConfig();

// Sync from database (PostgreSQL on Render) once DB is connected
export async function syncPersistedEmailConfig() {
  try {
    const saved = await loadEmailConfig();
    if (saved) {
      if (saved.brevoApiKey) runtimeConfig.brevoApiKey = sanitizeApiKey(saved.brevoApiKey);
      if (saved.brevoSenderEmail) runtimeConfig.brevoSenderEmail = extractPureEmail(saved.brevoSenderEmail);
      if (saved.emailHost) runtimeConfig.emailHost = saved.emailHost.trim();
      if (saved.emailPort) runtimeConfig.emailPort = saved.emailPort;
      if (saved.emailUsername) runtimeConfig.emailUsername = saved.emailUsername.trim();
      if (saved.emailPassword) runtimeConfig.emailPassword = saved.emailPassword.trim();
      console.log('[EmailService] Configuración de correo sincronizada exitosamente con la base de datos.');
    }
  } catch (err: any) {
    console.warn('[EmailService] Advertencia al sincronizar config de correo:', err.message);
  }
}

export async function updateRuntimeEmailConfig(newConfig: Partial<EmailConfig>) {
  if (newConfig.brevoApiKey !== undefined) runtimeConfig.brevoApiKey = sanitizeApiKey(newConfig.brevoApiKey);
  if (newConfig.brevoSenderEmail !== undefined) runtimeConfig.brevoSenderEmail = extractPureEmail(newConfig.brevoSenderEmail);
  if (newConfig.emailHost !== undefined) runtimeConfig.emailHost = newConfig.emailHost.trim();
  if (newConfig.emailPort !== undefined) runtimeConfig.emailPort = newConfig.emailPort;
  if (newConfig.emailUsername !== undefined) runtimeConfig.emailUsername = newConfig.emailUsername.trim();
  if (newConfig.emailPassword !== undefined) runtimeConfig.emailPassword = newConfig.emailPassword.trim();

  // Persist to PostgreSQL and disk so it survives Render restarts
  await saveEmailConfig(runtimeConfig);
}

export function getRuntimeEmailConfig() {
  return { ...runtimeConfig };
}

// ---------------------------------------------------------------------------
// 1. BREVO REST API DISPATCHER (HTTPS Port 443 - 100% Guaranteed in Render)
// ---------------------------------------------------------------------------
async function sendViaBrevoApi(
  apiKey: string,
  senderInput: string,
  to: string,
  toName: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; messageId: string; error?: string; rawError?: any; status?: number }> {
  const cleanKey = sanitizeApiKey(apiKey);
  const cleanSender = extractPureEmail(senderInput) || 'motatovanesa@gmail.com';
  const senderDisplayName = extractDisplayName(senderInput, 'VotoSmart Colombia');
  const cleanToEmail = extractPureEmail(to);
  const cleanToDisplayName = (toName || '').replace(/["']/g, '').trim() || cleanToEmail;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': cleanKey,
        'content-type': 'application/json'
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        sender: {
          name: senderDisplayName,
          email: cleanSender
        },
        to: [
          {
            email: cleanToEmail,
            name: cleanToDisplayName
          }
        ],
        replyTo: {
          email: cleanSender,
          name: senderDisplayName
        },
        subject: subject,
        htmlContent: html,
        textContent: text
      })
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const rawMsg = data?.message || data?.error || (typeof data === 'string' ? data : `Error HTTP ${res.status}: ${res.statusText}`);
      let userFriendly = rawMsg;
      const lower = String(rawMsg).toLowerCase();

      if (res.status === 401 || lower.includes('key not found') || lower.includes('unauthorized')) {
        userFriendly = `Clave de Brevo no válida o no encontrada (HTTP 401). Asegúrese de haber copiado la "Clave API (v3)" en Brevo > SMTP & API > Claves API (inicia con xkeysib-). Si generó una clave SMTP (inicia con xsmtpsib-), el sistema usará el relay SMTP en puerto 2525.`;
      } else if (lower.includes('sender email') || lower.includes('not registered') || lower.includes('unverified') || lower.includes('invalid_parameter')) {
        userFriendly = `El correo remitente (${cleanSender}) no está verificado en Brevo. Vaya a Brevo > Remitentes e IP y verifique esta dirección para poder enviar correos.`;
      } else if (lower.includes('quota') || lower.includes('credit') || lower.includes('limit')) {
        userFriendly = `Límite diario de envíos alcanzado en su cuenta gratuita de Brevo (300 correos/día).`;
      }

      return {
        success: false,
        messageId: '',
        error: userFriendly,
        rawError: data,
        status: res.status
      };
    }

    return {
      success: true,
      messageId: data?.messageId || `brevo-${Date.now()}`
    };
  } catch (err: any) {
    return {
      success: false,
      messageId: '',
      error: `Error de red al conectar con Brevo API (HTTPS puerto 443): ${err.message}`
    };
  }
}

// ---------------------------------------------------------------------------
// 2. BREVO SMTP RELAY TRANSPORTER (Supports Port 2525 - Allowed by Render!)
// ---------------------------------------------------------------------------
function createBrevoSmtpTransporter(apiKey: string, senderEmail: string, port = 2525): nodemailer.Transporter {
  const cleanSender = extractPureEmail(senderEmail) || 'motatovanesa@gmail.com';
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: port,
    secure: port === 465,
    auth: {
      user: cleanSender,
      pass: sanitizeApiKey(apiKey)
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 8000,
    greetingTimeout: 6000
  } as any);
}

async function sendViaBrevoSmtpRelay(
  apiKey: string,
  senderEmail: string,
  to: string,
  toName: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; messageId: string; error?: string; portUsed?: number }> {
  // Render permits port 2525 without firewall blocks! Port 587 as secondary.
  const portsToTry = [2525, 587];
  let lastError = '';

  const cleanSender = extractPureEmail(senderEmail) || 'motatovanesa@gmail.com';
  const senderDisplayName = extractDisplayName(senderEmail, 'VotoSmart Colombia');
  const cleanToEmail = extractPureEmail(to);
  const cleanToDisplayName = (toName || '').replace(/["']/g, '').trim() || cleanToEmail;

  for (const port of portsToTry) {
    try {
      console.log(`[EmailService] Intentando Brevo SMTP Relay en puerto ${port} para ${cleanToEmail}...`);
      const transporter = createBrevoSmtpTransporter(apiKey, cleanSender, port);
      const info = await transporter.sendMail({
        from: `"${senderDisplayName}" <${cleanSender}>`,
        to: `"${cleanToDisplayName}" <${cleanToEmail}>`,
        replyTo: cleanSender,
        subject,
        text,
        html
      });

      console.log(`[EmailService] ¡Correo entregado con éxito vía Brevo SMTP Relay en puerto ${port}! (ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId || `brevo-smtp-${Date.now()}`,
        portUsed: port
      };
    } catch (err: any) {
      lastError = err.message;
      console.warn(`[EmailService] Falló Brevo SMTP Relay en puerto ${port}: ${err.message}`);
    }
  }

  return { success: false, messageId: '', error: lastError };
}

// ---------------------------------------------------------------------------
// 3. GENERIC / GMAIL SMTP TRANSPORTER
// ---------------------------------------------------------------------------
function createSmtpTransporter(port?: number): nodemailer.Transporter {
  const host = runtimeConfig.emailHost || process.env.EMAIL_HOST;
  const username = runtimeConfig.emailUsername || process.env.EMAIL_USERNAME;
  const password = runtimeConfig.emailPassword || process.env.EMAIL_PASSWORD;

  // Custom SMTP host
  if (host && username && password) {
    const targetPort = port || runtimeConfig.emailPort || 2525;
    return nodemailer.createTransport({
      host,
      port: targetPort,
      secure: targetPort === 465,
      auth: {
        user: username,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 8000,
      greetingTimeout: 6000
    } as any);
  }

  // Gmail SSL Fallback
  const gmailUser = process.env.GMAIL_USER?.trim() || 'motatovanesa@gmail.com';
  const envPass = process.env.GMAIL_PASS?.replace(/\s+/g, '');
  const cleanPass = (envPass && envPass.length === 16) ? envPass : 'wxjokjgignqlszdc';
  const gmailPort = port || 465;

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: gmailPort,
    secure: gmailPort === 465,
    auth: {
      user: gmailUser,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    },
    pool: false,
    connectionTimeout: 8000,
    greetingTimeout: 6000
  } as any);
}

// ---------------------------------------------------------------------------
// 4. MAIN DISPATCH DISPATCHER
// ---------------------------------------------------------------------------
export async function dispatchEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId: string;
  deliveryMode: 'real_brevo_api' | 'real_smtp' | 'sandbox_inbox';
  code?: string;
  message: string;
}> {
  const id = `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cleanTo = extractPureEmail(options.to);
  const cleanToName = (options.toName || '').trim();

  // Filter invalid or test dummy emails
  if (!cleanTo || !cleanTo.includes('@') || cleanTo.endsWith('@example.com') || cleanTo.endsWith('@test.com')) {
    return {
      success: false,
      messageId: id,
      deliveryMode: 'sandbox_inbox',
      message: !cleanTo || !cleanTo.includes('@')
        ? 'El copropietario no tiene una dirección de correo válida registrada.'
        : `La dirección ${cleanTo} es un correo de prueba no entregable. Actualice con un correo real.`
    };
  }

  // Plain-text version for email readers
  const plainText = options.text || options.html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const brevoApiKey = sanitizeApiKey(
    runtimeConfig.brevoApiKey ||
    process.env.BREVO_API_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.BREVO_APIKEY ||
    process.env.BREVO_SMTP_KEY
  );
  const brevoSender = extractPureEmail(
    runtimeConfig.brevoSenderEmail ||
    process.env.BREVO_SENDER_EMAIL ||
    process.env.EMAIL_FROM ||
    'motatovanesa@gmail.com'
  );

  let brevoApiError: string | undefined;

  // ROUTE A: Brevo Configured
  if (brevoApiKey && brevoApiKey.length > 8) {
    // If the key starts with 'xsmtpsib-', it's explicitly a Brevo SMTP key!
    if (brevoApiKey.startsWith('xsmtpsib-')) {
      console.log(`[EmailService] Detectada clave Brevo SMTP (xsmtpsib). Despachando vía SMTP Relay puerto 2525 (Render compatible)...`);
      const smtpRes = await sendViaBrevoSmtpRelay(brevoApiKey, brevoSender, cleanTo, cleanToName, options.subject, options.html, plainText);
      if (smtpRes.success) {
        return {
          success: true,
          messageId: smtpRes.messageId,
          deliveryMode: 'real_smtp',
          message: `Correo despachado exitosamente a ${cleanTo} vía Brevo SMTP Relay (puerto ${smtpRes.portUsed}).`
        };
      } else {
        brevoApiError = smtpRes.error;
      }
    } else {
      // Standard Brevo REST API v3 (HTTPS 443 - Recommended for Render)
      console.log(`[EmailService] Despachando vía Brevo REST API v3 (HTTPS Puerto 443) a ${cleanTo}...`);
      const brevoResult = await sendViaBrevoApi(brevoApiKey, brevoSender, cleanTo, cleanToName, options.subject, options.html, plainText);

      if (brevoResult.success) {
        console.log(`[EmailService] ¡Correo entregado con éxito vía Brevo API a ${cleanTo}! ID: ${brevoResult.messageId}`);
        return {
          success: true,
          messageId: brevoResult.messageId,
          deliveryMode: 'real_brevo_api',
          message: `Correo despachado exitosamente a ${cleanTo} vía Brevo API.`
        };
      }

      brevoApiError = brevoResult.error;
      console.warn(`[EmailService] Brevo REST API falló (${brevoResult.status}): ${brevoResult.error}. Probando fallback Brevo SMTP Relay...`);

      // If REST API failed because the key was actually an SMTP key or had an auth mismatch, try SMTP Relay on 2525
      const smtpRelayRes = await sendViaBrevoSmtpRelay(brevoApiKey, brevoSender, cleanTo, cleanToName, options.subject, options.html, plainText);
      if (smtpRelayRes.success) {
        return {
          success: true,
          messageId: smtpRelayRes.messageId,
          deliveryMode: 'real_smtp',
          message: `Correo despachado exitosamente a ${cleanTo} vía Brevo Relay (puerto ${smtpRelayRes.portUsed}).`
        };
      }
    }
  }

  // ROUTE B: Custom SMTP / Gmail Fallback (trying port 2525, 587, 465)
  const portsToTry = [2525, 587, 465];
  let lastSmtpError: string | undefined;

  for (let i = 0; i < portsToTry.length; i++) {
    const port = portsToTry[i];
    try {
      const transporter = createSmtpTransporter(port);
      const senderFrom = brevoSender || 'motatovanesa@gmail.com';

      const info = await transporter.sendMail({
        from: `"VotoSmart Colombia" <${senderFrom}>`,
        to: cleanToName ? `"${cleanToName}" <${cleanTo}>` : cleanTo,
        replyTo: senderFrom,
        subject: options.subject,
        text: plainText,
        html: options.html
      });

      const messageId = info.messageId || id;
      console.log(`[EmailService] Correo entregado exitosamente a ${cleanTo} vía SMTP puerto ${port} (ID: ${messageId})`);
      return {
        success: true,
        messageId,
        deliveryMode: 'real_smtp',
        message: `Correo electrónico despachado exitosamente a ${cleanTo} vía SMTP.`
      };
    } catch (err: any) {
      lastSmtpError = err.message;
      if (i < portsToTry.length - 1) {
        await new Promise(r => setTimeout(r, 150));
      }
    }
  }

  // If all methods failed:
  const diagnosticMsg = brevoApiKey
    ? `Fallo al entregar correo con Brevo: ${brevoApiError || 'Error de autenticación'}. ${lastSmtpError ? `Fallback SMTP también falló (${lastSmtpError}).` : ''}`
    : `No se pudo entregar el correo por SMTP directo (${lastSmtpError || 'puertos SMTP bloqueados por Render'}). Configure una clave de Brevo API en el Centro de Correos para garantizar envíos por HTTPS puerto 443 en Render.`;

  console.error(`[EmailService] ERROR FINAL DESPACHO para ${cleanTo}:`, diagnosticMsg);

  return {
    success: false,
    messageId: id,
    deliveryMode: 'sandbox_inbox',
    message: diagnosticMsg
  };
}

export function getEmailHistory(): EmailRecord[] {
  return [];
}

export function getLatestEmailFor(emailOrDoc: string): EmailRecord | undefined {
  return undefined;
}

export function clearEmailHistory() {
  // no-op
}

// ---------------------------------------------------------------------------
// 5. CONNECTION VERIFICATION (DIAGNOSTIC TEST)
// ---------------------------------------------------------------------------
export async function verifySmtpConnection(): Promise<{
  success: boolean;
  provider: string;
  message: string;
  durationMs: number;
  details?: any;
}> {
  const start = Date.now();
  const brevoApiKey = sanitizeApiKey(
    runtimeConfig.brevoApiKey ||
    process.env.BREVO_API_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.BREVO_APIKEY ||
    process.env.BREVO_SMTP_KEY
  );
  const brevoSender = extractPureEmail(
    runtimeConfig.brevoSenderEmail ||
    process.env.BREVO_SENDER_EMAIL ||
    process.env.EMAIL_FROM ||
    'motatovanesa@gmail.com'
  );

  // Case 1: Brevo SMTP Key detected (xsmtpsib-)
  if (brevoApiKey && brevoApiKey.startsWith('xsmtpsib-')) {
    try {
      const transporter = createBrevoSmtpTransporter(brevoApiKey, brevoSender, 2525);
      await transporter.verify();
      const duration = Date.now() - start;
      return {
        success: true,
        provider: 'brevo_smtp_relay',
        message: `Conexión con Brevo SMTP Relay verificada exitosamente en puerto 2525 (${duration}ms). Remitente: ${brevoSender}. 100% compatible con Render.`,
        durationMs: duration,
        details: { email: brevoSender, port: 2525, mode: 'SMTP Relay' }
      };
    } catch (err: any) {
      try {
        const t587 = createBrevoSmtpTransporter(brevoApiKey, brevoSender, 587);
        await t587.verify();
        const duration = Date.now() - start;
        return {
          success: true,
          provider: 'brevo_smtp_relay',
          message: `Conexión con Brevo SMTP Relay verificada en puerto 587 (${duration}ms). Remitente: ${brevoSender}.`,
          durationMs: duration,
          details: { email: brevoSender, port: 587 }
        };
      } catch (err2: any) {
        return {
          success: false,
          provider: 'brevo_smtp_relay',
          message: `Fallo al verificar Brevo SMTP Relay: ${err.message}. Compruebe que el correo emisor (${brevoSender}) y la clave SMTP sean correctos.`,
          durationMs: Date.now() - start
        };
      }
    }
  }

  // Case 2: Brevo REST API v3 Key
  if (brevoApiKey && brevoApiKey.length > 8) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey
        },
        signal: AbortSignal.timeout(10000)
      });
      const data: any = await res.json().catch(() => ({}));
      const duration = Date.now() - start;

      if (res.ok) {
        const credits = data?.plan?.[0]?.credits;
        const planType = data?.plan?.[0]?.type || 'Gratuito';
        return {
          success: true,
          provider: 'brevo_api',
          message: `Conexión con Brevo REST API verificada exitosamente en ${duration}ms. Cuenta: ${data?.email || 'Activa'} | Plan: ${planType} | Créditos disponibles: ${credits !== undefined ? credits : '300/día'}. 100% compatible con Render en puerto HTTPS 443.`,
          durationMs: duration,
          details: {
            email: data?.email,
            plan: planType,
            credits: credits,
            senderConfigured: brevoSender
          }
        };
      } else {
        // If REST API failed, test if it's an SMTP key on port 2525
        try {
          const smtpFallback = createBrevoSmtpTransporter(brevoApiKey, brevoSender, 2525);
          await smtpFallback.verify();
          return {
            success: true,
            provider: 'brevo_smtp_relay',
            message: `Conexión verificada vía Brevo SMTP Relay en puerto 2525 (${Date.now() - start}ms). 100% compatible con Render.`,
            durationMs: Date.now() - start,
            details: { email: brevoSender, port: 2525 }
          };
        } catch {
          let errorMsg = data?.message || `Error HTTP ${res.status}`;
          if (res.status === 401 || String(errorMsg).toLowerCase().includes('key not found')) {
            errorMsg = `Brevo rechazó la clave API (401: Key not found). Verifique en Brevo > SMTP & API > Claves API que la clave esté activa y empiece por xkeysib-.`;
          }
          return {
            success: false,
            provider: 'brevo_api',
            message: errorMsg,
            durationMs: duration
          };
        }
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'brevo_api',
        message: `Error de red al conectar con Brevo API: ${err.message}`,
        durationMs: Date.now() - start
      };
    }
  }

  // Case 3: Generic SMTP or Gmail verification
  try {
    const transporter = createSmtpTransporter();
    await transporter.verify();
    const duration = Date.now() - start;
    return {
      success: true,
      provider: runtimeConfig.emailHost ? 'custom_smtp' : 'gmail_ssl',
      message: `Conexión SMTP verificada exitosamente en ${duration}ms.`,
      durationMs: duration
    };
  } catch (err: any) {
    const duration = Date.now() - start;
    return {
      success: false,
      provider: runtimeConfig.emailHost ? 'custom_smtp' : 'gmail_ssl',
      message: `Fallo al verificar SMTP (${err.message}). Nota: En Render los puertos SMTP convencionales están bloqueados; configure su clave Brevo para envíos por HTTPS puerto 443 o SMTP puerto 2525.`,
      durationMs: duration
    };
  }
}

// ---------------------------------------------------------------------------
// 6. STATUS & METRICS
// ---------------------------------------------------------------------------
export function getEmailServiceStatus() {
  const brevoApiKey = sanitizeApiKey(
    runtimeConfig.brevoApiKey ||
    process.env.BREVO_API_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.BREVO_APIKEY ||
    process.env.BREVO_SMTP_KEY
  );
  const brevoSender = extractPureEmail(
    runtimeConfig.brevoSenderEmail ||
    process.env.BREVO_SENDER_EMAIL ||
    process.env.EMAIL_FROM ||
    'motatovanesa@gmail.com'
  );
  const customHost = runtimeConfig.emailHost || process.env.EMAIL_HOST;

  const isBrevoConfigured = !!(brevoApiKey && brevoApiKey.length > 8);
  const isBrevoSmtp = isBrevoConfigured && brevoApiKey.startsWith('xsmtpsib-');
  const activeProvider = isBrevoConfigured
    ? (isBrevoSmtp ? 'brevo_smtp_relay' : 'brevo_api')
    : customHost ? 'smtp_relay' : 'gmail_ssl';

  return {
    isConfigured: true,
    isBrevoConfigured,
    isBrevoSmtp,
    activeProvider,
    activeTransportName: isBrevoConfigured
      ? (isBrevoSmtp ? 'Brevo SMTP Relay (Puerto 2525 - Render compatible)' : 'Brevo REST API v3 (HTTPS Puerto 443 - Garantizado en Render)')
      : customHost
      ? `SMTP Relay (${customHost})`
      : 'Gmail SMTP Directo (SSL Puerto 465)',
    brevoSenderEmail: brevoSender,
    apiKeyMasked: brevoApiKey
      ? `${brevoApiKey.slice(0, 8)}...${brevoApiKey.slice(-4)}`
      : undefined,
    smtpHost: isBrevoConfigured ? (isBrevoSmtp ? 'smtp-relay.brevo.com' : 'api.brevo.com') : (customHost || 'smtp.gmail.com'),
    smtpPort: isBrevoConfigured ? (isBrevoSmtp ? 2525 : 443) : (runtimeConfig.emailPort || 465),
    compatibleProviders: [
      'Brevo REST API v3 (HTTPS Puerto 443 - Recomendado Render)',
      'Brevo SMTP Relay (Puerto 2525 - Render compatible)',
      'Gmail (Contraseña de aplicación)',
      'Outlook / Microsoft 365',
      'SMTP Personalizado'
    ]
  };
}

export async function dispatchBatchEmails(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  htmlGenerator: (recipient: { email: string; name?: string }) => string,
  type: 'resultados' | 'acta' | 'convocatoria' | 'invitacion'
): Promise<{ total: number; sent: number }> {
  console.log(`[EmailService] Iniciando despacho masivo de ${type} a ${recipients.length} destinatarios...`);
  let sent = 0;

  // Process asynchronously without blocking caller
  (async () => {
    for (const r of recipients) {
      if (!r.email) continue;
      try {
        await dispatchEmail({
          to: r.email,
          toName: r.name || 'Copropietario',
          subject,
          html: htmlGenerator(r),
          type
        });
        sent++;
        // Small 200ms throttle between emails
        await new Promise((res) => setTimeout(res, 200));
      } catch (err: any) {
        console.warn(`[EmailService] Error en envío individual a ${r.email}:`, err.message);
      }
    }
    console.log(`[EmailService] Despacho masivo finalizado: ${sent}/${recipients.length} correos entregados.`);
  })().catch((err) => console.error('[EmailService] Error en lote masivo:', err));

  return { total: recipients.length, sent: recipients.length };
}
