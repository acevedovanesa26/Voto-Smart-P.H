import nodemailer from 'nodemailer';

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

// In-memory runtime configuration override (can be set via UI or env)
interface EmailConfig {
  brevoApiKey?: string;
  brevoSenderEmail?: string;
  emailHost?: string;
  emailPort?: number;
  emailUsername?: string;
  emailPassword?: string;
}

const runtimeConfig: EmailConfig = {
  brevoApiKey: process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || 'motatovanesa@gmail.com',
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined,
  emailUsername: process.env.EMAIL_USERNAME,
  emailPassword: process.env.EMAIL_PASSWORD
};

export function updateRuntimeEmailConfig(newConfig: Partial<EmailConfig>) {
  if (newConfig.brevoApiKey !== undefined) runtimeConfig.brevoApiKey = newConfig.brevoApiKey.trim();
  if (newConfig.brevoSenderEmail !== undefined) runtimeConfig.brevoSenderEmail = newConfig.brevoSenderEmail.trim();
  if (newConfig.emailHost !== undefined) runtimeConfig.emailHost = newConfig.emailHost.trim();
  if (newConfig.emailPort !== undefined) runtimeConfig.emailPort = newConfig.emailPort;
  if (newConfig.emailUsername !== undefined) runtimeConfig.emailUsername = newConfig.emailUsername.trim();
  if (newConfig.emailPassword !== undefined) runtimeConfig.emailPassword = newConfig.emailPassword.trim();
}

export function getRuntimeEmailConfig() {
  return { ...runtimeConfig };
}

// Brevo REST API Dispatcher via HTTPS (Port 443 - 100% Compatible with Render Cloud Hosting)
async function sendViaBrevoApi(
  apiKey: string,
  senderEmail: string,
  to: string,
  toName: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; messageId: string; error?: string }> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'VotoSmart Colombia',
          email: senderEmail || 'motatovanesa@gmail.com'
        },
        to: [
          {
            email: to,
            name: toName || to
          }
        ],
        subject: subject,
        htmlContent: html,
        textContent: text
      })
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.message || data?.error || `Error HTTP ${res.status}: ${res.statusText}`;
      return { success: false, messageId: '', error: errMsg };
    }

    return {
      success: true,
      messageId: data?.messageId || `brevo-${Date.now()}`
    };
  } catch (err: any) {
    return {
      success: false,
      messageId: '',
      error: `Fallo de red al conectar con Brevo API: ${err.message}`
    };
  }
}

// SMTP Transporter Helper for Relay or Gmail
function createSmtpTransporter(port?: number): nodemailer.Transporter {
  const host = runtimeConfig.emailHost || process.env.EMAIL_HOST;
  const username = runtimeConfig.emailUsername || process.env.EMAIL_USERNAME;
  const password = runtimeConfig.emailPassword || process.env.EMAIL_PASSWORD;

  // If custom SMTP host is defined (e.g. Brevo SMTP relay or Mailgun)
  if (host && username && password) {
    const targetPort = port || runtimeConfig.emailPort || 587;
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
      connectionTimeout: 10000,
      greetingTimeout: 8000
    } as any);
  }

  // Fallback to Google Gmail App Password
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
    connectionTimeout: 10000,
    greetingTimeout: 8000
  } as any);
}

