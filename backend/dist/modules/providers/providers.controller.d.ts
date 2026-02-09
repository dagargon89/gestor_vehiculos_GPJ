import { ProvidersService } from './providers.service';
import { Provider } from '../../database/entities/provider.entity';
export declare class ProvidersController {
    private providersService;
    constructor(providersService: ProvidersService);
    findAll(): Promise<Provider[]>;
    findOne(id: string): Promise<Provider>;
    create(body: Partial<Provider>): Promise<Provider>;
    update(id: string, body: Partial<Provider>): Promise<Provider>;
    remove(id: string): Promise<void>;
}
