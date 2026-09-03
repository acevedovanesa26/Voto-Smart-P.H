import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  ShieldCheck,
  Type,
  User as UserIcon,
  Vote,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Badge, Button } from '../common/UIComponents';

interface NavbarProps {
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
  onNavigateHome?: () => void;
  onOpenComplexSwitcher?: () => void;
  activeView?: string;
  currentView?: string;
  onSelectView?: (view: string) => void;
  onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin = () => {},
  onOpenProfile,
  onNavigateHome,
  onOpenComplexSwitcher,
  activeView,
  currentView,
  onSelectView,
  onNavigate
}) => {
  const { user, role, complex, isAuthenticated, logout, fontSize, setFontSize } = useAuth();
  const [showA11yMenu, setShowA11yMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const currentActiveView = activeView || currentView || 'auth_decision';

  const handleSelectView = (view: string) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    if (onSelectView) {
      onSelectView(view);
    }
    if (onNavigate) {
      onNavigate(view);
    }
  };

  const handleNavigateHome = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Logo & Complex */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Menu Hamburger (Visible on < lg when authenticated) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Abrir menú de navegación"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={handleNavigateHome}
              className="flex items-center gap-2 group focus:outline-none shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Vote className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-left">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-0.5 sm:gap-1 font-display leading-tight">
                  Voto<span className="text-teal-600">Smart</span>
                </span>
                <span className="block text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-widest -mt-0.5 sm:-mt-1">
                  Asambleas P.H.
                </span>
              </div>
            </button>

            {complex && (
              isAuthenticated && (role === 'admin' || role === 'superadmin') ? (
                <button
                  type="button"
                  onClick={onOpenComplexSwitcher}
                  title="Cambiar o Administrar Conjunto Residencial"
                  className="hidden md:flex items-center pl-3 sm:pl-4 border-l border-slate-200 text-xs text-slate-700 hover:text-teal-700 transition-colors group truncate max-w-[200px] lg:max-w-[240px]"
                >
                  <Building2 className="w-4 h-4 text-teal-600 mr-1.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold truncate underline-offset-2 group-hover:underline">{complex.name}</span>
                  <span className="ml-1.5 px-1.5 py-0.2 bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-bold rounded shrink-0">Admin</span>
                </button>
              ) : (
                <div className="hidden md:flex items-center pl-3 sm:pl-4 border-l border-slate-200 text-xs text-slate-600 truncate max-w-[200px] lg:max-w-[240px]">
                  <Building2 className="w-4 h-4 text-teal-600 mr-1.5 shrink-0" />
                  <span className="font-semibold truncate">{complex.name}</span>
                </div>
              )
            )}
          </div>

          {/* Center Nav Links (when authenticated on desktop) */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
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

          {/* Right Actions: Accessibility & User Profile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Accessibility Size Controller */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowA11yMenu(!showA11yMenu);
                  setUserDropdownOpen(false);
                }}
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

            {/* Authenticated User Menu & Profile Access */}
            {isAuthenticated && user ? (
              <div className="relative">
                {/* User Pill Button (Desktop & Mobile) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenProfile) {
                      onOpenProfile();
                    } else {
                      setUserDropdownOpen(!userDropdownOpen);
                    }
                  }}
                  title="Mi Perfil, Actualizar Datos y Cambiar Contraseña"
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 text-xs transition-all text-left group"
                >
                  <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-[11px] shadow-xs group-hover:scale-105 transition-transform">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="font-bold text-slate-800 leading-tight truncate max-w-[110px] group-hover:text-teal-900">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-teal-700 font-semibold leading-tight">
                      {roleLabels[role]?.label.split(' ')[0]}
                    </p>
                  </div>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 ml-0.5" />
                </button>

                {/* Dropdown if onOpenProfile not passed directly */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-bold rounded">
                        {roleLabels[role]?.label || role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile?.();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-teal-600" />
                      <span>Ver / Editar Perfil</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile?.();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-teal-600" />
                      <span>Cambiar Contraseña</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Portal Seguro Ley 675</span>
                <span className="sm:hidden">Seguro</span>
              </div>
            )}

            {/* Quick Logout Button on Desktop */}
            {isAuthenticated && (
              <button
                onClick={logout}
                title="Cerrar Sesión Segura"
                className="hidden sm:flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors items-center gap-1 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER (Slide down on mobile when hamburger is active) */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg animate-fadeIn">
          {/* User Card in Mobile Drawer */}
          {user && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-teal-700 font-semibold">{roleLabels[role]?.label || role}</p>
                  {complex && <p className="text-[10px] text-slate-500 truncate">{complex.name}</p>}
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile?.();
                }}
                className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 shrink-0"
              >
                Mi Perfil
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Navegación</p>
            {(role === 'admin' || role === 'superadmin' || role === 'president' || role === 'accountant') && (
              <>
                <button
                  onClick={() => handleSelectView('dashboard')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    currentActiveView === 'dashboard'
                      ? 'bg-teal-50 text-teal-900 border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Panel de Control</span>
                </button>
                <button
                  onClick={() => handleSelectView('assembly')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    currentActiveView === 'assembly'
                      ? 'bg-teal-50 text-teal-900 border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Asamblea Activa</span>
                </button>
                <button
                  onClick={() => handleSelectView('owners')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    currentActiveView === 'owners'
                      ? 'bg-teal-50 text-teal-900 border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Censo Propietarios</span>
                </button>
              </>
            )}

            <button
              onClick={() => handleSelectView('voter')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                currentActiveView === 'voter'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-teal-800 bg-teal-50/70 hover:bg-teal-100'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Portal de Votación</span>
            </button>
          </div>

          {/* Quick Complex Switcher on Mobile (Admin only) */}
          {(role === 'admin' || role === 'superadmin') && onOpenComplexSwitcher && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenComplexSwitcher();
                }}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Cambiar / Administrar Conjunto</span>
              </button>
            </div>
          )}

          {/* User Profile & Password Buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfile?.();
              }}
              className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4 text-teal-600" />
              <span>Actualizar Información Personal</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfile?.();
              }}
              className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-teal-600" />
              <span>Cambiar Contraseña</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

