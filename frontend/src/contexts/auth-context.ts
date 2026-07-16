import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface UserData {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string | null;
  role?: { name: string };
  permissions?: { resource: string; action: string }[];
}

export interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  /** Mensaje cuando falla la sincronización con el backend (ej. backend no está en marcha). */
  authSyncError: string | null;
  /** Refresca los datos del usuario desde el backend (útil tras actualizar perfil o foto). */
  refreshUserData: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  getIdToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
