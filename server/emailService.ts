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
  status: 'sent' | 'delivered' | 'pending';
  deliveryMode: 'real_smtp' | 'sandbox_inbox';
  sentAt: string;
}

// In-memory mail queue and history
const emailHistory: EmailRecord[] = [];

// Initialize SMTP transporter if env credentials are provided
function getTransporter() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = (process.env.EMAIL_PORT || process.env.SMTP_PORT) ? parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10) : 587;
  const user = process.env.EMAIL_USERNAME || process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_PASS;
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'VotoSmart Colombia <notificaciones@votosmart.app>';

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  }

  return null;
}

export async function dispatchEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId: string;
  deliveryMode: 'real_smtp' | 'sandbox_inbox';
  code?: string;
  message: string;
}> {
  const id = `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();
  const transporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || 'VotoSmart Colombia <notificaciones@votosmart.app>';

  let deliveryMode: 'real_smtp' | 'sandbox_inbox' = 'sandbox_inbox';
  let messageId = id;
  let status: 'sent' | 'delivered' = 'sent';

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: `"${options.toName || options.to}" <${options.to}>`,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        html: options.html
      });
      messageId = info.messageId || id;
      deliveryMode = 'real_smtp';
      status = 'delivered';
      console.log(`[EmailService] Correo enviado exitosamente vía SMTP a ${options.to} (ID: ${messageId})`);
    } catch (err: any) {
      console.error(`[EmailService] Fallo al enviar vía SMTP, guardando en buzón de respaldo:`, err.message);
      deliveryMode = 'sandbox_inbox';
    }
  } else {
    console.log(`[EmailService] SMTP no configurado en entorno (.env). Email almacenado en el Buzón en Línea para ${options.to}.`);
  }

  // Extract snippet for quick preview
  const bodyPreview = options.text 
    ? options.text.slice(0, 160) 
    : options.html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

  const record: EmailRecord = {
    id,
    recipientEmail: options.to,
    recipientName: options.toName || 'Usuario',
    subject: options.subject,
    type: options.type,
    code: options.code,
    bodyPreview,
    htmlContent: options.html,
    status,
    deliveryMode,
    sentAt: timestamp
  };

  emailHistory.unshift(record);

  // Keep max 100 emails
  if (emailHistory.length > 100) {
    emailHistory.pop();
  }

  return {
    success: true,
    messageId,
    deliveryMode,
    code: options.code,
    message: deliveryMode === 'real_smtp' 
      ? `Correo electrónico despachado exitosamente a ${options.to}.`
      : `Código y notificación generados exitosamente para ${options.to}.`
  };
}

export function getEmailHistory(): EmailRecord[] {
  return emailHistory;
}

export function getLatestEmailFor(emailOrDoc: string): EmailRecord | undefined {
  const query = emailOrDoc.trim().toLowerCase();
  return emailHistory.find(e => 
    e.recipientEmail.toLowerCase() === query || 
    e.subject.toLowerCase().includes(query) ||
    (e.code && e.code === query)
  );
}

export function clearEmailHistory() {
  emailHistory.length = 0;
}
