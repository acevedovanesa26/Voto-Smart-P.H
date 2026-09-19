/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import { AssemblyDetail } from './components/assembly/AssemblyDetail';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { RoleDecisionView } from './components/auth/RoleDecisionView';
import { ComplexSwitcherModal } from './components/common/ComplexSwitcherModal';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { OwnersManager } from './components/owners/OwnersManager';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { VoterPortal } from './components/voter/VoterPortal';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainContent() {
  const { user, isAuthenticated, role, complex } = useAuth();
  const [currentView, setCurrentView] = useState<'auth_decision' | 'dashboard' | 'assembly' | 'owners' | 'voter'>('auth_decision');
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>('assembly-1');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState('');
  const [showComplexModal, setShowComplexModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Auto-sync selected assembly when active complex changes
  useEffect(() => {
    if (!complex?.id) return;
    api.getAssemblies(complex.id).then((assemblies) => {
      if (assemblies && assemblies.length > 0) {
        const exists = assemblies.some((a) => a.id === selectedAssemblyId);
        if (!exists) {
          setSelectedAssemblyId(assemblies[0].id);
        }
      }
    }).catch(console.error);
  }, [complex?.id]);

  // If user is authenticated, route to appropriate default view if on login screen
  const activeDisplayView = !isAuthenticated ? 'auth_decision' : (currentView === 'auth_decision' ? (role === 'owner' ? 'voter' : 'dashboard') : currentView);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onNavigateHome={() => setCurrentView(isAuthenticated ? (role === 'owner' ? 'voter' : 'dashboard') : 'auth_decision')}
        onOpenComplexSwitcher={() => setShowComplexModal(true)}
        currentView={activeDisplayView}
        activeView={activeDisplayView}
        onNavigate={(view) => setCurrentView(view as any)}
        onSelectView={(view) => setCurrentView(view as any)}
      />

      {/* Main Content Area - Responsive padding for mobile and desktop */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 1. Login / Access Decision View */}
        {activeDisplayView === 'auth_decision' && (
          <RoleDecisionView
            onEnterAdmin={() => setCurrentView('dashboard')}
            onEnterVoter={() => setCurrentView('voter')}
            onOpenForgotPassword={(initialId?: string) => {
              setForgotPasswordIdentifier(initialId || '');
              setShowForgotPasswordModal(true);
            }}
            onOpenRegister={() => setShowRegisterModal(true)}
            onOpenComplexSwitcher={() => setShowComplexModal(true)}
          />
        )}

        {/* 2. Administrator Dashboard */}
        {activeDisplayView === 'dashboard' && (
          <AdminDashboard
            onSelectAssembly={(id) => {
              setSelectedAssemblyId(id);
              setCurrentView('assembly');
            }}
            onOpenOwners={() => setCurrentView('owners')}
            onOpenVoterPortal={() => setCurrentView('voter')}
          />
        )}

        {/* 3. Assembly Management */}
        {activeDisplayView === 'assembly' && (
          <AssemblyDetail
            assemblyId={selectedAssemblyId}
            onBack={() => setCurrentView('dashboard')}
            onOpenVoterPortal={() => setCurrentView('voter')}
          />
        )}

        {/* 4. Owners Census Management */}
        {activeDisplayView === 'owners' && (
          <OwnersManager />
        )}

        {/* 5. Voter Portal */}
        {activeDisplayView === 'voter' && (
          <VoterPortal
            assemblyId={selectedAssemblyId}
            onBackToAdmin={() => setCurrentView(role === 'owner' ? 'auth_decision' : 'assembly')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth & Management Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onOpenForgotPassword={(initialId?: string) => {
          setForgotPasswordIdentifier(initialId || '');
          setShowLoginModal(false);
          setShowForgotPasswordModal(true);
        }}
        onOpenRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onSuccessLogin={(loggedRole) => {
          setCurrentView(loggedRole === 'owner' ? 'voter' : 'dashboard');
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onOpenLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        initialIdentifier={forgotPasswordIdentifier}
        onClose={() => {
          setShowForgotPasswordModal(false);
          setForgotPasswordIdentifier('');
        }}
        onBackToLogin={() => {
          setShowForgotPasswordModal(false);
          setShowLoginModal(true);
        }}
      />

      <ComplexSwitcherModal
        isOpen={showComplexModal}
        onClose={() => setShowComplexModal(false)}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
