import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Award,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Users,
  Vote as VoteIcon,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Candidate, Owner, Vote, VoteOption, VoteStatus, VoteType, VoterFilterType } from '../../types';
import { Alert, Badge, Button, Modal } from '../common/UIComponents';
import { createCandidateProposalPdfUri, downloadFile, fileToBase64 } from '../../utils/pdfHelper';

interface EditVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  vote: Vote | null;
  assemblyId: string;
  complexName?: string;
  registeredOwners?: Owner[];
  onVoteUpdated: () => void;
  onVoteDeleted?: () => void;
  onOpenPdfPreview?: (url: string, title: string, fileName: string) => void;
}

export const EditVoteModal: React.FC<EditVoteModalProps> = ({
  isOpen,
  onClose,
  vote,
  assemblyId,
  complexName = 'Conjunto Residencial',
  registeredOwners = [],
  onVoteUpdated,
  onVoteDeleted,
  onOpenPdfPreview
}) => {
  if (!vote) return null;

  // Form State
  const [title, setTitle] = useState(vote.title || '');
  const [description, setDescription] = useState(vote.description || '');
  const [question, setQuestion] = useState(vote.question || '');
  const [status, setStatus] = useState<VoteStatus>(vote.status);
  const [isSecret, setIsSecret] = useState(vote.isSecret ?? false);
  const [requiresCoefficient, setRequiresCoefficient] = useState(vote.requiresCoefficient ?? true);
  const [allowAbstain, setAllowAbstain] = useState(vote.allowAbstain ?? true);
  const [maxSelections, setMaxSelections] = useState(vote.maxSelections || 1);

  // Filter Configuration
  const [targetAudience, setTargetAudience] = useState<string>(
    vote.filterConfig?.targetAudience || vote.filterConfig?.filterType || 'all'
  );
  const [selectedTowers, setSelectedTowers] = useState<string[]>(vote.filterConfig?.allowedTowers || []);
  const [selectedCustomOwnerIds, setSelectedCustomOwnerIds] = useState<string[]>(
    vote.filterConfig?.allowedOwnerIds || []
  );

  // Candidates & Options
  const [candidatesList, setCandidatesList] = useState<Candidate[]>(vote.candidates || []);
  const [options, setOptions] = useState<VoteOption[]>(vote.options || []);

  // Candidate Subform
  const [candName, setCandName] = useState('');
  const [candDoc, setCandDoc] = useState('');
  const [candApto, setCandApto] = useState('');
  const [candBuilding, setCandBuilding] = useState('');
  const [candRole, setCandRole] = useState('Consejo de Administración (Principal)');
  const [candProposal, setCandProposal] = useState('');
  const [candPdfData, setCandPdfData] = useState<{ url: string; name: string } | null>(null);
  const [isUploadingCandPdf, setIsUploadingCandPdf] = useState(false);

  // Owners list & candidate selection helpers
  const [ownersList, setOwnersList] = useState<Owner[]>(registeredOwners);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [allowCandidateEditOverride, setAllowCandidateEditOverride] = useState(false);

  // General Vote PDF Attachment
  const [attachmentPdfUrl, setAttachmentPdfUrl] = useState<string | undefined>(vote.attachmentPdfUrl);
  const [attachmentPdfName, setAttachmentPdfName] = useState<string | undefined>(vote.attachmentPdfName);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Available Towers for selection
  const availableTowers = Array.from(new Set(ownersList.map((o) => o.building).filter(Boolean)));

  // Sync ownersList if empty or missing documentNumber
  useEffect(() => {
    if (registeredOwners && registeredOwners.length > 0 && registeredOwners.some(o => !!o.documentNumber)) {
      setOwnersList(registeredOwners);
    } else {
      api.getOwners().then((list) => {
        if (list && list.length > 0) {
          setOwnersList(list);
        }
      }).catch(console.error);
    }
  }, [registeredOwners, isOpen]);

  // Sync state when vote prop changes
  useEffect(() => {
    if (vote) {
      setTitle(vote.title || '');
      setDescription(vote.description || '');
      setQuestion(vote.question || '');
      setStatus(vote.status);
      setIsSecret(vote.isSecret ?? false);
      setRequiresCoefficient(vote.requiresCoefficient ?? true);
      setAllowAbstain(vote.allowAbstain ?? true);
      setMaxSelections(vote.maxSelections || 1);
      setTargetAudience(vote.filterConfig?.targetAudience || vote.filterConfig?.filterType || 'all');
      setSelectedTowers(vote.filterConfig?.allowedTowers || []);
      setSelectedCustomOwnerIds(vote.filterConfig?.allowedOwnerIds || []);
      setCandidatesList(vote.candidates || []);
      setOptions(vote.options || []);
      setAttachmentPdfUrl(vote.attachmentPdfUrl);
      setAttachmentPdfName(vote.attachmentPdfName);
      setSelectedOwnerId('');
      setOwnerSearchQuery('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [vote, isOpen]);

  const canEditCandidates = vote.status === 'scheduled' || vote.status === 'active' || allowCandidateEditOverride;
  const canEditOptions = vote.status === 'scheduled' || allowCandidateEditOverride;

  // Handle PDF Upload for Candidate
  const handleCandPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('El archivo debe ser en formato PDF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo no puede exceder los 15 MB.');
      return;
    }
    try {
      setIsUploadingCandPdf(true);
      const converted = await fileToBase64(file);
      setCandPdfData({ url: converted.dataUrl, name: converted.name });
    } catch (err: any) {
      alert('Error al leer el archivo PDF: ' + err.message);
    } finally {
      setIsUploadingCandPdf(false);
    }
  };

  // Handle PDF Upload for Vote Attachment
  const handleVotePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('El archivo debe ser en formato PDF.');
      return;
    }
    try {
      const converted = await fileToBase64(file);
      setAttachmentPdfUrl(converted.dataUrl);
      setAttachmentPdfName(converted.name);
    } catch (err: any) {
      alert('Error al leer el archivo PDF: ' + err.message);
    }
  };

  const handleAddCandidate = () => {
    if (!candName.trim()) {
      alert('Por favor ingrese el nombre del candidato o selecciónelo del censo de propietarios.');
      return;
    }

    const proposalText = candProposal.trim() || 'Gestión transparente, optimización presupuestal y seguridad.';
    const finalPdfUrl =
      candPdfData?.url ||
      createCandidateProposalPdfUri(
        candName.trim(),
        candApto.trim() || 'Apto Propio',
        candRole.trim(),
        proposalText,
        complexName
      );

    const newCandidateId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCandidate: Candidate = {
      id: newCandidateId,
      voteId: vote.id,
      name: candName.trim(),
      documentNumber: candDoc.trim() || 'CC Verificada',
      apartment: candApto.trim() || 'Apto Propio',
      building: candBuilding.trim() || 'Torre Principal',
      rolePostulation: candRole.trim() || 'Consejo de Administración (Principal)',
      profileSummary: proposalText,
      proposals: proposalText,
      proposalPdfUrl: finalPdfUrl,
      proposalPdfName: candPdfData?.name || `Propuesta_${candName.trim().replace(/\s+/g, '_')}.pdf`,
      photoUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      status: 'active'
    };

    setCandidatesList((prev) => [...prev, newCandidate]);

    // Also update options list with candidate
    setOptions((prev) => [
      ...prev.filter((o) => o.candidateId !== newCandidateId && o.id !== `opt-${newCandidateId}`),
      {
        id: `opt-${newCandidateId}`,
        label: `${newCandidate.name} (${newCandidate.apartment}) - ${newCandidate.rolePostulation}`,
        description: newCandidate.profileSummary,
        candidateId: newCandidateId
      }
    ]);

    // Reset candidate subform
    setSelectedOwnerId('');
    setOwnerSearchQuery('');
    setCandName('');
    setCandDoc('');
    setCandApto('');
    setCandBuilding('');
    setCandProposal('');
    setCandPdfData(null);
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidatesList((prev) => prev.filter((c) => c.id !== id));
    setOptions((prev) => prev.filter((o) => o.candidateId !== id && o.id !== `opt-${id}`));
  };

  const handleOwnerSelect = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    if (!ownerId) {
      setCandName('');
      setCandDoc('');
      setCandApto('');
      setCandBuilding('');
      return;
    }
    const found = ownersList.find((o) => o.id === ownerId);
    if (found) {
      setCandName(found.name);
      setCandDoc(found.documentNumber || '');
      setCandApto(found.apartment);
      setCandBuilding(found.building || 'Torre Principal');
      if (found.isCouncilMember && found.councilRole) {
        setCandRole(found.councilRole);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) {
      setError('El título y la pregunta son campos obligatorios.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Compute synchronous final options matching current candidate list
    const finalOptions: VoteOption[] = vote.type === 'candidate_election'
      ? candidatesList.map((c) => ({
          id: `opt-${c.id}`,
          label: `${c.name} (${c.apartment}) - ${c.rolePostulation || 'Candidato'}`,
          description: c.profileSummary,
          candidateId: c.id
        }))
      : (canEditOptions ? options : vote.options);

    try {
      await api.updateVote(vote.id, {
        title: title.trim(),
        description: description.trim(),
        question: question.trim(),
        status,
        isSecret,
        requiresCoefficient,
        allowAbstain,
        maxSelections: vote.type === 'multiple_choice' || vote.type === 'candidate_election' ? maxSelections : 1,
        candidates: vote.type === 'candidate_election' ? candidatesList : vote.candidates,
        options: finalOptions,
        attachmentPdfUrl,
        attachmentPdfName,
        filterConfig: {
          filterType: (targetAudience === 'council_only'
            ? 'council_only'
            : targetAudience === 'specific_towers'
            ? 'by_tower'
            : targetAudience === 'towers_and_council'
            ? 'tower_and_council'
            : targetAudience === 'custom'
            ? 'specific_owners'
            : 'all') as VoterFilterType,
          targetAudience: targetAudience as any,
          allowedTowers: selectedTowers,
          allowedOwnerIds: selectedCustomOwnerIds,
          councilOnly: targetAudience === 'council_only'
        }
      });

      setSuccessMessage('¡Votación y candidatos actualizados exitosamente!');
      setTimeout(() => {
        onVoteUpdated();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la votación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `¿Está completamente seguro de eliminar la votación "${vote.title}"? Esta acción no se puede deshacer y borrará los registros de auditoría asociados.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteVote(vote.id);
      if (onVoteDeleted) onVoteDeleted();
      onVoteUpdated();
      onClose();
    } catch (err: any) {
      alert('Error al eliminar votación: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        `¿Desea reiniciar la votación "${vote.title}" a estado PROGRAMADO (Borrador)? Se restablecerá el conteo a 0 votos para permitir una nueva apertura.`
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await api.resetVote(vote.id);
      setStatus('scheduled');
      onVoteUpdated();
      setSuccessMessage('Votación reiniciada a estado programado.');
    } catch (err: any) {
      alert('Error al reiniciar votación: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Votación: ${vote.title}`} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <Alert type="error">{error}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {/* State Notice */}
        {vote.status !== 'scheduled' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Votación en estado {vote.status === 'active' ? 'ABIERTA' : 'FINALIZADA'}:</strong> Las opciones y
              candidatos no se pueden eliminar durante la votación para garantizar la trazabilidad del sufragio conforme
              a la Ley 675. Puede modificar el estado, título, descripción y documentos adjuntos. Si requiere
              reconfigurar opciones, use el botón <strong>"Reiniciar Votación"</strong>.
            </div>
          </div>
        )}

        {/* Status Selector */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Estado Actual de la Votación
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'scheduled', label: 'Programada (Borrador)', color: 'border-amber-300 bg-amber-50 text-amber-900' },
              { id: 'active', label: 'Abierta (En Votación)', color: 'border-emerald-400 bg-emerald-50 text-emerald-900' },
              { id: 'finished', label: 'Finalizada (Cerrada)', color: 'border-slate-300 bg-slate-100 text-slate-800' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id as VoteStatus)}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                  status === s.id
                    ? `${s.color} ring-2 ring-teal-500 shadow-xs`
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Título de la Votación *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Pregunta Directa al Votante *</label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Descripción o Justificación Jurídica</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el punto del orden del día o la decisión a tomar..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium resize-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Document Attachment for the Vote */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 uppercase text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Documento o Propuesta en PDF (Opcional)
            </label>
            {attachmentPdfUrl && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPdfPreview) {
                      onOpenPdfPreview(attachmentPdfUrl, title, attachmentPdfName || 'Documento_Votacion.pdf');
                    } else {
                      downloadFile(attachmentPdfUrl, attachmentPdfName || 'Documento_Votacion.pdf');
                    }
                  }}
                  className="text-teal-600 hover:text-teal-800 font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentPdfUrl(undefined);
                    setAttachmentPdfName(undefined);
                  }}
                  className="text-rose-500 hover:text-rose-700 text-[11px]"
                >
                  ✕ Quitar
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs">
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              {attachmentPdfUrl ? 'Reemplazar Archivo PDF' : 'Adjuntar Documento PDF'}
              <input type="file" accept="application/pdf" onChange={handleVotePdfUpload} className="hidden" />
            </label>
            {attachmentPdfName && <span className="text-slate-500 text-[11px] truncate">{attachmentPdfName}</span>}
          </div>
        </div>

        {/* CANDIDATES MANAGEMENT (If candidate_election) */}
        {vote.type === 'candidate_election' && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-600" />
                Candidatos Postulados ({candidatesList.length})
              </h5>
              <span className="text-[11px] text-slate-500">
                Máx a elegir: <strong>{maxSelections}</strong>
              </span>
            </div>

            {/* List of current candidates */}
            <div className="space-y-2">
              {candidatesList.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  No hay candidatos registrados en esta votación.
                </div>
              ) : (
                candidatesList.map((c) => (
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
                          <p className="text-[11px] text-slate-700 mt-1 line-clamp-2">{c.profileSummary}</p>
                        )}
                        {/* PDF link */}
                        {c.proposalPdfUrl && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenPdfPreview) {
                                  onOpenPdfPreview(
                                    c.proposalPdfUrl!,
                                    `Propuesta: ${c.name}`,
                                    c.proposalPdfName || `Propuesta_${c.name}.pdf`
                                  );
                                } else {
                                  downloadFile(c.proposalPdfUrl!, c.proposalPdfName || `Propuesta_${c.name}.pdf`);
                                }
                              }}
                              className="text-[11px] text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200"
                            >
                              <FileText className="w-3 h-3" /> Ver Propuestas (PDF)
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadFile(c.proposalPdfUrl!, c.proposalPdfName || `Propuesta_${c.name}.pdf`)}
                              className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Descargar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {canEditCandidates && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(c.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 text-xs font-bold"
                        title="Eliminar candidato"
                      >
                        ✕ Quitar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Candidate Form (enabled for scheduled or active votes) */}
            {canEditCandidates ? (
              <div className="p-4 bg-teal-50/70 border-2 border-teal-300 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-teal-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <Plus className="w-4 h-4 text-teal-700" /> Postular / Agregar Nuevo Candidato
                  </p>
                  {vote.status === 'active' && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      Votación Activa (Sincronización en vivo)
                    </span>
                  )}
                </div>

                {/* Census Owner Selection & Live Filter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-xs flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      Seleccionar Copropietario desde el Censo ({ownersList.length} registrados):
                    </label>
                    {selectedOwnerId && (
                      <button
                        type="button"
                        onClick={() => handleOwnerSelect('')}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Filtrar por nombre, cédula o apto..."
                      value={ownerSearchQuery}
                      onChange={(e) => setOwnerSearchQuery(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
                    />

                    <select
                      value={selectedOwnerId}
                      onChange={(e) => handleOwnerSelect(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border-2 border-teal-400 text-xs text-slate-900 bg-white font-bold focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- Elige un copropietario del censo --</option>
                      {ownersList
                        .filter((o) => {
                          if (!ownerSearchQuery.trim()) return true;
                          const q = ownerSearchQuery.toLowerCase();
                          return (
                            o.name.toLowerCase().includes(q) ||
                            (o.documentNumber && o.documentNumber.includes(q)) ||
                            o.apartment.toLowerCase().includes(q)
                          );
                        })
                        .map((owner) => {
                          const isAlreadyCand = candidatesList.some(
                            (c) => (c.documentNumber && c.documentNumber === owner.documentNumber) || c.name.toLowerCase() === owner.name.toLowerCase()
                          );
                          return (
                            <option key={owner.id} value={owner.id}>
                              {owner.apartment} ({owner.building || 'Torre 1'}) — {owner.name} {owner.documentNumber ? `[CC: ${owner.documentNumber}]` : ''} {isAlreadyCand ? '⚠️ (Ya postulado)' : ''}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                {/* Candidate Manual/Autofilled Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Nombre del Candidato *</label>
                    <input
                      type="text"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      placeholder="Nombre Completo *"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-bold focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Documento de Identidad</label>
                    <input
                      type="text"
                      value={candDoc}
                      onChange={(e) => setCandDoc(e.target.value)}
                      placeholder="Número de Cédula"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-mono focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Inmueble / Apto</label>
                    <input
                      type="text"
                      value={candApto}
                      onChange={(e) => setCandApto(e.target.value)}
                      placeholder="Apto / Casa"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Cargo al que se Postula</label>
                    <select
                      value={candRole}
                      onChange={(e) => setCandRole(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-bold focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Consejo de Administración (Principal)">Consejo de Administración (Principal)</option>
                      <option value="Consejo de Administración (Suplente)">Consejo de Administración (Suplente)</option>
                      <option value="Comité de Convivencia">Comité de Convivencia</option>
                      <option value="Revisor Fiscal">Revisor Fiscal</option>
                      <option value="Comité de Obras y Mejoras">Comité de Obras y Mejoras</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Propuestas y Plan de Trabajo</label>
                  <textarea
                    rows={2}
                    value={candProposal}
                    onChange={(e) => setCandProposal(e.target.value)}
                    placeholder="Resumen de propuestas y compromisos para la copropiedad..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white resize-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* PDF proposal upload & Add button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-teal-200">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-white hover:bg-teal-50 text-[11px] font-bold text-teal-800 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    {candPdfData ? candPdfData.name : 'Adjuntar Hoja de Vida / Propuesta (PDF)'}
                    <input type="file" accept="application/pdf" onChange={handleCandPdfUpload} className="hidden" />
                  </label>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddCandidate}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="bg-teal-600 hover:bg-teal-700 font-bold shadow-xs"
                  >
                    Agregar a la Lista de Candidatos
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 flex items-center justify-between">
                <span>La votación está cerrada para edición directa.</span>
                <button
                  type="button"
                  onClick={() => setAllowCandidateEditOverride(true)}
                  className="text-teal-700 font-bold hover:underline"
                >
                  Habilitar edición de candidatos
                </button>
              </div>
            )}
          </div>
        )}

        {/* REGULAR OPTIONS (If not candidate election) */}
        {vote.type !== 'candidate_election' && vote.type !== 'yes_no' && (
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase">Opciones de Votación</label>
              {canEditOptions && (
                <button
                  type="button"
                  onClick={() =>
                    setOptions([
                      ...options,
                      { id: `opt-${Date.now()}`, label: `Opción ${String.fromCharCode(65 + options.length)}` }
                    ])
                  }
                  className="text-teal-600 hover:underline font-bold text-xs"
                >
                  + Añadir Opción
                </button>
              )}
            </div>
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex gap-2">
                <input
                  type="text"
                  required
                  disabled={!canEditOptions}
                  value={opt.label}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setOptions(next);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white disabled:bg-slate-100"
                />
                {canEditOptions && options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Voting Rules Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresCoefficient}
              onChange={(e) => setRequiresCoefficient(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-800">Ponderar por Coeficiente</span>
              <p className="text-[10px] text-slate-500">Exigido por Ley 675/2001 para decisiones económicas</p>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-800">Voto Secreto Encriptado</span>
              <p className="text-[10px] text-slate-500">No asocia identidad pública al sufragio en actas</p>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAbstain}
              onChange={(e) => setAllowAbstain(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-800">Permitir Abstención</span>
              <p className="text-[10px] text-slate-500">Habilita opción formal de abstención</p>
            </div>
          </label>

          <div className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800">Máximo a Elegir:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={maxSelections}
              onChange={(e) => setMaxSelections(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDelete}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="font-bold"
            >
              Eliminar
            </Button>

            {vote.status !== 'scheduled' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isResetting}
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                className="font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                Reiniciar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="bg-teal-600 hover:bg-teal-700 font-bold"
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
