import React, { useState, useEffect } from 'react';
import {
  Award,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  FileText,
  Filter,
  Layers,
  Lock,
  Plus,
  Scale,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Vote,
  X
} from 'lucide-react';
import { Candidate, Owner, VoteOption } from '../../types';
import { api } from '../../services/api';
import { Alert, Badge, Button, Card, Modal } from '../common/UIComponents';
import { createCandidateProposalPdfUri, fileToBase64 } from '../../utils/pdfHelper';

interface CreateVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  assemblyId: string;
  complexId?: string;
  onVoteCreated: () => void;
}

type VoteCategory = 'yes_no' | 'candidate_election' | 'single_choice' | 'multiple_choice';

export const CreateVoteModal: React.FC<CreateVoteModalProps> = ({
  isOpen,
  onClose,
  assemblyId,
  complexId,
  onVoteCreated
}) => {
  // Core Vote Info
  const [type, setType] = useState<VoteCategory>('yes_no');
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['Propuesta A: Empresa Alpha', 'Propuesta B: Empresa Beta']);
  const [isSecret, setIsSecret] = useState(false);
  const [requiresCoefficient, setRequiresCoefficient] = useState(true);
  const [allowAbstain, setAllowAbstain] = useState(true);
  const [maxSelections, setMaxSelections] = useState(1);
  const [includeBlankVote, setIncludeBlankVote] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // General vote attachment PDF
  const [attachmentPdfUrl, setAttachmentPdfUrl] = useState<string | undefined>(undefined);
  const [attachmentPdfName, setAttachmentPdfName] = useState<string | undefined>(undefined);

  // Audience & Filter Config
  const [targetAudience, setTargetAudience] = useState<
    'all' | 'council_only' | 'specific_towers' | 'towers_and_council' | 'custom'
  >('all');
  const [selectedTowers, setSelectedTowers] = useState<string[]>([]);
  const [selectedCustomOwnerIds, setSelectedCustomOwnerIds] = useState<string[]>([]);

  // Registered Owners and Candidates
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
  const [candPdfData, setCandPdfData] = useState<{ url: string; name: string; size: number } | null>(null);

  // Load census owners when modal opens
  useEffect(() => {
    if (isOpen && complexId) {
      api
        .getOwners(complexId)
        .then((list) => {
          setRegisteredOwners(list);
        })
        .catch(console.error);
    }
  }, [isOpen, complexId]);

  // Set default contextual templates when type changes
  const handleTypeSelect = (newType: VoteCategory) => {
    setType(newType);
    if (newType === 'yes_no') {
      if (!title || title.includes('Consejo') || title.includes('Selección')) {
        setTitle('Aprobación de Estados Financieros y Presupuesto 2026');
        setQuestion('¿Aprueba usted el presupuesto y los estados financieros presentados para la vigencia 2026?');
        setDescription('Votación reglamentaria de asamblea general ordinaria conforme a la Ley 675 de 2001.');
      }
      setMaxSelections(1);
    } else if (newType === 'candidate_election') {
      if (!title || title.includes('Presupuesto') || title.includes('Selección')) {
        setTitle('Elección de Miembros del Consejo de Administración 2026-2028');
        setQuestion('Seleccione los candidatos de su preferencia para conformar el Consejo de Administración:');
        setDescription('Se eligen los integrantes del Consejo para el periodo estatutario de 2 años.');
      }
      setMaxSelections(3);
    } else if (newType === 'single_choice') {
      if (!title || title.includes('Consejo') || title.includes('Presupuesto')) {
        setTitle('Selección de Proveedor de Seguridad y Vigilancia Privada');
        setQuestion('¿Cuál de las propuestas comerciales presentadas considera más conveniente para el conjunto?');
        setDescription('Evaluación de propuestas técnicas y económicas para el contrato anual de vigilancia.');
      }
      setMaxSelections(1);
    } else if (newType === 'multiple_choice') {
      if (!title || title.includes('Consejo') || title.includes('Presupuesto')) {
        setTitle('Priorización de Obras y Mejoras Comunitarias 2026');
        setQuestion('Seleccione las obras prioritarias a ejecutar con cargo al fondo de mejoras:');
        setDescription('Puede marcar hasta 2 alternativas prioritarias para ejecución en el primer semestre.');
      }
      setMaxSelections(2);
    }
  };

  // Derived available census options
  const availableTowers = Array.from(new Set(registeredOwners.map((o) => o.building || 'Torre Principal'))).sort();
  const councilOwners = registeredOwners.filter((o) => !!o.isCouncilMember);

  const eligibleOwners = registeredOwners.filter((o) => {
    if (targetAudience === 'all') return true;
    if (targetAudience === 'council_only') return !!o.isCouncilMember;
    if (targetAudience === 'specific_towers') return selectedTowers.includes(o.building || 'Torre Principal');
    if (targetAudience === 'towers_and_council') {
      return selectedTowers.includes(o.building || 'Torre Principal') || !!o.isCouncilMember;
    }
    if (targetAudience === 'custom') return selectedCustomOwnerIds.includes(o.id);
    return true;
  });
  const eligibleCoeff = eligibleOwners.reduce((s, o) => s + (o.coefficient || 0), 0);

  // Auto-complete candidate when owner is selected from dropdown
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
        setCandPhoto(
          `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`
        );
      }
    }
  };

  // Add Candidate
  const handleAddCandidate = () => {
    if (!candName.trim()) {
      alert('Por favor ingrese el nombre del candidato o selecciónelo del censo.');
      return;
    }

    const proposalText = candProposal.trim() || 'Candidato postulado para la representación en la asamblea.';
    const proposalPdfUrl =
      candPdfData?.url ||
      createCandidateProposalPdfUri(
        candName.trim(),
        `${candApto.trim() || 'Apto'} - ${candBuilding.trim() || 'Torre'}`,
        candRole.trim() || 'Consejo de Administración',
        candProposal.trim() || 'Cumplimiento del reglamento de propiedad horizontal y optimización de recursos.'
      );

    const newCandidate: Candidate = {
      id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: candName.trim(),
      documentNumber: candDoc.trim() || 'CC Verificada',
      apartment: candApto.trim() || 'Apto Propio',
      building: candBuilding.trim() || 'Torre Principal',
      rolePostulation: candRole.trim() || 'Consejo de Administración',
      profileSummary: proposalText,
      proposals: candProposal.trim() || 'Cumplimiento del reglamento de propiedad horizontal y optimización de recursos.',
      proposalPdfUrl,
      proposalPdfName: candPdfData?.name || `Propuesta_${candName.trim().replace(/\s+/g, '_')}.pdf`,
      proposalPdfSize: candPdfData?.size || 42000,
      photoUrl:
        candPhoto.trim() ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
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
    setCandPdfData(null);
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor ingrese el título de la votación.');
      return;
    }
    if (!question.trim()) {
      alert('Por favor ingrese la pregunta formal.');
      return;
    }

    if (type === 'candidate_election' && candidatesList.length === 0) {
      alert('Para elecciones de candidatos debe registrar al menos un candidato postulado.');
      return;
    }

    if (
      (targetAudience === 'specific_towers' || targetAudience === 'towers_and_council') &&
      selectedTowers.length === 0
    ) {
      alert('Debe seleccionar al menos una torre autorizada.');
      return;
    }

    if (targetAudience === 'custom' && selectedCustomOwnerIds.length === 0) {
      alert('Debe seleccionar al menos un copropietario en el padrón personalizado.');
      return;
    }

    setIsLoading(true);

    try {
      let formattedOptions: VoteOption[] = [];

      if (type === 'yes_no') {
        formattedOptions = [
          { id: `opt-${Date.now()}-yes`, label: 'SÍ, APRUEBO', color: 'emerald' },
          { id: `opt-${Date.now()}-no`, label: 'NO APRUEBO', color: 'rose' },
          { id: `opt-${Date.now()}-abs`, label: 'ME ABSTENGO', color: 'slate' }
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
        formattedOptions = options.map((opt, i) => ({
          id: `opt-${Date.now()}-${i}`,
          label: opt
        }));
        if (allowAbstain) {
          formattedOptions.push({
            id: `opt-${Date.now()}-abs`,
            label: 'ME ABSTENGO DE VOTAR',
            description: 'Voto en blanco o abstención'
          });
        }
      }

      // Filter Configuration
      const filterConfig = {
        targetAudience,
        filterType: targetAudience,
        allowedTowers:
          targetAudience === 'specific_towers' || targetAudience === 'towers_and_council' ? selectedTowers : undefined,
        allowedOwnerIds: targetAudience === 'custom' ? selectedCustomOwnerIds : undefined,
        councilOnly: targetAudience === 'council_only'
      };

      await api.createVote(assemblyId, {
        title: title.trim(),
        question: question.trim(),
        description: description.trim() || undefined,
        type,
        options: formattedOptions,
        candidates: type === 'candidate_election' ? candidatesList : undefined,
        minSelections: 1,
        maxSelections: type === 'candidate_election' || type === 'multiple_choice' ? maxSelections : 1,
        requiresCoefficient,
        isSecret,
        showLiveResults: true,
        allowAbstain,
        attachmentPdfUrl,
        attachmentPdfName,
        filterConfig,
        complexId
      });

      onVoteCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al crear la votación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Votación o Elección Digital" maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: VOTE CATEGORY SELECTOR (RICH CARDS) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            1. Modalidad de Votación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'yes_no',
                title: 'SÍ / NO / ABSTENCIÓN',
                desc: 'Aprobación de balances, cuotas y reformas estatutarias',
                badge: 'Mayoría Ley 675',
                icon: <Scale className="w-5 h-5 text-emerald-600" />
              },
              {
                id: 'candidate_election',
                title: 'Elección de Candidatos',
                desc: 'Consejo de administración, comité y revisoría fiscal con foto',
                badge: 'Plancha / Listas',
                icon: <Users className="w-5 h-5 text-teal-600" />
              },
              {
                id: 'single_choice',
                title: 'Selección Única',
                desc: 'Elegir 1 opción entre múltiples propuestas o proveedores',
                badge: '1 Alternativa',
                icon: <Vote className="w-5 h-5 text-indigo-600" />
              },
              {
                id: 'multiple_choice',
                title: 'Selección Múltiple',
                desc: 'El votante puede marcar hasta N opciones simultáneas',
                badge: 'Hasta N opciones',
                icon: <Layers className="w-5 h-5 text-purple-600" />
              }
            ].map((cat) => {
              const isSelected = type === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleTypeSelect(cat.id as VoteCategory)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between text-left ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/60 shadow-sm ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-100">{cat.icon}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {cat.badge}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{cat.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{cat.desc}</p>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isSelected ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
                      {isSelected ? 'Seleccionado' : 'Elegir'}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-teal-600 text-white' : 'border-2 border-slate-300'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: TITLE & STATEMENT */}
        <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              2. Enunciado y Fundamentación Oficial
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título Formal de la Votación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Aprobación del Presupuesto Anual Ordinario 2026-2027"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pregunta Directa al Votante <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Aprueba usted el presupuesto presentado por la administración por valor de $145.000.000 COP?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción o Contexto Legal (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle los antecedentes, informe de revisoría fiscal o normas aplicables de la Ley 675..."
              className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white resize-none"
            />
          </div>

          {/* Technical document attachment */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Documento Técnico / Presupuesto en PDF (Opcional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Los votantes podrán consultar y descargar este documento adjunto directamente antes de emitir su voto.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>{attachmentPdfName ? 'Cambiar PDF' : 'Subir Anexo PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const base64 = await fileToBase64(file);
                        setAttachmentPdfUrl(base64);
                        setAttachmentPdfName(file.name);
                      } catch (err: any) {
                        alert('Error al cargar archivo: ' + err.message);
                      }
                    }
                  }}
                />
              </label>
            </div>
            {attachmentPdfName && (
              <div className="mt-2 p-2 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs text-teal-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" /> {attachmentPdfName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentPdfUrl(undefined);
                    setAttachmentPdfName(undefined);
                  }}
                  className="text-rose-600 hover:underline font-bold text-[11px]"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: OPTIONS CONFIGURATION OR CANDIDATES REGISTRATION */}
        {type === 'candidate_election' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Plancha de Candidatos Postulados
                </label>
                <p className="text-xs text-slate-600">
                  Seleccione copropietarios del censo o regístrelos manualmente con sus propuestas y fotos:
                </p>
              </div>
              <Badge variant="teal" size="md">
                {candidatesList.length} postulados
              </Badge>
            </div>

            {/* Candidate Postulation Form */}
            <Card className="p-4 sm:p-5 bg-teal-50/40 border-teal-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-950 uppercase">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>Postular Nuevo Candidato</span>
              </div>

              {/* Census auto-completion */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paso A: Auto-completar desde el Censo de Propietarios (Opcional)
                </label>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => handleOwnerSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white"
                >
                  <option value="">-- Buscar copropietario por cédula, nombre o apartamento --</option>
                  {registeredOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      CC {owner.documentNumber} - {owner.name} ({owner.apartment} {owner.building})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    placeholder="Nombre del candidato"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cédula / Documento</label>
                  <input
                    type="text"
                    value={candDoc}
                    onChange={(e) => setCandDoc(e.target.value)}
                    placeholder="Número de identificación"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inmueble / Apartamento</label>
                  <input
                    type="text"
                    value={candApto}
                    onChange={(e) => setCandApto(e.target.value)}
                    placeholder="Ej: Apto 302 Torre A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo a Postularse</label>
                  <select
                    value={candRole}
                    onChange={(e) => setCandRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-semibold"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Propuesta de Gestión y Perfil Profesional
                </label>
                <textarea
                  rows={2}
                  value={candProposal}
                  onChange={(e) => setCandProposal(e.target.value)}
                  placeholder="Resumen del plan de trabajo, experiencia en PH, compromisos de auditoría y gestión..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-normal bg-white resize-none"
                />
              </div>

              {/* Candidate PDF Proposal Upload */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Adjuntar Plan de Trabajo / Propuesta en PDF
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Si no adjunta un archivo, el sistema generará automáticamente un PDF firmado con la propuesta.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{candPdfData ? 'PDF Listo' : 'Subir PDF Propuesta'}</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await fileToBase64(file);
                            setCandPdfData({ url: base64, name: file.name, size: file.size });
                          } catch (err: any) {
                            alert('Error al leer PDF: ' + err.message);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {candPdfData && (
                  <p className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Archivo adjunto: {candPdfData.name} ({Math.round(candPdfData.size / 1024)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAddCandidate}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="bg-teal-600 hover:bg-teal-700 font-bold px-6"
                >
                  Agregar a la Plancha de Candidatos
                </Button>
              </div>
            </Card>

            {/* List of Registered Candidates */}
            <div className="space-y-3">
              {candidatesList.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                  No hay candidatos registrados en la plancha todavía. Diligencie el formulario arriba para agregar los
                  postulados.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidatesList.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={c.photoUrl}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover border-2 border-teal-500 shadow-xs shrink-0"
                        />
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-slate-900 text-sm leading-tight">{c.name}</h5>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            {c.apartment} • CC {c.documentNumber}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                            {c.rolePostulation}
                          </span>
                          {c.profileSummary && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 font-normal">
                              {c.profileSummary}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Eliminar candidato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Settings for candidate election */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={includeBlankVote}
                    onChange={(e) => setIncludeBlankVote(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>Incluir opción democrática de "VOTO EN BLANCO"</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Máximo a elegir por votante:</span>
                  <input
                    type="number"
                    min={1}
                    max={candidatesList.length || 5}
                    value={maxSelections}
                    onChange={(e) => setMaxSelections(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : type === 'yes_no' ? (
          /* YES / NO PREVIEW */
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              3. Opciones Legales Configurada
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/30 text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mx-auto">
                  ✓
                </div>
                <h5 className="font-bold text-emerald-950 text-sm">SÍ, APRUEBO</h5>
                <p className="text-[11px] text-emerald-700">Voto afirmativo computable</p>
              </div>
              <div className="p-4 rounded-2xl border-2 border-rose-500/40 bg-rose-50/30 text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold mx-auto">
                  ✕
                </div>
                <h5 className="font-bold text-rose-950 text-sm">NO APRUEBO</h5>
                <p className="text-[11px] text-rose-700">Voto negativo computable</p>
              </div>
              <div className="p-4 rounded-2xl border-2 border-slate-300 bg-slate-50 text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold mx-auto">
                  —
                </div>
                <h5 className="font-bold text-slate-900 text-sm">ME ABSTENGO</h5>
                <p className="text-[11px] text-slate-500">Abstención formal registrada</p>
              </div>
            </div>
          </div>
        ) : (
          /* SINGLE & MULTIPLE CHOICE OPTIONS LIST */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Opciones a Elegir
                </label>
                <p className="text-xs text-slate-600">Defina las alternativas que los votantes verán en pantalla:</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Añadir Opción
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 font-bold text-xs text-slate-600 flex items-center justify-center shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Opción ${String.fromCharCode(65 + idx)}`}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Eliminar opción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {type === 'multiple_choice' && (
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-purple-950">Máximo de opciones permitidas por votante:</span>
                <input
                  type="number"
                  min={1}
                  max={options.length}
                  value={maxSelections}
                  onChange={(e) => setMaxSelections(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 rounded-lg border border-purple-300 text-center font-bold text-purple-900 bg-white"
                />
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: VOTER AUDIENCE & SEGMENTATION */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wide">
                4. Padrón Electoral y Reglas de Cómputo (Ley 675)
              </h3>
            </div>
            <span className="text-xs font-bold text-teal-900 bg-teal-100/90 px-3 py-1 rounded-full border border-teal-200 self-start sm:self-auto">
              {eligibleOwners.length} de {registeredOwners.length} copropietarios habilitados ({eligibleCoeff.toFixed(2)}%
              coef.)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ¿Quiénes están autorizados para votar en este punto?
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
            >
              <option value="all">👥 Todos los copropietarios del conjunto (Asamblea General)</option>
              <option value="council_only">🏛️ Exclusivo: Solo Miembros del Consejo de Administración</option>
              <option value="specific_towers">🏢 Por Torres: Solo copropietarios de Torres / Bloques específicos</option>
              <option value="towers_and_council">🏢 Torres específicas Y Miembros del Consejo</option>
              <option value="custom">👤 Selección manual de copropietarios específicos</option>
            </select>
          </div>

          {/* Specific Towers */}
          {(targetAudience === 'specific_towers' || targetAudience === 'towers_and_council') && (
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Seleccione las Torres / Bloques autorizados:</label>
              <div className="flex flex-wrap gap-2">
                {availableTowers.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No hay torres registradas en este conjunto.</p>
                ) : (
                  availableTowers.map((tower) => {
                    const isChecked = selectedTowers.includes(tower);
                    const towerOwners = registeredOwners.filter((o) => (o.building || 'Torre Principal') === tower);
                    const towerCoeff = towerOwners.reduce((s, o) => s + (o.coefficient || 0), 0);
                    return (
                      <label
                        key={tower}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedTowers(selectedTowers.filter((t) => t !== tower));
                            } else {
                              setSelectedTowers([...selectedTowers, tower]);
                            }
                          }}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <span>{tower}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({towerOwners.length} aptos • {towerCoeff.toFixed(2)}%)
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Council only */}
          {targetAudience === 'council_only' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Votación restringida al Consejo de Administración ({councilOwners.length} miembros registrados)</span>
              </div>
              {councilOwners.length === 0 ? (
                <p className="text-rose-700 font-medium pt-1">
                  ⚠️ Atención: No hay miembros del consejo marcados en el censo. Ingrese a "Copropietarios" para activarlos.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {councilOwners.map((co) => (
                    <span
                      key={co.id}
                      className="px-2 py-0.5 bg-amber-100/90 border border-amber-300 rounded text-[11px] font-semibold text-amber-950"
                    >
                      {co.name} • {co.building} {co.apartment} ({co.councilRole || 'Consejero'})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom owners */}
          {targetAudience === 'custom' && (
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">Seleccione los copropietarios autorizados:</label>
                <span className="text-slate-500 font-semibold">{selectedCustomOwnerIds.length} seleccionados</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 text-xs">
                {registeredOwners.map((o) => {
                  const isChecked = selectedCustomOwnerIds.includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedCustomOwnerIds(selectedCustomOwnerIds.filter((id) => id !== o.id));
                            } else {
                              setSelectedCustomOwnerIds([...selectedCustomOwnerIds, o.id]);
                            }
                          }}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <span className="font-semibold text-slate-900">{o.name}</span>
                        <span className="text-slate-500 font-normal">
                          ({o.building} - {o.apartment})
                        </span>
                      </div>
                      <span className="font-mono text-teal-800 font-bold">{o.coefficient.toFixed(2)}%</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legal Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-teal-300 transition-colors">
              <input
                type="checkbox"
                checked={requiresCoefficient}
                onChange={(e) => setRequiresCoefficient(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded shrink-0"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-800">Cómputo por Coeficiente</p>
                <p className="text-slate-500 text-[11px]">Ponderado por cuota de propiedad horizontal (Ley 675)</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-teal-300 transition-colors">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded shrink-0"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-800">Voto Secreto Encriptado</p>
                <p className="text-slate-500 text-[11px]">Separa identidad de voto en urna digital anónima</p>
              </div>
            </label>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="lg" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="xl"
            isLoading={isLoading}
            className="bg-teal-600 hover:bg-teal-700 font-black px-8"
          >
            Guardar y Crear Votación
          </Button>
        </div>
      </form>
    </Modal>
  );
};
