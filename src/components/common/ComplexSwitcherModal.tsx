import React, { useState } from 'react';
import { Building2, Check, CheckCircle2, Edit3, MapPin, Phone, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ResidentialComplex } from '../../types';
import { Alert, Badge, Button, Modal } from './UIComponents';

interface ComplexSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplexSwitcherModal: React.FC<ComplexSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { complex, complexes, switchComplex, refreshComplex } = useAuth();
  const [mode, setMode] = useState<'list' | 'edit' | 'create'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create Form state
  const [formData, setFormData] = useState({
    name: complex?.name || '',
    nit: complex?.nit || '',
    address: complex?.address || '',
    city: complex?.city || '',
    state: complex?.state || '',
    phone: complex?.phone || '',
    email: complex?.email || '',
    totalUnits: complex?.totalUnits || 120,
    logo: complex?.logo || '🏢'
  });

  const handleSelectComplex = async (complexId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await switchComplex(complexId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar de conjunto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (complex) {
      setFormData({
        name: complex.name,
        nit: complex.nit,
        address: complex.address,
        city: complex.city,
        state: complex.state,
        phone: complex.phone,
        email: complex.email,
        totalUnits: complex.totalUnits,
        logo: complex.logo || '🏢'
      });
    }
    setMode('edit');
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      nit: '',
      address: '',
      city: 'Bogotá D.C.',
      state: 'Cundinamarca',
      phone: '',
      email: '',
      totalUnits: 60,
      logo: '🏢'
    });
    setMode('create');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nit.trim()) {
      setError('El nombre y el NIT son requeridos');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'edit') {
        await api.updateComplex(formData);
        await refreshComplex();
        setMode('list');
      } else {
        await api.addComplex({
          ...formData,
          totalCoefficient: 100.0,
          timezone: 'America/Bogota',
          autoSendResults: true
        });
        await refreshComplex();
        setMode('list');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar información');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'list'
          ? 'Conjuntos Residenciales / Edificios'
          : mode === 'edit'
          ? `Editar: ${complex?.name}`
          : 'Registrar Nuevo Conjunto Residencial'
      }
      maxWidth="md"
    >
      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {mode === 'list' && (
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Seleccione el conjunto residencial activo sobre el cual desea operar o edite sus datos institucionales:
          </p>

          <div className="space-y-2.5">
            {complexes.map((c) => {
              const isCurrent = c.id === complex?.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectComplex(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-2xs">
                      {c.logo || '🏢'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                        {isCurrent && <Badge variant="teal" size="sm">Activo</Badge>}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>NIT: {c.nit}</span>
                        <span>•</span>
                        <span>{c.city}</span>
                        <span>•</span>
                        <span>{c.totalUnits} unidades</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isCurrent ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500 hover:text-teal-600">
                        Seleccionar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Editar Conjunto Activo
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-teal-600 hover:bg-teal-700 font-bold"
            >
              Crear Nuevo Conjunto
            </Button>
          </div>
        </div>
      )}

      {(mode === 'edit' || mode === 'create') && (
        <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Nombre Oficial del Conjunto / Edificio P.H.
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Conjunto Residencial Torres del Parque P.H."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">NIT / Razón Social</label>
              <input
                type="text"
                required
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                placeholder="900.876.543-1"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Total Unidades</label>
              <input
                type="number"
                required
                value={formData.totalUnits}
                onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Dirección Completa</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle 140 # 19-45"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Ciudad</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Bogotá D.C."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Departamento</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Cundinamarca"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Correo Institucional</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@torresdelparque.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono Contacto</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(+57) 601 745 8900"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode('list')}
              disabled={isLoading}
            >
              Volver a Lista
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-teal-600 hover:bg-teal-700 font-bold"
            >
              {mode === 'edit' ? 'Guardar Cambios' : 'Crear y Activar Conjunto'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
