import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Alert, Button, Modal } from '../common/UIComponents';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin
}) => {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor ingrese su correo electrónico registrado.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(email);
      setInfoMessage(res.message || `Hemos enviado un código de 6 dígitos al correo ${email}. Revisa tu bandeja de entrada o spam.`);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Por favor ingrese el código de 6 dígitos.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.resetPassword(email, code, newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setInfoMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetAll();
        onClose();
      }}
      title="Recuperación de Contraseña"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {error && <Alert type="error">{error}</Alert>}

        {step === 'email' && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta de copropietario o administrador. Te enviaremos un código de seguridad de 6 dígitos para restablecer tu contraseña.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej: usuario@ejemplo.com o tu_correo@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="w-1/2"
                onClick={() => {
                  resetAll();
                  onClose();
                  onBackToLogin();
                }}
              >
                Volver
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-1/2 bg-teal-600 hover:bg-teal-700 font-bold"
                isLoading={isLoading}
              >
                Enviar Código
              </Button>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {infoMessage && <Alert type="info">{infoMessage}</Alert>}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Código de 6 Dígitos
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono font-bold rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ingresa el código que recibiste en tu correo electrónico.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                    title={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                    title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="w-1/2"
                onClick={() => setStep('email')}
              >
                Cambiar Correo
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-1/2 bg-teal-600 hover:bg-teal-700 font-bold"
                isLoading={isLoading}
              >
                Guardar Contraseña
              </Button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">¡Contraseña Restablecida!</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Su contraseña ha sido actualizada exitosamente. Ya puede iniciar sesión con sus nuevas credenciales.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full bg-teal-600 hover:bg-teal-700 font-bold"
                onClick={() => {
                  resetAll();
                  onClose();
                  onBackToLogin();
                }}
              >
                Iniciar Sesión Ahora
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
