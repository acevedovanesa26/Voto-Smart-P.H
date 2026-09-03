import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Type,
  User,
  Vote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Badge, Button } from '../common/UIComponents';

interface NavbarProps {
  onOpenLogin?: () => void;
  onNavigateHome?: () => void;
  onOpenComplexSwitcher?: () => void;
  activeView?: string;
  currentView?: string;
  onSelectView?: (view: string) => void;
  onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin = () => {},
  onNavigateHome,
  onOpenComplexSwitcher,
  activeView,
  currentView,
  onSelectView,
  onNavigate
}) => {
  const { user, role, complex, isAuthenticated, logout, fontSize, setFontSize } = useAuth();
  const [showA11yMenu, setShowA11yMenu] = useState(false);

  const currentActiveView = activeView || currentView || 'auth_decision';

  const handleSelectView = (view: string) => {
    if (onSelectView) {
      onSelectView(view);
    }
    if (onNavigate) {
      onNavigate(view);
    }
  };

  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      handleSelectView(isAuthenticated ? 'dashboard' : 'auth_decision');
    }
  };

  const roleLabels: Record<UserRole, { label: string; badge: 'teal' | 'indigo' | 'emerald' | 'amber' | 'slate' }> = {
    superadmin: { label: 'Super Admin', badge: 'indigo' },
    admin: { label: 'Administrador P.H.', badge: 'teal' },
    president: { label: 'Presidente', badge: 'emerald' },
    accountant: { label: 'Contador', badge: 'amber' },
    secretary: { label: 'Secretaria', badge: 'teal' },
    fiscal_auditor: { label: 'Revisor Fiscal', badge: 'amber' },
    owner: { label: 'Copropietario / Votante', badge: 'slate' }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Complex */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleNavigateHome}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Vote className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1 font-display">
                  Voto<span className="text-teal-600">Smart</span>
                </span>
                <span className="block text-[10px] font-semibold text-slate-600 uppercase tracking-widest -mt-1">
                  Asambleas P.H.
                </span>
              </div>
            </button>

            {complex && (
              isAuthenticated && (role === 'admin' || role === 'superadmin') ? (
                <button
                  type="button"
                  onClick={onOpenComplexSwitcher}
                  title="Cambiar o Administrar Conjunto Residencial (Exclusivo Administrador)"
                  className="hidden md:flex items-center pl-4 border-l border-slate-200 text-xs text-slate-700 hover:text-teal-700 transition-colors group"
                >
                  <Building2 className="w-4 h-4 text-teal-600 mr-1.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold truncate max-w-[220px] underline-offset-2 group-hover:underline">{complex.name}</span>
                  <span className="ml-1.5 px-1.5 py-0.2 bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-bold rounded">Admin</span>
                </button>
              ) : (
                <div className="hidden md:flex items-center pl-4 border-l border-slate-200 text-xs text-slate-600">
                  <Building2 className="w-4 h-4 text-teal-600 mr-1.5 flex-shrink-0" />
                  <span className="font-semibold truncate max-w-[220px]">{complex.name}</span>
                </div>
              )
            )}
          </div>

          {/* Center Nav Links (when authenticated) */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              {(role === 'admin' || role === 'superadmin' || role === 'president' || role === 'accountant') && (
                <>
                  <button
                    onClick={() => handleSelectView('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentActiveView === 'dashboard'
                        ? 'bg-white text-teal-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Panel de Control
                  </button>
                  <button
                    onClick={() => handleSelectView('assembly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentActiveView === 'assembly'
                        ? 'bg-white text-teal-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Asamblea Activa
                  </button>
                  <button
                    onClick={() => handleSelectView('owners')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentActiveView === 'owners'
                        ? 'bg-white text-teal-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Censo Propietarios
                  </button>
                </>
              )}

              {/* Voter portal shortcut for everyone */}
              <button
                onClick={() => handleSelectView('voter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  currentActiveView === 'voter'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                <Vote className="w-3.5 h-3.5" />
                Portal de Votación
              </button>
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Accessibility Size Controller */}
            <div className="relative">
              <button
                onClick={() => setShowA11yMenu(!showA11yMenu)}
                title="Ajustar tamaño de letra para lectura cómoda"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">Texto</span>
              </button>

              {showA11yMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn">
                  <p className="text-[11px] font-bold text-slate-600 uppercase px-2 py-1">Tamaño de Texto</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={() => { setFontSize('normal'); setShowA11yMenu(false); }}
                      className={`px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between ${
                        fontSize === 'normal' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span>Estándar (100%)</span>
                      <span className="text-xs">A</span>
                    </button>
                    <button
                      onClick={() => { setFontSize('large'); setShowA11yMenu(false); }}
                      className={`px-3 py-2 rounded-lg text-left text-sm font-medium flex items-center justify-between ${
                        fontSize === 'large' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span>Grande (115%)</span>
                      <span className="text-base font-bold">A+</span>
                    </button>
                    <button
                      onClick={() => { setFontSize('xlarge'); setShowA11yMenu(false); }}
                      className={`px-3 py-2 rounded-lg text-left text-base font-medium flex items-center justify-between ${
                        fontSize === 'xlarge' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span>Muy Grande (130%)</span>
                      <span className="text-lg font-black">A++</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Auth Button / User Profile */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{roleLabels[role]?.label.split(' ')[0]}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Cerrar Sesión"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Portal Seguro Ley 675</span>
                <span className="sm:hidden">Seguro</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
