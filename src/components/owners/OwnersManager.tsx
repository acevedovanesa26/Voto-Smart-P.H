import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  CheckSquare,
  Download,
  Edit2,
  FileSpreadsheet,
  Plus,
  Search,
  Shield,
  Square,
  Trash2,
  Upload,
  UserCheck,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Owner } from '../../types';
import { exportOwnersToExcel, parseOwnersExcel } from '../../utils/excelHelper';
import { Alert, Badge, Button, Card, Modal } from '../common/UIComponents';

export const OwnersManager: React.FC = () => {
  const { complex } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [search, setSearch] = useState('');
  const [councilFilter, setCouncilFilter] = useState<'all' | 'council_only' | 'non_council'>('all');
  const [towerFilter, setTowerFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Selection & Deletion State
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<Set<string>>(new Set());
  const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOwnerForEdit, setSelectedOwnerForEdit] = useState<Owner | null>(null);
  const [councilModalOwner, setCouncilModalOwner] = useState<Owner | null>(null);
  const [councilRoleInput, setCouncilRoleInput] = useState('Consejero Principal');

  const loadOwners = async () => {
    try {
      setIsLoading(true);
      const list = await api.getOwners(complex?.id);
      setOwners(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, [complex?.id]);

  const totalCoefficient = owners.reduce((sum, o) => sum + o.coefficient, 0);

  // Available unique towers in this complex
  const uniqueTowers = Array.from(new Set(owners.map((o) => o.building || 'Torre Principal'))).sort();
  const councilCount = owners.filter((o) => o.isCouncilMember).length;

  const filteredOwners = owners.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.apartment.toLowerCase().includes(search.toLowerCase()) ||
      o.building.toLowerCase().includes(search.toLowerCase()) ||
      o.documentNumber.includes(search);

    const matchesCouncil =
      councilFilter === 'all'
        ? true
        : councilFilter === 'council_only'
        ? !!o.isCouncilMember
        : !o.isCouncilMember;

    const matchesTower =
      towerFilter === 'all' ? true : (o.building || 'Torre Principal') === towerFilter;

    return matchesSearch && matchesCouncil && matchesTower;
  });

  const handleToggleCouncilAction = async (owner: Owner, isMember: boolean, role?: string) => {
    try {
      const res = await api.toggleCouncilMember(owner.id, isMember, role);
      setFeedback({
        type: 'success',
        text: isMember
          ? `✓ ${owner.name} ha sido designado(a) como "${role || 'Miembro del Consejo'}" para este conjunto.`
          : `✓ ${owner.name} ha sido retirado(a) del Consejo de Administración.`
      });
      setCouncilModalOwner(null);
      await loadOwners();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error al actualizar estado en el consejo'
      });
    }
  };

  // Selection helpers
  const allFilteredSelected =
    filteredOwners.length > 0 &&
    filteredOwners.every((o) => selectedOwnerIds.has(o.id));

  const someFilteredSelected =
    filteredOwners.some((o) => selectedOwnerIds.has(o.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedOwnerIds);
      filteredOwners.forEach((o) => next.delete(o.id));
      setSelectedOwnerIds(next);
    } else {
      const next = new Set(selectedOwnerIds);
      filteredOwners.forEach((o) => next.add(o.id));
      setSelectedOwnerIds(next);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedOwnerIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedOwnerIds(next);
  };

  const handleClearSelection = () => {
    setSelectedOwnerIds(new Set());
  };

  // Single Owner Deletion
  const handleConfirmDeleteSingle = async () => {
    if (!ownerToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteOwner(ownerToDelete.id);
      const next = new Set(selectedOwnerIds);
      next.delete(ownerToDelete.id);
      setSelectedOwnerIds(next);
      setOwnerToDelete(null);
      setFeedback({
        type: 'success',
        text: `Copropietario ${ownerToDelete.name} (${ownerToDelete.building} - ${ownerToDelete.apartment}) eliminado correctamente del censo.`
      });
      await loadOwners();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error al eliminar el propietario.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch Deletion
  const handleConfirmDeleteBatch = async () => {
    if (selectedOwnerIds.size === 0) return;
    setIsDeleting(true);
    try {
      const countToDelete = selectedOwnerIds.size;
      const res = await api.deleteOwnersBatch(Array.from(selectedOwnerIds), complex?.id);
      setSelectedOwnerIds(new Set());
      setShowBatchDeleteModal(false);
      setFeedback({
        type: 'success',
        text: `Se eliminaron ${res.deletedCount || countToDelete} copropietarios exitosamente del censo oficial.`
      });
      await loadOwners();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error al eliminar los propietarios seleccionados.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate coefficient of selected
  const selectedCoefficient = owners
    .filter((o) => selectedOwnerIds.has(o.id))
    .reduce((sum, o) => sum + o.coefficient, 0);

  const selectedOwnersList = owners.filter((o) => selectedOwnerIds.has(o.id));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Censo Oficial de Propietarios e Inmuebles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administre la base de copropietarios, coeficientes de propiedad horizontal y apoderados legales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportOwnersToExcel(owners, complex?.name || 'Conjunto')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportModal(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Importar Excel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nuevo Propietario
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Unidades Registradas</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{owners.length} Inmuebles</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Suma de Coeficientes</span>
          <p className="text-2xl font-black text-teal-800 mt-1">{totalCoefficient.toFixed(2)}%</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Inmuebles con Poder / Apoderado</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{owners.filter((o) => o.hasProxy).length}</p>
        </Card>
      </div>

      {/* BATCH ACTION TOOLBAR (when 1 or more owners are selected) */}
      {selectedOwnerIds.size > 0 && (
        <div className="p-3 sm:p-4 bg-teal-900 text-white rounded-2xl shadow-lg border border-teal-800 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-800 text-white font-black text-sm border border-teal-700">
              {selectedOwnerIds.size}
            </span>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedOwnerIds.size === 1
                  ? '1 propietario seleccionado'
                  : `${selectedOwnerIds.size} propietarios seleccionados`}
              </p>
              <p className="text-[11px] text-teal-200">
                Coeficiente total seleccionado: <strong>{selectedCoefficient.toFixed(2)}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-teal-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-teal-800/60 font-medium transition-colors"
            >
              Deseleccionar todo
            </button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowBatchDeleteModal(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar Seleccionados ({selectedOwnerIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, documento o apartamento..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedOwnerIds.size > 0 && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {selectedOwnerIds.size} de {owners.length} seleccionados
                </span>
              )}
              <span className="text-xs text-slate-500 font-semibold">
                Mostrando {filteredOwners.length} de {owners.length}
              </span>
            </div>
          </div>

          {/* Granular Filters: Consejo & Torres */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Filtrar:</span>
              <button
                type="button"
                onClick={() => setCouncilFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  councilFilter === 'all'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos ({owners.length})
              </button>
              <button
                type="button"
                onClick={() => setCouncilFilter('council_only')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  councilFilter === 'council_only'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Consejo de Administración ({councilCount})
              </button>
              <button
                type="button"
                onClick={() => setCouncilFilter('non_council')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  councilFilter === 'non_council'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Otros Copropietarios ({owners.length - councilCount})
              </button>
            </div>

            {/* Tower Filter Dropdown */}
            {uniqueTowers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-[11px] font-bold text-slate-500 uppercase">Torre:</label>
                <select
                  value={towerFilter}
                  onChange={(e) => setTowerFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="all">Todas las Torres ({owners.length})</option>
                  {uniqueTowers.map((tw) => (
                    <option key={tw} value={tw}>
                      {tw} ({owners.filter((o) => (o.building || 'Torre Principal') === tw).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                    title={allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos los visibles'}
                  />
                </th>
                <th className="py-3.5 px-4">Inmueble</th>
                <th className="py-3.5 px-4">Propietario y Rol</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4 text-center">Coeficiente</th>
                <th className="py-3.5 px-4">Apoderado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron propietarios con el filtro actual.
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => {
                  const isSelected = selectedOwnerIds.has(owner.id);
                  return (
                    <tr
                      key={owner.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-teal-50/70 border-l-2 border-teal-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(owner.id)}
                          className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                          aria-label={`Seleccionar a ${owner.name}`}
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {owner.building} - {owner.apartment}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{owner.name}</div>
                        {owner.isCouncilMember && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Award className="w-3 h-3 text-amber-600" />
                            {owner.councilRole || 'Consejero(a)'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {owner.documentType} {owner.documentNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{owner.email}</div>
                        <div className="text-[10px] text-slate-400">{owner.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-teal-800">
                        {owner.coefficient.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4">
                        {owner.hasProxy ? (
                          <Badge variant="amber" size="sm">Apoderado Registrado</Badge>
                        ) : (
                          <span className="text-slate-400">Titular Directo</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Council Member Action */}
                          <button
                            type="button"
                            onClick={() => {
                              if (owner.isCouncilMember) {
                                if (confirm(`¿Desea retirar a ${owner.name} del Consejo de Administración?`)) {
                                  handleToggleCouncilAction(owner, false);
                                }
                              } else {
                                setCouncilModalOwner(owner);
                                setCouncilRoleInput('Consejero Principal');
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              owner.isCouncilMember
                                ? 'text-amber-700 bg-amber-100/80 hover:bg-amber-200'
                                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title={
                              owner.isCouncilMember
                                ? `Miembro del Consejo: ${owner.councilRole || 'Consejero'}. Click para retirar.`
                                : 'Designar como Miembro del Consejo de Administración'
                            }
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOwnerForEdit(owner)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Editar datos del propietario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOwnerToDelete(owner)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Eliminar del censo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM SINGLE OWNER DELETE MODAL */}
      {ownerToDelete && (
        <Modal
          isOpen={!!ownerToDelete}
          onClose={() => !isDeleting && setOwnerToDelete(null)}
          title="Confirmar Eliminación de Copropietario"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900 mb-1">
                  ¿Está seguro de eliminar este registro?
                </p>
                <p className="text-rose-800 leading-relaxed">
                  Se removerá a <strong>{ownerToDelete.name}</strong> del inmueble{' '}
                  <strong>{ownerToDelete.building} - {ownerToDelete.apartment}</strong> (Doc: {ownerToDelete.documentNumber}) con coeficiente <strong>{ownerToDelete.coefficient.toFixed(2)}%</strong>.
                </p>
                <p className="text-[11px] text-rose-700 mt-2">
                  Esta acción revocará su derecho a voto en la asamblea y lo desvinculará del quórum.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setOwnerToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleConfirmDeleteSingle}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Sí, Eliminar Propietario
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM BATCH DELETE MODAL */}
      {showBatchDeleteModal && (
        <Modal
          isOpen={showBatchDeleteModal}
          onClose={() => !isDeleting && setShowBatchDeleteModal(false)}
          title={`Eliminar ${selectedOwnerIds.size} Propietarios Seleccionados`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900 mb-1">
                  Acción masiva de eliminación
                </p>
                <p className="text-rose-800 leading-relaxed">
                  Está a punto de eliminar <strong>{selectedOwnerIds.size} copropietarios</strong> del censo oficial con una suma de coeficiente del <strong>{selectedCoefficient.toFixed(2)}%</strong>.
                </p>
                <p className="text-[11px] text-rose-700 mt-2">
                  Los inmuebles seleccionados serán desvinculados de la lista de quórum y sus accesos quedarán inhabilitados.
                </p>
              </div>
            </div>

            {/* List preview of selected owners */}
            <div>
              <p className="font-bold text-slate-700 mb-2 uppercase text-[11px]">
                Inmuebles que serán eliminados:
              </p>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {selectedOwnersList.map((o) => (
                  <div key={o.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">
                        {o.building} - {o.apartment}
                      </span>
                      <span className="text-slate-500 ml-2">({o.name})</span>
                    </div>
                    <span className="font-mono text-teal-800 font-bold">
                      {o.coefficient.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowBatchDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleConfirmDeleteBatch}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Eliminar Definitivamente ({selectedOwnerIds.size})
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DESIGNATE COUNCIL ROLE MODAL */}
      {councilModalOwner && (
        <Modal
          isOpen={!!councilModalOwner}
          onClose={() => setCouncilModalOwner(null)}
          title="Designar Miembro del Consejo de Administración"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5">
              <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">{councilModalOwner.name}</p>
                <p className="text-slate-600">
                  {councilModalOwner.building} - {councilModalOwner.apartment} (Doc: {councilModalOwner.documentNumber})
                </p>
                <p className="text-[11px] text-amber-800 mt-1">
                  Este copropietario quedará habilitado para votaciones y quórums exclusivos del Consejo de Administración en este conjunto.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">Cargo / Rol en el Consejo</label>
              <select
                value={councilRoleInput}
                onChange={(e) => setCouncilRoleInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              >
                <option value="Presidente del Consejo">Presidente del Consejo</option>
                <option value="Vicepresidente del Consejo">Vicepresidente del Consejo</option>
                <option value="Consejero Principal">Consejero Principal</option>
                <option value="Consejero Suplente">Consejero Suplente</option>
                <option value="Secretario(a) del Consejo">Secretario(a) del Consejo</option>
                <option value="Vocal del Consejo">Vocal del Consejo</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCouncilModalOwner(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 font-bold"
                onClick={() => handleToggleCouncilAction(councilModalOwner, true, councilRoleInput)}
                leftIcon={<Award className="w-4 h-4" />}
              >
                Confirmar Nombramiento
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT OWNER MODAL */}
      {(showAddModal || selectedOwnerForEdit) && (
        <OwnerFormModal
          isOpen={showAddModal || !!selectedOwnerForEdit}
          initialData={selectedOwnerForEdit}
          complexId={complex?.id}
          onClose={() => {
            setShowAddModal(false);
            setSelectedOwnerForEdit(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setSelectedOwnerForEdit(null);
            loadOwners();
          }}
        />
      )}

      {/* IMPORT EXCEL MODAL */}
      <ImportExcelModal
        isOpen={showImportModal}
        complexId={complex?.id}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          setShowImportModal(false);
          loadOwners();
        }}
      />
    </div>
  );
};

// Modal for Adding / Editing Owner
const OwnerFormModal: React.FC<{
  isOpen: boolean;
  initialData: Owner | null;
  complexId?: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ isOpen, initialData, complexId, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    documentType: initialData?.documentType || 'CC',
    documentNumber: initialData?.documentNumber || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    building: initialData?.building || 'Torre A',
    apartment: initialData?.apartment || '',
    hasProxy: initialData?.hasProxy || false,
    proxyName: initialData?.proxyName || '',
    status: initialData?.status || 'active'
  });
  const [coefficientStr, setCoefficientStr] = useState<string>(
    initialData ? String(initialData.coefficient) : '1.25'
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const parsedCoeff = parseFloat(coefficientStr.replace(',', '.')) || 0;
      const payload = {
        ...formData,
        coefficient: parsedCoeff
      };
      if (initialData) {
        await api.updateOwner(initialData.id, payload);
      } else {
        await api.addOwner(payload as any, complexId);
      }
      onSaved();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Copropietario' : 'Registrar Nuevo Copropietario'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Nombre Completo o Razón Social</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Tipo Doc.</label>
            <select
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              className="w-full px-2 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            >
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="NIT">NIT</option>
              <option value="PAS">Pasaporte</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">Número de Documento</label>
            <input
              type="text"
              required
              value={formData.documentNumber}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Torre / Bloque</label>
            <input
              type="text"
              required
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Apartamento / Unidad</label>
            <input
              type="text"
              required
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Coeficiente (%)</label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={coefficientStr}
              onChange={(e) => setCoefficientStr(e.target.value)}
              placeholder="ej: 0.25 o 1.25"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl space-y-2">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
            <input
              type="checkbox"
              checked={formData.hasProxy}
              onChange={(e) => setFormData({ ...formData, hasProxy: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded"
            />
            Tiene Poder Notarial / Apoderado
          </label>
          {formData.hasProxy && (
            <input
              type="text"
              placeholder="Nombre del apoderado o representante legal..."
              value={formData.proxyName}
              onChange={(e) => setFormData({ ...formData, proxyName: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900"
            />
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal for Importing Excel
const ImportExcelModal: React.FC<{
  isOpen: boolean;
  complexId?: string;
  onClose: () => void;
  onImported: () => void;
}> = ({ isOpen, complexId, onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    try {
      const parsed = await parseOwnersExcel(selected);
      setParsedPreview(parsed);
    } catch (err: any) {
      setError(err.message || 'Error al analizar el archivo');
    }
  };

  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0) return;
    setIsLoading(true);
    try {
      await api.importOwnersBatch(parsedPreview, complexId);
      alert(`Se importaron ${parsedPreview.length} copropietarios con éxito.`);
      onImported();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importación Masiva de Propietarios (Excel)" maxWidth="lg">
      <div className="space-y-4 text-xs">
        <p className="text-slate-600">
          Suba una plantilla de Excel (.xlsx) con las columnas: <strong>Nombre Completo, Documento, Apartamento, Torre, Coeficiente, Correo</strong>.
        </p>

        {error && <Alert type="error">{error}</Alert>}

        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500 hover:border-teal-500 transition-colors">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="excel-file-input"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer space-y-2 block">
            <FileSpreadsheet className="w-10 h-10 text-teal-600 mx-auto" />
            <span className="block font-bold text-slate-800">
              {file ? file.name : 'Haga clic para seleccionar archivo Excel'}
            </span>
            <span className="block text-[10px] text-slate-400">Formatos soportados: .xlsx, .xls</span>
          </label>
        </div>

        {parsedPreview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span>Vista previa ({parsedPreview.length} registros listos)</span>
              <span className="text-emerald-700">✓ Validación superada</span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
              {parsedPreview.slice(0, 5).map((row, idx) => (
                <div key={idx} className="text-[11px] text-slate-800 flex justify-between">
                  <span>{row.building} - {row.apartment}: {row.name}</span>
                  <span className="font-bold text-teal-800">{row.coefficient}%</span>
                </div>
              ))}
              {parsedPreview.length > 5 && (
                <p className="text-[10px] text-slate-400 italic">... y {parsedPreview.length - 5} registros más.</p>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={parsedPreview.length === 0}
            isLoading={isLoading}
            onClick={handleConfirmImport}
          >
            Importar al Censo
          </Button>
        </div>
      </div>
    </Modal>
  );
};
