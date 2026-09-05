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

interface RoleDecisionViewProps {
  onEnterAdmin: () => void;
  onEnterVoter: () => void;
  onOpenForgotPassword: () => void;
  onOpenRegister: () => void;
  onOpenComplexSwitcher?: () => void;
}

export const RoleDecisionView: React.FC<RoleDecisionViewProps> = ({
  onEnterAdmin,
  onEnterVoter,
  onOpenForgotPassword,
  onOpenRegister
}) => {
  const { login, loginVoterWithOtp, complex } = useAuth();

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Voter OTP state (Cédula -> Código enviado al Correo)
  const [voterCedula, setVoterCedula] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterApto, setVoterApto] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isLoadingVoter, setIsLoadingVoter] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState<string | null>(null);
  const [errorVoter, setErrorVoter] = useState<string | null>(null);
  const [successVoter, setSuccessVoter] = useState<string | null>(null);

  // Admin Login
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

  // Voter Request OTP
  const handleRequestOtp = async (cedulaToUse?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const doc = (cedulaToUse || voterCedula).trim();
    if (!doc) {
      setErrorVoter('Por favor ingrese su número de cédula o documento de identidad.');
      return;
    }
    setIsLoadingVoter(true);
    setErrorVoter(null);
    setSuccessVoter(null);
    try {
      const res = await api.requestVoterOtp(doc);
      setMaskedEmail(res.maskedEmail);
      setVoterName(res.name);
      setVoterApto(res.apartment ? `${res.building ? res.building + ' - ' : ''}${res.apartment}` : '');
      setOtpCode('');
      setOtpStep('verify');
      setSuccessVoter(`Hemos enviado su código de seguridad de 6 dígitos al correo registrado ${res.maskedEmail}. Por favor revise su bandeja de entrada o spam.`);
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorVoter(err.message || 'No se encontró la cédula en el censo del conjunto.');
    } finally {
      setIsLoadingVoter(false);
    }
  };

  // Voter Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToVerify = otpCode.trim();
    if (!codeToVerify || codeToVerify.length < 4) {
      setErrorVoter('Por favor ingrese el código de 6 dígitos que recibió en su correo.');
      return;
    }
    setIsLoadingVoter(true);
    setErrorVoter(null);
    try {
      await loginVoterWithOtp(voterCedula.trim(), codeToVerify);
      onEnterVoter();
    } catch (err: any) {
      setErrorVoter(err.message || 'Código de verificación incorrecto o expirado.');
    } finally {
      setIsLoadingVoter(false);
    }
  };

  const handleResetVoter = () => {
    setOtpStep('request');
    setOtpCode('');
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

        <div className="inline-flex items-center gap-2 bg-slate-100/90 border border-slate-200 px-4 py-1.5 rounded-xl text-xs text-slate-700">
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>Conjunto Activo: <strong className="text-slate-900">{complex?.name}</strong></span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 font-medium">NIT: {complex?.nit || '901.458.789-2'}</span>
        </div>
      </div>

      {/* Dual Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* CARD 1: VOTER ACCESS (CÉDULA + CÓDIGO) */}
        <Card className="p-4 sm:p-8 flex flex-col justify-between border-2 border-teal-500 shadow-lg shadow-teal-500/5 bg-white">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
              <Vote className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Ingreso Copropietario / Votante
                </h2>
                <Badge variant="teal" size="sm">Cédula + Código</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ingrese con su número de cédula. Se enviará un código de verificación seguro a su correo electrónico registrado para habilitar su voto.
              </p>
            </div>

            {errorVoter && (
              <div className="space-y-2">
                <Alert type="error">{errorVoter}</Alert>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
                  <span className="text-[11px] leading-tight">¿Tu cédula no aparece en el censo aún?</span>
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

            {/* Step 1: Document Request */}
            {otpStep === 'request' ? (
              <form onSubmit={(e) => handleRequestOtp(undefined, e)} className="space-y-3.5 pt-2 text-xs">
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
                      placeholder="Ej: 79845612 o 52987123"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </div>

                {/* Quick Demo ID selector */}
                <div className="pt-1 pb-1">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Cédulas registradas de prueba (haz clic para probar):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setVoterCedula('1.098.765.432');
                        handleRequestOtp('1.098.765.432');
                      }}
                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300 rounded-lg text-[11px] font-semibold transition-colors border"
                    >
                      1.098.765.432 (Vanesa - Gmail)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoterCedula('41.905.432');
                        handleRequestOtp('41.905.432');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-lg text-[11px] font-medium text-slate-700 transition-colors border border-slate-200"
                    >
                      41.905.432 (Elena - Hotmail)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoterCedula('1.020.345.678');
                        handleRequestOtp('1.020.345.678');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 rounded-lg text-[11px] font-medium text-slate-700 transition-colors border border-slate-200"
                    >
                      1.020.345.678 (Fernando - Outlook)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoterCedula('19.876.543');
                        handleRequestOtp('19.876.543');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 rounded-lg text-[11px] font-medium text-slate-700 transition-colors border border-slate-200"
                    >
                      19.876.543 (Roberto - Yahoo)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoterCedula('79.845.612');
                        handleRequestOtp('79.845.612');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 rounded-lg text-[11px] font-medium text-slate-700 transition-colors border border-slate-200"
                    >
                      79.845.612 (Carlos - Gmail)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Envío ultra-rápido compatible con Gmail, Outlook, Hotmail, Yahoo, iCloud y correos corporativos.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="md"
                  className="w-full bg-teal-600 hover:bg-teal-700 font-bold py-2.5 text-sm"
                  isLoading={isLoadingVoter}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Solicitar Código al Correo
                </Button>
              </form>
            ) : (
              /* Step 2: Code Verification */
              <form onSubmit={handleVerifyOtp} className="space-y-3.5 pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{voterName}</span>
                    {voterApto && <Badge variant="teal" size="sm">{voterApto}</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Código enviado al correo registrado: <strong className="text-teal-700">{maskedEmail}</strong>
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
                      onClick={() => handleRequestOtp()}
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
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 849201"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-mono text-center text-lg tracking-widest font-bold focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Revise su bandeja de entrada o carpeta de correo no deseado (spam) en <strong>{maskedEmail}</strong> e introduzca el código de seguridad recibido.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetVoter}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 flex items-center gap-1 font-semibold text-xs"
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
                    Validar e Ingresar a Votar
                  </Button>
                </div>
              </form>
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
                    placeholder="administracion@torresdelparque.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase">Contraseña</label>
                  <button
                    type="button"
                    onClick={onOpenForgotPassword}
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

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  Los roles de Presidente, Contador y Secretaria son creados por el Administrador desde el panel de control.
                </span>
              </div>

              <Button
                type="submit"
                size="md"
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 text-sm"
                isLoading={isLoadingAdmin}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Ingresar al Panel de Control
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Footer Registration Bar (Exclusive for Owners) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 text-slate-700">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">¿Es un nuevo copropietario o residente?</p>
            <p className="text-slate-500">Regístrese con sus datos del inmueble para acceder a las votaciones de su copropiedad.</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenRegister}
          className="bg-teal-600 hover:bg-teal-700 font-bold w-full sm:w-auto"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Registrar Copropietario
        </Button>
      </div>
    </div>
  );
};
