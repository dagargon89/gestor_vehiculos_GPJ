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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Vehículos Institucionales</h2>
            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">Gestión de Vehículos Institucionales</p>
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
              className="w-full flex justify-center items-center gap-3 py-3.5 px-6 border border-slate-200 rounded-[16px] bg-white text-base font-semibold text-slate-700 shadow-md hover:shadow-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <>
                  <span className="material-icons animate-spin text-xl">refresh</span>
                  Ingresando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Gestión de Vehículos Institucionales v3.1
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Fondo de vehículos con desenfoque */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/fleet-bg.jpg')", filter: 'blur(3px)' }}
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/75 to-indigo-900/85" />
        <div className="relative z-10 h-full flex flex-col justify-center px-16 text-white max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-10 border border-white/20 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider mb-6 text-white backdrop-blur-sm">
              <span className="material-icons text-sm">security</span>
              Acceso seguro
            </div>
            <h2 className="text-4xl font-extrabold mb-4 font-display leading-tight tracking-tight">Gestión de Vehículos Institucionales</h2>
            <p className="text-lg text-indigo-50 mb-8 leading-relaxed opacity-90">
              Plataforma centralizada para la gestión eficiente de vehículos y reservas. Supervise el estado de la flota y programe mantenimientos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
