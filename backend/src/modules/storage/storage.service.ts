import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { StorageFile } from '../../database/entities/storage-file.entity';
import { firebaseStorage } from '../../config/firebase-admin.config';
import { v4 as uuidv4 } from 'uuid';

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
    if (!firebaseStorage) {
      throw new BadRequestException('Firebase Storage no configurado');
    }
    try {
      const bucket = firebaseStorage.bucket();
      const fileName = `${uuidv4()}-${file.originalname}`;
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
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException('Error al subir archivo');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.storageFileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new BadRequestException('Archivo no encontrado');
    if (firebaseStorage) {
      try {
        const bucket = firebaseStorage.bucket();
        await bucket.file(file.filePath).delete();
      } catch (e) {
        console.error('Error deleting from Firebase:', e);
      }
    }
    file.deletedAt = new Date();
    await this.storageFileRepo.save(file);
  }

  async getFilesByEntity(entityType: string, entityId: string): Promise<StorageFile[]> {
    return this.storageFileRepo.find({
      where: { entityType, entityId, deletedAt: IsNull() },
      order: { uploadedAt: 'DESC' },
    });
  }
}
