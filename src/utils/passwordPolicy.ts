export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 100
  strengthLabel: 'Muy Débil' | 'Débil' | 'Aceptable' | 'Segura' | 'Excelente';
  strengthColor: string;
  rules: PasswordRule[];
  errorMessage?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  const pwd = password || '';

  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'Mínimo 8 caracteres',
      passed: pwd.length >= 8
    },
    {
      id: 'uppercase',
      label: 'Al menos una letra mayúscula (A-Z)',
      passed: /[A-Z]/.test(pwd)
    },
    {
      id: 'lowercase',
      label: 'Al menos una letra minúscula (a-z)',
      passed: /[a-z]/.test(pwd)
    },
    {
      id: 'number',
      label: 'Al menos un número (0-9)',
      passed: /[0-9]/.test(pwd)
    },
    {
      id: 'special',
      label: 'Al menos un carácter especial (@$!%*#?&-_.)',
      passed: /[^A-Za-z0-9]/.test(pwd)
    }
  ];

  const passedCount = rules.filter((r) => r.passed).length;
  const score = Math.round((passedCount / rules.length) * 100);
  const isValid = passedCount === rules.length;

  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Muy Débil';
  let strengthColor = 'bg-rose-500';

  if (passedCount === 5) {
    strengthLabel = 'Excelente';
    strengthColor = 'bg-emerald-500';
  } else if (passedCount === 4) {
    strengthLabel = 'Segura';
    strengthColor = 'bg-teal-500';
  } else if (passedCount === 3) {
    strengthLabel = 'Aceptable';
    strengthColor = 'bg-amber-500';
  } else if (passedCount >= 1) {
    strengthLabel = 'Débil';
    strengthColor = 'bg-orange-500';
  }

  let errorMessage: string | undefined;
  if (!isValid) {
    const missing = rules.filter((r) => !r.passed).map((r) => r.label.toLowerCase());
    errorMessage = `La contraseña debe cumplir con: ${missing.join(', ')}.`;
  }

  return {
    isValid,
    score,
    strengthLabel,
    strengthColor,
    rules,
    errorMessage
  };
}
