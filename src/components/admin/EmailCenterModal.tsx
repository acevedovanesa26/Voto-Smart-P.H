import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Alert, Badge, Button, Modal } from '../common/UIComponents';

interface EmailCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailCenterModal: React.FC<EmailCenterModalProps> = ({ isOpen, onClose }) => {
  const { complex } = useAuth();
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Brevo configuration state
  const [brevoApiKey, setBrevoApiKey] = useState('');
  const [brevoSenderEmail, setBrevoSenderEmail] = useState('');
  const [isSavingBrevo, setIsSavingBrevo] = useState(false);
  const [brevoSaveFeedback, setBrevoSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Test send state
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Prueba de Entrega de Correo VotoSmart');
  const [testMessage, setTestMessage] = useState('Este es un correo de comprobación para verificar que el despacho de notificaciones está funcionando en producción.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEmailServiceStatus();
      setSmtpStatus(res);
      if (res?.brevoSenderEmail && !brevoSenderEmail) {
        setBrevoSenderEmail(res.brevoSenderEmail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setTestResult(null);
      setBrevoSaveFeedback(null);
    }
  }, [isOpen]);

  const handleVerifyOnly = async () => {
    setIsVerifying(true);
    setBrevoSaveFeedback(null);
    try {
      const verifyRes = await api.verifySmtp();
      setBrevoSaveFeedback({
        success: verifyRes.success,
        message: verifyRes.message
      });
      await checkStatus();
    } catch (err: any) {
      setBrevoSaveFeedback({
        success: false,
        message: err.message || 'Error al verificar conexión'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveBrevo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBrevo(true);
    setBrevoSaveFeedback(null);
    try {
      const res = await api.updateEmailConfig({
        brevoApiKey: brevoApiKey.trim() || undefined,
        brevoSenderEmail: brevoSenderEmail.trim() || undefined
      });
      setBrevoSaveFeedback({
        success: true,
        message: res.message || 'Configuración guardada de forma permanente.'
      });
      // Run verification
      const verifyRes = await api.verifySmtp();
      if (verifyRes.success) {
        setBrevoSaveFeedback({
          success: true,
          message: verifyRes.message
        });
      } else {
        setBrevoSaveFeedback({
          success: false,
          message: verifyRes.message
        });
      }
      await checkStatus();
    } catch (err: any) {
      setBrevoSaveFeedback({
        success: false,
        message: err.message || 'Error al guardar configuración de Brevo'
      });
    } finally {
      setIsSavingBrevo(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.testSendDiagnosticEmail(testEmail.trim(), testMessage);
      if (res.success) {
        setTestResult({
          success: true,
          message: res.message || `Correo de prueba despachado exitosamente a ${testEmail}. Revise su bandeja de entrada o spam.`,
          mode: res.deliveryMode
        });
      } else {
        setTestResult({
          success: false,
          message: res.message || 'No se pudo entregar el correo.',
          mode: res.deliveryMode
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error al enviar correo de prueba'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Envíos de Correo & Configuración de Entrega"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Security & Confidentiality Notice */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Privacidad y Confidencialidad Criptográfica (Habeas Data Ley 1581)</span>
          </div>
          <p className="text-emerald-800 text-[11px] leading-relaxed">
            Por protocolos de seguridad, los administradores no tienen acceso a los códigos de verificación u OTPs de los copropietarios.
            Todas las credenciales y actas se despachan directamente al correo electrónico registrado de cada votante.
          </p>
        </div>

        {/* Current Dispatch Status */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-900 text-xs">
                Proveedor Activo de Entrega
              </span>
            </div>
            <button
              type="button"
              onClick={checkStatus}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 text-[11px] font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 text-teal-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Verificar Estado</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Proveedor</div>
              <div className="mt-1 flex items-center gap-1.5 font-bold text-teal-700">
                {smtpStatus?.isBrevoConfigured ? (
                  <>
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Brevo API (HTTPS)</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-teal-600" />
                    <span>SMTP Directo</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Compatibilidad Render</div>
              <div className="mt-1 font-bold text-xs">
                {smtpStatus?.isBrevoConfigured ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Garantizada
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Requiere Brevo API
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Conjunto Emisor</div>
              <div className="mt-1 font-bold text-slate-800 text-xs truncate">
                {complex?.name || 'VotoSmart PH'}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
            <strong>Mecanismo activo:</strong> {smtpStatus?.activeTransportName || 'Detectando proveedor...'}
            {smtpStatus?.apiKeyMasked && (
              <span className="ml-2 text-teal-700 font-mono">({smtpStatus.apiKeyMasked})</span>
            )}
          </div>
        </div>

        {/* Brevo Cloud Configuration Card */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-700" />
              <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wide">
                Configuración Brevo (Sendinblue) para Producción
              </h4>
            </div>
            <Badge variant="teal" size="sm">Recomendado Render</Badge>
          </div>

          <div className="text-[11px] text-indigo-900 leading-relaxed space-y-1.5">
            <p>
              <strong>¿Por qué Brevo en Render?</strong> Render bloquea los puertos SMTP salientes (25, 465 y 587) en planes gratuitos/starter.
              Con Brevo, los correos se entregan vía <strong>HTTPS REST API en puerto 443</strong> (o Relay en puerto 2525), garantizando entrega instantánea sin bloqueos de red. Brevo incluye <strong>300 correos gratis al día</strong>.
            </p>
            <div className="p-2 bg-white/80 rounded-lg border border-indigo-200 text-[10px] text-indigo-950 space-y-0.5">
              <p><strong>• Clave API v3 recomendada:</strong> En Brevo ve a <em>Configuración &gt; SMTP &amp; API &gt; Claves API</em> (empieza por <code>xkeysib-...</code>).</p>
              <p><strong>• Remitente obligatorio:</strong> El correo debe estar verificado en <em>Brevo &gt; Remitentes e IP</em>.</p>
            </div>
          </div>

          <form onSubmit={handleSaveBrevo} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-950 mb-1 uppercase">
                  Clave API de Brevo (xkeysib-...)
                </label>
                <input
                  type="password"
                  value={brevoApiKey}
                  onChange={(e) => setBrevoApiKey(e.target.value)}
                  placeholder={smtpStatus?.apiKeyMasked ? `Guardada: ${smtpStatus.apiKeyMasked}` : 'xkeysib-xxxxxxxxxxxxxxxx'}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-950 mb-1 uppercase">
                  Correo Emisor Verificado
                </label>
                <input
                  type="email"
                  value={brevoSenderEmail}
                  onChange={(e) => setBrevoSenderEmail(e.target.value)}
                  placeholder="motatovanesa@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-indigo-700">
                También configurable en Render en Environment: <code>BREVO_API_KEY</code>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isVerifying}
                  onClick={handleVerifyOnly}
                  className="border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-medium"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Probar Conexión
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingBrevo}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Guardar y Activar
                </Button>
              </div>
            </div>
          </form>

          {brevoSaveFeedback && (
            <Alert type={brevoSaveFeedback.success ? 'success' : 'error'}>
              {brevoSaveFeedback.message}
            </Alert>
          )}
        </div>

        {/* Live Test Sender Box */}
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-teal-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Send className="w-3.5 h-3.5 text-teal-700" />
              Probar Entrega de Correo en Vivo
            </h4>
            <Badge variant="teal" size="sm">Prueba Técnica</Badge>
          </div>

          <p className="text-[11px] text-teal-800">
            Envía un correo de prueba a tu dirección real para confirmar que las convocatorias, OTPs y actas se están entregando sin inconvenientes.
          </p>

          <form onSubmit={handleSendTest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Correo Destinatario
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tu_correo_real@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Asunto
                </label>
                <input
                  type="text"
                  required
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Mensaje de Prueba
              </label>
              <textarea
                rows={2}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSendingTest}
                className="bg-teal-600 hover:bg-teal-700 font-bold"
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Enviar Correo de Prueba
              </Button>
            </div>
          </form>

          {testResult && (
            <Alert type={testResult.success ? 'success' : 'error'}>
              <div className="space-y-1">
                <p>{testResult.message}</p>
                {testResult.mode && (
                  <p className="text-[10px] opacity-80">
                    Modo de entrega: <strong>{testResult.mode === 'real_brevo_api' ? 'Brevo REST API (HTTPS)' : testResult.mode === 'real_smtp' ? 'SMTP Directo' : 'Sandbox'}</strong>
                  </p>
                )}
              </div>
            </Alert>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
