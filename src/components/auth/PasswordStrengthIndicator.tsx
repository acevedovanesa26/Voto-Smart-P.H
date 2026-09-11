import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  strengthLabel: 'Muy Débil' | 'Débil' | 'Aceptable' | 'Fuerte' | 'Muy Segura';
  strengthColor: string;
  rules: {
    id: string;
    label: string;
    passed: boolean;
  }[];
  isCommonPassword: boolean;
  errorMessage?: string;
}

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  'password',
  'password123',
  'password123!',
  'admin123',
  'admin123!',
  'admin2024',
  'admin2025',
  'qwerty12345',
  'qwertyuiop',
  'contrasena123',
  'contraseña123',
  'votosmart123',
  'votosmart2025'
]);

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const p = password || '';
  const trimmed = p.trim();
  const lower = trimmed.toLowerCase();

  const rules = [
    {
      id: 'length',
      label: 'Mínimo 8 caracteres',
      passed: trimmed.length >= 8
    },
    {
      id: 'uppercase',
      label: 'Al menos una letra mayúscula (A-Z)',
      passed: /[A-Z]/.test(p)
    },
    {
      id: 'lowercase',
      label: 'Al menos una letra minúscula (a-z)',
      passed: /[a-z]/.test(p)
    },
    {
      id: 'number',
      label: 'Al menos un número (0-9)',
      passed: /[0-9]/.test(p)
    },
    {
      id: 'special',
      label: 'Al menos un carácter especial (!@#$%^&*...)',
      passed: /[^A-Za-z0-9]/.test(p)
    }
  ];

  const isCommon = COMMON_PASSWORDS.has(lower);
  const passedCount = rules.filter((r) => r.passed).length;

  let score = 0;
  if (trimmed.length > 0) {
    score = Math.min(4, Math.floor((passedCount / rules.length) * 4));
    if (isCommon) score = 0;
  }

  const strengthMap: Record<number, { label: PasswordValidationResult['strengthLabel']; color: string }> = {
    0: { label: 'Muy Débil', color: 'bg-rose-500 text-rose-700' },
    1: { label: 'Débil', color: 'bg-orange-500 text-orange-700' },
    2: { label: 'Aceptable', color: 'bg-amber-500 text-amber-700' },
    3: { label: 'Fuerte', color: 'bg-teal-500 text-teal-700' },
    4: { label: 'Muy Segura', color: 'bg-emerald-600 text-emerald-700' }
  };

  const currentStrength = strengthMap[score];
  const allRulesPassed = rules.every((r) => r.passed);
  const isValid = allRulesPassed && !isCommon;

  let errorMessage: string | undefined;
  if (isCommon) {
    errorMessage = 'Esta contraseña es demasiado común o predecible. Por favor elija una combinación única.';
  } else if (!allRulesPassed && trimmed.length > 0) {
    const missing = rules.filter((r) => !r.passed).map((r) => r.label.toLowerCase());
    errorMessage = `Faltan requisitos de seguridad: ${missing.join(', ')}.`;
  }

  return {
    isValid,
    score,
    strengthLabel: currentStrength.label,
    strengthColor: currentStrength.color,
    rules,
    isCommonPassword: isCommon,
    errorMessage
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRulesAlways?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRulesAlways = false
}) => {
  if (!password && !showRulesAlways) return null;

  const result = validatePasswordPolicy(password);

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 transition-all">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-600">Nivel de Seguridad:</span>
          <span className={result.isValid ? 'text-emerald-600 font-black' : 'text-slate-500'}>
            {result.strengthLabel}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((step) => {
            const active = result.score >= step && !result.isCommonPassword;
            let barColor = 'bg-slate-200';
            if (active) {
              if (result.score === 1) barColor = 'bg-rose-500';
              else if (result.score === 2) barColor = 'bg-amber-500';
              else if (result.score === 3) barColor = 'bg-teal-500';
              else if (result.score === 4) barColor = 'bg-emerald-600';
            }
            return (
              <div
                key={step}
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              />
            );
          })}
        </div>
      </div>

      {result.isCommonPassword && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Contraseña demasiado predecible o vulnerable. Elija otra más compleja.</span>
        </div>
      )}

      {/* Rules Checklist */}
      <div className="space-y-1 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Requisitos obligatorios:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
          {result.rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-1.5 transition-colors ${
                rule.passed ? 'text-emerald-700 font-semibold' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                  rule.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {rule.passed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[2]" />}
              </div>
              <span className="truncate">{rule.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
