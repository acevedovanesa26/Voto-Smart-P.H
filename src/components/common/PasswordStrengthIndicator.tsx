import React from 'react';
import { Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { validatePassword } from '../../utils/passwordPolicy';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRules?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRules = true
}) => {
  if (!password) return null;

  const result = validatePassword(password);

  return (
    <div className="mt-2 space-y-2 text-xs animate-fadeIn">
      {/* Strength bar */}
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Seguridad: <strong className="text-slate-800 font-bold">{result.strengthLabel}</strong>
        </span>
        <span className="text-slate-400 font-mono">{result.score}%</span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${result.strengthColor}`}
          style={{ width: `${Math.max(result.score, 10)}%` }}
        />
      </div>

      {/* Checklist of rules */}
      {showRules && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          {result.rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                rule.passed ? 'text-emerald-700 font-medium' : 'text-slate-400'
              }`}
            >
              {rule.passed ? (
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5 stroke-[2]" />
                </div>
              )}
              <span>{rule.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
