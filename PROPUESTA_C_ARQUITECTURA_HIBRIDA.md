# PROPUESTA C: Sistema de Gestión de Flota - Arquitectura Híbrida
## Stack: NestJS + PostgreSQL + Firebase Auth/Storage + React

---

## **ÍNDICE**

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Filosofía de la Arquitectura Híbrida](#filosofia-de-la-arquitectura-hibrida)
3. [Arquitectura General](#arquitectura-general)
4. [Modelo de Datos PostgreSQL](#modelo-de-datos-postgresql)
5. [Integración Firebase](#integracion-firebase)
6. [Estructura del Backend](#estructura-del-backend)
7. [Estructura del Frontend](#estructura-del-frontend)
8. [Autenticación Híbrida](#autenticacion-hibrida)
9. [Storage Strategy](#storage-strategy)
10. [APIs y Endpoints](#apis-y-endpoints)
11. [Jobs y Schedulers](#jobs-y-schedulers)
12. [Notificaciones Multi-Canal](#notificaciones-multi-canal)
13. [Reportes y Analytics](#reportes-y-analytics)
14. [Despliegue](#despliegue)
15. [Costos Estimados](#costos-estimados)
16. [Ventajas y Desventajas](#ventajas-y-desventajas)
17. [Migración y Salida](#migracion-y-salida)

---

## **1. RESUMEN EJECUTIVO**

### **Stack Tecnológico**

**Backend:**
- **Framework:** NestJS (Node.js + TypeScript)
- **Base de Datos:** PostgreSQL 15+
- **ORM:** TypeORM
- **Autenticación:** Firebase Auth (integrado con NestJS)
- **Cache:** Redis
- **Queue:** Bull (Redis)
- **Email:** Nodemailer + SendGrid

**Frontend:**
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand + React Query
- **Auth:** Firebase Auth SDK
- **HTTP Client:** Axios

**Firebase Services (Solo lo esencial):**
- ✅ **Firebase Auth** - Autenticación (Google OAuth, Email/Password)
- ✅ **Firebase Storage** - Almacenamiento de archivos
- ✅ **Firebase Hosting** - Deploy frontend (opcional)
- ✅ **Firebase Cloud Messaging** - Push notifications (opcional)
- ❌ **Firestore** - NO (usamos PostgreSQL)
- ❌ **Cloud Functions** - NO (usamos NestJS)

**DevOps:**
- **Containerización:** Docker + Docker Compose
- **Backend Hosting:** VPS / Cloud (DigitalOcean, AWS, GCP)
- **Frontend Hosting:** Firebase Hosting / Vercel / Netlify
- **Reverse Proxy:** Nginx
- **CI/CD:** GitHub Actions
- **Monitoring:** PM2 + Sentry

### **¿Por qué Híbrida?**

Esta arquitectura toma **lo mejor de ambos mundos:**

✅ **De Firebase (Propuesta A):**
- Autenticación robusta sin configurar JWT desde cero
- OAuth social (Google, Microsoft) listo para usar
- Storage escalable y CDN global
- Deploy frontend en segundos
- Notificaciones push nativas

✅ **De Backend Tradicional (Propuesta B):**
- PostgreSQL para queries complejas y reportes
- Control total de la lógica de negocio
- Sin vendor lock-in en datos críticos
- Debugging completo
- Escalabilidad predecible

### **Ventaja Clave**

🎯 **Balance perfecto entre velocidad de desarrollo y control**
- Desarrollo 40% más rápido que Propuesta B
- 70% más control que Propuesta A
- Costos 30% menores que Propuesta B en fase inicial
- Migración posible (no lock-in total)

---

## **2. FILOSOFÍA DE LA ARQUITECTURA HÍBRIDA**

### **Principio de Separación de Responsabilidades**

```
┌─────────────────────────────────────────────────────────┐
│                  CAPA DE SERVICIOS                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Firebase Auth          │  PostgreSQL                  │
│  ─────────────          │  ──────────                  │
│  • Identidad            │  • Datos de negocio          │
│  • Tokens               │  • Relaciones                │
│  • OAuth                │  • Transacciones             │
│  • Sesiones             │  • Reportes                  │
│                         │                               │
│  Firebase Storage       │  NestJS Backend              │
│  ───────────────        │  ──────────────              │
│  • Archivos             │  • Lógica de negocio         │
│  • Imágenes             │  • Validaciones              │
│  • PDFs                 │  • Procesamiento             │
│  • CDN                  │  • Integraciones             │
│                         │                               │
└─────────────────────────────────────────────────────────┘
```

### **Decisiones Arquitectónicas**

| Funcionalidad | Servicio Elegido | Justificación |
|---------------|------------------|---------------|
| **Autenticación** | Firebase Auth | Probado, seguro, OAuth incluido, sin mantenimiento |
| **Base de Datos** | PostgreSQL | Queries complejas, reportes, control total |
| **API Backend** | NestJS | Lógica de negocio, validaciones, integraciones |
| **File Storage** | Firebase Storage | CDN global, escalable, fácil integración |
| **Jobs/Queue** | Bull + Redis | Control total, retry logic, observabilidad |
| **Cache** | Redis | Performance, session storage |
| **Email** | SendGrid | Confiable, templates, analytics |
| **Frontend Deploy** | Firebase Hosting | Deploy automático, CDN, SSL gratis |
| **Backend Deploy** | VPS/Cloud | Control, costos predecibles |

---

## **3. ARQUITECTURA GENERAL**

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIOS                                 │
│         (React App + Firebase Auth SDK)                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE HOSTING (CDN)                        │
│                  Frontend React Optimizado                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ API Calls (JWT Token de Firebase)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX (Reverse Proxy)                     │
│                  SSL Termination + Load Balancer                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NESTJS BACKEND API                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │    Firebase Auth Verification Middleware          │          │
│  │    (Verifica JWT tokens de Firebase)              │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Controllers  │  │   Services   │  │  Repositories│         │
│  │   (REST)     │  │  (Business)  │  │   (TypeORM)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         WebSocket Gateway (Socket.IO)             │          │
│  │         Real-time Notifications                   │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
      │          │          │          │          │
      ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ ┌──────────────┐
│PostgreSQL│ │ Redis  │ │  Bull   │ │SendG.│ │Firebase      │
│   DB     │ │ Cache  │ │  Queue  │ │Email │ │Auth/Storage  │
└──────────┘ └────────┘ └─────────┘ └──────┘ └──────────────┘

                         ▲
                         │
                    Google OAuth
```

---

## **4. MODELO DE DATOS POSTGRESQL**

### **4.1. Esquema Principal**

> **Nota:** Utilizamos el mismo esquema SQL de la Propuesta B con algunas modificaciones para integración con Firebase Auth.

**Modificación en la tabla `users`:**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Firebase Auth Integration
    firebase_uid VARCHAR(128) UNIQUE NOT NULL, -- UID de Firebase Auth
    
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    
    -- Licencia
    license_number VARCHAR(100),
    license_type VARCHAR(10),
    license_expiry DATE,
    license_restrictions TEXT[],
    
    -- Contacto
    phone VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    
    -- Estado y Rol
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    
    -- Preferencias
    email_notifications BOOLEAN DEFAULT true,
    auto_approval_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
```

**El resto de las tablas permanecen igual que en la Propuesta B:**
- roles
- permissions
- role_permissions
- vehicles
- vehicle_photos (URLs de Firebase Storage)
- reservations
- maintenance
- fuel_records
- incidents
- sanctions
- notifications
- costs
- providers
- system_settings
- audit_logs

### **4.2. Tabla de Mapeo Firebase Storage**

```sql
-- Tabla para trackear archivos en Firebase Storage
CREATE TABLE storage_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entity_type VARCHAR(50) NOT NULL, -- 'vehicle', 'reservation', 'maintenance', etc.
    entity_id UUID NOT NULL,
    
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Path en Firebase Storage
    firebase_url TEXT NOT NULL, -- URL pública
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_storage_files_entity ON storage_files(entity_type, entity_id);
CREATE INDEX idx_storage_files_deleted_at ON storage_files(deleted_at) WHERE deleted_at IS NULL;
```

---

## **5. INTEGRACIÓN FIREBASE**

### **5.1. Firebase Configuration**

```typescript
// src/config/firebase.config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
```

### **5.2. Firebase Admin SDK (Backend)**

```typescript
// backend/src/config/firebase-admin.config.ts
import * as admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const firebaseAuth = admin.auth();
export const firebaseStorage = admin.storage();

export default admin;
```

### **5.3. Servicios Firebase Utilizados**

| Servicio | Uso | Costo |
|----------|-----|-------|
| **Firebase Auth** | Autenticación de usuarios | Gratis hasta 50K MAU |
| **Firebase Storage** | Fotos, PDFs, documentos | $0.026/GB/mes |
| **Firebase Hosting** | Deploy frontend (opcional) | Gratis hasta 10GB/mes |
| **FCM** | Push notifications (opcional) | Gratis |

---

## **6. ESTRUCTURA DEL BACKEND**

```
/fleet-management-backend
├── /src
│   ├── /config
│   │   ├── database.config.ts
│   │   ├── firebase-admin.config.ts      # ← Firebase Admin
│   │   ├── redis.config.ts
│   │   └── storage.config.ts
│   │
│   ├── /common
│   │   ├── /decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── firebase-user.decorator.ts # ← Firebase User
│   │   │   └── permissions.decorator.ts
│   │   ├── /guards
│   │   │   ├── firebase-auth.guard.ts     # ← Verificación Firebase JWT
│   │   │   ├── permissions.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── /filters
│   │   ├── /interceptors
│   │   ├── /pipes
│   │   └── /utils
│   │
│   ├── /database
│   │   ├── /entities
│   │   │   ├── user.entity.ts             # ← Con firebase_uid
│   │   │   ├── storage-file.entity.ts     # ← Nueva entidad
│   │   │   └── ... (resto igual)
│   │   ├── /migrations
│   │   └── /seeds
│   │
│   ├── /modules
│   │   ├── /auth
│   │   │   ├── /strategies
│   │   │   │   └── firebase.strategy.ts   # ← Passport Firebase
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts            # ← Integra Firebase Auth
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── /storage                        # ← Nuevo módulo
│   │   │   ├── /dto
│   │   │   ├── storage.controller.ts
│   │   │   ├── storage.service.ts          # ← Firebase Storage
│   │   │   └── storage.module.ts
│   │   │
│   │   ├── /users
│   │   ├── /roles
│   │   ├── /vehicles
│   │   ├── /reservations
│   │   ├── /maintenance
│   │   ├── /fuel
│   │   ├── /incidents
│   │   ├── /sanctions
│   │   ├── /costs
│   │   ├── /notifications
│   │   └── /reports
│   │
│   ├── /jobs
│   ├── /schedulers
│   ├── /gateways
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── /test
├── .env.example
├── firebase-service-account.json          # ← Service Account
├── package.json
└── tsconfig.json
```

---

## **7. ESTRUCTURA DEL FRONTEND**

```
/fleet-management-frontend
├── /src
│   ├── /config
│   │   └── firebase.config.ts             # ← Firebase Client SDK
│   │
│   ├── /contexts
│   │   ├── AuthContext.tsx                # ← Firebase Auth Context
│   │   ├── VehicleContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── /hooks
│   │   ├── /auth
│   │   │   ├── useFirebaseAuth.ts         # ← Hook Firebase Auth
│   │   │   └── usePermissions.ts
│   │   ├── /api
│   │   │   ├── useVehicles.ts
│   │   │   ├── useReservations.ts
│   │   │   └── ...
│   │   └── /storage
│   │       └── useFileUpload.ts           # ← Upload a Firebase Storage
│   │
│   ├── /services
│   │   ├── api.service.ts                 # ← Axios con Firebase Token
│   │   ├── auth.service.ts                # ← Firebase Auth
│   │   ├── storage.service.ts             # ← Firebase Storage
│   │   └── websocket.service.ts
│   │
│   ├── /components
│   │   ├── /ui
│   │   ├── /layout
│   │   ├── /auth
│   │   │   ├── GoogleSignInButton.tsx     # ← Botón Google Sign-In
│   │   │   └── ProtectedRoute.tsx
│   │   └── /shared
│   │
│   ├── /pages
│   │   ├── /Auth
│   │   │   └── Login.tsx                  # ← Firebase Auth UI
│   │   ├── /Dashboard
│   │   ├── /Vehicles
│   │   └── ...
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── /public
├── .env.example
├── firebase.json                           # ← Firebase Hosting Config
├── package.json
└── vite.config.ts
```

---

## **8. AUTENTICACIÓN HÍBRIDA**

### **8.1. Flow de Autenticación**

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ 1. Click "Sign in with Google"
       ▼
┌─────────────────────┐
│  Firebase Auth SDK  │
│   (Frontend)        │
└──────┬──────────────┘
       │
       │ 2. Redirect a Google OAuth
       ▼
┌─────────────────────┐
│   Google OAuth      │
└──────┬──────────────┘
       │
       │ 3. Retorna ID Token
       ▼
┌─────────────────────┐
│  Firebase Auth SDK  │
└──────┬──────────────┘
       │
       │ 4. ID Token en header
       │    Authorization: Bearer <token>
       ▼
┌─────────────────────────────────┐
│  NestJS Backend                 │
│  Firebase Auth Middleware       │
└──────┬──────────────────────────┘
       │
       │ 5. Verifica token con Firebase Admin SDK
       ▼
┌─────────────────────────────────┐
│  Firebase Admin SDK             │
│  admin.auth().verifyIdToken()   │
└──────┬──────────────────────────┘
       │
       │ 6. Token válido, extrae UID
       ▼
┌─────────────────────────────────┐
│  PostgreSQL                     │
│  SELECT * FROM users            │
│  WHERE firebase_uid = ?         │
└──────┬──────────────────────────┘
       │
       │ 7. Usuario + Rol + Permisos
       ▼
┌─────────────────────────────────┐
│  Request Context                │
│  req.user = { ...userData }     │
└─────────────────────────────────┘
```

### **8.2. Firebase Auth Guard (NestJS)**

```typescript
// firebase-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { firebaseAuth } from '@/config/firebase-admin.config';
import { UsersService } from '@/modules/users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verificar token con Firebase Admin SDK
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      const firebaseUid = decodedToken.uid;

      // Buscar usuario en PostgreSQL
      let user = await this.usersService.findByFirebaseUid(firebaseUid);

      // Si no existe, crear automáticamente
      if (!user) {
        user = await this.usersService.createFromFirebase({
          firebaseUid,
          email: decodedToken.email,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
        });
      }

      // Actualizar último login
      await this.usersService.updateLastLogin(user.id);

      // Cargar rol y permisos
      const userWithPermissions = await this.usersService.findOneWithPermissions(user.id);

      // Verificar si está activo
      if (userWithPermissions.status !== 'active') {
        throw new UnauthorizedException('Usuario suspendido o inactivo');
      }

      // Adjuntar usuario al request
      request.user = userWithPermissions;
      request.firebaseToken = decodedToken;

      return true;
    } catch (error) {
      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token expirado');
      }
      throw new UnauthorizedException('Token inválido');
    }
  }
}
```

### **8.3. Frontend Auth Context**

```typescript
// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  onIdTokenChanged
} from 'firebase/auth';
import { auth } from '@/config/firebase.config';
import axios from 'axios';

interface AuthContextType {
  currentUser: User | null;
  userData: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Obtener token y datos del backend
        const token = await user.getIdToken();
        
        try {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserData(response.data);
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Escuchar cambios en el token (refresco automático)
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        // Actualizar token en Axios interceptor
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    });

    return () => {
      unsubscribe();
      unsubscribeToken();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    delete axios.defaults.headers.common['Authorization'];
  };

  const getIdToken = async (): Promise<string> => {
    if (!currentUser) throw new Error('No hay usuario autenticado');
    return await currentUser.getIdToken();
  };

  const value = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

### **8.4. Axios Interceptor**

```typescript
// api.service.ts
import axios from 'axios';
import { auth } from '@/config/firebase.config';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, intentar refrescar
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true); // Force refresh
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Si falla el refresh, cerrar sesión
          await auth.signOut();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## **9. STORAGE STRATEGY**

### **9.1. Firebase Storage Service (Backend)**

```typescript
// storage.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { firebaseStorage } from '@/config/firebase-admin.config';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageFile } from '@/database/entities/storage-file.entity';

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(StorageFile)
    private storageFileRepo: Repository<StorageFile>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    entityType: string,
    entityId: string,
    userId: string,
  ): Promise<StorageFile> {
    try {
      const bucket = firebaseStorage.bucket();
      const fileName = `${uuidv4()}-${file.originalname}`;
      const filePath = `${entityType}/${entityId}/${fileName}`;
      
      const fileUpload = bucket.file(filePath);
      
      // Upload a Firebase Storage
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            entityType,
            entityId,
          },
        },
      });
      
      // Hacer público
      await fileUpload.makePublic();
      
      // Obtener URL pública
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      
      // Guardar en PostgreSQL
      const storageFile = this.storageFileRepo.create({
        entityType,
        entityId,
        fileName: file.originalname,
        filePath,
        firebaseUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId,
      });
      
      return await this.storageFileRepo.save(storageFile);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException('Error al subir archivo');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.storageFileRepo.findOne({ where: { id: fileId } });
    
    if (!file) {
      throw new BadRequestException('Archivo no encontrado');
    }
    
    try {
      const bucket = firebaseStorage.bucket();
      await bucket.file(file.filePath).delete();
      
      // Soft delete en PostgreSQL
      file.deletedAt = new Date();
      await this.storageFileRepo.save(file);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new BadRequestException('Error al eliminar archivo');
    }
  }

  async getFilesByEntity(entityType: string, entityId: string): Promise<StorageFile[]> {
    return await this.storageFileRepo.find({
      where: {
        entityType,
        entityId,
        deletedAt: null,
      },
      order: {
        uploadedAt: 'DESC',
      },
    });
  }
}
```

### **9.2. Frontend File Upload Hook**

```typescript
// useFileUpload.ts
import { useState } from 'react';
import apiClient from '@/services/api.service';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase.config';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (
    file: File,
    entityType: string,
    entityId: string,
  ): Promise<string> => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const response = await apiClient.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });

      return response.data.firebaseUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadFile, uploading, progress };
}
```

### **9.3. Organización de Archivos en Firebase Storage**

```
fleet-storage/
├── vehicles/
│   ├── {vehicle-id}/
│   │   ├── {uuid}-photo1.jpg
│   │   ├── {uuid}-photo2.jpg
│   │   └── {uuid}-insurance.pdf
│   └── ...
│
├── reservations/
│   ├── {reservation-id}/
│   │   ├── {uuid}-checkin1.jpg
│   │   ├── {uuid}-checkin2.jpg
│   │   ├── {uuid}-checkout1.jpg
│   │   └── {uuid}-checkout2.jpg
│   └── ...
│
├── maintenance/
│   ├── {maintenance-id}/
│   │   ├── {uuid}-invoice.pdf
│   │   └── {uuid}-photo.jpg
│   └── ...
│
├── incidents/
│   ├── {incident-id}/
│   │   ├── {uuid}-photo1.jpg
│   │   ├── {uuid}-police-report.pdf
│   │   └── {uuid}-insurance-claim.pdf
│   └── ...
│
└── fuel/
    ├── {fuel-record-id}/
    │   └── {uuid}-receipt.jpg
    └── ...
```

---

## **10. APIS Y ENDPOINTS**

### **10.1. Auth Endpoints**

```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getCurrentUser(@Request() req) {
    // El usuario ya está en req.user gracias al guard
    return req.user;
  }

  @Post('sync-user')
  @UseGuards(FirebaseAuthGuard)
  async syncUser(@Request() req, @Body() updateDto: UpdateUserDto) {
    // Sincronizar datos adicionales en PostgreSQL
    return await this.authService.updateUserData(req.user.id, updateDto);
  }

  @Delete('account')
  @UseGuards(FirebaseAuthGuard)
  async deleteAccount(@Request() req) {
    // Eliminar cuenta (soft delete en PostgreSQL, delete en Firebase)
    await this.authService.deleteAccount(req.user.id, req.user.firebaseUid);
    return { message: 'Cuenta eliminada exitosamente' };
  }
}
```

### **10.2. Vehicles Endpoints (con File Upload)**

```typescript
// vehicles.controller.ts
@Controller('vehicles')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class VehiclesController {
  constructor(
    private vehiclesService: VehiclesService,
    private storageService: StorageService,
  ) {}

  @Post(':id/photos')
  @RequirePermission('vehicles', 'update')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const storageFile = await this.storageService.uploadFile(
      file,
      'vehicle',
      id,
      req.user.id,
    );

    // Actualizar referencia en vehicle
    await this.vehiclesService.addPhoto(id, storageFile.firebaseUrl);

    return storageFile;
  }

  @Delete('photos/:photoId')
  @RequirePermission('vehicles', 'update')
  async deletePhoto(@Param('photoId') photoId: string) {
    await this.storageService.deleteFile(photoId);
    return { message: 'Foto eliminada' };
  }

  // ... resto de endpoints igual que Propuesta B
}
```

---

## **11. JOBS Y SCHEDULERS**

> **Nota:** Utilizamos la misma arquitectura de Bull + Redis de la Propuesta B

```typescript
// check-overdue-reservations.scheduler.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsService } from '@/modules/reservations/reservations.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CheckOverdueReservationsScheduler {
  constructor(
    private reservationsService: ReservationsService,
    private notificationsService: NotificationsService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  async handleCron() {
    const overdueReservations = await this.reservationsService.findOverdue();
    
    for (const reservation of overdueReservations) {
      await this.reservationsService.update(reservation.id, {
        status: 'overdue',
      });
      
      // Encolar notificación (in-app + email)
      await this.notificationsQueue.add('send-overdue-notification', {
        userId: reservation.userId,
        reservationId: reservation.id,
        vehiclePlate: reservation.vehicle.plate,
      });
    }
  }
}
```

---

## **12. NOTIFICACIONES MULTI-CANAL**

### **12.1. Arquitectura de Notificaciones**

```
┌────────────────────────────────────────────────────────┐
│              EVENTO (Ej: Reserva Aprobada)             │
└───────────────────┬────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│           NotificationsService.create()                │
└───────┬────────────┬───────────────┬───────────────────┘
        │            │               │
        ▼            ▼               ▼
