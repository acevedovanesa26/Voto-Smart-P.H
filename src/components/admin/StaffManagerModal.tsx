import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Mail,
  PenTool,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Owner, User, UserRole } from '../../types';
import { Alert, Badge, Button, Modal } from '../common/UIComponents';

interface StaffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const ROLE_INFO: Record<string, { label: string; badgeColor: string; icon: any; duties: string }> = {
  admin: {
    label: 'Administrador Principal / Delegado',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: ShieldCheck,
    duties: 'Control total de la plataforma, quórum, creación de asambleas, gestión de conjuntos y designación de mesa.'
  },
  president: {
    label: 'Presidente de Asamblea',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: UserCheck,
    duties: 'Modera el orden del día, otorga la palabra, abre y cierra las votaciones oficiales en tiempo real.'
  },
  secretary: {
    label: 'Secretaria de Asamblea',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: PenTool,
    duties: 'Redacta notas e intervenciones, elabora y firma el Acta Oficial de la Asamblea (Ley 675).'
  },
  accountant: {
    label: 'Contador / Comisión Verificadora',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileSpreadsheet,
    duties: 'Valida presupuestos, estados financieros, coeficientes y revisa los quórums calculados.'
  },
  fiscal_auditor: {
    label: 'Revisor Fiscal',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Briefcase,
    duties: 'Fiscaliza la legalidad estatutaria de las decisiones y emite concepto técnico.'
  }
};

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const { complex } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'from_census' | 'manual'>('from_census');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mode 1: From census selection
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedOwnerRole, setSelectedOwnerRole] = useState<'president' | 'secretary' | 'accountant' | 'fiscal_auditor' | 'admin'>('president');
  const [ownerCustomPassword, setOwnerCustomPassword] = useState('');

  // Mode 2: Manual fields
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRole, setManualRole] = useState<'president' | 'secretary' | 'accountant' | 'fiscal_auditor' | 'admin'>('president');
  const [manualDocType, setManualDocType] = useState('CC');
  const [manualDocNumber, setManualDocNumber] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPassword, setManualPassword] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffData, ownersData] = await Promise.all([
        api.getStaffUsers(),
        api.getOwners(complex?.id)
      ]);
      setStaff(staffData);
      setOwners(ownersData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar miembros directivos y propietarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setShowAddForm(false);
      setError(null);
      setSuccessMessage(null);
      setSelectedOwnerId('');
      setOwnerSearch('');
    }
  }, [isOpen, complex?.id]);

  // Handle assigning an existing owner
  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId) {
      setError('Por favor seleccione un copropietario de la lista.');
      return;
    }

    const targetOwner = owners.find((o) => o.id === selectedOwnerId);
    if (!targetOwner) {
      setError('Copropietario no encontrado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.createStaffUser({
        ownerId: targetOwner.id,
        name: targetOwner.name,
        email: targetOwner.email,
        role: selectedOwnerRole,
        documentType: targetOwner.documentType,
        documentNumber: targetOwner.documentNumber,
        phone: targetOwner.phone,
        password: ownerCustomPassword.trim() || undefined
      });

      const roleLabel = ROLE_INFO[selectedOwnerRole]?.label || selectedOwnerRole;
      setSuccessMessage(
        `¡${targetOwner.name} (${targetOwner.apartment}) ha sido asignado(a) como ${roleLabel} con éxito! Contraseña de acceso: ${res.initialPassword}`
      );

      // Reset
      setSelectedOwnerId('');
      setOwnerSearch('');
      setOwnerCustomPassword('');
      setShowAddForm(false);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al asignar cargo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle creating external staff manually
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) {
      setError('Por favor ingrese el nombre completo y correo electrónico.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.createStaffUser({
        name: manualName.trim(),
        email: manualEmail.trim().toLowerCase(),
        role: manualRole,
        documentType: manualDocType,
        documentNumber: manualDocNumber.trim(),
        phone: manualPhone.trim(),
        password: manualPassword.trim() || undefined
      });

      const roleLabel = ROLE_INFO[manualRole]?.label || manualRole;
      setSuccessMessage(
        `¡Miembro directivo externo (${manualName}) creado exitosamente como ${roleLabel}! Contraseña asignada: ${res.initialPassword}`
      );

      // Reset
      setManualName('');
      setManualEmail('');
      setManualDocNumber('');
      setManualPhone('');
      setManualPassword('');
      setShowAddForm(false);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al crear miembro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    const isOwner = !!(user.apartment && user.apartment !== 'Mesa Directiva' && user.apartment !== 'Administración');
    const confirmMsg = isOwner
      ? `¿Desea revocar el cargo directivo a ${user.name} (${user.apartment})? Permanecerá en el censo como copropietario.`
      : `¿Está seguro de revocar el cargo y eliminar el acceso de ${user.name}?`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.deleteStaffUser(user.id);
      setSuccessMessage(`Se revocó el cargo a ${user.name}.`);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al revocar cargo');
    }
  };

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId);

  const filteredOwners = owners.filter((o) => {
    if (!ownerSearch.trim()) return true;
    const q = ownerSearch.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.apartment.toLowerCase().includes(q) ||
      o.building.toLowerCase().includes(q) ||
      o.documentNumber.includes(q)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Mesa Directiva & Cargos Administrativos"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Security / Statutory Header */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Control Exclusivo de Administración • Ley 675 de 2001
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              En este panel el <strong>Administrador</strong> crea y asigna de manera segura los roles de <strong>Presidente</strong>, <strong>Secretaria</strong>, <strong>Contador</strong> y <strong>Revisor Fiscal</strong> para <strong>{complex?.name}</strong>.
            </p>
          </div>
          {!showAddForm && (
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 font-bold shrink-0 flex items-center gap-1.5"
              onClick={() => {
                setShowAddForm(true);
                setAddMode('from_census');
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Asignar o Crear Miembro</span>
            </Button>
          )}
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {/* Add / Assign Staff Form */}
        {showAddForm && (
          <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl space-y-4 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wide">
                    Designar Mesa Directiva o Cargo Administrativo
                  </h4>
                  <p className="text-[10px] text-teal-700">Seleccione un copropietario del censo o registre un directivo externo.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-teal-700 hover:text-teal-900 text-xs font-bold px-2 py-1 rounded-md hover:bg-teal-100"
              >
                ✕ Cancelar
              </button>
            </div>

            {/* Sub-mode selector tabs */}
            <div className="grid grid-cols-2 gap-2 bg-teal-100/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAddMode('from_census')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  addMode === 'from_census'
                    ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                    : 'text-teal-700 hover:text-teal-950'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Seleccionar de Copropietarios ({owners.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  addMode === 'manual'
                    ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                    : 'text-teal-700 hover:text-teal-950'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>2. Crear Directivo Externo (Manual)</span>
              </button>
            </div>

            {/* TAB 1: SELECT FROM CENSUS */}
            {addMode === 'from_census' && (
              <form onSubmit={handleAssignOwner} className="space-y-3.5">
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    Buscar y Seleccionar Copropietario del Conjunto:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filtrar por nombre, apartamento, torre o documento..."
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={selectedOwnerId}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="">-- Seleccione un copropietario registrado --</option>
                    {filteredOwners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.apartment} ({o.building}) — {o.name} [Doc: {o.documentNumber}] (Coef: {o.coefficient}%)
                        {o.isCouncilMember ? ` [Ya en Mesa: ${o.councilRole || 'Consejero'}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Owner Details Card */}
                {selectedOwner && (
                  <div className="p-3 bg-white border border-teal-300 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        {selectedOwner.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-teal-100 text-teal-800 border border-teal-200">
                        {selectedOwner.building} - {selectedOwner.apartment}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Documento:</span>
                        <strong>{selectedOwner.documentType} {selectedOwner.documentNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Coeficiente:</span>
                        <strong>{selectedOwner.coefficient}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Correo:</span>
                        <strong className="truncate block" title={selectedOwner.email}>{selectedOwner.email}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Cargo o Rol a Asignar en Mesa Directiva *
                    </label>
                    <select
                      value={selectedOwnerRole}
                      onChange={(e) => setSelectedOwnerRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="president">Presidente de Asamblea</option>
                      <option value="secretary">Secretaria de Asamblea</option>
                      <option value="accountant">Contador / Comisión Verificadora</option>
                      <option value="fiscal_auditor">Revisor Fiscal</option>
                      <option value="admin">Administrador Delegado / Consejo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contraseña de Acceso Directivo (Opcional)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Dejar en blanco para autogenerar o conservar clave"
                        value={ownerCustomPassword}
                        onChange={(e) => setOwnerCustomPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    disabled={!selectedOwnerId}
                    className="bg-teal-600 hover:bg-teal-700 font-bold"
                  >
                    <Award className="w-3.5 h-3.5 mr-1" />
                    Asignar Cargo a Copropietario
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 2: MANUAL CREATION (EXTERNAL STAFF) */}
            {addMode === 'manual' && (
              <form onSubmit={handleCreateManual} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Dra. María Camila Morales"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rol / Cargo a Asignar *</label>
                    <select
                      value={manualRole}
                      onChange={(e) => setManualRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="president">Presidente de Asamblea</option>
                      <option value="secretary">Secretaria de Asamblea</option>
                      <option value="accountant">Contador / Comisión Verificadora</option>
                      <option value="fiscal_auditor">Revisor Fiscal</option>
                      <option value="admin">Administrador Delegado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico (Usuario) *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@correo.com"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contraseña Inicial (Opcional)</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Dejar en blanco para autogenerar"
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tipo Documento</label>
                    <select
                      value={manualDocType}
                      onChange={(e) => setManualDocType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="NIT">NIT Profesional</option>
                      <option value="PAS">Pasaporte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Número Documento</label>
                    <input
                      type="text"
                      placeholder="ej: 12345678"
                      value={manualDocNumber}
                      onChange={(e) => setManualDocNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Teléfono / Celular</label>
                    <input
                      type="tel"
                      placeholder="+57 300 000 0000"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    className="bg-teal-600 hover:bg-teal-700 font-bold"
                  >
                    Guardar y Enviar Credenciales
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Staff List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-slate-600 px-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              Mesa Directiva & Cargos Registrados ({staff.length})
            </span>
            <button
              type="button"
              onClick={loadData}
              className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              Actualizar
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
              Cargando mesa directiva...
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
              No hay cargos directivos registrados aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {staff.map((u) => {
                const info = ROLE_INFO[u.role] || {
                  label: u.role,
                  badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
                  icon: Users,
                  duties: 'Miembro del equipo directivo'
                };
                const IconComponent = info.icon;
                const isPrimaryAdmin = u.id === 'user-admin';
                const isOwner = !!(u.apartment && u.apartment !== 'Mesa Directiva' && u.apartment !== 'Administración');

                return (
                  <div
                    key={u.id}
                    className="p-3.5 bg-white border border-slate-200 hover:border-teal-300 rounded-xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{u.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${info.badgeColor} flex items-center gap-1`}>
                            <Award className="w-3 h-3 text-amber-500" />
                            {info.label}
                          </span>
                          {isOwner && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-teal-600" />
                              {u.apartment} {u.building ? `(${u.building})` : ''} • Coef: {u.coefficient ?? 0}%
                            </span>
                          )}
                          {!isOwner && !isPrimaryAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              👤 Directivo Externo
                            </span>
                          )}
                          {isPrimaryAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              👑 Administrador Principal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {u.email}
                          </span>
                          {u.documentNumber && (
                            <span>Doc: {u.documentType || 'CC'} {u.documentNumber}</span>
                          )}
                          {u.phone && <span>Tel: {u.phone}</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                          {info.duties}
                        </p>
                      </div>
                    </div>

                    {!isPrimaryAdmin && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                          title={isOwner ? 'Revocar cargo de mesa (mantiene copropietario)' : 'Eliminar usuario'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isOwner ? 'Revocar Cargo' : 'Eliminar'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
