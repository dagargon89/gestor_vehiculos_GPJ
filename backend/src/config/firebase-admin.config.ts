import * as admin from 'firebase-admin';

/**
 * FIREBASE_SERVICE_ACCOUNT_KEY debe ser el JSON del Service Account en una sola línea (minificado)
 * para evitar problemas con saltos de línea en .env.
 */
let serviceAccount: admin.ServiceAccount | null = null;

try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw && raw.trim()) {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      if (
        typeof parsed.client_email === 'string' &&
        typeof parsed.project_id === 'string' &&
        parsed.private_key
      ) {
        serviceAccount = parsed as admin.ServiceAccount;
      } else {
        console.warn(
          '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY inválido: faltan client_email, project_id o private_key.',
        );
      }
    } else {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY está vacío o no es un objeto válido.');
    }
  }
} catch {
  console.warn(
    '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY inválido o no definido. Revise que sea JSON válido en una sola línea.',
  );
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const firebaseAuth = serviceAccount ? admin.auth() : null;
export const firebaseStorage = serviceAccount ? admin.storage() : null;
export default admin;
