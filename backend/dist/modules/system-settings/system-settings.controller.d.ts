import { SystemSettingsService } from './system-settings.service';
export declare class SystemSettingsController {
    private systemSettingsService;
    constructor(systemSettingsService: SystemSettingsService);
    findAll(): Promise<import("../../database/entities/system-setting.entity").SystemSetting[]>;
    findOne(id: string): Promise<import("../../database/entities/system-setting.entity").SystemSetting>;
    create(body: {
        key: string;
        value: string;
    }): Promise<import("../../database/entities/system-setting.entity").SystemSetting>;
    update(id: string, body: Partial<{
        key: string;
        value: string;
    }>): Promise<import("../../database/entities/system-setting.entity").SystemSetting>;
    remove(id: string): Promise<void>;
}
