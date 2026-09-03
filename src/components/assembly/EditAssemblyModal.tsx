import React, { useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, MapPin, Shield, Users } from 'lucide-react';
import { api } from '../../services/api';
import { Assembly } from '../../types';
import { Alert, Button, Modal } from '../common/UIComponents';

interface EditAssemblyModalProps {
  isOpen: boolean;
  assembly: Assembly;
  onClose: () => void;
  onUpdated: (updated: Assembly) => void;
}

export const EditAssemblyModal: React.FC<EditAssemblyModalProps> = ({
  isOpen,
  assembly,
  onClose,
  onUpdated
}) => {
  const [title, setTitle] = useState(assembly.title);
  const [type, setType] = useState(assembly.type);
  const [modality, setModality] = useState(assembly.modality);
  const [date, setDate] = useState(assembly.date);
  const [time, setTime] = useState(assembly.time);
  const [location, setLocation] = useState(assembly.location);
  const [description, setDescription] = useState(assembly.description);
  const [requiredQuorum, setRequiredQuorum] = useState(assembly.requiredQuorum || 50.1);
  const [status, setStatus] = useState(assembly.status);
  const [administratorName, setAdministratorName] = useState(assembly.administratorName || 'Carolina Méndez Rojas');
  const [presidentName, setPresidentName] = useState(assembly.presidentName || 'Dr. Gustavo Petro Ortiz');
  const [accountantName, setAccountantName] = useState(assembly.accountantName || 'C.P. Fernando Valdés Ruiz');
  const [secretaryName, setSecretaryName] = useState(assembly.secretaryName || 'Mariana Gómez S.');
  const [autoSendMinutes, setAutoSendMinutes] = useState(assembly.autoSendMinutes ?? true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError('El título, fecha y hora son obligatorios.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const updated = await api.updateAssembly(assembly.id, {
        title,
        type,
        modality,
        date,
        time,
        location,
        description,
        requiredQuorum: Number(requiredQuorum),
        status,
        administratorName,
        presidentName,
        accountantName,
        secretaryName,
        autoSendMinutes
      });
      setSuccess(true);
      setTimeout(() => {
        onUpdated(updated);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la asamblea');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Asamblea: ${assembly.title}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <Alert type="error" title="Error">{error}</Alert>}
        {success && (
          <Alert type="success" title="Actualización exitosa">
            La información de la asamblea se ha actualizado correctamente.
          </Alert>
        )}

        {/* Section 1: General Info */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            Información General de la Convocatoria
          </h4>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Título de la Asamblea</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tipo de Asamblea</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium"
              >
                <option value="ordinaria">Ordinaria (Anual)</option>
                <option value="extraordinaria">Extraordinaria</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Modalidad</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium"
              >
                <option value="mixta">Mixta (Presencial + Virtual)</option>
                <option value="presencial">100% Presencial</option>
                <option value="virtual">100% Virtual</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Estado de la Asamblea</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-bold text-teal-800"
              >
                <option value="scheduled">Programada (Convocatoria)</option>
                <option value="in_progress">En Curso (Transmisión / Votación)</option>
                <option value="finished">Finalizada (Cerrada)</option>
                <option value="draft">Borrador</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Fecha</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Hora de Inicio</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Quórum Requerido (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={requiredQuorum}
                onChange={(e) => setRequiredQuorum(parseFloat(e.target.value) || 50.1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Lugar / Enlace de Transmisión</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Salón Comunal Piso 2 y Microsoft Teams"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Orden del Día / Descripción</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Dignitaries */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            Mesa Directiva & Firmantes de la Asamblea
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Presidente de Asamblea</label>
              <input
                type="text"
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Administrador(a)</label>
              <input
                type="text"
                value={administratorName}
                onChange={(e) => setAdministratorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Secretaria(o) de Asamblea</label>
              <input
                type="text"
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Contador / Revisor Fiscal</label>
              <input
                type="text"
                value={accountantName}
                onChange={(e) => setAccountantName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification options */}
        <label className="flex items-center gap-2 p-3 bg-teal-50/70 border border-teal-200 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={autoSendMinutes}
            onChange={(e) => setAutoSendMinutes(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded"
          />
          <span className="font-semibold text-teal-950">
            Enviar automáticamente el extracto del acta y resultados por correo a los copropietarios al finalizar la asamblea.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="bg-teal-600 hover:bg-teal-700 font-bold">
            Guardar Cambios de la Asamblea
          </Button>
        </div>
      </form>
    </Modal>
  );
};
