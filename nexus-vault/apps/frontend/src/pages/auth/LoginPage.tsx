import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Zap } from 'lucide-react';
import { auth, googleProvider, microsoftProvider } from '@/config/firebase';
import { Spinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import type { UserProfile, UserClaims } from '@/types';

// ---- Google Icon ----
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ---- Microsoft Icon ----
function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M11.4 24H0V12.6h11.4V24z" fill="#F25022" />
      <path d="M24 24H12.6V12.6H24V24z" fill="#00A4EF" />
      <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#7FBA00" />
      <path d="M24 11.4H12.6V0H24v11.4z" fill="#FFB900" />
    </svg>
  );
}

// ---- Animated Orb ----
function Orb({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`orb ${className}`} style={style} aria-hidden="true" />;
}

// ---- Auth Error mapper ----
function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/popup-closed-by-user':    'La ventana emergente de inicio de sesión fue cerrada. Intente de nuevo.',
    'auth/popup-blocked':           'Ventana emergente bloqueada por el navegador. Habilítelas e intente de nuevo.',
    'auth/invalid-email':           'Correo electrónico no válido.',
    'auth/user-not-found':          'No se encontró ninguna cuenta registrada con este correo.',
    'auth/wrong-password':          'Contraseña incorrecta.',
    'auth/too-many-requests':       'Demasiados intentos fallidos. Intente más tarde.',
    'auth/account-exists-with-different-credential':
                                    'Ya existe una cuenta vinculada a este correo usando un método de inicio de sesión diferente.',
    'auth/network-request-failed':  'Error de red. Verifique su conexión e intente de nuevo.',
  };
  return map[code] ?? 'Error al iniciar sesión. Por favor, intente de nuevo.';
}

