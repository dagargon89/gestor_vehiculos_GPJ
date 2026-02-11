import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermission('roles', 'read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermission('roles', 'read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermission('roles', 'update')
  create(
    @Body()
    body: { name: string; description?: string; permissionIds?: string[] },
  ) {
    return this.rolesService.create(body);
  }

  @Put(':id')
  @RequirePermission('roles', 'update')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      permissionIds: string[];
    }>,
  ) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('roles', 'update')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
