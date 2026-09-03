import React from 'react';
import { Award, Lock, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold font-display">
                VS
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Voto<span className="text-teal-400">Smart</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Plataforma inteligente y segura para la administración integral de asambleas de copropietarios y votaciones digitales en propiedad horizontal conforme a la Ley 675 de 2001.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs pt-2">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-400" /> Voto Secreto Encriptado
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" /> Trazabilidad & Auditoría
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-400" /> Cómputo por Coeficiente
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-3">Marco Legal & Seguridad</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Ley 675 de 2001 (Régimen P.H.)</li>
              <li>Decreto 398 de 2020 (Asambleas No Presenciales)</li>
              <li>Ley 1581 de 2012 (Habeas Data)</li>
              <li>Firma Digital de Actas y Resultados</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-3">Soporte & Asistencia</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Línea Directa: (+57) 601 745 8900</li>
              <li>WhatsApp Soporte: +57 310 987 6543</li>
              <li>Email: soporte@votosmart.app</li>
              <li>Disponibilidad 24/7 en Asambleas</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 VotoSmart Technologies. Todos los derechos reservados.</p>
          <p className="text-[11px]">Diseñado para máxima accesibilidad y transparencia en conjuntos residenciales.</p>
        </div>
      </div>
    </footer>
  );
};