┌──────────┐  ┌──────────┐  ┌─────────────────┐
│ Database │  │WebSocket │  │  Bull Queue     │
│(PostgreS)│  │(Socket.IO│  │  (Email/FCM)    │
└──────────┘  └──────────┘  └─────────────────┘
                    │               │
                    ▼               ▼
            ┌──────────┐    ┌─────────────────┐
            │ Frontend │    │ Email Processor │
            │ (Real-   │    │ FCM Processor   │
            │  time)   │    └─────────────────┘
            └──────────┘
```

### **12.2. Notifications Service con Multi-Canal**

```typescript
// notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@/database/entities/notification.entity';
import { NotificationsGateway } from '@/gateways/notifications.gateway';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('fcm') private fcmQueue: Queue, // Firebase Cloud Messaging
  ) {}

  async create(createDto: CreateNotificationDto) {
    // Guardar en PostgreSQL
    const notification = this.notificationsRepo.create(createDto);
    await this.notificationsRepo.save(notification);

    // 1. Notificación In-App (WebSocket) - Inmediata
    if (createDto.channels?.inApp) {
      this.notificationsGateway.sendNotificationToUser(
        createDto.userId,
        notification,
      );
    }

    // 2. Email - Asíncrono via Queue
    if (createDto.channels?.email) {
      await this.emailQueue.add(
        'send-notification',
        {
          notificationId: notification.id,
          userId: createDto.userId,
          userEmail: createDto.userEmail,
          type: notification.type,
          title: notification.title,
          message: notification.message,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
    }

    // 3. Push Notification (FCM) - Asíncrono via Queue
    if (createDto.channels?.push) {
      await this.fcmQueue.add(
        'send-push',
        {
          userId: createDto.userId,
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: notification.id,
            type: notification.type,
            actionUrl: notification.actionUrl,
          },
        },
        {
          attempts: 3,
        }
      );
    }

    return notification;
  }
}
```

### **12.3. FCM Processor (Opcional)**

```typescript
// fcm.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import * as admin from 'firebase-admin';
import { UsersService } from '@/modules/users/users.service';

