export interface CurrentUserPayload {
    id: string;
    firebaseUid: string;
    email: string;
    displayName?: string;
    roleId?: string;
    role?: {
        name: string;
    };
    status: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof CurrentUserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