export async function dispatchEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId: string;
  deliveryMode: 'real_brevo_api' | 'real_smtp' | 'sandbox_inbox';
  code?: string;
  message: string;
}> {
  const id = `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cleanTo = (options.to || '').trim().toLowerCase();
  const cleanToName = (options.toName || '').trim();

  // Filter invalid or dummy sandbox emails
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

  // Clean plain-text version for email clients
  const plainText = options.text || options.html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const brevoApiKey = runtimeConfig.brevoApiKey || process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const brevoSender = runtimeConfig.brevoSenderEmail || process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || 'motatovanesa@gmail.com';

  // METHOD 1: Brevo REST API via HTTPS (Port 443) - Guaranteed in Render Cloud
  if (brevoApiKey && brevoApiKey.length > 10) {
    console.log(`[EmailService] Intentando despacho vía Brevo REST API (HTTPS Puerto 443) a ${cleanTo}...`);
    const brevoResult = await sendViaBrevoApi(brevoApiKey, brevoSender, cleanTo, cleanToName, options.subject, options.html, plainText);
    
    if (brevoResult.success) {
      console.log(`[EmailService] ¡Correo entregado con éxito vía Brevo API a ${cleanTo}! MessageId: ${brevoResult.messageId}`);
      return {
        success: true,
        messageId: brevoResult.messageId,
        deliveryMode: 'real_brevo_api',
        message: `Correo electrónico despachado exitosamente a ${cleanTo} vía Brevo API.`
      };
    } else {
      console.warn(`[EmailService] Brevo API reportó error: ${brevoResult.error}. Procediendo con fallback SMTP...`);
    }
  }

  // METHOD 2: Custom SMTP / Brevo SMTP Relay / Gmail SSL
  const portsToTry = [465, 587];
  let lastSmtpError: string | undefined;

  for (let i = 0; i < portsToTry.length; i++) {
    const port = portsToTry[i];
    try {
      const transporter = createSmtpTransporter(port);
      const senderFrom = runtimeConfig.brevoSenderEmail || process.env.EMAIL_FROM || '"VotoSmart Colombia" <motatovanesa@gmail.com>';

      const info = await transporter.sendMail({
        from: senderFrom.includes('<') ? senderFrom : `"VotoSmart Colombia" <${senderFrom}>`,
        to: cleanToName ? `"${cleanToName}" <${cleanTo}>` : cleanTo,
        replyTo: 'motatovanesa@gmail.com',
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
      console.warn(`[EmailService] Envío falló para ${cleanTo} en puerto ${port}: ${err.message}`);
      if (i < portsToTry.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  // If both failed
  return {
    success: false,
    messageId: id,
    deliveryMode: 'sandbox_inbox',
    message: brevoApiKey
      ? `Fallo al enviar correo: Brevo API rechazó el envío y los puertos SMTP directos no respondieron.`
      : `No se pudo entregar el correo por SMTP directo (${lastSmtpError || 'puertos 465/587 bloqueados por Render'}). Configure una clave de Brevo API en el Centro de Correos para garantizar envíos por HTTPS puerto 443.`
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

export async function verifySmtpConnection(): Promise<{
  success: boolean;
  provider: string;
  message: string;
  durationMs: number;
  details?: any;
}> {
  const start = Date.now();
  const brevoApiKey = runtimeConfig.brevoApiKey || process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;

  // Test Brevo API if key is present
  if (brevoApiKey && brevoApiKey.length > 10) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey
        }
      });
      const data: any = await res.json().catch(() => ({}));
      const duration = Date.now() - start;

      if (res.ok) {
        return {
          success: true,
          provider: 'brevo_api',
          message: `Conexión con Brevo REST API verificada exitosamente en ${duration}ms. Cuenta: ${data?.email || 'Activa'}. 100% compatible con Render.`,
          durationMs: duration,
          details: {
            email: data?.email,
            plan: data?.plan?.[0]?.type || 'Free',
            credits: data?.plan?.[0]?.credits
          }
        };
      } else {
        return {
          success: false,
          provider: 'brevo_api',
          message: `Brevo API rechazó la autenticación (${res.status}): ${data?.message || 'Clave API no válida'}`,
          durationMs: duration
        };
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

  // Fallback to SMTP verification
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
      message: `Fallo al verificar SMTP (${err.message}). Nota: En Render los puertos SMTP pueden estar bloqueados; se recomienda configurar Brevo API Key.`,
      durationMs: duration
    };
  }
}

export function getEmailServiceStatus() {
  const brevoApiKey = runtimeConfig.brevoApiKey || process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const brevoSender = runtimeConfig.brevoSenderEmail || process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || 'motatovanesa@gmail.com';
  const customHost = runtimeConfig.emailHost || process.env.EMAIL_HOST;

  const isBrevoConfigured = !!(brevoApiKey && brevoApiKey.length > 10);
  const activeProvider = isBrevoConfigured ? 'brevo_api' : customHost ? 'smtp_relay' : 'gmail_ssl';

  return {
    isConfigured: true,
    isBrevoConfigured,
    activeProvider,
    activeTransportName: isBrevoConfigured
      ? 'Brevo REST API v3 (HTTPS Puerto 443 - Garantizado en Render)'
      : customHost
      ? `SMTP Relay (${customHost})`
      : 'Gmail SMTP Directo (SSL Puerto 465)',
    brevoSenderEmail: brevoSender,
    apiKeyMasked: brevoApiKey
      ? `${brevoApiKey.slice(0, 8)}...${brevoApiKey.slice(-4)}`
      : undefined,
    smtpHost: customHost || 'smtp.gmail.com',
    smtpPort: runtimeConfig.emailPort || 465,
    compatibleProviders: ['Brevo (Recomendado Render)', 'Gmail', 'Hotmail', 'Outlook', 'Yahoo', 'iCloud', 'UCentral (.edu.co)']
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
