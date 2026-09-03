import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
  Users
} from 'lucide-react';
import { api } from '../../services/api';
import { Assembly, AssemblyModality, AssemblyType } from '../../types';
import { Alert, Button, Card, Modal } from '../common/UIComponents';

interface AssemblyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAssemblyCreated: (assembly: Assembly) => void;
}

export const AssemblyWizard: React.FC<AssemblyWizardProps> = ({
  isOpen,
  onClose,
  onAssemblyCreated
}) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: 'Asamblea Extraordinaria de Propietarios - Fachadas y Seguridad 2026',
    type: 'extraordinaria' as AssemblyType,
    date: '2026-09-15',
    time: '19:00',
    location: 'Salón Social & Sala Virtual VotoSmart',
    modality: 'mixta' as AssemblyModality,
    description: 'Aprobación de cuota extraordinaria para impermeabilización de fachadas y renovación de equipos de seguridad electrónica.',
    administratorName: 'Carolina Méndez Rojas',
    presidentName: 'Dr. Gustavo Petro Ortiz',
    accountantName: 'C.P. Fernando Valdés Ruiz',
    secretaryName: 'Martha Cecilia Quintero',
    requiredQuorum: 50.01,
    totalOwnersInvited: 14,
    autoSendMinutes: true
  });

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.title.trim()) {
        setError('El título de la asamblea es obligatorio.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.date || !formData.time || !formData.location.trim()) {
        setError('Complete la fecha, hora y lugar de la asamblea.');
        return;
      }
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await api.createAssembly({
        ...formData,
        status: 'scheduled'
      });
      onAssemblyCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear la asamblea');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Asamblea (Asistente Guiado)" maxWidth="2xl">
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          {[
            { num: 1, label: 'Tipo y Título' },
            { num: 2, label: 'Fecha y Lugar' },
            { num: 3, label: 'Mesa Directiva' },
            { num: 4, label: 'Quórum y Reglas' },
            { num: 5, label: 'Confirmación' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.num
                    ? 'bg-teal-600 text-white'
                    : step > s.num
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span
                className={`hidden sm:inline text-xs font-semibold ${
                  step === s.num ? 'text-teal-900' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {/* Step 1: Type and Title */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Tipo de Asamblea
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'ordinaria' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.type === 'ordinaria'
                      ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold text-slate-900 text-sm">Asamblea Ordinaria</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Anual obligatoria, examen de estados financieros y elección de órganos.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'extraordinaria' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.type === 'extraordinaria'
                      ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold text-slate-900 text-sm">Asamblea Extraordinaria</span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Convocada para atender necesidades urgentes o imprevistas.
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Título Oficial de la Asamblea
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium text-slate-900"
                placeholder="Ej: Asamblea General Ordinaria 2026"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Descripción / Orden del Día Tentativo
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm text-slate-900"
                placeholder="Puntos a tratar durante la sesión..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Date, Time and Modality */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fecha de la Asamblea
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hora de Convocatoria (Primera Citación)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Modalidad
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['presencial', 'virtual', 'mixta'] as AssemblyModality[]).map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setFormData({ ...formData, modality: mod })}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                      formData.modality === mod
                        ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Lugar Físico o Enlace de Transmisión
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900"
                  placeholder="Ej: Salón Comunal Bloque A / Sala Google Meet"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Board & Roles */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-slate-500">
              Indique los dignatarios y responsables oficiales para la firma del acta:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Administrador(a) del Conjunto
                </label>
                <input
                  type="text"
                  value={formData.administratorName}
                  onChange={(e) => setFormData({ ...formData, administratorName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Presidente de la Asamblea
                </label>
                <input
                  type="text"
                  value={formData.presidentName}
                  onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contador(a) / Revisor Fiscal
                </label>
                <input
                  type="text"
                  value={formData.accountantName}
                  onChange={(e) => setFormData({ ...formData, accountantName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Secretario(a) Ad-hoc
                </label>
                <input
                  type="text"
                  value={formData.secretaryName}
                  onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Quorum and Auto-Rules */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quórum Mínimo Requerido (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="100"
                  value={formData.requiredQuorum}
                  onChange={(e) => setFormData({ ...formData, requiredQuorum: parseFloat(e.target.value) || 50.01 })}
                  className="w-36 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
                <span className="text-xs text-slate-500 font-medium">
                  (50.01% para quórum decisorio ordinario según Ley 675/2001)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSendMinutes}
                  onChange={(e) => setFormData({ ...formData, autoSendMinutes: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="block text-xs font-bold text-teal-950">
                    Envío Automático de Resultados y Acta Oficial
                  </span>
                  <span className="block text-xs text-teal-800/80">
                    Notificar por correo electrónico a todos los copropietarios al cerrar formalmente la asamblea.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Summary & Confirm */}
        {step === 5 && (
          <div className="space-y-4 animate-fadeIn">
            <Alert type="success" title="Listo para crear la asamblea">
              Por favor verifique los datos resumidos antes de confirmar la programación.
            </Alert>

            <Card className="p-4 bg-slate-50 space-y-2 text-xs">
              <p className="font-bold text-slate-800 text-sm">{formData.title}</p>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200">
                <div><span className="font-bold text-slate-800">Tipo:</span> {formData.type.toUpperCase()}</div>
                <div><span className="font-bold text-slate-800">Modalidad:</span> {formData.modality.toUpperCase()}</div>
                <div><span className="font-bold text-slate-800">Fecha y Hora:</span> {formData.date} a las {formData.time}</div>
                <div><span className="font-bold text-slate-800">Quórum requerido:</span> {formData.requiredQuorum}%</div>
                <div><span className="font-bold text-slate-800">Presidente:</span> {formData.presidentName}</div>
                <div><span className="font-bold text-slate-800">Administrador:</span> {formData.administratorName}</div>
              </div>
            </Card>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Anterior
          </Button>

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleFinish}
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Programar y Crear Asamblea
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
