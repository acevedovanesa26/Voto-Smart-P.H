import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Mail,
  MapPin,
  Play,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Vote as VoteIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Assembly,
  AssemblyDocument,
  AssemblyMinutes,
  AssemblyNote,
  AuditLog,
  Candidate,
  EmailLog,
  Owner,
  QuorumAttendance,
  Vote,
  VoteResultSummary
} from '../../types';
import { exportOwnersToExcel, exportQuorumToExcel, exportVoteResultsToExcel } from '../../utils/excelHelper';
import { generateMinutesPDF } from '../../utils/pdfGenerator';
import { Alert, Badge, Button, Card, Modal, StatCard } from '../common/UIComponents';
import { EditAssemblyModal } from './EditAssemblyModal';

interface AssemblyDetailProps {
  assemblyId: string;
  onBack: () => void;
  onOpenVoterPortal: () => void;
}

export const AssemblyDetail: React.FC<AssemblyDetailProps> = ({
  assemblyId,
  onBack,
  onOpenVoterPortal
}) => {
  const { user, complex } = useAuth();
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'quorum' | 'documents' | 'votes' | 'notes' | 'results' | 'minutes' | 'emails' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab Data States
  const [quorum, setQuorum] = useState<QuorumAttendance[]>([]);
  const [documents, setDocuments] = useState<AssemblyDocument[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [notes, setNotes] = useState<AssemblyNote[]>([]);
  const [minutes, setMinutes] = useState<AssemblyMinutes | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [votesResults, setVotesResults] = useState<VoteResultSummary[]>([]);

  // Search & Filter
  const [quorumSearch, setQuorumSearch] = useState('');

  // Modals & Dispatch state
  const [showNewVoteModal, setShowNewVoteModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSendingResults, setIsSendingResults] = useState(false);
  const [isSendingMinutes, setIsSendingMinutes] = useState(false);

  // New Note input
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'general' | 'intervencion' | 'aclaracion' | 'empate' | 'aprobacion'>('general');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Minutes Form State
  const [minuteForm, setMinuteForm] = useState({
    title: '',
    introText: '',
    summary: '',
    conclusions: '',
    observations: ''
  });

  // Load all Assembly data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [asm, qList, dList, vList, nList, mList, eList, aList] = await Promise.all([
        api.getAssembly(assemblyId),
        api.getQuorum(assemblyId),
        api.getDocuments(assemblyId),
        api.getVotes(assemblyId),
        api.getNotes(assemblyId),
        api.getMinutes(assemblyId),
        api.getEmails(assemblyId),
        api.getAuditLogs(assemblyId)
      ]);

      setAssembly(asm);
      setQuorum(qList);
      setDocuments(dList);
      setVotes(vList);
      setNotes(nList);
      setEmailLogs(eList);
      setAuditLogs(aList);

      if (mList && mList.length > 0) {
        setMinutes(mList[0]);
        setMinuteForm({
          title: mList[0].title,
          introText: mList[0].introText,
          summary: mList[0].summary,
          conclusions: mList[0].conclusions,
          observations: mList[0].observations
        });
      }

      // Fetch results for all votes
      const results = await Promise.all(vList.map((v) => api.getVoteResults(v.id).catch(() => null)));
      setVotesResults(results.filter(Boolean) as VoteResultSummary[]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la asamblea');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assemblyId]);

  // Actions
  const handleToggleQuorum = async (ownerId: string, currentStatus: boolean) => {
    try {
      const res = await api.toggleQuorum(assemblyId, ownerId, !currentStatus, user?.name || 'Administración');
      setQuorum((prev) =>
        prev.map((q) => (q.ownerId === ownerId ? { ...q, checkedIn: !currentStatus, checkedInAt: !currentStatus ? new Date().toISOString() : undefined } : q))
      );
      if (assembly) {
        setAssembly({
          ...assembly,
          representedQuorum: Number(res.representedQuorum.toFixed(2)),
          checkedInOwnersCount: res.checkedInCount
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartVote = async (voteId: string) => {
    if (window.confirm('¿Desea abrir oficialmente esta votación para que los copropietarios comiencen a votar?')) {
      try {
        const updated = await api.startVote(voteId, user?.name || 'Administración');
        setVotes((prev) => prev.map((v) => (v.id === voteId ? updated : v)));
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleCloseVote = async (voteId: string) => {
    if (window.confirm('¿Desea cerrar definitivamente la votación y consolidar los resultados?')) {
      try {
        const { vote: updated } = await api.closeVote(voteId, user?.name || 'Administración');
        setVotes((prev) => prev.map((v) => (v.id === voteId ? updated : v)));
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      const added = await api.addNote(assemblyId, {
        content: newNoteContent,
        authorName: user?.name || 'Administración',
        authorRole: user?.role || 'admin',
        category: newNoteCategory
      });
      setNotes((prev) => [...prev, added]);
      setNewNoteContent('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAiSummarizeMinutes = async () => {
    if (!assembly || !complex) return;
    setIsAiGenerating(true);
    try {
      const res = await api.generateAiSummary({
        assemblyTitle: assembly.title,
        complexName: complex.name,
        notes,
        votesResults
      });
      setMinuteForm((prev) => ({
        ...prev,
        summary: res.summary
      }));
    } catch (err: any) {
      alert('Error al generar resumen asistido: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveMinutes = async () => {
    try {
      const saved = await api.saveMinutes(assemblyId, {
        id: minutes?.id,
        title: minuteForm.title || `Acta Oficial - ${assembly?.title}`,
        introText: minuteForm.introText || `En la ciudad de ${complex?.city}, siendo las ${assembly?.time} horas del ${assembly?.date}, se reunieron los copropietarios de ${complex?.name}.`,
        summary: minuteForm.summary,
        votingSummary: votesResults.map((r) => `${r.voteTitle}: ${r.winnerOption ? `Aprobado (${r.winnerOption.label})` : 'Cómputo completado'}`).join('\n'),
        observations: minuteForm.observations,
        conclusions: minuteForm.conclusions || 'Se faculta a la administración para la ejecución de los acuerdos aprobados.',
        status: 'draft',
        generatedBy: user?.name || 'Administración',
        signatures: [
          { role: 'Presidente de Asamblea', name: assembly?.presidentName || 'Presidente', document: 'CC Válida' },
          { role: 'Secretaria Ad-hoc', name: assembly?.secretaryName || 'Secretaria', document: 'CC Válida' },
          { role: 'Administración', name: assembly?.administratorName || 'Administrador', document: 'CC Válida' }
        ]
      });
      setMinutes(saved);
      alert('Acta guardada con éxito.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownloadPDF = () => {
    if (!assembly || !complex || !minutes) {
      alert('Por favor guarde primero el acta para exportar.');
      return;
    }
    generateMinutesPDF(assembly, complex, minutes, votesResults);
  };

  const handleSendResults = async (type: 'all' | 'attended') => {
    try {
      const res = await api.sendResultsEmails(assemblyId, type, `Resultados Oficiales y Acta: ${assembly?.title}`);
      alert(`Correos despachados exitosamente a ${res.sentCount} copropietarios.`);
      setShowSendEmailModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendResultsToAll = async () => {
    if (!assembly) return;
    if (votesResults.length === 0) {
      alert('Aún no hay resultados de votación registrados para despachar.');
      return;
    }
    setIsSendingResults(true);
    try {
      const res = await api.sendResultsEmails(assemblyId, 'all', `Resultados Oficiales de Votación: ${assembly.title}`);
      alert(`¡Éxito! Se han enviado los resultados oficiales por correo a todos los ${res.sentCount} copropietarios registrados.`);
      loadData();
    } catch (err: any) {
      alert('Error al enviar los correos: ' + err.message);
    } finally {
      setIsSendingResults(false);
    }
  };

  const handleSendMinutesToAll = async () => {
    if (!assembly) return;
    if (!minutes && !minuteForm.title) {
      alert('Por favor guarde o complete el acta antes de enviarla.');
      return;
    }
    setIsSendingMinutes(true);
    try {
      const res = await api.sendMinutesEmails(assemblyId, 'all', `Acta Oficial de Asamblea: ${assembly.title}`);
      alert(`¡Éxito! Se ha enviado el acta oficial de la asamblea por correo a todos los ${res.sentCount} copropietarios registrados.`);
      loadData();
    } catch (err: any) {
      alert('Error al enviar el acta por correo: ' + err.message);
    } finally {
      setIsSendingMinutes(false);
    }
  };

  if (isLoading || !assembly) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-700">Cargando sala de control de la asamblea...</p>
      </div>
    );
  }

  const isQuorumReached = assembly.representedQuorum >= assembly.requiredQuorum;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-500 hover:text-teal-600 mb-2 inline-flex items-center gap-1"
          >
            ← Volver al Panel de Asambleas
          </button>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{assembly.title}</h1>
            <Badge variant={assembly.status === 'in_progress' ? 'emerald' : 'teal'}>
              {assembly.status === 'in_progress' ? 'EN CURSO' : assembly.status.toUpperCase()}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-teal-600" /> {assembly.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-teal-600" /> {assembly.time}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-teal-600" /> {assembly.location}</span>
          </div>
        </div>

        {/* Live Quorum Gauge & Quick Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            isQuorumReached ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Quórum en Vivo</p>
              <p className="text-lg font-black">{assembly.representedQuorum}%</p>
            </div>
            <div className="text-xs">
              <span className="font-bold">{assembly.checkedInOwnersCount}</span>/{assembly.totalOwnersInvited} presentes
              <p className="text-[10px] opacity-80">{isQuorumReached ? 'Quórum Válido' : 'Falta Quórum'}</p>
            </div>
          </div>

          <Button
            size="md"
            variant="outline"
            onClick={() => setShowEditModal(true)}
            leftIcon={<Edit3 className="w-4 h-4" />}
            className="border-slate-300 font-bold"
          >
            Editar Asamblea
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={onOpenVoterPortal}
            leftIcon={<VoteIcon className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 font-bold"
          >
            Vista Votante
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-px scrollbar-none">
        {[
          { id: 'overview', label: 'Resumen & Estado', icon: <FileText className="w-4 h-4" /> },
          { id: 'quorum', label: `Quórum (${assembly.checkedInOwnersCount}/${assembly.totalOwnersInvited})`, icon: <Users className="w-4 h-4" /> },
          { id: 'votes', label: `Votaciones (${votes.length})`, icon: <VoteIcon className="w-4 h-4" /> },
          { id: 'results', label: 'Resultados Oficiales', icon: <Award className="w-4 h-4" /> },
          { id: 'minutes', label: 'Acta Oficial & PDF', icon: <FileCheck2 className="w-4 h-4" /> },
          { id: 'documents', label: `Documentos (${documents.length})`, icon: <Upload className="w-4 h-4" /> },
          { id: 'notes', label: `Bitácora (${notes.length})`, icon: <Sparkles className="w-4 h-4" /> },
          { id: 'emails', label: 'Envío Correos', icon: <Mail className="w-4 h-4" /> },
          { id: 'audit', label: 'Auditoría', icon: <ShieldCheck className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700 bg-teal-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Quórum Verificado"
              value={`${assembly.representedQuorum}%`}
              subtitle={`Requerido: ${assembly.requiredQuorum}%`}
              icon={<Users className="w-6 h-6" />}
              color={isQuorumReached ? 'emerald' : 'amber'}
            />
            <StatCard
              title="Votaciones Totales"
              value={votes.length}
              subtitle={`${votes.filter((v) => v.status === 'active').length} activas en este momento`}
              icon={<VoteIcon className="w-6 h-6" />}
              color="teal"
            />
            <StatCard
              title="Copropietarios Convocados"
              value={assembly.totalOwnersInvited}
              subtitle={`${assembly.checkedInOwnersCount} registrados en sala`}
              icon={<UserCheck className="w-6 h-6" />}
              color="indigo"
            />
            <StatCard
              title="Documentos & Anexos"
              value={documents.length}
              subtitle="Cargados para consulta pública"
              icon={<FileText className="w-6 h-6" />}
              color="amber"
            />
          </div>

          {/* Details & Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" /> Información y Orden del Día
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{assembly.description}</p>
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-semibold">Modalidad:</span>
                  <span className="font-bold text-slate-800 capitalize">{assembly.modality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Lugar / Transmisión:</span>
                  <span className="font-bold text-slate-800">{assembly.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Fecha de Creación:</span>
                  <span className="text-slate-800">{new Date(assembly.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" /> Mesa Directiva & Dignatarios
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{assembly.presidentName}</span>
                    <span className="text-slate-500">Presidente de la Asamblea</span>
                  </div>
                  <Badge variant="emerald">Verificado</Badge>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{assembly.administratorName}</span>
                    <span className="text-slate-500">Administradora del Conjunto</span>
                  </div>
                  <Badge variant="teal">Administración</Badge>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{assembly.accountantName}</span>
                    <span className="text-slate-500">Contador / Revisor Fiscal</span>
                  </div>
                  <Badge variant="amber">Finanzas</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: QUORUM & OWNERS */}
      {activeTab === 'quorum' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registro de Asistencia y Quórum Legal</h3>
              <p className="text-xs text-slate-500">Marque el ingreso de cada propietario o apoderado para actualizar el coeficiente en tiempo real.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportQuorumToExcel(quorum, assembly.title)}
                leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              >
                Exportar Quórum a Excel
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <input
                type="text"
                value={quorumSearch}
                onChange={(e) => setQuorumSearch(e.target.value)}
                placeholder="Buscar por nombre o apartamento..."
                className="max-w-xs px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs font-bold text-slate-600">
                Total Registrados: {quorum.filter((q) => q.checkedIn).length} de {quorum.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Inmueble</th>
                    <th className="py-3.5 px-4">Propietario / Apoderado</th>
                    <th className="py-3.5 px-4 text-center">Coeficiente</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4">Hora de Ingreso</th>
                    <th className="py-3.5 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quorum
                    .filter((q) => q.ownerName.toLowerCase().includes(quorumSearch.toLowerCase()) || q.apartment.toLowerCase().includes(quorumSearch.toLowerCase()))
                    .map((item) => (
                      <tr key={item.id} className={item.checkedIn ? 'bg-teal-50/30' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.building} - {item.apartment}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.ownerName}</div>
                          {item.notes && <div className="text-[10px] text-amber-700 font-medium">{item.notes}</div>}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {item.coefficient.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={item.checkedIn ? 'emerald' : 'slate'} size="sm">
                            {item.checkedIn ? 'PRESENTE' : 'AUSENTE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleQuorum(item.ownerId, item.checkedIn)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                              item.checkedIn
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                            }`}
                          >
                            {item.checkedIn ? 'Marcar Ausente' : 'Registrar Ingreso'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VOTACIONES & ELECCIONES */}
      {activeTab === 'votes' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Votaciones y Elecciones de la Asamblea</h3>
              <p className="text-xs text-slate-500">Inicie las votaciones en el momento oportuno de la asamblea para que los asistentes emitan su voto digital.</p>
            </div>
            <Button
              size="md"
              variant="primary"
              onClick={() => setShowNewVoteModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Crear Nueva Votación
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {votes.map((vote) => (
              <Card key={vote.id} className="p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={vote.status === 'active' ? 'emerald' : vote.status === 'finished' ? 'slate' : 'amber'}>
                      {vote.status === 'active' ? 'VOTACIÓN ABIERTA' : vote.status === 'finished' ? 'FINALIZADA' : 'PROGRAMADA'}
                    </Badge>
                    <span className="text-xs text-slate-600 font-semibold uppercase">
                      {vote.type.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">{vote.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{vote.question}</p>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700">
                    <p><span className="font-bold">Opciones / Candidatos:</span> {vote.options.length}</p>
                    <p><span className="font-bold">Ponderado por Coeficiente:</span> {vote.requiresCoefficient ? 'Sí (Ley 675)' : 'No (1 voto = 1 apto)'}</p>
                    <p><span className="font-bold">Tipo de Sufragio:</span> {vote.isSecret ? 'Voto Secreto Encriptado' : 'Voto Nominal y Público'}</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {vote.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStartVote(vote.id)}
                      leftIcon={<Play className="w-4 h-4" />}
                      className="w-full"
                    >
                      Abrir Votación
                    </Button>
                  )}

                  {vote.status === 'active' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleCloseVote(vote.id)}
                      leftIcon={<StopCircle className="w-4 h-4" />}
                      className="w-full"
                    >
                      Cerrar y Consolidar Resultados
                    </Button>
                  )}

                  {vote.status === 'finished' && (
                    <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Resultados oficiales consolidados</span>
                      <button
                        onClick={() => setActiveTab('results')}
                        className="text-teal-600 hover:underline"
                      >
                        Ver Detalle →
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RESULTADOS OFICIALES */}
      {activeTab === 'results' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Escrutinio y Resultados Oficiales</h3>
              <p className="text-xs text-slate-500">Resultados ponderados por coeficiente y por conteo nominal según la normativa colombiana.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleSendResultsToAll}
                isLoading={isSendingResults}
                leftIcon={<Mail className="w-4 h-4" />}
                className="bg-teal-600 hover:bg-teal-700 font-bold"
              >
                Enviar Resultados a Todos por Correo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportVoteResultsToExcel(votesResults, assembly.title)}
                leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              >
                Exportar Excel
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {votesResults.map((result) => (
              <Card key={result.voteId} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{result.voteTitle}</h4>
                    <p className="text-xs text-slate-500">{result.question}</p>
                  </div>
                  <Badge variant={result.status === 'finished' ? 'slate' : 'emerald'}>
                    {result.status === 'finished' ? 'VOTACIÓN CERRADA' : 'VOTACIÓN EN CURSO'}
                  </Badge>
                </div>

                {/* Summary badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-slate-500 block">Votos Emitidos</span>
                    <span className="text-base font-bold text-slate-900">{result.totalVotesCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-slate-500 block">Coeficiente Computado</span>
                    <span className="text-base font-bold text-slate-900">{result.totalCoefficientSum.toFixed(2)}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 col-span-2">
                    <span className="text-slate-500 block">Dictamen / Decisión</span>
                    <span className="text-sm font-bold text-teal-800">
                      {result.isTie
                        ? `Empate entre: ${result.tieOptionLabels?.join(', ')}`
                        : result.winnerOption
                        ? `Aprobado: ${result.winnerOption.label}`
                        : 'En proceso de votación'}
                    </span>
                  </div>
                </div>

                {/* Option Breakdown Progress Bars */}
                <div className="space-y-3 pt-2">
                  {result.optionResults.map((opt) => (
                    <div key={opt.optionId} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{opt.label}</span>
                        <span className="font-extrabold text-teal-900">
                          {opt.votesCount} votos ({opt.percentageVotes}%) • Coef: {opt.coefficientSum.toFixed(2)}% ({opt.percentageCoefficient}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full transition-all duration-500"
                          style={{ width: `${opt.percentageCoefficient || opt.percentageVotes}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ACTA OFICIAL & PDF */}
      {activeTab === 'minutes' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Generación y Edición del Acta Oficial</h3>
              <p className="text-xs text-slate-500">Edite los textos oficiales, genere un resumen asistido y descargue el PDF formal.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="md"
                variant="primary"
                onClick={handleSendMinutesToAll}
                isLoading={isSendingMinutes}
                leftIcon={<Mail className="w-4 h-4" />}
                className="bg-teal-600 hover:bg-teal-700 font-bold"
              >
                Enviar Acta a Todos por Correo
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={handleDownloadPDF}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Descargar PDF
              </Button>
            </div>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800">Contenido del Acta (Versión {minutes?.version || 1})</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAiSummarizeMinutes}
                isLoading={isAiGenerating}
                leftIcon={<Sparkles className="w-4 h-4 text-teal-600" />}
              >
                Auto-Redactar Resumen
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Título del Acta</label>
                <input
                  type="text"
                  value={minuteForm.title}
                  onChange={(e) => setMinuteForm({ ...minuteForm, title: e.target.value })}
                  placeholder="Acta No. 35 - Asamblea General 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Párrafo de Instalación & Quórum</label>
                <textarea
                  rows={3}
                  value={minuteForm.introText}
                  onChange={(e) => setMinuteForm({ ...minuteForm, introText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Desarrollo y Deliberaciones</label>
                <textarea
                  rows={4}
                  value={minuteForm.summary}
                  onChange={(e) => setMinuteForm({ ...minuteForm, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Conclusiones y Disposiciones Finales</label>
                <textarea
                  rows={3}
                  value={minuteForm.conclusions}
                  onChange={(e) => setMinuteForm({ ...minuteForm, conclusions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button size="md" variant="primary" onClick={handleSaveMinutes}>
                Guardar Cambios del Acta
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: DOCUMENTOS */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Documentos y Anexos de la Asamblea</h3>
              <p className="text-xs text-slate-500">Convocatorias, reglamentos, balances dictaminados y propuestas de candidatos.</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowUploadDocModal(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Cargar Documento
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="teal" size="sm">{doc.type.replace('_', ' ').toUpperCase()}</Badge>
                    <span className="text-[10px] text-slate-600">{doc.fileSize}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 truncate">{doc.name}</h4>
                  <p className="text-[10px] text-slate-600 mt-1">Cargado por: {doc.uploadedBy}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={doc.fileUrl}
                    download
                    className="text-teal-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                  <button
                    onClick={async () => {
                      if (window.confirm('¿Eliminar este documento?')) {
                        await api.deleteDocument(assemblyId, doc.id);
                        loadData();
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: BITÁCORA & NOTAS */}
      {activeTab === 'notes' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bitácora Oficial de la Asamblea</h3>
              <p className="text-xs text-slate-500">Tome nota de intervenciones y aclaraciones que luego se integrarán en el acta.</p>
            </div>
          </div>

          <Card className="p-4">
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={2}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Escriba una intervención, acuerdo o aclaración..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
                >
                  <option value="general">General</option>
                  <option value="intervencion">Intervención de Copropietario</option>
                  <option value="aclaracion">Aclaración de Mesa Directiva</option>
                  <option value="aprobacion">Aprobación Preliminar</option>
                </select>
                <Button size="sm" type="submit" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Agregar a la Bitácora
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-bold text-slate-800">{n.authorName} ({n.authorRole})</span>
                  <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: ENVÍO DE CORREOS */}
      {activeTab === 'emails' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Historial y Despacho Masivo de Correos</h3>
              <p className="text-xs text-slate-500">Envíe convocatorias, resultados oficiales y actas firmadas a los copropietarios.</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowSendEmailModal(true)}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Despachar Notificaciones
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Asunto</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{e.recipientName}</div>
                      <div className="text-[10px] text-slate-600">{e.recipientEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{e.subject}</td>
                    <td className="py-3 px-4 capitalize">{e.type}</td>
                    <td className="py-3 px-4">
                      <Badge variant="emerald" size="sm">Entregado</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(e.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: AUDITORÍA */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registro Inmutable de Auditoría</h3>
              <p className="text-xs text-slate-500">Trazabilidad de cada evento, cambio de estado, sufragio y acción administrativa.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Detalles</th>
                  <th className="py-3 px-4">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="indigo" size="sm">{log.action}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.details}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[10px]">{log.ipAddress || '190.25.112.44'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE VOTE MODAL */}
      <CreateVoteModal
        isOpen={showNewVoteModal}
        onClose={() => setShowNewVoteModal(false)}
        assemblyId={assemblyId}
        onVoteCreated={() => {
          setShowNewVoteModal(false);
          loadData();
        }}
      />

      {/* UPLOAD DOCUMENT MODAL */}
      <UploadDocumentModal
        isOpen={showUploadDocModal}
        onClose={() => setShowUploadDocModal(false)}
        assemblyId={assemblyId}
        onUploaded={() => {
          setShowUploadDocModal(false);
          loadData();
        }}
      />

      {/* SEND EMAILS MODAL */}
      <Modal
        isOpen={showSendEmailModal}
        onClose={() => setShowSendEmailModal(false)}
        title="Enviar Resultados y Acta por Correo"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Seleccione el grupo de destinatarios a quienes se les enviará el resumen oficial de resultados y el acta de la asamblea:
          </p>

          <div className="space-y-2">
            <button
              onClick={() => handleSendResults('all')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all"
            >
              <span className="font-bold text-slate-900 block text-sm">A todos los copropietarios ({assembly.totalOwnersInvited})</span>
              <span className="text-slate-500">Enviar a la totalidad del censo registrado del conjunto residencial.</span>
            </button>

            <button
              onClick={() => handleSendResults('attended')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all"
            >
              <span className="font-bold text-slate-900 block text-sm">Solo a los asistentes ({assembly.checkedInOwnersCount})</span>
              <span className="text-slate-500">Enviar exclusivamente a los propietarios que registraron su ingreso a la asamblea.</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Assembly Modal */}
      {showEditModal && assembly && (
        <EditAssemblyModal
          isOpen={showEditModal}
          assembly={assembly}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setAssembly(updated);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Modal for Creating New Vote with 5 types and rich candidate registration
const CreateVoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  assemblyId: string;
  onVoteCreated: () => void;
}> = ({ isOpen, onClose, assemblyId, onVoteCreated }) => {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<'yes_no' | 'single_choice' | 'multiple_choice' | 'candidate_election'>('single_choice');
  const [options, setOptions] = useState<string[]>(['Opción A', 'Opción B']);
  const [isSecret, setIsSecret] = useState(false);
  const [requiresCoefficient, setRequiresCoefficient] = useState(true);
  const [maxSelections, setMaxSelections] = useState(1);
  const [includeBlankVote, setIncludeBlankVote] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Candidate Registration state
  const [registeredOwners, setRegisteredOwners] = useState<Owner[]>([]);
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [candName, setCandName] = useState('');
  const [candDoc, setCandDoc] = useState('');
  const [candApto, setCandApto] = useState('');
  const [candBuilding, setCandBuilding] = useState('');
  const [candRole, setCandRole] = useState('Consejo de Administración (Principal)');
  const [candProposal, setCandProposal] = useState('');
  const [candPhoto, setCandPhoto] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getOwners().then((list) => {
        setRegisteredOwners(list);
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleOwnerSelect = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    if (!ownerId) {
      setCandName('');
      setCandDoc('');
      setCandApto('');
      setCandBuilding('');
      return;
    }
    const found = registeredOwners.find((o) => o.id === ownerId);
    if (found) {
      setCandName(found.name);
      setCandDoc(found.documentNumber);
      setCandApto(found.apartment);
      setCandBuilding(found.building || 'Torre Principal');
      if (!candPhoto) {
        setCandPhoto(`https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`);
      }
    }
  };

  const handleAddCandidate = () => {
    if (!candName.trim()) {
      alert('Por favor ingrese el nombre del candidato o selecciónelo del censo.');
      return;
    }

    const newCandidate: Candidate = {
      id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: candName.trim(),
      documentNumber: candDoc.trim() || 'CC Verificada',
      apartment: candApto.trim() || 'Apto Propio',
      building: candBuilding.trim() || 'Torre Principal',
      rolePostulation: candRole.trim() || 'Consejo de Administración',
      profileSummary: candProposal.trim() || 'Candidato postulado para la representación en la asamblea.',
      proposals: candProposal.trim() || 'Cumplimiento del reglamento de propiedad horizontal y optimización de recursos.',
      photoUrl: candPhoto.trim() || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      status: 'active'
    };

    setCandidatesList((prev) => [...prev, newCandidate]);
    // Reset candidate form
    setSelectedOwnerId('');
    setCandName('');
    setCandDoc('');
    setCandApto('');
    setCandBuilding('');
    setCandProposal('');
    setCandPhoto('');
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidatesList((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddOption = () => {
    setOptions([...options, `Opción ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) {
      alert('Título y pregunta son obligatorios');
      return;
    }

    if (type === 'candidate_election' && candidatesList.length === 0) {
      alert('Por favor agregue al menos un candidato para la elección.');
      return;
    }

    setIsLoading(true);
    try {
      let formattedOptions: { id: string; label: string; description?: string; candidateId?: string }[] = [];

      if (type === 'yes_no') {
        formattedOptions = [
          { id: `opt-${Date.now()}-yes`, label: 'SÍ, APRUEBO' },
          { id: `opt-${Date.now()}-no`, label: 'NO APRUEBO' },
          { id: `opt-${Date.now()}-abs`, label: 'ME ABSTENGO' }
        ];
      } else if (type === 'candidate_election') {
        formattedOptions = candidatesList.map((c) => ({
          id: `opt-${c.id}`,
          label: `${c.name} (${c.apartment}) - ${c.rolePostulation || 'Candidato'}`,
          description: c.profileSummary,
          candidateId: c.id
        }));
        if (includeBlankVote) {
          formattedOptions.push({
            id: `opt-${Date.now()}-blank`,
            label: 'VOTO EN BLANCO',
            description: 'Opción democrática formal para manifestar abstención de preferencia'
          });
        }
      } else {
        formattedOptions = options.map((opt, i) => ({ id: `opt-${Date.now()}-${i}`, label: opt }));
      }

      await api.createVote(assemblyId, {
        title,
        question,
        type,
        options: formattedOptions,
        candidates: type === 'candidate_election' ? candidatesList : undefined,
        isSecret,
        requiresCoefficient,
        maxSelections: type === 'multiple_choice' || type === 'candidate_election' ? maxSelections : 1,
        minSelections: 1,
        showLiveResults: true,
        allowAbstain: true
      });
      onVoteCreated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Votación o Elección" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Tipo de Votación</label>
          <select
            value={type}
            onChange={(e) => {
              const newType = e.target.value as any;
              setType(newType);
              if (newType === 'candidate_election' && !title) {
                setTitle('Elección de Consejo de Administración 2026');
                setQuestion('Seleccione los candidatos de su preferencia para conformar el Consejo de Administración:');
              }
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
          >
            <option value="single_choice">Selección Única (Múltiples Opciones)</option>
            <option value="yes_no">Votación SÍ / NO / ABSTENCIÓN</option>
            <option value="multiple_choice">Selección Múltiple (Hasta N opciones)</option>
            <option value="candidate_election">Elección de Candidatos (Consejo / Comité / Revisoría)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Título de la Votación</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Elección Consejo de Administración o Aprobación Presupuesto"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Pregunta Directa al Votante</label>
          <input
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="¿Seleccione su opción o candidato de preferencia?"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
          />
        </div>

        {/* CANDIDATE ELECTION FLOW */}
        {type === 'candidate_election' && (
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="bg-teal-50/70 border border-teal-200 p-3.5 rounded-xl">
              <h5 className="font-bold text-teal-900 text-xs mb-1">Registro y Postulación de Candidatos</h5>
              <p className="text-[11px] text-teal-700">
                Seleccione un copropietario registrado por su cédula para auto-completar sus datos o ingrese los datos manualmente junto con su propuesta:
              </p>
            </div>

            {/* Selector by Cedula */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  1. Seleccionar Copropietario por Cédula / Nombre:
                </label>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => handleOwnerSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white font-medium"
                >
                  <option value="">-- Buscar / Seleccionar Copropietario del Censo --</option>
                  {registeredOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      CC {owner.documentNumber} - {owner.name} ({owner.apartment} {owner.building})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Nombre Completo</label>
                  <input
                    type="text"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    placeholder="Nombre del candidato"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Cédula / Documento</label>
                  <input
                    type="text"
                    value={candDoc}
                    onChange={(e) => setCandDoc(e.target.value)}
                    placeholder="Número de cédula"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Inmueble / Apto</label>
                  <input
                    type="text"
                    value={candApto}
                    onChange={(e) => setCandApto(e.target.value)}
                    placeholder="Ej: Apto 402 Torre 1"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Cargo / Postulación</label>
                  <select
                    value={candRole}
                    onChange={(e) => setCandRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium bg-white"
                  >
                    <option value="Consejo de Administración (Principal)">Consejo de Administración (Principal)</option>
                    <option value="Consejo de Administración (Suplente)">Consejo de Administración (Suplente)</option>
                    <option value="Comité de Convivencia">Comité de Convivencia</option>
                    <option value="Revisor Fiscal">Revisor Fiscal</option>
                    <option value="Comité de Obras y Mejoras">Comité de Obras y Mejoras</option>
                    <option value="Presidente de Asamblea">Presidente de Asamblea</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-0.5">Propuesta de Gestión y Perfil</label>
                <textarea
                  rows={2}
                  value={candProposal}
                  onChange={(e) => setCandProposal(e.target.value)}
                  placeholder="Resumen del plan de trabajo, experiencia y compromisos con la comunidad..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddCandidate}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Agregar Candidato
                </Button>
              </div>
            </div>

            {/* List of Registered Candidates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase">
                  Candidatos Postulados ({candidatesList.length})
                </label>
              </div>

              {candidatesList.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  No hay candidatos registrados todavía. Seleccione una cédula arriba y pulse "Agregar Candidato".
                </div>
              ) : (
                <div className="space-y-2">
                  {candidatesList.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
                              {c.rolePostulation}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            CC: {c.documentNumber} • {c.apartment} ({c.building})
                          </p>
                          {c.profileSummary && (
                            <p className="text-[11px] text-slate-700 mt-1 line-clamp-2">
                              {c.profileSummary}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(c.id)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="Eliminar candidato"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBlankVote}
                    onChange={(e) => setIncludeBlankVote(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="font-bold text-slate-700">Incluir opción de "VOTO EN BLANCO"</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Máximo a elegir por votante:</span>
                  <input
                    type="number"
                    min={1}
                    max={candidatesList.length || 5}
                    value={maxSelections}
                    onChange={(e) => setMaxSelections(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REGULAR OPTIONS FLOW */}
        {type !== 'yes_no' && type !== 'candidate_election' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase">Opciones de Votación</label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-teal-600 hover:underline font-bold text-xs"
              >
                + Añadir Opción
              </button>
            </div>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = e.target.value;
                    setOptions(next);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={requiresCoefficient}
              onChange={(e) => setRequiresCoefficient(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <span className="font-bold text-slate-800">Cómputo por Coeficiente</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <span className="font-bold text-slate-800">Voto Secreto Encriptado</span>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Crear Votación
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal for Uploading Documents
const UploadDocumentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  assemblyId: string;
  onUploaded: () => void;
}> = ({ isOpen, onClose, assemblyId, onUploaded }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'convocatoria' | 'estados_financieros' | 'propuesta' | 'reglamento'>('estados_financieros');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await api.addDocument(assemblyId, {
        name,
        type,
        fileUrl: '#',
        fileSize: '2.4 MB',
        uploadedBy: 'Administración'
      });
      onUploaded();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cargar Documento a la Asamblea" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Nombre del Documento</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Dictamen_Revisor_Fiscal_2025.pdf"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Categoría</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
          >
            <option value="convocatoria">Convocatoria Oficial</option>
            <option value="estados_financieros">Estados Financieros y Presupuesto</option>
            <option value="propuesta">Propuesta Comercial / Candidatos</option>
            <option value="reglamento">Reglamento y Estatutos</option>
          </select>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500 hover:border-teal-500 transition-colors">
          <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
          <p className="font-bold text-slate-700">Arrastre o seleccione el archivo PDF / Excel</p>
          <p className="text-[10px] text-slate-400 mt-1">Máximo 25 MB por archivo</p>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Cargar Documento</Button>
        </div>
      </form>
    </Modal>
  );
};
