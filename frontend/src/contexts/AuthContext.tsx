import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { auth } from '../config/firebase.config';
import apiClient from '../services/api.service';

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string | null;
  role?: { name: string };
  permissions?: { resource: string; action: string }[];
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await apiClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserData(response.data);
        } catch (err) {
          console.error('Error obteniendo datos del usuario:', err);
          setUserData(null);
        }
      } else {
        setUserData(null);
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
  }, []);

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
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const getIdToken = async (): Promise<string> => {
    if (!currentUser) throw new Error('No hay usuario autenticado');
    return currentUser.getIdToken();
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
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
