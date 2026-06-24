'use client';

import React, { useEffect, useState } from 'react';
import { supabaseClient, getSupabaseRawConfig } from '@/services/supabase';
import { trackPrivateMetric } from '@/utils/private_metrics';

const CLINICAL_PEARLS = [
  "\"El dolor de la pericarditis aguda típicamente se alivia al inclinarse hacia adelante.\"",
  "\"La auscultación del R3 es fisiológica en jóvenes, pero sugiere insuficiencia cardíaca en adultos.\"",
  "\"El pulso dicroto es un signo clásico de la fiebre tifoidea y de baja resistencia periférica.\"",
  "\"La semiología es el arte del diagnóstico clínico rápido mediante la agudeza sensorial.\"",
  "\"El signo de Murphy es positivo si se interrumpe la inspiración al presionar el hipocondrio derecho.\"",
  "\"La triada de Charcot (fiebre, ictericia y dolor abdominal) es indicativa de colangitis aguda.\"",
  "\"El signo de Babinski es patológico en adultos y sugiere lesión de la vía piramidal.\""
];

const SIMULATION_PHASES = [
  { percent: 45, title: "Generando simulación clínica de alta fidelidad...", subtext: "Cargando 7 Cursos" },
  { percent: 80, title: "Configurando base de datos local temporal...", subtext: "Inicializando Progreso" },
  { percent: 100, title: "¡Entorno Demo listo!", subtext: "Redireccionando..." }
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState('Estableciendo conexión segura...');
  const [loaderSubtext, setLoaderSubtext] = useState('Cargando módulos médicos');
  const [loaderPercent, setLoaderPercent] = useState(5);
  const [loaderQuote, setLoaderQuote] = useState(CLINICAL_PEARLS[0]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: randomize quote on mount, standard localStorage pattern
    setLoaderQuote(CLINICAL_PEARLS[Math.floor(Math.random() * CLINICAL_PEARLS.length)]);
    trackPrivateMetric({ event: 'page_view_login', userType: 'anonymous' });
  }, []);

  const runDemoMode = (selectedUniv: string, userEmail: string) => {
    trackPrivateMetric({
      event: 'login_demo_start',
      mode: 'demo',
      userType: 'student',
      meta: { university: selectedUniv },
    });

    setIsLoading(true);
    setLoaderPercent(15);
    setLoaderTitle("Estableciendo entorno local demo...");
    setLoaderSubtext("Simulación Comercial");
    
    // Persistir variables demo
    localStorage.setItem('study_university', selectedUniv);
    localStorage.setItem('study_email', userEmail);
    localStorage.setItem('study_user', userEmail.split('@')[0]);
    localStorage.setItem('is_demo', 'true');
    document.cookie = "is_demo=true; path=/; max-age=86400; SameSite=Lax";

    let phaseIdx = 0;
    const interval = setInterval(() => {
      if (phaseIdx < SIMULATION_PHASES.length) {
        const phase = SIMULATION_PHASES[phaseIdx];
        setLoaderPercent(phase.percent);
        setLoaderTitle(phase.title);
        setLoaderSubtext(phase.subtext);
        if (phaseIdx === 1) {
          // Cambiar la perla clínica a mitad de camino
          setLoaderQuote(CLINICAL_PEARLS[Math.floor(Math.random() * CLINICAL_PEARLS.length)]);
        }
        phaseIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    }, 900);
  };

  const handleSSOLogin = async () => {
    trackPrivateMetric({ event: 'login_sso_click', mode: 'azure', userType: 'student' });

    setIsLoading(true);
    setLoaderPercent(20);
    setLoaderTitle("Conectando con Microsoft Entra ID...");
    setLoaderSubtext("Redireccionando a Portal UCE");

    const isAzureSsoEnabled = process.env.NEXT_PUBLIC_ENABLE_AZURE_SSO === 'true';
    if (!isAzureSsoEnabled) {
      console.info('SSO Azure deshabilitado por configuración. Ingresando en modo demo.');
      trackPrivateMetric({ event: 'login_sso_disabled_fallback_demo', mode: 'demo' });
      runDemoMode("UCE", "estudiante.sim@uce.edu.do");
      return;
    }

    const config = getSupabaseRawConfig();

    if (supabaseClient && config.url && !config.anonKey.startsWith('YOUR_')) {
      try {
        // Establecer cookie is_demo a false para producción
        document.cookie = "is_demo=false; path=/; max-age=86400; SameSite=Lax";
        
        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            scopes: 'openid profile email offline_access',
            redirectTo: `${window.location.origin}/`,
          }
        });
        if (error) throw error;
      } catch (err) {
        console.warn("Fallo de autenticación SSO, ingresando en modo demo:", err);
        trackPrivateMetric({ event: 'login_sso_error_fallback_demo', mode: 'demo' });
        runDemoMode("UCE", "estudiante.sim@uce.edu.do");
      }
    } else {
      trackPrivateMetric({ event: 'login_missing_supabase_config_fallback_demo', mode: 'demo' });
      runDemoMode("UCE", "estudiante.sim@uce.edu.do");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 bg-[#0b0f19] text-gray-100">
      
      {/* BLOBS DECORATIVOS DE FONDO */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl float-blob -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl float-blob-reverse -z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className={`w-full max-w-lg z-10 transition-all duration-500 ${isLoading ? 'scale-95 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
        
        {/* Encabezado con Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 mb-4 border border-blue-400/20">
            <span className="text-3xl">🩺</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
            Study With Me
          </h1>
          <p className="text-gray-400 text-sm mt-1">Plataforma Educativa para Ciencias de la Salud</p>
        </div>

        {/* Tarjeta de Login */}
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"></div>

          <h2 className="text-xl font-display font-bold text-gray-100 mb-2 text-center">Acceso Estudiantil</h2>
          <p className="text-xs text-gray-400 mb-8 text-center">Inicia sesión de forma segura con tu cuenta universitaria</p>

          <div className="space-y-6">
            {/* Botón Microsoft Entra ID SSO */}
            <button
              type="button"
              onClick={handleSSOLogin}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer border border-blue-400/20"
            >
              <span className="text-lg">🔑</span>
              <span>Continuar con Correo Institucional UCE</span>
            </button>

            {/* Separador visual */}
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="h-px bg-gray-800 flex-1"></div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">o también</span>
              <div className="h-px bg-gray-800 flex-1"></div>
            </div>

            {/* Acceso Demo Comercial */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => runDemoMode("UCE", "estudiante.sim@uce.edu.do")}
                className="w-full py-3 bg-gray-900/50 hover:bg-gray-800/50 text-gray-300 border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
              >
                Acceder en Modo Demo Comercial (Prueba Offline)
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-[11px] text-gray-500">
              ¿Problemas para ingresar?
              <a href="#" className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1">Contactar a Soporte UCE</a>
            </p>
          </div>
        </div>

        {/* Pie de página */}
        <p className="text-center text-gray-600 text-xs mt-8">
          &copy; 2026 Study With Me. Todos los derechos reservados.<br />
          Desarrollado para entornos de simulación y evaluación clínica.
        </p>
      </div>

      {/* OVERLAY DE CARGA CON ECG INTERACTIVO */}
      <div
        className={`fixed inset-0 bg-[#090d16]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-all duration-500 ${
          isLoading ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
      >
        <div className="max-w-md w-full px-6 text-center space-y-8">
          
          {/* Gráfico de ECG */}
          <div className="w-48 h-24 mx-auto relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                className="ekg-line"
                d="M 0 50 L 80 50 L 100 20 L 120 80 L 140 45 L 150 55 L 160 50 L 200 50 L 210 10 L 225 90 L 240 40 L 250 55 L 260 50 L 300 50"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute text-5xl animate-pulse select-none">❤️</div>
          </div>

          {/* Textos de Estado de Carga */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-100 font-display">{loaderTitle}</h3>
            <p className="text-xs text-blue-400 font-mono tracking-widest uppercase">{loaderSubtext}</p>
            
            {/* Barra de progreso */}
            <div className="w-64 h-1.5 bg-gray-800 rounded-full mx-auto overflow-hidden p-0.5 mt-4">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${loaderPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cita de Cátedra durante la carga */}
          <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 max-w-sm mx-auto">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Perla Clínica del Día</p>
            <p className="text-xs text-gray-300 italic">{loaderQuote}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
