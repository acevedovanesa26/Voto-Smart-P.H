import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  UserPlus,
  Vote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Alert, Badge, Button, Modal } from '../common/UIComponents';
import { PasswordStrengthIndicator, validatePasswordPolicy } from './PasswordStrengthIndicator';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenForgotPassword: (initialIdentifier?: string) => void;
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
  const { login, loginVoterWithOtp, registerVoterPassword, complex } = useAuth();
  const [activeTab, setActiveTab] = useState<'voter' | 'admin'>(initialRole);

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Voter sub-mode: 'password' | 'activate'
  const [voterSubMode, setVoterSubMode] = useState<'password' | 'activate'>('password');

  // Voter credentials
  const [voterCedula, setVoterCedula] = useState('');
  const [voterPassword, setVoterPassword] = useState('');
  const [showVoterPassword, setShowVoterPassword] = useState(false);

  // Voter Activation (Cédula -> Código -> Contraseña)
  const [activateStep, setActivateStep] = useState<'request' | 'verify'>('request');
  const [activationCode, setActivationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Shared voter metadata
  const [maskedEmail, setMaskedEmail] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterApto, setVoterApto] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startCooldown = (seconds = 30) => {
    setResendCooldown(seconds);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

  // Voter login with Password
  const handleVoterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = voterCedula.trim();
    if (!doc) {
      setError('Por favor ingrese su número de cédula.');
      return;
    }
    if (!voterPassword.trim()) {
      setError('Por favor ingrese su contraseña.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await login(doc, voterPassword.trim());
      onClose();
      if (onSuccessLogin) onSuccessLogin('owner');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('contraseña') || msg.toLowerCase().includes('credenciales')) {
        setError(`${msg} Si aún no has registrado tu contraseña o es tu primera vez, puedes activarla haciendo clic en "Crear o Activar Contraseña" abajo.`);
      } else {
        setError(msg || 'Error al iniciar sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Voter Request Activation Code
  const handleRequestActivation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const doc = voterCedula.trim();
    if (!doc) {
      setError('Por favor ingrese su número de cédula.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.requestVoterActivation(doc);
      setMaskedEmail(res.maskedEmail);
      setVoterName(res.name);
      setVoterApto(res.apartment ? `${res.building ? res.building + ' - ' : ''}${res.apartment}` : '');
      setActivationCode('');
      setActivateStep('verify');
      setSuccessMessage(`Hemos enviado un código de 6 dígitos al correo registrado ${res.maskedEmail}.`);
      startCooldown(30);
    } catch (err: any) {
      setError(err.message || 'No se encontró la cédula en el censo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Voter Register Password
  const handleRegisterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = voterCedula.trim();
    const code = activationCode.trim().replace(/\D/g, '');
    if (!code || code.length < 4) {
      setError('Por favor ingrese el código de 6 dígitos recibido.');
      return;
    }
    const validation = validatePasswordPolicy(newPassword);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'La contraseña no cumple con la política de seguridad.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await registerVoterPassword(doc, code, newPassword);
      onClose();
      if (onSuccessLogin) onSuccessLogin('owner');
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setIsLoading(false);
    }
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
            <span>Ingreso Votante</span>
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

        {error && (
          <div className="space-y-2">
            <Alert type="error">{error}</Alert>
            {activeTab === 'voter' && onOpenRegister && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
                <span className="text-[11px]">¿No estás registrado en el censo?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegister();
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] whitespace-nowrap shadow-xs"
                >
                  Registrarme al Censo
                </button>
              </div>
            )}
          </div>
        )}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {/* TAB 1: VOTER ACCESS */}
        {activeTab === 'voter' && (
          <div className="space-y-4">
            {/* VOTER MODE 1: PASSWORD */}
            {voterSubMode === 'password' && (
              <form onSubmit={handleVoterPasswordSubmit} className="space-y-3.5">
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
                      placeholder="ej: 12345678"
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
                        onOpenForgotPassword(voterCedula);
                      }}
                      className="text-xs font-semibold text-teal-600 hover:underline"
                    >
                      ¿Olvidó contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showVoterPassword ? 'text' : 'password'}
                      required
                      value={voterPassword}
                      onChange={(e) => setVoterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVoterPassword(!showVoterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showVoterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="md"
                  className="w-full bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
                  isLoading={isLoading}
                >
                  Ingresar a Votar
                </Button>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200 text-center">
                    <p className="text-[11px] text-teal-900 mb-1">¿Primera vez o sin contraseña?</p>
                    <button
                      type="button"
                      onClick={() => {
                        setVoterSubMode('activate');
                        setActivateStep('request');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="w-full py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Crear o Activar Contraseña con Código a tu Correo</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* VOTER MODE 2: ACTIVATE ACCOUNT / REGISTER PASSWORD */}
            {voterSubMode === 'activate' && (
              <div className="space-y-3.5">
                {activateStep === 'request' ? (
                  <form onSubmit={handleRequestActivation} className="space-y-3.5">
                    <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200 text-teal-900 text-xs">
                      Ingrese su cédula. Recibirá un código de 6 dígitos a su correo electrónico para crear su contraseña.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Cédula de Copropietario
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={voterCedula}
                          onChange={(e) => setVoterCedula(e.target.value)}
                          placeholder="ej: 12345678"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white font-medium text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVoterSubMode('password')}
                        className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 flex items-center gap-1 font-semibold"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Atrás</span>
                      </button>

                      <Button
                        type="submit"
                        size="md"
                        className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
                        isLoading={isLoading}
                      >
                        Enviar Código al Correo
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterPassword} className="space-y-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <p className="font-bold text-slate-900">{voterName} {voterApto && `(${voterApto})`}</p>
                      <p className="text-[11px] text-slate-600">Código enviado a: <strong className="text-teal-700">{maskedEmail}</strong></p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Código de 6 Dígitos
                        </label>
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || isLoading}
                          onClick={() => handleRequestActivation()}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-800 disabled:text-slate-400 disabled:no-underline hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono font-bold rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Crear Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Confirmar
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {newPassword && <PasswordStrengthIndicator password={newPassword} />}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActivateStep('request')}
                        className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 flex items-center gap-1 font-semibold"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Atrás</span>
                      </button>

                      <Button
                        type="submit"
                        size="md"
                        className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold text-sm"
                        isLoading={isLoading}
                      >
                        Registrar e Ingresar
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADMINISTRATOR */}
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
                  placeholder="ejemplo@correo.com"
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
                    onOpenForgotPassword(adminEmail);
                  }}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="modal-admin-password"
                  type={showAdminPassword ? "text" : "password"}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                  aria-label={showAdminPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showAdminPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showAdminPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 text-sm"
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
