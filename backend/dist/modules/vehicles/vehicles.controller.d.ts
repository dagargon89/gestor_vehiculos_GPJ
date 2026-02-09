import { VehiclesService } from './vehicles.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class VehiclesController {
    private vehiclesService;
    private storageService;
    constructor(vehiclesService: VehiclesService, storageService: StorageService);
    findAll(): Promise<import("../../database/entities/vehicle.entity").Vehicle[]>;
    findOne(id: string): Promise<import("../../database/entities/vehicle.entity").Vehicle>;
    create(body: Record<string, unknown>): Promise<import("../../database/entities/vehicle.entity").Vehicle>;
    update(id: string, body: Record<string, unknown>): Promise<import("../../database/entities/vehicle.entity").Vehicle>;
    remove(id: string): Promise<void>;
    uploadPhoto(id: string, file: Express.Multer.File, user: CurrentUserPayload): Promise<import("../../database/entities/storage-file.entity").StorageFile | {
        message: string;
    }>;
    deletePhoto(photoId: string): Promise<void>;
}