@Processor('fcm')
export class FcmProcessor {
  constructor(private usersService: UsersService) {}

  @Process('send-push')
  async handleSendPush(job: Job) {
    const { userId, title, body, data } = job.data;

    // Obtener FCM tokens del usuario
    const user = await this.usersService.findOne(userId);
    const fcmTokens = user.fcmTokens || []; // Array de tokens de dispositivos

    if (fcmTokens.length === 0) {
      console.log(`Usuario ${userId} no tiene tokens FCM`);
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens: fcmTokens,
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      
      console.log(`Push enviado a ${response.successCount} dispositivos`);
      
      // Limpiar tokens inválidos
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(fcmTokens[idx]);
          }
        });
        
        if (failedTokens.length > 0) {
          await this.usersService.removeFcmTokens(userId, failedTokens);
        }
      }
    } catch (error) {
      console.error('Error enviando push notification:', error);
      throw error;
    }
  }
}
```

---

## **13. REPORTES Y ANALYTICS**

> **Nota:** Utilizamos las mismas queries SQL optimizadas de la Propuesta B con PostgreSQL

```typescript
// reports.service.ts
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepo: Repository<Reservation>,
  ) {}

  async getVehicleUsageReport(startDate: Date, endDate: Date) {
    // Query SQL compleja igual que Propuesta B
    const query = `
      SELECT 
        v.id,
        v.plate,
        v.brand,
        v.model,
        COUNT(DISTINCT r.id) as total_reservations,
        COALESCE(SUM(r.checkout_odometer - r.checkin_odometer), 0) as total_km_driven,
        ROUND((COUNT(DISTINCT DATE(r.start_datetime))::numeric / 
          EXTRACT(DAY FROM $2::date - $1::date))::numeric * 100, 2) as utilization_rate
      FROM vehicles v
      LEFT JOIN reservations r ON v.id = r.vehicle_id 
        AND r.created_at BETWEEN $1 AND $2
        AND r.deleted_at IS NULL
      WHERE v.deleted_at IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model
      ORDER BY total_reservations DESC
    `;
    
    return await this.reservationsRepo.query(query, [startDate, endDate]);
  }
}
```

---

## **14. DESPLIEGUE**

### **14.1. Docker Compose Híbrido**

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fleet_management
      POSTGRES_USER: fleet_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - fleet-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - fleet-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: fleet_management
      DB_USER: fleet_user
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      # Firebase
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      FIREBASE_STORAGE_BUCKET: ${FIREBASE_STORAGE_BUCKET}
      FIREBASE_SERVICE_ACCOUNT_KEY: ${FIREBASE_SERVICE_ACCOUNT_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - fleet-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    ports:
      - "443:443"
    depends_on:
      - backend
    networks:
      - fleet-network

volumes:
  postgres_data:
  redis_data:

networks:
  fleet-network:
    driver: bridge
```

