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

@Controller('roles')
@UseGuards(FirebaseAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: { name: string; description?: string; permissionIds?: string[] },
  ) {
    return this.rolesService.create(body);
  }

  @Put(':id')
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
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
