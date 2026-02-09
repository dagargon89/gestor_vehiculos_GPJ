import { Repository } from 'typeorm';
import { SystemSetting } from '../../database/entities/system-setting.entity';
export declare class SystemSettingsService {
    private repo;
    constructor(repo: Repository<SystemSetting>);
    findAll(): Promise<SystemSetting[]>;
    findOne(id: string): Promise<SystemSetting>;
    findByKey(key: string): Promise<SystemSetting | null>;
    create(data: {
        key: string;
        value: string;
    }): Promise<SystemSetting>;
    update(id: string, data: Partial<{
        key: string;
        value: string;
    }>): Promise<SystemSetting>;
    remove(id: string): Promise<void>;
}
