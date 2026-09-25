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
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  UserPlus,
  Vote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Alert, Badge, Button, Card } from '../common/UIComponents';
import { PasswordStrengthIndicator, validatePasswordPolicy } from './PasswordStrengthIndicator';

interface RoleDecisionViewProps {
  onEnterAdmin: () => void;
  onEnterVoter: () => void;
  onOpenForgotPassword: (initialIdentifier?: string) => void;
  onOpenRegister: () => void;
  onOpenComplexSwitcher?: () => void;
}

export const RoleDecisionView: React.FC<RoleDecisionViewProps> = ({
  onEnterAdmin,
  onEnterVoter,
  onOpenForgotPassword,
  onOpenRegister,
  onOpenComplexSwitcher
}) => {
  const { login, loginVoterWithOtp, registerVoterPassword, complex, complexes, switchComplex } = useAuth();

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Voter Mode: 'password' (default) | 'activate' (first-time password setup with email verification)
  const [voterMode, setVoterMode] = useState<'password' | 'activate'>('password');

  // Voter password login state
  const [voterCedula, setVoterCedula] = useState('');
  const [voterPassword, setVoterPassword] = useState('');
  const [showVoterPassword, setShowVoterPassword] = useState(false);

  // Voter activation state (Cédula -> Código a correo -> Nueva Contraseña)
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

  // Loading and alerts
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isLoadingVoter, setIsLoadingVoter] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState<string | null>(null);
  const [errorVoter, setErrorVoter] = useState<string | null>(null);
  const [successVoter, setSuccessVoter] = useState<string | null>(null);

  // Start cooldown timer for resend buttons
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

  // 1. Admin Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setErrorAdmin('Por favor ingrese su correo electrónico registrado.');
      return;
    }
    if (!adminPassword.trim()) {
      setErrorAdmin('Por favor ingrese su contraseña.');
      return;
    }
    setIsLoadingAdmin(true);
    setErrorAdmin(null);
    try {
      await login(adminEmail.trim(), adminPassword.trim());
      onEnterAdmin();
    } catch (err: any) {
      setErrorAdmin(err.message || 'Credenciales inválidas. Verifique su correo y contraseña.');
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  // 2. Voter Login with Password
  const handleVoterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = voterCedula.trim();
    if (!doc) {
      setErrorVoter('Por favor ingrese su número de cédula o documento de identidad.');
      return;
    }
    if (!voterPassword.trim()) {
      setErrorVoter('Por favor ingrese su contraseña.');
      return;
    }

    setIsLoadingVoter(true);
    setErrorVoter(null);
    try {
      await login(doc, voterPassword.trim());
      onEnterVoter();
    } catch (err: any) {
      // Check if user has no password yet
      const msg = err.message || '';
      if (msg.toLowerCase().includes('contraseña') || msg.toLowerCase().includes('credenciales')) {
        setErrorVoter(`${msg} Si aún no has registrado tu contraseña o es tu primera vez, puedes activarla con el botón "Activar o Crear Contraseña" más abajo.`);
      } else {
        setErrorVoter(msg || 'Error al iniciar sesión. Verifique sus datos.');
      }
    } finally {
      setIsLoadingVoter(false);
    }
  };

  // 3. Voter Request Activation Code (to register password)
  const handleRequestActivation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const doc = voterCedula.trim();
    if (!doc) {
      setErrorVoter('Por favor ingrese su número de cédula o documento de identidad.');
      return;
    }

    setIsLoadingVoter(true);
    setErrorVoter(null);
    setSuccessVoter(null);
    try {
      const res = await api.requestVoterActivation(doc);
      setMaskedEmail(res.maskedEmail);
      setVoterName(res.name);
      setVoterApto(res.apartment ? `${res.building ? res.building + ' - ' : ''}${res.apartment}` : '');
      setActivationCode('');
      setActivateStep('verify');
      setSuccessVoter(`Hemos enviado un código de verificación de 6 dígitos a ${res.maskedEmail}. Revise su bandeja de entrada o carpeta de spam.`);
      startCooldown(30);
    } catch (err: any) {
      setErrorVoter(err.message || 'No se encontró la cédula en el censo de copropietarios.');
    } finally {
      setIsLoadingVoter(false);
    }
  };

  // 4. Voter Register Password with Code
  const handleRegisterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = voterCedula.trim();
    const code = activationCode.trim().replace(/\D/g, '');

    if (!code || code.length < 4) {
      setErrorVoter('Por favor ingrese el código de 6 dígitos recibido en su correo.');
      return;
    }

    const validation = validatePasswordPolicy(newPassword);
    if (!validation.isValid) {
      setErrorVoter(validation.errorMessage || 'La contraseña no cumple con los requisitos mínimos de seguridad.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorVoter('Las contraseñas no coinciden. Por favor verifíquelas.');
      return;
    }

    setIsLoadingVoter(true);
    setErrorVoter(null);
    try {
      await registerVoterPassword(doc, code, newPassword);
      setSuccessVoter('¡Contraseña registrada exitosamente! Ingresando a la sala de votación...');
      setTimeout(() => {
        onEnterVoter();
      }, 500);
    } catch (err: any) {
      setErrorVoter(err.message || 'Código de verificación incorrecto o expirado.');
    } finally {
      setIsLoadingVoter(false);
    }
  };

  const handleResetVoterMode = (mode: 'password' | 'activate') => {
    setVoterMode(mode);
    setActivateStep('request');
    setActivationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorVoter(null);
    setSuccessVoter(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 sm:py-8 animate-fadeIn">
      {/* Header & Active Complex Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Sistema Oficial de Asambleas & Votaciones PH
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
          Ingreso a la Plataforma
        </h1>

        {/* Interactive Residential Complex Selector (Selection-only for voters, no creation) */}
        <div className="max-w-2xl mx-auto p-4 sm:p-5 bg-gradient-to-br from-white via-teal-50/30 to-slate-50 border-2 border-teal-500/40 rounded-3xl shadow-sm text-left transition-all hover:border-teal-500/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                {complex?.logo || '🏢'}
              </div>
              <div>
                <span className="text-[11px] font-black text-teal-900 uppercase tracking-wider block">
                  Copropiedad / Conjunto Activo
                </span>
                <span className="text-xs text-slate-500">
                  Selecciona la copropiedad donde vas a votar o administrar:
                </span>
              </div>
            </div>

            {complexes.length > 1 && onOpenComplexSwitcher && (
              <button
                type="button"
                onClick={onOpenComplexSwitcher}
                className="text-[11px] text-teal-800 hover:text-teal-950 font-bold bg-white px-2.5 py-1 rounded-lg border border-teal-200 hover:border-teal-400 shadow-2xs transition-all self-start sm:self-auto shrink-0 flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Explorar lista ({complexes.length})
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={complex?.id || ''}
              onChange={(e) => {
                if (e.target.value) {
                  switchComplex(e.target.value);
                }
              }}
              className="w-full pl-3.5 pr-10 py-3 bg-white hover:bg-teal-50/40 border-2 border-teal-500/50 rounded-2xl text-slate-900 font-extrabold text-sm sm:text-base focus:ring-3 focus:ring-teal-500/30 focus:outline-hidden cursor-pointer shadow-xs transition-all appearance-none"
            >
              {complexes.map((c) => (
                <option key={c.id} value={c.id} className="font-bold text-slate-900 py-1">
                  🏢 {c.name} — {c.city} (NIT: {c.nit})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-teal-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-teal-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">📍 {complex?.address}, {complex?.city}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">NIT: {complex?.nit}</span>
              <span className="text-slate-300">•</span>
              <span className="text-teal-800 font-bold">{complex?.totalUnits} unidades</span>
            </div>
            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Conjunto Seleccionado
            </span>
          </div>
        </div>
      </div>

      {/* Dual Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* CARD 1: VOTER ACCESS (CÉDULA + CONTRASEÑA O ACTIVACIÓN POR CÓDIGO A CORREO) */}
        <Card className="p-4 sm:p-8 flex flex-col justify-between border-2 border-teal-500 shadow-lg shadow-teal-500/5 bg-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                <Vote className="w-7 h-7" />
              </div>
              {voterMode === 'password' && <Badge variant="teal" size="sm">Cédula + Contraseña</Badge>}
              {voterMode === 'activate' && <Badge variant="teal" size="sm">Crear Contraseña</Badge>}
              {voterMode === 'otp' && <Badge variant="teal" size="sm">Código Temporal</Badge>}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                Ingreso Copropietario / Votante
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {voterMode === 'password' && 'Ingrese con su cédula y contraseña personal. Si es su primera vez, active su cuenta con el código a su correo.'}
                {voterMode === 'activate' && 'Active su cuenta: ingrese su cédula para recibir un código de seguridad a su correo y crear su contraseña.'}
                {voterMode === 'otp' && 'Acceda de manera rápida solicitando un código de acceso de 6 dígitos que llegará directo a su correo registrado.'}
              </p>
            </div>

            {errorVoter && (
              <div className="space-y-2">
                <Alert type="error">{errorVoter}</Alert>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
                  <span className="text-[11px] leading-tight">¿Tu cédula aún no está en el censo?</span>
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] whitespace-nowrap shadow-xs"
                  >
                    Registrarme al Censo
                  </button>
                </div>
              </div>
            )}

            {successVoter && <Alert type="success">{successVoter}</Alert>}

            {/* --- VOTER MODE 1: LOGIN WITH PASSWORD (DEFAULT) --- */}
            {voterMode === 'password' && (
              <form onSubmit={handleVoterPasswordSubmit} className="space-y-3.5 pt-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => onOpenForgotPassword(voterCedula)}
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
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVoterPassword(!showVoterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showVoterPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showVoterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="md"
                  className="w-full bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
                  isLoading={isLoadingVoter}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ingresar a Sala de Votación
                </Button>

                {/* Switcher to Activation */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 text-center">
                    <p className="text-[11px] text-teal-900 mb-1.5 font-medium">
                      ¿Primera vez o aún no has creado tu contraseña?
                    </p>
                    <button
                      type="button"
                      onClick={() => handleResetVoterMode('activate')}
                      className="w-full py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Crear o Activar Contraseña con Código a tu Correo</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* --- VOTER MODE 2: ACCOUNT ACTIVATION & PASSWORD REGISTRATION --- */}
            {voterMode === 'activate' && (
              <div className="space-y-3.5 pt-2 text-xs">
                {activateStep === 'request' ? (
                  <form onSubmit={handleRequestActivation} className="space-y-3.5">
                    <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-teal-900">
                      <p className="text-[11px] leading-relaxed">
                        Ingresa tu cédula registrada. Te enviaremos un código de verificación de 6 dígitos a tu correo electrónico para que puedas crear tu contraseña personal.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">
                        Número de Cédula / Documento
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={voterCedula}
                          onChange={(e) => setVoterCedula(e.target.value)}
                          placeholder="ej: 12345678"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetVoterMode('password')}
                        className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 flex items-center gap-1 font-semibold"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Atrás</span>
                      </button>

                      <Button
                        type="submit"
                        size="md"
                        className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
                        isLoading={isLoadingVoter}
                      >
                        Enviar Código a mi Correo
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterPassword} className="space-y-3.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-xs">{voterName}</span>
                        {voterApto && <Badge variant="teal" size="sm">{voterApto}</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Código enviado a: <strong className="text-teal-700">{maskedEmail}</strong>
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700 uppercase">
                          Código de 6 Dígitos
                        </label>
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || isLoadingVoter}
                          onClick={() => handleRequestActivation()}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-800 disabled:text-slate-400 disabled:no-underline hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingVoter ? 'animate-spin' : ''}`} />
                          {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={activationCode}
                          onChange={(e) => setActivationCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-mono text-center text-lg tracking-widest font-bold focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Crear Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          >
                            {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Confirmar Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Atrás</span>
                      </button>

                      <Button
                        type="submit"
                        size="md"
                        className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
                        isLoading={isLoadingVoter}
                      >
                        Registrar Contraseña e Ingresar
                      </Button>
                    </div>
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleResetVoterMode('password')}
                    className="text-xs text-slate-500 hover:text-teal-700 font-medium hover:underline"
                  >
                    Ya tengo contraseña, volver al ingreso normal
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* CARD 2: ADMINISTRATOR / MESA DIRECTIVA */}
        <Card className="p-6 sm:p-8 flex flex-col justify-between border-2 border-slate-200 hover:border-slate-300 bg-white">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-7 h-7 text-teal-700" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Administrador & Mesa Directiva
                </h2>
                <Badge variant="slate" size="sm">Acceso Seguro</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Acceso exclusivo para Administrador, Presidente de Asamblea, Secretaria y Contador/Revisor Fiscal con correo y contraseña.
              </p>
            </div>

            {errorAdmin && <Alert type="error">{errorAdmin}</Alert>}

            {/* Admin Login Form */}
            <form onSubmit={handleAdminSubmit} className="space-y-3.5 pt-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Correo Institucional / Registrado</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => onOpenForgotPassword(adminEmail)}
                    className="font-semibold text-teal-600 hover:underline"
                  >
                    ¿Olvidó contraseña?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-password-input"
                    type={showAdminPassword ? "text" : "password"}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                    aria-label={showAdminPassword ? "Ocultar contraseña" : "Ver contraseña"}
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
                isLoading={isLoadingAdmin}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Ingresar al Panel de Control
              </Button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 text-center">
            <p className="text-[11px] text-slate-400">
              Conforme a Ley 675 de 2001 de Propiedad Horizontal en Colombia.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