// ================================================================
// LOGIN PAGE
// ================================================================
export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setProfile, setClaims } = useAuthStore();

  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [loadingGoogle,  setLoadingGoogle]  = useState(false);
  const [loadingMS,      setLoadingMS]      = useState(false);
  const [loadingEmail,   setLoadingEmail]   = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // ---- Shared post-login: verify with backend ----
  async function postLogin(idToken: string) {
    const verifyRes = await api.post<{ user: UserProfile; claims: UserClaims }>('/api/v1/auth/verify', { idToken });
    setProfile(verifyRes.data.user);
    setClaims(verifyRes.data.claims);
    toast.success(`¡Bienvenido de nuevo, ${verifyRes.data.user.displayName || 'usuario'}!`);
    navigate('/dashboard', { replace: true });
  }

  // ---- Mock login for local development ----
  async function handleMockLogin(uid: string, email: string, displayName: string) {
    setError(null);
    try {
      const mockUser = {
        uid,
        email,
        displayName,
        getIdToken: async () => `mock-token-${uid}`,
        getIdTokenResult: async () => ({
          claims: {
            role: uid.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' : uid.includes('ADMIN') ? 'ADMIN' : uid.includes('INSTRUCTOR') ? 'INSTRUCTOR' : 'STUDENT',
          }
        }),
      } as unknown as any;

      setUser(mockUser);
      localStorage.setItem('nexus_mock_token', `mock-token-${uid}`);
      await postLogin(`mock-token-${uid}`);
    } catch (err: any) {
      console.error('[MockLogin] Error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Error desconocido';
      setError(`Error al iniciar sesión en modo prueba: ${errMsg}`);
    }
  }

  // ---- Google sign-in ----
  async function handleGoogle() {
    setError(null);
    setLoadingGoogle(true);
    try {
      const result  = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      setUser(result.user);
      await postLogin(idToken);
    } catch (err) {
      const code = (err as AuthError).code ?? '';
      setError(mapFirebaseError(code));
      toast.error(mapFirebaseError(code));
    } finally {
      setLoadingGoogle(false);
    }
  }

  // ---- Microsoft sign-in ----
  async function handleMicrosoft() {
    setError(null);
    setLoadingMS(true);
    try {
      const result  = await signInWithPopup(auth, microsoftProvider);
      const idToken = await result.user.getIdToken();
      setUser(result.user);
      await postLogin(idToken);
    } catch (err) {
      const code = (err as AuthError).code ?? '';
      setError(mapFirebaseError(code));
      toast.error(mapFirebaseError(code));
    } finally {
      setLoadingMS(false);
    }
  }

  // ---- Email/password sign-in ----
  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Por favor, ingrese tanto el correo electrónico como la contraseña.'); return; }
    setError(null);
    setLoadingEmail(true);

    if (import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key') {
      try {
        const uid = 'mock-uid-' + email.replace(/[^a-zA-Z0-9]/g, '-');
        const mockUser = {
          uid,
          email,
          displayName: email.split('@')[0],
          getIdToken: async () => `mock-token:${uid}:${email}`,
          getIdTokenResult: async () => ({
            claims: { role: 'USER' }
          }),
        } as unknown as any;

        setUser(mockUser);
        localStorage.setItem('nexus_mock_token', `mock-token:${uid}:${email}`);
        await postLogin(`mock-token:${uid}:${email}`);
      } catch (err: any) {
        console.error('[MockEmailLogin] Error:', err);
        const errMsg = err?.response?.data?.message || err?.message || 'Error desconocido';
        setError(`Error al iniciar sesión en modo prueba: ${errMsg}`);
      } finally {
        setLoadingEmail(false);
      }
      return;
    }

    try {
      const result  = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      setUser(result.user);
      await postLogin(idToken);
    } catch (err) {
      const code = (err as AuthError).code ?? '';
      setError(mapFirebaseError(code));
    } finally {
      setLoadingEmail(false);
    }
  }

  const anyLoading = loadingGoogle || loadingMS || loadingEmail;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-dark-900">

      {/* ---- Animated background orbs ---- */}
      <Orb className="w-[600px] h-[600px] bg-primary-600/25" style={{ top: '-10%', left: '-5%' } as React.CSSProperties} />
      <Orb className="w-[500px] h-[500px] bg-accent-600/20"  style={{ bottom: '-15%', right: '-5%', animationDelay: '-3s', animationDuration: '10s' } as React.CSSProperties} />
      <Orb className="w-[300px] h-[300px] bg-primary-800/20" style={{ top: '50%', left: '60%', animationDelay: '-6s', animationDuration: '12s' } as React.CSSProperties} />

      {/* ---- Grid overlay ---- */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* ---- Login card ---- */}
      <div className="relative z-10 w-full max-w-md animate-slideUp">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">

          {/* ---- Logo & brand ---- */}
          <div className="flex flex-col items-center mb-8">
            {/* Vault icon */}
            <div className="relative mb-5">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 blur-xl animate-pulse-glow" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Shield className="w-8 h-8 text-white" />
                {/* Inner detail */}
                <div className="absolute inset-2 rounded-xl border border-white/20" />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold gradient-text tracking-tight mb-1">
              NEXUS VAULT
            </h1>
            <p className="text-slate-400 text-sm font-medium text-center">
              Plataforma de Seguridad Documental Enterprise
            </p>

            {/* Feature pills */}
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              {['Zero Trust', 'AES-256', 'Listo para Auditoría'].map((tag) => (
                <span key={tag} className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[11px]">
                  <Zap className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ---- Error message ---- */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm animate-slideDown">
              {error}
            </div>
          )}

          {/* ---- OAuth Buttons ---- */}
          <div className="space-y-3 mb-5">
            <button
              onClick={handleGoogle}
              disabled={anyLoading}
              className="btn-ghost w-full justify-center gap-3 py-3 disabled:opacity-50"
            >
              {loadingGoogle ? <Spinner size="sm" className="text-primary-400" /> : <GoogleIcon />}
              <span className="font-semibold">Continuar con Google</span>
            </button>

            <button
              onClick={handleMicrosoft}
              disabled={anyLoading}
              className="btn-ghost w-full justify-center gap-3 py-3 disabled:opacity-50"
            >
              {loadingMS ? <Spinner size="sm" className="text-primary-400" /> : <MicrosoftIcon />}
              <span className="font-semibold">Continuar con Microsoft</span>
            </button>
          </div>

          {/* ---- Divider ---- */}
          <div className="divider text-slate-600 text-xs mb-5">
            o continuar con correo electrónico
          </div>

          {/* ---- Mock Login for Dev ---- */}
          {(import.meta.env.DEV || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key') && (
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-5 text-center">
              <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mb-3 flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent-400 animate-pulse" />
                Acceso de Prueba (Desarrollo)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleMockLogin('SEED_SUPER_ADMIN_FIREBASE_UID', 'superadmin@nexusvault.internal', 'Super Admin')}
                  className="btn-ghost text-xs py-2 px-3 justify-center text-slate-300 hover:text-white rounded-xl border border-white/5 hover:bg-white/5"
                >
                  Súper Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleMockLogin('SEED_DEMO_ADMIN_FIREBASE_UID', 'admin@demo-university.edu', 'Admin Demo')}
                  className="btn-ghost text-xs py-2 px-3 justify-center text-slate-300 hover:text-white rounded-xl border border-white/5 hover:bg-white/5"
                >
                  Admin Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleMockLogin('SEED_DEMO_INSTRUCTOR_FIREBASE_UID', 'prof.smith@demo-university.edu', 'Prof. Jane Smith')}
                  className="btn-ghost text-xs py-2 px-3 justify-center text-slate-300 hover:text-white rounded-xl border border-white/5 hover:bg-white/5"
                >
                  Instructor
                </button>
                <button
                  type="button"
                  onClick={() => handleMockLogin('SEED_DEMO_STUDENT_1_FIREBASE_UID', 'student.alice@demo-university.edu', 'Alice (Estudiante)')}
                  className="btn-ghost text-xs py-2 px-3 justify-center text-slate-300 hover:text-white rounded-xl border border-white/5 hover:bg-white/5"
                >
                  Estudiante
                </button>
              </div>
            </div>
          )}

          {/* ---- Email/Password form ---- */}
          <form onSubmit={handleEmailPassword} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Dirección de correo electrónico de trabajo"
                autoComplete="email"
                required
                className="input-dark pl-11"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                className="input-dark pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={anyLoading}
              className="btn-primary w-full py-3 mt-2 justify-center"
            >
              {loadingEmail ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ---- Footer ---- */}
          <div className="mt-8 pt-5 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Protegido por Firebase Enterprise Auth
              <br />
              <span className="text-slate-700">·</span>{' '}
              <span className="gradient-text font-semibold">NEXUS VAULT 2.0</span>
              {' '}<span className="text-slate-700">·</span>{' '}
              Todos los derechos reservados
            </p>
          </div>
        </div>

        {/* ---- Sub-card glow effect ---- */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 blur-2xl -z-10 animate-pulse" />
      </div>
    </div>
  );
}