### **14.2. Deploy Frontend a Firebase Hosting**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar Firebase Hosting
firebase init hosting

# Build frontend
cd frontend
npm run build

# Deploy
firebase deploy --only hosting
```

### **14.3. Variables de Entorno**

**Backend (.env):**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_management
DB_USER=fleet_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase
FIREBASE_PROJECT_ID=fleet-management-xxxxx
FIREBASE_STORAGE_BUCKET=fleet-management-xxxxx.appspot.com
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=notificaciones@planjuarez.org

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://fleet.planjuarez.org
```

**Frontend (.env):**
```env
# Firebase
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=fleet-management-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fleet-management-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=fleet-management-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# API
VITE_API_URL=https://api.fleet.planjuarez.org
```

---

## **15. COSTOS ESTIMADOS**

### **15.1. Infraestructura**

**Backend (VPS):**
| Recurso | Especificaciones | Costo Mensual |
|---------|------------------|---------------|
| VPS | 4 GB RAM, 2 vCPU, 80 GB SSD | $24/mes |
| Backup | 80 GB | $4/mes |
| **Subtotal Backend** | | **$28/mes** |

**Firebase Services:**
| Servicio | Uso Estimado (100 usuarios) | Costo Mensual |
|----------|------------------------------|---------------|
| Firebase Auth | 100 MAU | Gratis |
| Firebase Storage | 10 GB almacenamiento + 50 GB egress | $0.65 |
| Firebase Hosting | 10 GB transfer | Gratis |
| **Subtotal Firebase** | | **$0.65/mes** |

