import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
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
  const { theme, toggleTheme } = useTheme();
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <span className="font-mono-data font-bold" style={{ color: '#6384ff' }}>Cargando...</span>
      </div>
    );
  }

  if (currentUser) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)', fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>

      {/* Panel izquierdo — formulario */}
      <div
        className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 xl:p-16 z-10"
        style={{
          background: 'var(--color-bg-soft)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Header: logo + toggle tema */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: 48, height: 48, borderRadius: 16, flexShrink: 0,
              background: 'rgba(99,132,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(99,132,255,0.2)',
            }}>
              <span className="material-icons" style={{ fontSize: 26, color: '#6384ff' }}>local_shipping</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
                Gestión de Vehículos Institucionales
              </h2>
              <p className="text-xs font-semibold uppercase mt-0.5" style={{ color: '#6384ff', letterSpacing: '0.8px' }}>
                Poder Judicial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-border)' }}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span className="material-icons" style={{ fontSize: 20 }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)', letterSpacing: '-0.5px' }}>Bienvenido</h1>
            <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>Acceso al panel de gestión de flota.</p>
          </div>

          <div className="space-y-5">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 cursor-pointer"
                style={{ accentColor: '#6384ff' }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-soft)' }}>Mantener sesión iniciada</span>
            </label>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-3.5 px-6 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-panel-bg)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 10,
                color: 'var(--color-text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(20px)',
              }}
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

        {/* Footer del panel */}
        <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          <span className="w-2 h-2 rounded-full pulse" style={{ background: '#6384ff' }} />
          Gestión de Vehículos Institucionales v3.1
        </div>
      </div>

      {/* Panel derecho — imagen decorativa (solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/fleet-bg.jpg')", filter: 'blur(3px)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(99,132,255,0.78), rgba(90,111,255,0.88))' }} />
        <div className="relative z-10 h-full flex flex-col justify-center px-16 text-white max-w-2xl mx-auto">
          <div
            className="p-10"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-wider"
              style={{
                borderRadius: 20,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span className="material-icons text-sm">security</span>
              Acceso seguro
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ letterSpacing: '-0.5px' }}>
              Gestión de Vehículos Institucionales
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Plataforma centralizada para la gestión eficiente de vehículos y reservas. Supervise el estado de la flota y programe mantenimientos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
