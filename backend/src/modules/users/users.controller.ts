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
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @Get()
  @RequirePermission('users', 'read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission('users', 'read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermission('users', 'create')
  create(@Body() body: Record<string, unknown>) {
    return this.usersService.createFromFirebase(
      body as unknown as Parameters<typeof this.usersService.createFromFirebase>[0],
    );
  }

  @Put(':id')
  @RequirePermission('users', 'update')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.usersService.update(id, body as Partial<import('../../database/entities/user.entity').User>);
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
