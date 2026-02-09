import { VehiclesService } from './vehicles.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
export declare class VehiclesController {
    private vehiclesService;
    private storageService;
    constructor(vehiclesService: VehiclesService, storageService: StorageService);
    findAll(status?: string): Promise<import("../../database/entities/vehicle.entity").Vehicle[]>;
    findOne(id: string): Promise<import("../../database/entities/vehicle.entity").Vehicle>;
    create(body: CreateVehicleDto): Promise<import("../../database/entities/vehicle.entity").Vehicle>;
    update(id: string, body: UpdateVehicleDto): Promise<import("../../database/entities/vehicle.entity").Vehicle>;
    remove(id: string): Promise<void>;
    uploadPhoto(id: string, file: Express.Multer.File, user: CurrentUserPayload): Promise<import("../../database/entities/storage-file.entity").StorageFile | {
        message: string;
    }>;
    deletePhoto(photoId: string): Promise<void>;
}
