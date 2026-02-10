"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseStorage = exports.firebaseAuth = void 0;
const admin = require("firebase-admin");
let serviceAccount = null;
try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            if (typeof parsed.client_email === 'string' &&
                typeof parsed.project_id === 'string' &&
                parsed.private_key) {
                serviceAccount = parsed;
            }
            else {
                console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY inválido: faltan client_email, project_id o private_key.');
            }
        }
        else {
            console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY está vacío o no es un objeto válido.');
        }
    }
}
catch {
    console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY inválido o no definido. Revise que sea JSON válido en una sola línea.');
}
if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}
exports.firebaseAuth = serviceAccount ? admin.auth() : null;
exports.firebaseStorage = serviceAccount ? admin.storage() : null;
exports.default = admin;
//# sourceMappingURL=firebase-admin.config.js.map