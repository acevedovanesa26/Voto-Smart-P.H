import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_COMPLEX, DEMO_COMPLEXES, DEMO_USERS } from '../data/seedData';
import { api } from '../services/api';
import { ResidentialComplex, User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  complex: ResidentialComplex | null;
  complexes: ResidentialComplex[];
  isAuthenticated: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  login: (email: string, password?: string) => Promise<void>;
  loginVoterWithOtp: (documentNumber: string, code: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    role: 'admin' | 'president' | 'accountant' | 'owner';
    phone?: string;
    documentType: 'CC' | 'CE' | 'NIT' | 'PAS';
    documentNumber: string;
    apartment?: string;
    building?: string;
    coefficient?: number;
    password?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshComplex: () => Promise<void>;
  switchComplex: (complexId: string) => Promise<void>;
  addComplex: (data: Omit<ResidentialComplex, 'id'>) => Promise<void>;
  updateProfileState: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with no user logged in (force login first)
  const [user, setUser] = useState<User | null>(null);
  const [complex, setComplex] = useState<ResidentialComplex | null>(DEMO_COMPLEX);
  const [complexes, setComplexes] = useState<ResidentialComplex[]>(DEMO_COMPLEXES);
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const loadComplexes = async () => {
    try {
      const [list, curr] = await Promise.all([
        api.getComplexes(),
        api.getComplex()
      ]);
      setComplexes(list.length > 0 ? list : DEMO_COMPLEXES);
      setComplex(curr || DEMO_COMPLEX);
    } catch {
      setComplexes(DEMO_COMPLEXES);
      setComplex(DEMO_COMPLEX);
    }
  };

  useEffect(() => {
    loadComplexes();
  }, []);

  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    const root = document.documentElement;
    if (size === 'large') {
      root.style.fontSize = '18px';
    } else if (size === 'xlarge') {
      root.style.fontSize = '20px';
    } else {
      root.style.fontSize = '16px';
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setComplex(res.complex);
    } catch (err: any) {
      throw err;
    }
  };

  const loginVoterWithOtp = async (documentNumber: string, code: string) => {
    const res = await api.verifyVoterOtp(documentNumber, code);
    setUser(res.user);
    if (res.complex) setComplex(res.complex);
  };

  const register = async (userData: any) => {
    const res = await api.register(userData);
    setUser(res.user);
    if (res.complex) setComplex(res.complex);
    await loadComplexes();
  };

  const logout = () => {
    setUser(null);
  };

  const refreshComplex = async () => {
    try {
      const c = await api.getComplex();
      setComplex(c);
      await loadComplexes();
    } catch (err) {
      console.error(err);
    }
  };

  const switchComplex = async (complexId: string) => {
    const switched = await api.switchComplex(complexId);
    setComplex(switched);
    await loadComplexes();
  };

  const addComplex = async (data: Omit<ResidentialComplex, 'id'>) => {
    const created = await api.addComplex(data);
    setComplex(created);
    await loadComplexes();
  };

  const updateProfileState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'owner',
        complex,
        complexes,
        isAuthenticated: !!user,
        fontSize,
        setFontSize,
        login,
        loginVoterWithOtp,
        register,
        logout,
        refreshComplex,
        switchComplex,
        addComplex,
        updateProfileState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
