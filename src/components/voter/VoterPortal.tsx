import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Lock,
  Printer,
  ShieldCheck,
  Sparkles,
  User,
  Vote as VoteIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Assembly, Candidate, Vote, VoteOption } from '../../types';
import { Alert, Badge, Button, Card, Modal } from '../common/UIComponents';

interface VoterPortalProps {
  assemblyId?: string;
  onBackToAdmin?: () => void;
}

export const VoterPortal: React.FC<VoterPortalProps> = ({
  assemblyId = 'assembly-1',
  onBackToAdmin
}) => {
  const { user, complex } = useAuth();
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Active voting modal state
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [votingStep, setVotingStep] = useState<'select' | 'confirm' | 'receipt'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    receiptCode: string;
    verificationCode: string;
    votedAt: string;
    voterApartment: string;
    voterCoefficient: number;
  } | null>(null);

  // Candidate detail preview modal
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);

  const loadVoterData = async () => {
    try {
      setIsLoading(true);
      const [asm, vList] = await Promise.all([
        api.getAssembly(assemblyId),
        api.getVotes(assemblyId)
      ]);
      setAssembly(asm);
      setVotes(vList);

      // Check voting status for current user for each vote
      if (user) {
        const statusMap: Record<string, boolean> = {};
        for (const v of vList) {
          const hasVoted = await api.checkHasVoted(v.id, user.id, user.documentNumber, user.apartment);
          statusMap[v.id] = hasVoted;
        }
        setVotedMap(statusMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVoterData();
  }, [assemblyId, user]);

  const handleOpenVote = (vote: Vote) => {
    setSelectedVote(vote);
    setSelectedOptions([]);
    setVotingStep('select');
    setReceiptData(null);
  };

  const handleToggleOption = (optionId: string) => {
    if (!selectedVote) return;

    if (selectedVote.maxSelections === 1) {
      setSelectedOptions([optionId]);
    } else {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
      } else {
        if (selectedOptions.length < selectedVote.maxSelections) {
          setSelectedOptions([...selectedOptions, optionId]);
        } else {
          alert(`Máximo ${selectedVote.maxSelections} opciones permitidas.`);
        }
      }
    }
  };

  const handleConfirmVote = async () => {
    if (!selectedVote || !user) return;
    if (selectedOptions.length === 0) {
      alert('Por favor seleccione una opción para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.castVote(selectedVote.id, {
        voterUserId: user.id,
        voterName: user.name,
        voterApartment: user.apartment || 'Apto Copropietario',
        voterDocument: user.documentNumber,
        voterCoefficient: user.coefficient || 7.5,
        selectedOptionIds: selectedOptions
      });

      setReceiptData(res);
      setVotingStep('receipt');
      setVotedMap((prev) => ({ ...prev, [selectedVote.id]: true }));

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore in iframe if blocked
      }
    } catch (err: any) {
      alert(err.message || 'Error al emitir su voto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !assembly) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-base font-bold text-slate-800">Cargando su portal de votación personal...</p>
      </div>
    );
  }

  const activeVotes = votes.filter((v) => v.status === 'active');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Voter Profile Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase">
            <ShieldCheck className="w-4 h-4" /> Votante Acreditado
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            {user?.name || 'Copropietario'}
          </h1>
          <p className="text-sm text-slate-300">
            {complex?.name} • Inmueble: <span className="font-bold text-white">{user?.apartment || 'Apto 302'}</span> ({user?.building || 'Torre A'})
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[150px]">
          <p className="text-xs text-teal-200 uppercase font-bold tracking-wider">Su Coeficiente</p>
          <p className="text-3xl font-black text-white mt-0.5">{user?.coefficient || 7.85}%</p>
          <p className="text-[10px] text-slate-300 mt-1">Poder de decisión en asamblea</p>
        </div>
      </div>

      {/* Assembly Status Ribbon */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-teal-950 uppercase">{assembly.title}</p>
            <p className="text-xs text-teal-800">
              Quórum Actual: <span className="font-bold">{assembly.representedQuorum}%</span> (Sesión en vivo)
            </p>
          </div>
        </div>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
          >
            Volver a Mesa Directiva
          </button>
        )}
      </div>

      {/* Active Votes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display flex items-center gap-2">
            <VoteIcon className="w-6 h-6 text-teal-600" />
            Votaciones Disponibles en la Asamblea
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {activeVotes.length} {activeVotes.length === 1 ? 'votación abierta' : 'votaciones abiertas'}
          </span>
        </div>

        {votes.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No hay votaciones programadas en este momento.
          </Card>
        ) : (
          <div className="space-y-5">
            {votes.map((vote) => {
              const hasVoted = votedMap[vote.id];
              const isActive = vote.status === 'active';

              return (
                <Card
                  key={vote.id}
                  className={`p-6 sm:p-8 transition-all border-2 ${
                    hasVoted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isActive
                      ? 'border-teal-500 shadow-lg shadow-teal-500/5 bg-white'
                      : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {hasVoted ? (
                          <Badge variant="emerald" size="lg" className="gap-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> VOTO REGISTRADO
                          </Badge>
                        ) : isActive ? (
                          <Badge variant="teal" size="lg" className="animate-pulse font-bold">
                            ● VOTACIÓN ABIERTA AHORA
                          </Badge>
                        ) : (
                          <Badge variant="slate" size="md">
                            {vote.status === 'finished' ? 'VOTACIÓN FINALIZADA' : 'PROGRAMADA'}
                          </Badge>
                        )}

                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          {vote.type === 'candidate_election' ? 'Elección de Consejo' : 'Votación Reglamentaria'}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                        {vote.title}
                      </h3>

                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                        {vote.question}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-teal-600" /> {vote.isSecret ? 'Voto Secreto Encriptado' : 'Voto Nominal'}
                        </span>
                        <span>•</span>
                        <span>{vote.requiresCoefficient ? 'Ponderado por Coeficiente de Copropiedad' : '1 Inmueble = 1 Voto'}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {hasVoted ? (
                        <div className="p-3 bg-emerald-100/80 rounded-2xl text-center text-xs font-bold text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Sufragio Confirmado
                        </div>
                      ) : isActive ? (
                        <Button
                          size="xl"
                          variant="primary"
                          onClick={() => handleOpenVote(vote)}
                          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 font-black shadow-md tracking-wide px-8 text-lg"
                        >
                          VOTAR AHORA
                        </Button>
                      ) : (
                        <Button size="md" variant="ghost" disabled className="text-slate-400">
                          {vote.status === 'finished' ? 'Cerrada' : 'En Espera'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Senior Help Notice */}
      <Card className="p-6 bg-slate-50 border-slate-200 text-xs sm:text-sm text-slate-600 flex items-start gap-4">
        <Info className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800">¿Necesita asistencia para votar?</p>
          <p className="leading-relaxed">
            Si tiene dudas técnicas o requiere acompañamiento en la sala, comuníquese con el soporte en vivo de la administración o acérquese a la mesa de acreditación en el salón comunal.
          </p>
        </div>
      </Card>

      {/* STEP-BY-STEP VOTING MODAL (SENIOR-FRIENDLY) */}
      {selectedVote && (
        <Modal
          isOpen={!!selectedVote}
          onClose={() => setSelectedVote(null)}
          title={
            votingStep === 'receipt'
              ? '¡Voto Registrado con Éxito!'
              : votingStep === 'confirm'
              ? 'Confirme su Decisión de Voto'
              : 'Emita su Voto Digital'
          }
          maxWidth="2xl"
        >
          {/* STEP 1: SELECT OPTIONS */}
          {votingStep === 'select' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                <h4 className="text-base sm:text-lg font-bold text-teal-950">{selectedVote.title}</h4>
                <p className="text-sm sm:text-base text-teal-800 mt-1 font-medium">{selectedVote.question}</p>
                {selectedVote.maxSelections > 1 && (
                  <p className="text-xs font-bold text-teal-700 mt-2 uppercase tracking-wide">
                    Puede seleccionar hasta {selectedVote.maxSelections} opciones.
                  </p>
                )}
              </div>

              {/* Candidates Grid (if candidate election) */}
              {selectedVote.type === 'candidate_election' && selectedVote.candidates && selectedVote.candidates.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedVote.candidates.map((cand) => {
                      const opt = selectedVote.options.find((o) => o.candidateId === cand.id || o.label.includes(cand.name));
                      const isSelected = opt ? selectedOptions.includes(opt.id) : false;

                      return (
                        <div
                          key={cand.id}
                          onClick={() => opt && handleToggleOption(opt.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/80 shadow-md ring-2 ring-teal-500'
                              : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={cand.photoUrl}
                                alt={cand.name}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-full object-cover border-2 border-teal-500 shadow-sm flex-shrink-0"
                              />
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm sm:text-base">{cand.name}</h5>
                                <p className="text-xs text-slate-500 font-semibold">{cand.apartment} • {cand.building}</p>
                                {cand.rolePostulation && (
                                  <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                    {cand.rolePostulation}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {cand.profileSummary}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewCandidate(cand);
                              }}
                              className="text-xs font-bold text-teal-700 hover:underline"
                            >
                              Ver Propuestas Completas →
                            </button>

                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
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

                  {/* Extra options like Voto en Blanco */}
                  {selectedVote.options.filter((o) => !o.candidateId && !selectedVote.candidates?.some(c => o.label.includes(c.name))).map((opt) => {
                    const isSelected = selectedOptions.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleToggleOption(opt.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 shadow-md ring-2 ring-teal-500'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">{opt.label}</p>
                          {opt.description && (
                            <p className="text-xs text-slate-500">{opt.description}</p>
                          )}
                        </div>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            isSelected ? 'bg-teal-600 text-white' : 'border-2 border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Standard Options Grid */
                <div className="space-y-3">
                  {selectedVote.options.map((opt) => {
                    const isSelected = selectedOptions.includes(opt.id);

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleToggleOption(opt.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 shadow-md ring-2 ring-teal-500'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-base sm:text-lg font-bold text-slate-900">{opt.label}</p>
                          {opt.description && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{opt.description}</p>
                          )}
                        </div>

                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-teal-600 text-white shadow-sm' : 'border-2 border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button variant="ghost" size="lg" onClick={() => setSelectedVote(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="xl"
                  disabled={selectedOptions.length === 0}
                  onClick={() => setVotingStep('confirm')}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                  className="font-black text-base px-8"
                >
                  Continuar a Confirmación
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIRMATION (PREVENTS MISTAKES) */}
          {votingStep === 'confirm' && (
            <div className="space-y-6 animate-fadeIn">
              <Alert type="warning" title="ADVERTENCIA IMPORTANTE">
                Por favor revise cuidadosamente su selección. Conforme a las normas de votación digital, una vez enviado, su voto será definitivo e inmodificable.
              </Alert>

              <Card className="p-6 bg-slate-50 space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Votación en Curso:</span>
                  <h4 className="text-base font-bold text-slate-900">{selectedVote.title}</h4>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Su Elección:</span>
                  <div className="space-y-2 mt-2">
                    {selectedOptions.map((optId) => {
                      const opt = selectedVote.options.find((o) => o.id === optId);
                      return (
                        <div key={optId} className="p-3 bg-white rounded-xl border border-teal-300 font-bold text-slate-900 text-base flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-teal-600" />
                          <span>{opt?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex justify-between">
                  <span>Inmueble: <strong className="text-slate-800">{user?.apartment}</strong></span>
                  <span>Coeficiente Representado: <strong className="text-teal-700">{user?.coefficient || 7.5}%</strong></span>
                </div>
              </Card>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setVotingStep('select')}
                  disabled={isSubmitting}
                >
                  Modificar Selección
                </Button>
                <Button
                  variant="primary"
                  size="xl"
                  isLoading={isSubmitting}
                  onClick={handleConfirmVote}
                  className="bg-emerald-600 hover:bg-emerald-700 font-black text-lg px-8 shadow-md"
                >
                  SÍ, CONFIRMO MI VOTO DEFINITIVO
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DIGITAL RECEIPT */}
          {votingStep === 'receipt' && receiptData && (
            <div className="space-y-6 text-center py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">¡Su Voto ha sido Computado Exitosamente!</h4>
                <p className="text-sm text-slate-600">
                  Hemos generado su comprobante digital único con validez jurídica y de auditoría.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="p-6 rounded-2xl bg-slate-900 text-white text-left space-y-3 font-mono text-xs max-w-lg mx-auto shadow-xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-teal-400 font-bold uppercase tracking-wider">COMPROBANTE DIGITAL VOTOSMART</span>
                  <span className="text-[10px] text-slate-400">Ley 675 / 2001</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <p><span className="text-slate-400">Código de Recibo:</span> <strong className="text-white font-bold">{receiptData.receiptCode}</strong></p>
                  <p><span className="text-slate-400">Hash de Verificación:</span> <strong className="text-teal-300">{receiptData.verificationCode}</strong></p>
                  <p><span className="text-slate-400">Inmueble / Unidad:</span> {receiptData.voterApartment}</p>
                  <p><span className="text-slate-400">Coeficiente:</span> {receiptData.voterCoefficient}%</p>
                  <p><span className="text-slate-400">Fecha y Hora:</span> {new Date(receiptData.votedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="md"
                  variant="outline"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={() => window.print()}
                >
                  Imprimir Comprobante
                </Button>
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => setSelectedVote(null)}
                  className="font-bold px-8"
                >
                  Entendido y Finalizar
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* CANDIDATE PROPOSALS MODAL */}
      {previewCandidate && (
        <Modal
          isOpen={!!previewCandidate}
          onClose={() => setPreviewCandidate(null)}
          title={`Perfil de Candidato: ${previewCandidate.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4">
              <img
                src={previewCandidate.photoUrl}
                alt={previewCandidate.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-500 shadow-md flex-shrink-0"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-base">{previewCandidate.name}</h4>
                <p className="text-slate-500 font-semibold">{previewCandidate.apartment} • {previewCandidate.building}</p>
                <p className="text-[11px] text-teal-700 mt-1">{previewCandidate.experience}</p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 uppercase mb-1">Perfil Profesional & Trayectoria</h5>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl">
                {previewCandidate.profileSummary}
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 uppercase mb-1">Propuestas Específicas para el Conjunto</h5>
              <div className="p-3 rounded-xl bg-teal-50/60 text-teal-950 whitespace-pre-line leading-relaxed font-medium">
                {previewCandidate.proposals}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="md" variant="primary" onClick={() => setPreviewCandidate(null)}>
                Cerrar Perfil
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
