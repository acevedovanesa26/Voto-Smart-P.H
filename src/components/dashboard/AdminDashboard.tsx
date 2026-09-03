import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Vote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Assembly, AuditLog, Owner } from '../../types';
import { EmailCenterModal } from '../admin/EmailCenterModal';
import { StaffManagerModal } from '../admin/StaffManagerModal';
import { AssemblyWizard } from '../assembly/AssemblyWizard';
import { ComplexSwitcherModal } from '../common/ComplexSwitcherModal';
import { Alert, Badge, Button, Card, StatCard } from '../common/UIComponents';

interface AdminDashboardProps {
  onSelectAssembly: (assemblyId: string) => void;
  onOpenOwners: () => void;
  onOpenVoterPortal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectAssembly,
  onOpenOwners,
  onOpenVoterPortal
}) => {
  const { user, complex } = useAuth();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showComplexModal, setShowComplexModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [asmList, ownList, aLogs] = await Promise.all([
        api.getAssemblies(),
        api.getOwners(),
        api.getAuditLogs()
      ]);
      setAssemblies(asmList);
      setOwners(ownList);
      setAuditLogs(aLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [complex?.id]);

  const activeAssembly = assemblies.find((a) => a.status === 'in_progress');

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. TOP STATUTORY & COMPLEX SELECTION BAR (EXCLUSIVO ADMINISTRADOR) */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-teal-800/40 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Complex Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Administración Activa • Ley 675 de 2001
              </span>
              <span className="text-[11px] text-slate-400">
                NIT: {complex?.nit || '901.458.789-2'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 font-bold text-lg">
                🏢
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
                  {complex?.name || 'Conjunto Residencial'}
                </h2>
                <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-teal-400" /> {complex?.address}, {complex?.city}</span>
                  <span>•</span>
                  <span>{complex?.totalUnits || owners.length || 120} Unidades Residenciales</span>
                </p>
              </div>
            </div>
          </div>

          {/* Admin Exclusive Actions: Change Complex, Board Staff, Email Center */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowComplexModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-300" />
              <span>Cambiar / Crear Conjunto</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStaffModal(true)}
              className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border-teal-400/40 font-bold text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-300" />
              <span>Mesa Directiva & Roles</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEmailModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 font-bold text-xs flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-teal-300" />
              <span>Centro de Correos</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Panel Administrativo Principal
            </span>
            <Badge variant="teal" size="sm">Sesión Activa</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
            Hola, {user?.name || 'Administrador'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control integral de asambleas, quórum legal, designación de mesa directiva y votaciones digitales seguras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="md"
            variant="outline"
            onClick={onOpenOwners}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Censo Propietarios
          </Button>
          <Button
            size="md"
            variant="primary"
            onClick={() => setShowWizard(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 shadow-md font-bold"
          >
            Nueva Asamblea
          </Button>
        </div>
      </div>

      {/* ACTIVE ASSEMBLY HERO CARD (IF IN PROGRESS) */}
      {activeAssembly && (
        <Card className="p-6 sm:p-8 border-2 border-teal-500 bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-widest text-teal-300">
                  ASAMBLEA EN TRANSMISIÓN EN VIVO
                </span>
                <Badge variant="emerald" size="sm">SESIÓN ABIERTA</Badge>
              </div>

              <h2 className="text-xl sm:text-3xl font-black font-display tracking-tight text-white">
                {activeAssembly.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                {activeAssembly.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-teal-400" /> {activeAssembly.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal-400" /> {activeAssembly.time}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-teal-400" /> {activeAssembly.location}</span>
              </div>
            </div>

            {/* Quorum Stats & Action */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 flex-shrink-0">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[180px]">
                <p className="text-[11px] font-bold text-teal-300 uppercase">Quórum Verificado</p>
                <p className="text-3xl font-black text-white mt-0.5">{activeAssembly.representedQuorum}%</p>
                <p className="text-[10px] text-slate-300 mt-1">
                  {activeAssembly.checkedInOwnersCount} de {activeAssembly.totalOwnersInvited} presentes
                </p>
              </div>

              <Button
                size="lg"
                variant="primary"
                onClick={() => onSelectAssembly(activeAssembly.id)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-black shadow-lg"
              >
                Ingresar a Sala de Control
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Copropietarios"
          value={owners.length}
          subtitle="Censo del conjunto actualizado"
          icon={<Users className="w-6 h-6" />}
          color="teal"
        />
        <StatCard
          title="Asambleas Registradas"
          value={assemblies.length}
          subtitle="Con actas y trazabilidad"
          icon={<FileCheck2 className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title="Quórum Histórico Medio"
          value="76.4%"
          subtitle="Alta participación digital"
          icon={<TrendingUp className="w-6 h-6" />}
          color="indigo"
        />
        <StatCard
          title="Votaciones Totales"
          value="18"
          subtitle="Auditadas criptográficamente"
          icon={<Vote className="w-6 h-6" />}
          color="amber"
        />
      </div>

      {/* Assemblies List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 font-display">
            Historial de Asambleas
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {assemblies.length} registros
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assemblies.map((asm) => (
            <Card
              key={asm.id}
              onClick={() => onSelectAssembly(asm.id)}
              className="p-6 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={asm.status === 'in_progress' ? 'emerald' : asm.status === 'finished' ? 'slate' : 'amber'}>
                    {asm.status === 'in_progress' ? 'EN CURSO' : asm.status === 'finished' ? 'FINALIZADA' : 'PROGRAMADA'}
                  </Badge>
                  <span className="text-xs text-slate-600 font-semibold uppercase">
                    {asm.type}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                  {asm.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {asm.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-teal-600" /> {asm.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-teal-600" /> {asm.time}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-700">Quórum: {asm.representedQuorum}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 mt-4">
                <span>Gestionar Asamblea y Votaciones</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Audit Stream */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Actividad Reciente & Registro de Auditoría</h3>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">Inmutable conforme a Ley 675</span>
        </div>

        <div className="space-y-2">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">{log.userName}:</span>
                <span className="text-slate-600 ml-1.5">{log.details}</span>
              </div>
              <span className="text-[10px] text-slate-600 whitespace-nowrap ml-4">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Modals */}
      <AssemblyWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onAssemblyCreated={(newAsm) => {
          setShowWizard(false);
          loadDashboardData();
          onSelectAssembly(newAsm.id);
        }}
      />

      <StaffManagerModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          loadDashboardData();
        }}
      />

      <EmailCenterModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />

      <ComplexSwitcherModal
        isOpen={showComplexModal}
        onClose={() => {
          setShowComplexModal(false);
          loadDashboardData();
        }}
      />
    </div>
  );
};
