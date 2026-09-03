import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UserRole } from '../../types';
import { Alert, Badge, Button, Modal } from '../common/UIComponents';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, role, complex, logout, updateProfileState } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'session'>('info');

  // Info Tab Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');

  // Password Tab Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // States
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDocumentType(user.documentType || 'CC');
      setDocumentNumber(user.documentNumber || '');
      setBuilding(user.building || '');
      setApartment(user.apartment || '');
      setInfoMessage(null);
      setPassMessage(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const roleLabels: Record<UserRole, { label: string; badge: 'teal' | 'indigo' | 'emerald' | 'amber' | 'slate' }> = {
    superadmin: { label: 'Super Administrador', badge: 'indigo' },
    admin: { label: 'Administrador P.H.', badge: 'teal' },
    president: { label: 'Presidente de Asamblea', badge: 'emerald' },
    accountant: { label: 'Contador P.H.', badge: 'amber' },
    secretary: { label: 'Secretaria de Asamblea', badge: 'teal' },
    fiscal_auditor: { label: 'Revisor Fiscal', badge: 'amber' },
    owner: { label: 'Copropietario / Votante', badge: 'slate' }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);

    if (!name.trim()) {
      setInfoMessage({ type: 'error', text: 'El nombre completo es obligatorio.' });
      return;
    }
    if (!email.trim()) {
      setInfoMessage({ type: 'error', text: 'El correo electrónico es obligatorio.' });
      return;
    }

    try {
      setIsSavingInfo(true);
      const res = await api.updateProfile(user.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        documentType: documentType as any,
        documentNumber: documentNumber.trim(),
        building: building.trim(),
        apartment: apartment.trim()
      });

      updateProfileState(res.user);
      setInfoMessage({
        type: 'success',
        text: '¡Información personal actualizada correctamente!'
      });
    } catch (err: any) {
      setInfoMessage({
        type: 'error',
        text: err.message || 'Error al guardar los cambios en su perfil.'
      });
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (!currentPassword.trim()) {
      setPassMessage({ type: 'error', text: 'Debe ingresar su contraseña actual.' });
      return;
    }
    if (newPassword.trim().length < 6) {
      setPassMessage({ type: 'error', text: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: 'error', text: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }

    try {
      setIsChangingPass(true);
      const res = await api.changePassword(user.id, currentPassword.trim(), newPassword.trim());
      setPassMessage({
        type: 'success',
        text: res.message || '¡Contraseña actualizada con éxito!'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMessage({
        type: 'error',
        text: err.message || 'No se pudo actualizar la contraseña. Verifique los datos.'
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn my-4">
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-teal-400/40 shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black font-display text-white truncate">
                  {user.name}
                </h2>
                <Badge variant={roleLabels[role]?.badge || 'teal'} size="sm">
                  {roleLabels[role]?.label || role}
                </Badge>
              </div>
              <p className="text-xs text-teal-200 truncate mt-0.5">{user.email}</p>
              {complex && (
                <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-1 truncate">
                  <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="truncate">{complex.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-3 sm:px-6 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'info'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Actualizar Información</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'password'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Cambiar Contraseña</span>
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'session'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 max-h-[68vh] overflow-y-auto">
          {/* TAB 1: ACTUALIZAR INFORMACIÓN */}
          {activeTab === 'info' && (
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              {infoMessage && (
                <Alert type={infoMessage.type}>{infoMessage.text}</Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Carlos Gómez"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teléfono Celular
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="NIT">NIT Persona Jurídica</option>
                    <option value="PAS">Pasaporte (PAS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número de Documento
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Ej: 79845612"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Torre / Edificio / Interior
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="Ej: Torre 2 o Interior A"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Apartamento / Casa
                  </label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Ej: 302 o Casa 14"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Readonly info badges */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span className="text-slate-600">Coeficiente asignado:</span>
                  <span className="font-bold text-slate-900">{user.coefficient ?? 5.0}%</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Activo en Sistema
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSavingInfo}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="bg-teal-600 hover:bg-teal-700 font-bold"
                >
                  Actualizar Información
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: CAMBIAR CONTRASEÑA */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 flex items-start gap-2">
                <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Protege tu cuenta. Tu nueva contraseña debe tener mínimo 6 caracteres. Si eres copropietario o directivo, asegúrate de no compartirla.
                </span>
              </div>

              {passMessage && (
                <Alert type={passMessage.type}>{passMessage.text}</Alert>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu clave actual"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  (Para usuarios iniciales de demostración, la clave por defecto es <code>admin123</code>)
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-rose-400'
                        : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    Las contraseñas no coinciden
                  </p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isChangingPass}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  className="bg-teal-600 hover:bg-teal-700 font-bold"
                >
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: SESIÓN & CERRAR SESIÓN */}
          {activeTab === 'session' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Detalles de la Sesión Actual
                </h3>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p>
                    <strong className="text-slate-800">Usuario:</strong> {user.name}
                  </p>
                  <p>
                    <strong className="text-slate-800">Correo:</strong> {user.email}
                  </p>
                  <p>
                    <strong className="text-slate-800">Rol Activo:</strong>{' '}
                    {roleLabels[role]?.label || role}
                  </p>
                  {complex && (
                    <p>
                      <strong className="text-slate-800">Conjunto:</strong> {complex.name} (NIT {complex.nit})
                    </p>
                  )}
                  <p>
                    <strong className="text-slate-800">Seguridad:</strong> Sesión verificada bajo marco Ley 675 de 2001
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>¿Deseas salir del sistema?</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Al cerrar sesión se desconectará tu usuario de esta sesión. Puedes volver a ingresar en cualquier momento con tus credenciales o mediante código seguro a tu correo.
                </p>
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={handleLogout}
                    leftIcon={<LogOut className="w-4 h-4" />}
                    className="w-full sm:w-auto font-bold"
                  >
                    Cerrar Sesión Definitivamente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
