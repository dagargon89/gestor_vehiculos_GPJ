import { Repository } from 'typeorm';
import { Provider } from '../../database/entities/provider.entity';
export declare class ProvidersService {
    private repo;
    constructor(repo: Repository<Provider>);
    findAll(): Promise<Provider[]>;
    findOne(id: string): Promise<Provider>;
    create(data: Partial<Provider>): Promise<Provider>;
    update(id: string, data: Partial<Provider>): Promise<Provider>;
    remove(id: string): Promise<void>;
}
