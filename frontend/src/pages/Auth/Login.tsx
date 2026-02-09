import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase.config';

function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
    'auth/cancelled-popup-request': 'Inicio de sesión cancelado.',
    'auth/popup-blocked': 'El popup fue bloqueado. Permite ventanas emergentes para este sitio.',
    'auth/network-request-failed': 'Error de conexión. Revisa tu red.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  };
  return messages[code] ?? 'Error al iniciar sesión. Intenta de nuevo.';
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const { signInWithGoogle, signInWithEmail, sendPasswordResetEmail, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate(from, { replace: true });
    }
  }, [authLoading, currentUser, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (auth) await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (auth) await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotStatus('sending');
    try {
      await sendPasswordResetEmail(forgotEmail.trim());
      setForgotStatus('success');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setForgotError(code === 'auth/user-not-found' ? 'No existe una cuenta con este correo.' : getFirebaseErrorMessage(code));
      setForgotStatus('error');
    }
  };

  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  const canSubmit = email.trim() && password && isValidEmail(email);

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700" htmlFor="email">Correo electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary">
                  <span className="material-icons text-xl">mail_outline</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-[16px] bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-base font-medium shadow-sm"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700" htmlFor="password">Contraseña</label>
                <button type="button" onClick={() => { setForgotOpen(true); setForgotStatus('idle'); setForgotError(null); setForgotEmail(email); }} className="text-sm font-bold text-primary hover:text-accent transition-colors">¿Olvidó su contraseña?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary">
                  <span className="material-icons text-xl">lock_outline</span>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-[16px] bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-base font-medium shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
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
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-[16px] shadow-lg shadow-primary/30 text-base font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <span className="material-icons animate-spin text-xl">refresh</span>
                  Ingresando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 font-medium">Acceso alternativo</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 rounded-[16px] shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
          </form>

          {forgotOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setForgotOpen(false)}>
              <div className="bg-white rounded-[16px] shadow-xl border border-slate-200 p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Restablecer contraseña</h3>
                  <button type="button" onClick={() => setForgotOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-icons">close</span>
                  </button>
                </div>
                <p className="text-sm text-slate-600">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                {forgotStatus === 'success' ? (
                  <div className="rounded-[16px] bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium">
                    Revisa tu correo para restablecer la contraseña.
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="Correo electrónico"
                      className="block w-full px-4 py-3 border border-slate-200 rounded-[16px] bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                    {forgotError && (
                      <div className="rounded-[16px] bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{forgotError}</div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setForgotOpen(false)} className="flex-1 py-2.5 px-4 rounded-[16px] border border-slate-200 font-bold text-slate-700 hover:bg-slate-50">
                        Cancelar
                      </button>
                      <button type="submit" disabled={forgotStatus === 'sending' || !isValidEmail(forgotEmail)} className="flex-1 py-2.5 px-4 rounded-[16px] bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-60">
                        {forgotStatus === 'sending' ? 'Enviando...' : 'Enviar enlace'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
          <p className="text-center text-sm text-slate-500">
            ¿Problemas de acceso técnico?{' '}
            <a className="font-bold text-accent hover:text-pink-700 transition-colors" href="#">Soporte técnico</a>
          </p>
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
