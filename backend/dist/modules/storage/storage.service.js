"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const storage_file_entity_1 = require("../../database/entities/storage-file.entity");
const firebase_admin_config_1 = require("../../config/firebase-admin.config");
const uuid_1 = require("uuid");
let StorageService = class StorageService {
    constructor(storageFileRepo) {
        this.storageFileRepo = storageFileRepo;
    }
    async uploadFile(file, entityType, entityId, userId) {
        if (!firebase_admin_config_1.firebaseStorage) {
            throw new common_1.BadRequestException('Firebase Storage no configurado');
        }
        try {
            const bucket = firebase_admin_config_1.firebaseStorage.bucket();
            const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
            const filePath = `${entityType}/${entityId}/${fileName}`;
            const fileUpload = bucket.file(filePath);
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
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
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
        }
        catch (error) {
            console.error('Error uploading file:', error);
            throw new common_1.BadRequestException('Error al subir archivo');
        }
    }
    async deleteFile(fileId) {
        const file = await this.storageFileRepo.findOne({ where: { id: fileId } });
        if (!file)
            throw new common_1.BadRequestException('Archivo no encontrado');
        if (firebase_admin_config_1.firebaseStorage) {
            try {
                const bucket = firebase_admin_config_1.firebaseStorage.bucket();
                await bucket.file(file.filePath).delete();
            }
            catch (e) {
                console.error('Error deleting from Firebase:', e);
            }
        }
        file.deletedAt = new Date();
        await this.storageFileRepo.save(file);
    }
    async getFilesByEntity(entityType, entityId) {
        return this.storageFileRepo.find({
            where: { entityType, entityId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { uploadedAt: 'DESC' },
        });
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(storage_file_entity_1.StorageFile)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StorageService);
//# sourceMappingURL=storage.service.js.map