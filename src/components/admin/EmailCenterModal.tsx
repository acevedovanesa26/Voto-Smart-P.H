import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  KeyRound,
  Mail,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Vote
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
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  // Test send state
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Prueba de Verificación VotoSmart');
  const [testMessage, setTestMessage] = useState('Este es un mensaje de prueba para verificar la entrega de correos de la plataforma.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);

  const loadEmails = async () => {
    setIsLoading(true);
    try {
      const records = await api.getEmailRecords();
      setEmails(records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEmails();
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
        message: `Correo enviado exitosamente a ${testEmail}. Modo: ${res.deliveryMode === 'smtp' ? 'Servidor SMTP Oficial' : 'Registro de Seguridad In-Memory'}`,
        mode: res.deliveryMode
      });
      await loadEmails();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error al enviar correo de prueba'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const filteredEmails = emails.filter((item) => {
    const matchesSearch =
      item.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.includes(searchTerm);

    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Envíos de Correo y Códigos de Seguridad"
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        {/* Banner / Info */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Motor de Notificaciones & Trazabilidad de Correo
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Todos los códigos de recuperación de contraseña, códigos OTP para votación de copropietarios y credenciales emitidas quedan registrados con sello de tiempo y entrega garantizada.
            </p>
          </div>
          <button
            type="button"
            onClick={loadEmails}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 flex items-center gap-1.5 shrink-0 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Live Test Sender Box */}
        <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-teal-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Send className="w-3.5 h-3.5 text-teal-700" />
              Probar Envío de Correo en Tiempo Real
            </h4>
            <span className="text-[10px] text-teal-800 font-semibold">
              Verificación de entrega
            </span>
          </div>

          <form onSubmit={handleSendTest} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Destinatario</label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Asunto</label>
              <input
                type="text"
                required
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSendingTest}
                className="w-full bg-teal-600 hover:bg-teal-700 font-bold flex items-center justify-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Enviar Prueba</span>
              </Button>
            </div>
          </form>

          {testResult && (
            <Alert type={testResult.success ? 'success' : 'error'}>
              {testResult.message}
            </Alert>
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por correo, destinatario, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({emails.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('password_reset')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                filterType === 'password_reset' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Recuperación Contraseña
            </button>
            <button
              type="button"
              onClick={() => setFilterType('voter_otp')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                filterType === 'voter_otp' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              Códigos Votante OTP
            </button>
            <button
              type="button"
              onClick={() => setFilterType('staff_credentials')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                filterType === 'staff_credentials' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              Credenciales Mesa
            </button>
          </div>
        </div>

        {/* Email Logs List */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
              Cargando historial de envíos...
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
              No hay registros de correo con el filtro seleccionado.
            </div>
          ) : (
            filteredEmails.map((item) => {
              const dateStr = item.sentAt ? new Date(item.sentAt).toLocaleString('es-CO') : 'Reciente';
              const isOtp = item.code || item.type === 'voter_otp' || item.type === 'password_reset';

              return (
                <div
                  key={item.id}
                  className="p-3 bg-white border border-slate-200 hover:border-teal-300 rounded-xl transition-all shadow-2xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">
                        {item.recipientName || 'Usuario'}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        ({item.recipientEmail})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {item.status === 'sent' ? 'Enviado / Entregado' : item.status}
                      </span>
                      {item.deliveryMode && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                          {item.deliveryMode === 'smtp' ? 'SMTP' : 'Buzón Seguro'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800 text-[11px]">{item.subject}</p>
                      {item.code && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-slate-600 font-medium">Código emitido:</span>
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-900 border border-teal-300 font-mono font-black rounded-md tracking-wider text-xs">
                            {item.code}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.html && (
                      <button
                        type="button"
                        onClick={() => setSelectedEmail(item)}
                        className="text-[11px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 px-2 py-1 bg-white border border-teal-200 rounded-md"
                      >
                        <Eye className="w-3 h-3" />
                        Ver Plantilla
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Email Template Viewer */}
        {selectedEmail && (
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-teal-400" />
                Vista Previa del Correo Enviado a {selectedEmail.recipientEmail}
              </h5>
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                ✕ Cerrar Vista
              </button>
            </div>
            <div
              className="bg-white text-slate-900 p-4 rounded-lg overflow-x-auto max-h-64"
              dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
            />
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
