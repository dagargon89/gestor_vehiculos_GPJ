import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
export interface CreateFromFirebaseDto {
    firebaseUid: string;
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
}
export declare class UsersService {
    private userRepo;
    private roleRepo;
    constructor(userRepo: Repository<User>, roleRepo: Repository<Role>);
    findByFirebaseUid(firebaseUid: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findOneWithPermissions(id: string): Promise<User & {
        permissions?: {
            resource: string;
            action: string;
        }[];
    }>;
    createFromFirebase(dto: CreateFromFirebaseDto): Promise<User>;
    updateLastLogin(id: string): Promise<void>;
    updateUserData(id: string, data: Partial<User>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    remove(id: string): Promise<void>;
}