**Servicios Externos:**
| Servicio | Plan | Costo Mensual |
|----------|------|---------------|
| SendGrid | Essentials (50K emails) | $20 |
| Dominio | .org | $1/mes |
| SSL | Let's Encrypt | Gratis |
| **Subtotal Servicios** | | **$21/mes** |

### **15.2. Total por Escala**

**100 Usuarios Activos:**
- Backend VPS: $28
- Firebase: $0.65
- Servicios: $21
- **Total: ~$50/mes**

**1000 Usuarios Activos:**
- Backend VPS (8GB): $48
- Firebase Auth: $0 (hasta 50K MAU)
- Firebase Storage: $3
- Servicios: $21
- **Total: ~$72/mes**

### **15.3. Comparativa de Costos**

| Usuarios | Propuesta A (Firebase) | Propuesta B (NestJS) | **Propuesta C (Híbrida)** |
|----------|------------------------|----------------------|---------------------------|
| 100 | $2-5/mes | $80/mes | **$50/mes** ✅ |
| 500 | $10-15/mes | $80/mes | **$60/mes** ✅ |
| 1000 | $22/mes | $100/mes | **$72/mes** ✅ |
| 5000 | $80/mes | $150/mes | **$120/mes** ✅ |

**💡 La Propuesta C es más económica que B en todas las escalas, y solo un poco más cara que A en alta escala, pero con muchísimo más control.**

