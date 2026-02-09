import { SetMetadata } from '@nestjs/common';
import { REQUIRE_PERMISSION_KEY } from '../guards/permissions.guard';

export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { resource, action });
