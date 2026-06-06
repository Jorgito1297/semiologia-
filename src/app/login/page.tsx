'use client';

import React, { useState } from 'react';
import { supabaseClient, getSupabaseRawConfig } from '@/services/supabase';

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
  const [university, setUniversity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState('Estableciendo conexión segura...');
  const [loaderSubtext, setLoaderSubtext] = useState('Cargando módulos médicos');
  const [loaderPercent, setLoaderPercent] = useState(5);
  const [loaderQuote, setLoaderQuote] = useState(() => CLINICAL_PEARLS[Math.floor(Math.random() * CLINICAL_PEARLS.length)]);

  const runDemoMode = (selectedUniv: string, userEmail: string) => {
    setIsLoading(true);
    setLoaderPercent(15);
    setLoaderTitle("Estableciendo entorno local demo...");
    setLoaderSubtext("Simulación Comercial");
    
    // Persistir variables demo
    localStorage.setItem('study_university', selectedUniv);
    localStorage.setItem('study_email', userEmail);
    localStorage.setItem('study_user', userEmail.split('@')[0]);
    localStorage.setItem('is_demo', 'true');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const config = getSupabaseRawConfig();

    if (supabaseClient && config.url && !config.anonKey.startsWith('YOUR_')) {
      try {
        setLoaderPercent(20);
        setLoaderTitle("Autenticando usuario en Supabase...");
        setLoaderSubtext("Seguridad SSL Activa");

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setLoaderPercent(50);
        setLoaderTitle("Invocando proxy Edge de Moodle...");
        setLoaderSubtext("Sincronizando Aula");

        const moodleUrls: Record<string, string> = {
          UCE: "https://moodle.uce.edu.do",
          UASD: "https://uasdvirtual.edu.do",
          INTEC: "https://virtual.intec.edu.do",
          UNIBE: "https://unibevirtual.edu.do",
          PUCMM: "https://pucmmvirtual.edu.do"
        };
        const moodleUrl = moodleUrls[university] || "https://moodle.uce.edu.do";

        const response = await fetch(`${config.url}/functions/v1/supabase_moodle_proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({
            action: 'login',
            moodleUrl: moodleUrl,
            username: email.split('@')[0],
            password: password
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Fallo en la comunicación con el Edge Function Proxy");
        }

        setLoaderPercent(80);
        setLoaderTitle("Sincronizando base de datos...");
        setLoaderSubtext("Alineando Syllabus");

        // Almacenar credenciales del estudiante en sesión de producción
        localStorage.setItem('study_university', university);
        localStorage.setItem('study_email', email);
        localStorage.setItem('study_user', email.split('@')[0]);
        localStorage.setItem('is_demo', 'false');

        setLoaderPercent(100);
        setLoaderTitle("¡Acceso concedido exitosamente!");
        setLoaderSubtext("Cargando Aula Virtual");

        setTimeout(() => {
          window.location.href = '/';
        }, 500);

      } catch (err) {
        console.warn("Fallo de autenticación en Supabase, ingresando en modo demo. Detalles:", err);
        runDemoMode(university, email);
      }
    } else {
      runDemoMode(university, email);
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

          <h2 className="text-xl font-display font-bold text-gray-100 mb-6 text-center">Acceso Estudiantil</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Selector de Universidad */}
            <div>
              <label htmlFor="university" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Universidad de Origen
              </label>
              <div className="relative">
                <select
                  id="university"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-gray-200 text-sm focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-[#0f172a] text-gray-400">Selecciona tu institución</option>
                  <option value="UCE" className="bg-[#0f172a] text-gray-200">Universidad Central del Este (UCE)</option>
                  <option value="UASD" className="bg-[#0f172a] text-gray-200">Universidad Autónoma de Santo Domingo (UASD)</option>
                  <option value="INTEC" className="bg-[#0f172a] text-gray-200">Instituto Tecnológico de Santo Domingo (INTEC)</option>
                  <option value="UNIBE" className="bg-[#0f172a] text-gray-200">Universidad Iberoamericana (UNIBE)</option>
                  <option value="PUCMM" className="bg-[#0f172a] text-gray-200">Pontificia Universidad Católica Madre y Maestra (PUCMM)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Input Correo */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Correo Institucional
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@universidad.edu"
                className="w-full px-4 py-3 rounded-xl glass-input text-gray-200 text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* Input Contraseña */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  ¿La olvidaste?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl glass-input text-gray-200 text-sm placeholder-gray-500 focus:outline-none pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors text-xs font-semibold select-none"
                >
                  {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                </button>
              </div>
            </div>

            {/* Recordar Sesión */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 focus:ring-offset-2"
              />
              <label htmlFor="remember" className="ml-2 text-xs text-gray-400 select-none cursor-pointer">
                Mantener sesión iniciada en este equipo
              </label>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar al Aula Virtual</span> ➔
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-400">
              ¿No tienes una cuenta aún? 
              <a href="#" className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1">Solicita acceso institucional</a>
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