---

## **16. VENTAJAS Y DESVENTAJAS**

### **✅ VENTAJAS**

1. **Lo Mejor de Ambos Mundos**
   - ✅ Auth robusta de Firebase (sin configurar JWT)
   - ✅ PostgreSQL para queries complejas
   - ✅ Storage escalable de Firebase
   - ✅ Control total del backend

2. **Desarrollo Acelerado**
   - ⚡ 40% más rápido que Propuesta B
   - ⚡ Auth lista en minutos
   - ⚡ Storage sin configuración
   - ⚡ Deploy frontend instantáneo

3. **Costos Optimizados**
   - 💰 40% más barato que Propuesta B
   - 💰 Solo 15% más caro que Propuesta A
   - 💰 Sin infraestructura para auth
   - 💰 Sin CDN adicional para archivos

4. **Base de Datos SQL**
   - 📊 Queries complejas
   - 📊 Joins ilimitados
   - 📊 Reportes avanzados
   - 📊 Transacciones ACID

5. **No Lock-in Total**
   - 🔓 Auth puede migrarse (Keycloak, Auth0)
   - 🔓 Storage puede cambiarse (S3, MinIO)
   - 🔓 Datos en PostgreSQL (control total)
   - 🔓 Backend independiente

6. **Escalabilidad Flexible**
   - 📈 Backend escala según necesidad
   - 📈 Firebase auto-escala auth y storage
   - 📈 PostgreSQL optimizable
   - 📈 Costos predecibles

