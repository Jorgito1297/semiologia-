import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      {/* Círculos de luz difusa de fondo */}
      <div className="absolute w-72 h-72 rounded-full bg-primary-600/10 blur-[80px] pointer-events-none -z-10" />
      <div className="absolute w-72 h-72 rounded-full bg-accent-600/10 blur-[80px] pointer-events-none -z-10 translate-x-12 translate-y-12" />

      <div className="glass-strong rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl relative overflow-hidden animate-slideUp">
        {/* Línea decorativa */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />

        {/* Icono de error */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center border border-rose-500/30 mb-6 mt-4">
          <ShieldAlert className="w-10 h-10 text-rose-400 animate-pulse" />
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          404
        </h1>
        <h2 className="text-lg font-bold text-white mb-3">
          Página no encontrada
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          El recurso al que intentas acceder no existe, ha sido movido de lugar, o no cuentas con los privilegios necesarios para visualizarlo.
        </p>

        {/* Botones de navegación */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver Atrás
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
