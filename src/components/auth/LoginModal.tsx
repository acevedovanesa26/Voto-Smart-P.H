import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserPlus,
  Vote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Alert, Badge, Button, Modal } from '../common/UIComponents';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenForgotPassword: () => void;
  onOpenRegister?: () => void;
  initialRole?: 'admin' | 'voter';
  onSuccessLogin?: (role: 'admin' | 'owner') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenForgotPassword,
  onOpenRegister,
  initialRole = 'voter',
  onSuccessLogin
}) => {
  const { login, loginVoterWithOtp, complex } = useAuth();
  const [activeTab, setActiveTab] = useState<'voter' | 'admin'>(initialRole);

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Voter OTP credentials (Cedula -> Code from email)
  const [voterCedula, setVoterCedula] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterApto, setVoterApto] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin login handler
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setError('Por favor ingrese su correo electrónico institucional.');
      return;
    }
    if (!adminPassword.trim()) {
      setError('Por favor ingrese su contraseña.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await login(adminEmail.trim(), adminPassword.trim());
      onClose();
      if (onSuccessLogin) onSuccessLogin('admin');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Verifique su correo y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  // Voter step 1: Request OTP with Cedula
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!voterCedula.trim()) {
      setError('Por favor ingrese su número de cédula o documento de identidad.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.requestVoterOtp(voterCedula.trim());
      setMaskedEmail(res.maskedEmail);
      setVoterName(res.name);
      setVoterApto(res.apartment ? `${res.building ? res.building + ' - ' : ''}${res.apartment}` : '');
      setOtpStep('verify');
      setSuccessMessage(`Hemos enviado un código de 6 dígitos a su correo ${res.maskedEmail}. Revisa tu bandeja de entrada o spam.`);
    } catch (err: any) {
      setError(err.message || 'No se encontró la cédula en el censo del conjunto.');
    } finally {
      setIsLoading(false);
    }
  };

  // Voter step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setError('Por favor ingrese el código de 6 dígitos que recibió en su correo.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await loginVoterWithOtp(voterCedula.trim(), otpCode.trim());
      onClose();
      if (onSuccessLogin) onSuccessLogin('owner');
    } catch (err: any) {
      setError(err.message || 'Código de verificación incorrecto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetVoterForm = () => {
    setOtpStep('request');
    setOtpCode('');
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acceso Seguro a VotoSmart" maxWidth="md">
      <div className="space-y-4 text-xs">
        {/* Role Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('voter');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'voter'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Vote className={`w-4 h-4 ${activeTab === 'voter' ? 'text-teal-600' : ''}`} />
            <span>Ingreso Votante (Cédula)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-teal-600' : ''}`} />
            <span>Administrador / Mesa</span>
          </button>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {/* TAB 1: VOTER / OWNER ACCESS BY CÉDULA + EMAIL CODE */}
        {activeTab === 'voter' && (
          <div className="space-y-4">
            {otpStep === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-3.5">
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/80 text-teal-900">
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>Acceso para Copropietarios y Apoderados</span>
                  </p>
                  <p className="text-[11px] text-teal-800 mt-1">
                    Ingrese su número de cédula o documento registrado. Le enviaremos un código de seguridad instantáneo a su correo electrónico.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número de Cédula / Documento de Identidad
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={voterCedula}
                      onChange={(e) => setVoterCedula(e.target.value)}
                      placeholder="Ej: 79845612 o 52987123"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white font-medium text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="md"
                  className="w-full bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
                  isLoading={isLoading}
                >
                  Solicitar Código de Acceso
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-xs">{voterName}</span>
                    {voterApto && <Badge variant="teal" size="sm">{voterApto}</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Código enviado a: <strong className="text-teal-700">{maskedEmail}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Código de 6 Dígitos
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white font-mono text-center text-lg tracking-widest font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Revise su bandeja de entrada o spam para copiar el código recibido.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetVoterForm}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Cambiar Cédula</span>
                  </button>

                  <Button
                    type="submit"
                    size="md"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold text-sm"
                    isLoading={isLoading}
                  >
                    Ingresar a Votar
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: ADMINISTRATOR / DIGNITARIES */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correo Electrónico Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@votosmart.app"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white font-medium text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenForgotPassword();
                  }}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white font-medium text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
              isLoading={isLoading}
            >
              Ingresar al Panel de Control
            </Button>
          </form>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {onOpenRegister ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>¿No está registrado en el censo? Regístrese aquí</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
