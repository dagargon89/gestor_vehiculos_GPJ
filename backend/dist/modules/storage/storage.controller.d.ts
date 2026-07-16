import type { Response } from 'express';
import { StorageService } from './storage.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class StorageController {
    private storageService;
    constructor(storageService: StorageService);
    upload(file: Express.Multer.File, user: CurrentUserPayload, body: {
        entityType?: string;
        entityId?: string;
    }): Promise<{
        firebaseUrl: string;
        id: string;
    }>;
    proxyImage(url: string, res: Response): Promise<void>;
    getOne(id: string): Promise<import("../../database/entities/storage-file.entity").StorageFile>;
    getByEntity(entityType: string, entityId: string): Promise<import("../../database/entities/storage-file.entity").StorageFile[]>;
    delete(id: string): Promise<void>;
}
