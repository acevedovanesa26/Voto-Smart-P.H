import React from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileCheck2,
  Lock,
  PieChart,
  ShieldCheck,
  Sparkles,
  Users,
  Vote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card } from '../common/UIComponents';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenLogin
}) => {
  const { switchDemoRole } = useAuth();

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 text-white p-8 sm:p-14 border border-teal-800/40 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma Certificada para Asambleas P.H.
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] font-display">
            Asambleas y Votaciones Digitales <span className="text-teal-400">100% Claras y Seguras</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed">
            Diseñada especialmente para conjuntos residenciales en Colombia. Fácil de usar para adultos mayores, cálculo automático de coeficientes en tiempo real y generación oficial de actas con validez legal.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <Button
              size="xl"
              variant="primary"
              onClick={onEnterApp}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black shadow-lg shadow-teal-500/25"
            >
              Explorar Asamblea Demo en Vivo
            </Button>
            <Button
              size="xl"
              variant="outline"
              onClick={onOpenLogin}
              className="border-slate-600 text-white hover:bg-white/10"
            >
              Acceso a Mi Conjunto
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Conforme a la Ley 675 / 2001</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Voto Secreto Encriptado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Sin Descargas ni Apps Extra</span>
            </div>
          </div>
        </div>
      </section>

      {/* Senior Accessibility Focus */}
      <section className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-8 sm:p-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Diseñado Pensando en Adultos Mayores y Personas sin Experiencia Digital
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Botones extra grandes, contraste visual optimizado, textos claros sin tecnicismos y confirmación de dos pasos con recibo digital descargable. Nadie se queda sin votar.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            Todo lo que necesita para una Asamblea Impecable
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Automatice desde el quórum hasta la generación y firma del acta oficial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Control de Quórum en Vivo</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cálculo inmediato de coeficientes de copropiedad al registrar el ingreso presencial o virtual. Alerta visual de quórum decisorio y deliberatorio.
            </p>
          </Card>

          {/* Card 2 */}
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Vote className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">5 Tipos de Votaciones</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Votaciones Sí/No, selección única, múltiple, elecciones de candidatos con foto y propuestas, o selección de cargos con cómputo ponderado.
            </p>
          </Card>

          {/* Card 3 */}
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Resultados & Coeficientes</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Gráficos transparentes en tiempo real, detección automática de empates, cálculo por porcentaje de votos y por coeficiente según la ley.
            </p>
          </Card>

          {/* Card 4 */}
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Acta Oficial & Exportación PDF</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generación instantánea del acta con formato legal, cuadros de votación, firmas institucionales y exportación a PDF y Excel con un clic.
            </p>
          </Card>

          {/* Card 5 */}
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Voto Secreto & Anti-Duplicados</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Garantía criptográfica de anonimato en votaciones secretas impidiendo doble sufragio y entregando un recibo digital único a cada copropietario.
            </p>
          </Card>

          {/* Card 6 */}
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Auditoría & Trazabilidad</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bitácora cronológica inmutable que registra cada apertura de votación, votos emitidos, cambios de quórum y envío masivo de correos.
            </p>
          </Card>
        </div>
      </section>

      {/* Role Quick Demonstration Box */}
      <section className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase">
            <Award className="w-3.5 h-3.5" /> Modos de Demostración
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display">
            Pruebe la experiencia según el rol
          </h2>
          <p className="text-slate-400 text-sm">
            Seleccione una de las perspectivas para ingresar directamente a la simulación:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              switchDemoRole('admin');
              onEnterApp();
            }}
            className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1">Administrador</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Control de quórum, apertura/cierre de votaciones, gestión de actas y envío de correos.
            </p>
          </button>

          <button
            onClick={() => {
              switchDemoRole('owner', 'user-owner-1');
              onEnterApp();
            }}
            className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Vote className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1">Copropietario (Carlos)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Portal simple con botones grandes, votación activa en vivo y comprobante digital.
            </p>
          </button>

          <button
            onClick={() => {
              switchDemoRole('president');
              onEnterApp();
            }}
            className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1">Presidente de Asamblea</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dirección del orden del día, toma de notas oficiales y firma del acta.
            </p>
          </button>

          <button
            onClick={() => {
              switchDemoRole('accountant');
              onEnterApp();
            }}
            className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1">Contador / Revisor</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validación de estados financieros, presupuestos y consulta de reportes en Excel.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};
