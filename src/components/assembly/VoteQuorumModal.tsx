import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Vote as VoteIcon,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Vote, VoteAttendanceDetails } from '../../types';
import { exportVoteAttendanceToExcel } from '../../utils/excelHelper';
import { Badge, Button, Modal } from '../common/UIComponents';

interface VoteQuorumModalProps {
  isOpen: boolean;
  onClose: () => void;
  vote: Vote;
  assemblyTitle?: string;
}

export const VoteQuorumModal: React.FC<VoteQuorumModalProps> = ({
  isOpen,
  onClose,
  vote,
  assemblyTitle = 'Asamblea General'
}) => {
  const [details, setDetails] = useState<VoteAttendanceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'voted' | 'pending'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const data = await api.getVoteAttendance(vote.id);
      setDetails(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
    }
  }, [isOpen, vote.id]);

  if (!isOpen) return null;

  const summary = details?.summary;
  const quorumPct = summary?.quorumPercentage ?? 0;
  const isQuorumReached = summary?.isQuorumMet ?? false;
  const requiredQuorum = summary?.requiredQuorum ?? 50.01;

  // Filter list
  const filteredList = (details?.attendees || []).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.apartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.building.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'voted') return item.hasVoted;
    if (filterTab === 'pending') return !item.hasVoted;
    return true;
  });

  const handleExport = () => {
    if (details) {
      exportVoteAttendanceToExcel(details, assemblyTitle);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                <VoteIcon className="w-3.5 h-3.5" /> Quórum de Votación en Vivo
              </span>
              <Badge variant={vote.status === 'active' ? 'emerald' : vote.status === 'finished' ? 'slate' : 'amber'}>
                {vote.status === 'active' ? '● VOTACIÓN ABIERTA' : vote.status === 'finished' ? 'FINALIZADA' : 'PROGRAMADA'}
              </Badge>
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-snug">{vote.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{vote.question}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAttendance}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              className="text-xs"
            >
              Actualizar
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleExport}
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              className="bg-teal-600 hover:bg-teal-700 text-xs font-bold"
            >
              Excel
            </Button>
          </div>
        </div>

        {/* GRÁFICAS DE ASISTENCIA Y QUÓRUM SENCILLAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Coeficiente & Quórum Decisorio */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/70 to-slate-50 border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-950 uppercase">Quórum Computado</span>
              <span className={`font-black ${isQuorumReached ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isQuorumReached ? '✓ Quórum Válido' : 'En Curso'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-teal-900">{quorumPct.toFixed(2)}%</span>
              <span className="text-xs text-slate-500 font-semibold">de 100% total</span>
            </div>
            {/* Visual Progress Bar with 50.01% marker */}
            <div className="space-y-1">
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isQuorumReached ? 'bg-emerald-500' : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(quorumPct, 100)}%` }}
                />
                {/* 50.01% marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                  style={{ left: `${requiredQuorum}%` }}
                  title={`Quórum legal requerido: ${requiredQuorum}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0%</span>
                <span className="font-bold text-slate-700">Mínimo: {requiredQuorum}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Participación de Inmuebles */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase">Inmuebles Votantes</span>
              <span className="text-slate-500 font-semibold">
                {summary ? `${summary.attendancePercentage}%` : '0%'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{summary?.totalVotersCount ?? 0}</span>
              <span className="text-xs text-slate-500 font-semibold">
                de {summary?.totalEligibleCount ?? 0} convocados
              </span>
            </div>
            {/* Visual Attendance Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-teal-600 transition-all duration-500"
                style={{ width: `${summary?.attendancePercentage ?? 0}%` }}
                title="Votaron"
              />
              <div
                className="h-full bg-amber-400/80 transition-all duration-500"
                style={{ width: `${100 - (summary?.attendancePercentage ?? 0)}%` }}
                title="Pendientes por votar"
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold">
              <span className="text-teal-700">● {summary?.totalVotersCount ?? 0} votaron</span>
              <span className="text-amber-800">
                ● {(summary?.totalEligibleCount ?? 0) - (summary?.totalVotersCount ?? 0)} pendientes
              </span>
            </div>
          </div>

          {/* Card 3: Estatus Jurídico Ley 675 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Validez Ley 675 / 2001</span>
            <div className="my-1">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isQuorumReached ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <span className={isQuorumReached ? 'text-emerald-800 font-extrabold' : 'text-amber-800'}>
                  {isQuorumReached
                    ? 'Quórum Legal Superado'
                    : 'Esperando Quórum Mínimo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {isQuorumReached
                  ? 'La votación cuenta con suficiente coeficiente para adopción válida de decisiones.'
                  : `Se requiere al menos ${requiredQuorum}% para constituir mayoría legal.`}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Actualizado: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Simple Graphical Attendance Ratio Bars */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-teal-600" />
              <span className="font-semibold text-slate-700">
                Votos Ejercidos: <strong>{summary?.totalVotersCount ?? 0}</strong> ({summary?.totalCoefficientVoted.toFixed(2)}% coef.)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
              <span className="font-semibold text-slate-700">
                Inmuebles Pendientes:{' '}
                <strong>
                  {details ? details.pendingList.length : 0}
                </strong>{' '}
                ({((summary?.totalEligibleCoefficient ?? 100) - (summary?.totalCoefficientVoted ?? 0)).toFixed(2)}% coef.)
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            100% Coeficiente de Copropiedad
          </span>
        </div>

        {/* LISTA FILTRABLE DE ASISTENCIA EN VIVO */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Todos ({details?.attendees.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('voted')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterTab === 'voted' ? 'bg-teal-600 text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Voto Ejercido ({details?.votedList.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterTab === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Pendientes por Votar ({details?.pendingList.length || 0})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar inmueble o nombre..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Attendees Table */}
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3">Inmueble</th>
                  <th className="py-2.5 px-3">Copropietario</th>
                  <th className="py-2.5 px-3 text-center">Coeficiente</th>
                  <th className="py-2.5 px-3 text-center">Estado en esta Votación</th>
                  <th className="py-2.5 px-3">Hora de Sufragio</th>
                  <th className="py-2.5 px-3">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No se encontraron copropietarios con el criterio seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr
                      key={item.ownerId || idx}
                      className={item.hasVoted ? 'bg-teal-50/20 hover:bg-teal-50/40' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {item.building ? `${item.building} - ` : ''}
                        {item.apartment}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        {item.isCouncilMember && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            <Award className="w-2.5 h-2.5" /> {item.councilRole || 'Consejo'}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {item.coefficient.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.hasVoted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Votó
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {item.votedAt ? new Date(item.votedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                        {item.receiptCode ? (
                          <span className="text-teal-700 font-bold">{item.receiptCode.slice(0, 14)}...</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <Button size="md" variant="outline" onClick={onClose}>
            Cerrar Ventana
          </Button>
        </div>
      </div>
    </Modal>
  );
};
