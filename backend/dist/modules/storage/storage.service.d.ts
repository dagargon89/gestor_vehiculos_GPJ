import { Repository } from 'typeorm';
import { StorageFile } from '../../database/entities/storage-file.entity';
export declare class StorageService {
    private storageFileRepo;
    constructor(storageFileRepo: Repository<StorageFile>);
    uploadFile(file: Express.Multer.File, entityType: string, entityId: string, userId: string): Promise<StorageFile>;
    deleteFile(fileId: string): Promise<void>;
    getFilesByEntity(entityType: string, entityId: string): Promise<StorageFile[]>;
    findOne(id: string): Promise<StorageFile>;
}
