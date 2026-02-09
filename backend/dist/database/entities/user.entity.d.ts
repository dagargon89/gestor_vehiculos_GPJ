import { Role } from './role.entity';
export declare class User {
    id: string;
    firebaseUid: string;
    email: string;
    displayName: string;
    photoUrl: string;
    employeeId: string;
    department: string;
    licenseNumber: string;
    licenseType: string;
    licenseExpiry: Date;
    licenseRestrictions: string[];
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    status: string;
    roleId: string;
    role: Role;
    emailNotifications: boolean;
    autoApprovalEnabled: boolean;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