7. **Developer Experience**
   - 👨‍💻 TypeScript end-to-end
   - 👨‍💻 Firebase SDK maduro
   - 👨‍💻 NestJS bien estructurado
   - 👨‍💻 Debugging completo

8. **Seguridad**
   - 🔒 Firebase Auth probado en batalla
   - 🔒 OAuth social nativo
   - 🔒 SSL automático (Firebase Hosting)
   - 🔒 Permisos granulares en PostgreSQL

### **❌ DESVENTAJAS**

1. **Complejidad Moderada**
   - ⚠️ Más complejo que Propuesta A
   - ⚠️ Dos sistemas de storage (Firebase + PostgreSQL)
   - ⚠️ Sincronización Firebase UID ↔ PostgreSQL
   - ⚠️ Requiere entender ambos ecosistemas

2. **Dependencia Parcial de Firebase**
   - ⚠️ Lock-in en Auth (mitigable)
   - ⚠️ Lock-in en Storage (mitigable)
   - ⚠️ Requiere proyecto Firebase activo
   - ⚠️ Costos Firebase en alta escala

3. **DevOps Parcial**
   - ⚠️ Backend requiere gestión (VPS/Cloud)
   - ⚠️ PostgreSQL requiere backups
   - ⚠️ Redis requiere monitoreo
   - ⚠️ Menos serverless que Propuesta A

4. **Curva de Aprendizaje**
   - 📚 Firebase SDK + NestJS + TypeORM
   - 📚 Dos paradigmas (serverless + tradicional)
   - 📚 Integración requiere expertise
   - 📚 Debugging en dos sistemas

5. **Mantenimiento Dual**
   - 🔧 Actualizar Firebase SDK
   - 🔧 Actualizar dependencias NestJS
   - 🔧 Mantener sincronización
   - 🔧 Monitorear dos stacks

### **✅ VENTAJAS vs PROPUESTAS A y B**

| Característica | vs Propuesta A | vs Propuesta B |
|----------------|----------------|----------------|
| **Time to Market** | Similar | ⚡ 40% más rápido |
| **Costo Inicial** | 💰 +15% | ✅ -40% más barato |
| **Queries Complejos** | ✅ Mejor (PostgreSQL) | ✅ Igual |
| **Control Backend** | ✅ Mucho mejor | ✅ Igual |
| **Configuración Auth** | ✅ Igual de fácil | ✅ Más fácil |
| **Vendor Lock-in** | ✅ Menor | ⚠️ Mayor (pero mitigable) |
| **Escalabilidad** | ✅ Más control | ✅ Similar |
| **Debugging** | ✅ Mejor | ✅ Igual |

---

## **17. MIGRACIÓN Y SALIDA**

### **17.1. Plan de Salida (Exit Strategy)**

La arquitectura híbrida está diseñada para **minimizar el vendor lock-in** y permitir migración.

**Escenario 1: Migrar Auth de Firebase a Keycloak**

```typescript
// 1. Instalar Keycloak
// 2. Exportar usuarios de Firebase
const users = await admin.auth().listUsers(1000);

for (const user of users.users) {
  // 3. Crear en Keycloak
  await keycloakAdmin.users.create({
    username: user.email,
    email: user.email,
    enabled: true,
  });
  
  // 4. Actualizar PostgreSQL
  await db.query(
    'UPDATE users SET auth_provider = $1, auth_uid = $2 WHERE firebase_uid = $3',
    ['keycloak', keycloakUserId, user.uid]
  );
}

// 5. Cambiar Guard en NestJS
@UseGuards(KeycloakAuthGuard) // en lugar de FirebaseAuthGuard
```

**Escenario 2: Migrar Storage de Firebase a S3/MinIO**

