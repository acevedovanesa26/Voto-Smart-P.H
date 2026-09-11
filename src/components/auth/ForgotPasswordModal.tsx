import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Alert, Button, Modal } from '../common/UIComponents';
import { PasswordStrengthIndicator, validatePasswordPolicy } from './PasswordStrengthIndicator';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
  initialIdentifier?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin,
  initialIdentifier = ''
}) => {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sync initial identifier if provided
  React.useEffect(() => {
    if (initialIdentifier && !identifier) {
      setIdentifier(initialIdentifier);
    }
  }, [initialIdentifier]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Por favor ingrese su correo electrónico o número de cédula.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(identifier.trim());
      setInfoMessage(res.message || `Hemos enviado un código de seguridad de 6 dígitos a su correo electrónico. Revisa tu bandeja de entrada o spam.`);
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
    const validation = validatePasswordPolicy(newPassword);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'La nueva contraseña no cumple con los requisitos mínimos de seguridad.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.resetPassword(identifier.trim(), code.trim(), newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setStep('email');
    setIdentifier('');
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
              Ingresa el <strong>correo electrónico</strong> o tu <strong>número de cédula</strong> registrado en la copropiedad. Te enviaremos un código de seguridad de 6 dígitos a tu correo verificado para restablecer tu contraseña.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Cédula o Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ej: 1020304050 o tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium text-slate-900 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Acepta tu número de cédula o el correo que tienes registrado en la administración.
              </p>
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
                Ingresa el código que acabamos de enviar a tu correo electrónico registrado.
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

            {/* Password Strength Indicator */}
            {newPassword && (
              <PasswordStrengthIndicator password={newPassword} />
            )}

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="w-1/2"
                onClick={() => setStep('email')}
              >
                Volver
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
