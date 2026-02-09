import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  roleId?: string;
  role?: { name: string };
  status: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext): CurrentUserPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (data && user) return user[data];
    return user;
  },
);
