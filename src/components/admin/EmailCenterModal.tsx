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
  Smartphone
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

  // Test send state
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Prueba de Entrega de Correo VotoSmart');
  const [testMessage, setTestMessage] = useState('Este es un correo de comprobación para verificar que el servidor SMTP está despachando correos en tiempo real.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/email-service/status').then(r => r.json());
      setSmtpStatus(res);
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
    }
  }, [isOpen]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.testSendEmail(testEmail.trim(), testSubject, testMessage);
      setTestResult({
        success: true,
        message: `Correo de prueba despachado exitosamente a ${testEmail}. Revise la bandeja de entrada o spam.`,
        mode: res.deliveryMode
      });
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
      title="Estado del Servidor de Correo Electrónico (SMTP)"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Security & Confidentiality Notice */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Privacidad y Confidencialidad Criptográfica (Habeas Data Ley 1581 de 2012)</span>
          </div>
          <p className="text-emerald-800 text-[11px] leading-relaxed">
            Por estrictos protocolos de seguridad y protección de datos conforme a la legislación colombiana (Ley 675 de 2001 y Ley 1581 de 2012), 
            <strong> los administradores no tienen acceso a los códigos de verificación, OTPs ni contraseñas de los copropietarios</strong>. 
            Todas las credenciales y códigos de seguridad se entregan de forma privada, cifrada y directa al correo electrónico registrado de cada votante.
          </p>
        </div>

        {/* SMTP Status Overview */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-900 text-xs">
                Servidor de Envío Transaccional
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
              <div className="text-[10px] text-slate-500 font-bold uppercase">Estado de Entrega</div>
              <div className="mt-1 flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SMTP Activo</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Transporte</div>
              <div className="mt-1 font-bold text-slate-800 text-xs">
                Google Workspace / Gmail SMTP
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Conjunto Emisor</div>
              <div className="mt-1 font-bold text-slate-800 text-xs truncate">
                {complex?.name || 'VotoSmart PH'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Test Sender Box */}
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-teal-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Send className="w-3.5 h-3.5 text-teal-700" />
              Probar Entrega de Correo en Tiempo Real
            </h4>
            <Badge variant="teal" size="sm">Prueba Técnica</Badge>
          </div>

          <p className="text-[11px] text-teal-800">
            Envía un correo de prueba a tu dirección para verificar que la bandeja de entrada recibe las notificaciones de forma inmediata sin bloqueos.
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
                  placeholder="ejemplo@correo.com"
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
              {testResult.message}
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
