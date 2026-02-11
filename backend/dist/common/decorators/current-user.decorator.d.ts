export interface CurrentUserPayload {
    id: string;
    firebaseUid: string;
    email: string;
    displayName?: string;
    photoUrl?: string | null;
    roleId?: string;
    role?: {
        id?: string;
        name: string;
    };
    status: string;
    permissions?: {
        resource: string;
        action: string;
    }[];
}
export declare const CurrentUser: (...dataOrPipes: (keyof CurrentUserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
