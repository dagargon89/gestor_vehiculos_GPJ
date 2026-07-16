import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  onIdTokenChanged,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../config/firebase.config';
import apiClient from '../services/api.service';
import { AuthContext, type AuthContextType, type UserData } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(!!auth);
  const [authSyncError, setAuthSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthSyncError(null);
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await apiClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserData(response.data);
          setAuthSyncError(null);
          // El backend crea/sincroniza el usuario en BD en esta petición; forzar recarga de la lista de usuarios
          queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (err) {
          console.error('Error obteniendo datos del usuario:', err);
          const ax = err as { response?: { status?: number; data?: { message?: string | string[] } } };
          const status = ax?.response?.status;
          const isNetwork = !ax?.response;
          const serverMsg = Array.isArray(ax?.response?.data?.message)
            ? ax.response.data.message[0]
            : ax?.response?.data?.message;
          const message = isNetwork
            ? 'No se pudo conectar con el servidor. Para que tu usuario se guarde en la base de datos, el backend debe estar en marcha (puerto 3000). ¿Lo tienes levantado?'
            : status === 401
              ? 'El servidor rechazó la sesión. Comprueba que el backend use el mismo proyecto de Firebase que el frontend.'
              : status === 500
                ? serverMsg
                  ? `Error en el servidor: ${serverMsg}`
                  : 'Error en el servidor al crear o obtener tu usuario. Revisa los logs del backend.'
                : 'No se pudo sincronizar con el servidor. Comprueba que el backend esté en marcha en http://localhost:3000.';
          setAuthSyncError(message);
          setUserData({
            id: '',
            email: user.email ?? '',
            displayName: user.displayName ?? undefined,
            photoUrl: user.photoURL ?? null,
            role: undefined,
            permissions: [],
          });
        }
      } else {
        setUserData(null);
        setAuthSyncError(null);
      }
      setLoading(false);
    });

    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    });

    return () => {
      unsubscribe();
      unsubscribeToken();
    };
  }, [queryClient]);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase no configurado. Configure VITE_FIREBASE_* en .env');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase no configurado. Configure VITE_FIREBASE_* en .env');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const sendPasswordResetEmail = async (email: string) => {
    if (!auth) throw new Error('Firebase no configurado. Configure VITE_FIREBASE_* en .env');
    await firebaseSendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    if (auth) await firebaseSignOut(auth);
    setAuthSyncError(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const getIdToken = async (): Promise<string> => {
    if (!currentUser) throw new Error('No hay usuario autenticado');
    return currentUser.getIdToken();
  };

  const refreshUserData = async () => {
    if (!auth?.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(response.data);
      setAuthSyncError(null);
    } catch {
      // Silenciar si falla; el usuario ya está logueado
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    authSyncError,
    refreshUserData,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    sendPasswordResetEmail,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
