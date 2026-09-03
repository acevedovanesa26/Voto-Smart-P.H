import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Mail,
  PenTool,
  Phone,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { Alert, Badge, Button, Modal } from '../common/UIComponents';

interface StaffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({ isOpen, onClose }) => {
  const { complex } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'president' | 'secretary' | 'accountant' | 'fiscal_auditor' | 'admin'>('president');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStaffUsers();
      setStaff(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar miembros directivos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      setShowAddForm(false);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Por favor ingrese el nombre completo y correo electrónico.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.createStaffUser({
        name,
        email,
        role,
        documentType,
        documentNumber,
        phone,
        password: password.trim() || undefined
      });

      setSuccessMessage(`¡Miembro directivo creado exitosamente! Se le ha asignado la contraseña: ${res.initialPassword} y se ha enviado la notificación a su correo (${email}).`);
      
      // Reset form
      setName('');
      setEmail('');
      setDocumentNumber('');
      setPhone('');
      setPassword('');
      setShowAddForm(false);

      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Error al crear miembro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, staffName: string) => {
    if (!confirm(`¿Está seguro de revocar el cargo y eliminar a ${staffName}?`)) {
      return;
    }
    try {
      await api.deleteStaffUser(id);
      setSuccessMessage(`Se revocó el acceso a ${staffName}.`);
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar miembro');
    }
  };

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
              onClick={() => setShowAddForm(true)}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Miembro</span>
            </Button>
          )}
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {/* Add Staff Form */}
        {showAddForm && (
          <form onSubmit={handleCreateStaff} className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-teal-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <UserPlus className="w-4 h-4 text-teal-700" />
                Registrar Nuevo Miembro de Mesa Directiva
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-teal-700 hover:text-teal-900 text-xs font-bold"
              >
                ✕ Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dra. María Camila Morales"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rol / Cargo a Asignar *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
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
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo Documento</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
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
                  placeholder="1020304050"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono / Celular</label>
                <input
                  type="tel"
                  placeholder="+57 300 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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

        {/* Staff List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-slate-600 px-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Mesa Directiva & Cargos Registrados ({staff.length})
            </span>
            <button
              type="button"
              onClick={loadStaff}
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
                  duties: 'Miembro del equipo'
                };
                const IconComponent = info.icon;
                const isPrimaryAdmin = u.id === 'user-admin';

                return (
                  <div
                    key={u.id}
                    className="p-3.5 bg-white border border-slate-200 hover:border-teal-300 rounded-xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{u.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.badgeColor}`}>
                            {info.label}
                          </span>
                          {isPrimaryAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Principal
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
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Revocar cargo y eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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