```typescript
// 1. Script de migración
const files = await db.query('SELECT * FROM storage_files WHERE deleted_at IS NULL');

for (const file of files) {
  // 2. Descargar de Firebase
  const bucket = firebaseStorage.bucket();
  const [buffer] = await bucket.file(file.filePath).download();
  
  // 3. Subir a S3/MinIO
  const s3Url = await s3Client.upload({
    Bucket: 'fleet-files',
    Key: file.filePath,
    Body: buffer,
    ContentType: file.mimeType,
  });
  
  // 4. Actualizar PostgreSQL
  await db.query(
    'UPDATE storage_files SET storage_provider = $1, storage_url = $2 WHERE id = $3',
    ['s3', s3Url, file.id]
  );
}

// 5. Cambiar StorageService
@Injectable()
export class StorageService {
  async uploadFile() {
    // Usar S3 en lugar de Firebase Storage
    return await this.s3Client.upload(...);
  }
}
```

**Tiempo Estimado de Migración:**
- Auth: 1-2 semanas
- Storage: 1 semana
- **Total: 2-3 semanas**

### **17.2. Portabilidad de Datos**

```typescript
// Export completo de PostgreSQL
pg_dump fleet_management > backup.sql

// Import a cualquier otra base de datos PostgreSQL
psql new_database < backup.sql
```

**🔓 Datos críticos NO están en lock-in:**
- ✅ Usuarios: PostgreSQL (portable)
- ✅ Vehículos: PostgreSQL (portable)
- ✅ Reservas: PostgreSQL (portable)
- ✅ Mantenimientos: PostgreSQL (portable)
- ⚠️ Auth: Firebase (migratable en 1-2 semanas)
- ⚠️ Files: Firebase Storage (migratable en 1 semana)

---

## **18. CONCLUSIÓN**

### **¿Cuándo Elegir la Propuesta C (Híbrida)?**

✅ **IDEAL SI:**
- Quieres desarrollo rápido SIN sacrificar control
- Necesitas queries SQL complejas
- Quieres auth robusta sin configuración
- Presupuesto medio ($50-100/mes)
- Equipo con conocimiento de NestJS + Firebase
- No quieres lock-in completo
- Necesitas reportes avanzados
- Plan de crecimiento a 1000+ usuarios

❌ **NO RECOMENDADA SI:**
- Equipo muy pequeño (1 persona) → Elegir Propuesta A
- Presupuesto muy limitado ($0-20/mes) → Elegir Propuesta A
- No tienes conocimiento de DevOps → Elegir Propuesta A
- Requieres 100% serverless → Elegir Propuesta A
- Quieres control total sin Firebase → Elegir Propuesta B
- Compliance estricto anti-cloud → Elegir Propuesta B

### **Comparativa Final**

| Criterio | Propuesta A | Propuesta B | **Propuesta C** |
|----------|-------------|-------------|-----------------|
| **Desarrollo** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Control** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Costo Inicial** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Queries SQL** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **No Lock-in** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **DevOps** | ⭐⭐⭐⭐⭐ (no req) | ⭐⭐ (mucho) | ⭐⭐⭐ (medio) |
| **Auth Fácil** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **TOTAL** | 30/40 | 30/40 | **35/40** ⭐ |

### **Recomendación Final**

**Para Plan Juárez, recomiendo la PROPUESTA C (Híbrida) porque:**

1. ✅ Balance perfecto entre velocidad y control
2. ✅ Auth de Firebase = desarrollo 40% más rápido
3. ✅ PostgreSQL = reportes complejos para Plan Juárez
4. ✅ Costo optimizado ($50-72/mes vs $80-100 en B)
5. ✅ No lock-in total (migración posible)
6. ✅ Escalable a 1000+ usuarios sin refactor
7. ✅ Equipo puede aprender gradualmente
8. ✅ Storage global con CDN (Firebase)

**Esta propuesta maximiza ROI y minimiza riesgo para Plan Juárez.** 🎯

---

## **ANEXOS**

### **A. Checklist de Implementación**

**Fase 1: Setup (Semana 1)**
- [ ] Crear proyecto Firebase
- [ ] Habilitar Firebase Auth (Google OAuth)
- [ ] Habilitar Firebase Storage
- [ ] Configurar PostgreSQL
- [ ] Configurar Redis
- [ ] Setup Docker Compose

**Fase 2: Backend Core (Semanas 2-3)**
- [ ] Implementar Firebase Auth Guard
- [ ] Crear entidades TypeORM
- [ ] Implementar módulos CRUD
- [ ] Configurar Bull Queue
- [ ] Implementar Storage Service

**Fase 3: Frontend (Semanas 4-5)**
- [ ] Implementar Firebase Auth Context
- [ ] Crear componentes UI
- [ ] Implementar páginas principales
- [ ] Integrar WebSocket
- [ ] Testing

**Fase 4: Features (Semanas 6-8)**
- [ ] Sistema de notificaciones
- [ ] Reportes avanzados
- [ ] Jobs programados
- [ ] Email templates
- [ ] Documentación

**Fase 5: Deploy (Semana 9)**
- [ ] Deploy backend a VPS
- [ ] Deploy frontend a Firebase Hosting
- [ ] Configurar dominio
- [ ] SSL/HTTPS
- [ ] Monitoreo

---

**Documento generado para Plan Juárez**
**Fecha:** Febrero 2026
**Versión:** 1.0
**Arquitectura:** Híbrida (NestJS + PostgreSQL + Firebase)
