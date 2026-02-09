"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseStorage = exports.firebaseAuth = void 0;
const admin = require("firebase-admin");
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;
if (serviceAccount && Object.keys(serviceAccount).length > 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}
exports.firebaseAuth = serviceAccount ? admin.auth() : null;
exports.firebaseStorage = serviceAccount ? admin.storage() : null;
exports.default = admin;
//# sourceMappingURL=firebase-admin.config.js.map