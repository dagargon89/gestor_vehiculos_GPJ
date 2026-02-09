import { User } from './user.entity';
export declare class StorageFile {
    id: string;
    entityType: string;
    entityId: string;
    fileName: string;
    filePath: string;
    firebaseUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploader: User;
    uploadedAt: Date;
    deletedAt: Date;
}
