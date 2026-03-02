import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase.config';

function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
    'auth/cancelled-popup-request': 'Inicio de sesión cancelado.',
    'auth/popup-blocked': 'El popup fue bloqueado. Permite ventanas emergentes para este sitio.',
    'auth/network-request-failed': 'Error de conexión. Revisa tu red.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  };
  return messages[code] ?? 'Error al iniciar sesión. Intenta de nuevo.';
}

export function Login() {
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate(from, { replace: true });
    }
  }, [authLoading, currentUser, navigate, from]);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (auth) await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-primary font-display font-bold">Cargando...</div>
      </div>
    );
  }

  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex font-display bg-background-light text-slate-800">
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 xl:p-16 bg-white rounded-r-[16px] shadow-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[16px] bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-icons text-2xl">local_shipping</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Flota</h2>
            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">Gestión de Flota</p>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Bienvenido</h1>
            <p className="text-slate-500 font-medium text-lg">Acceso al panel de gestión de flota.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded-[6px] cursor-pointer"
              />
              <label className="ml-3 block text-sm font-semibold text-slate-600" htmlFor="remember-me">Mantener sesión iniciada</label>
            </div>
            {error && (
              <div className="rounded-[16px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 rounded-[16px] shadow-lg shadow-primary/20 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <span className="material-icons animate-spin text-xl">refresh</span>
                  Ingresando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.0003 20.45c4.656 0 8.556-3.21 9.97-7.66h-9.97v-4.22h14.4c.144.75.22 1.54.22 2.34 0 7.39-5.36 12.66-12.62 12.66-6.99 0-12.66-5.67-12.66-12.66s5.67-12.66 12.66-12.66c3.39 0 6.47 1.25 8.87 3.49l-3.32 3.32c-1.39-1.34-3.36-2.18-5.55-2.18-4.57 0-8.28 3.71-8.28 8.28s3.71 8.28 8.28 8.28z" fill="currentColor" />
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Gestión de Flota v3.1
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative bg-background-light overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-indigo-900/90 mix-blend-multiply" />
        <div className="relative z-10 h-full flex flex-col justify-center px-16 text-white max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-10 border border-white/20 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider mb-6 text-white backdrop-blur-sm">
              <span className="material-icons text-sm">security</span>
              Acceso seguro
            </div>
            <h2 className="text-4xl font-extrabold mb-4 font-display leading-tight tracking-tight">Gestión de Flota</h2>
            <p className="text-lg text-indigo-50 mb-8 leading-relaxed opacity-90">
              Plataforma centralizada para la gestión eficiente de vehículos y reservas. Supervise el estado de la flota y programe mantenimientos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
