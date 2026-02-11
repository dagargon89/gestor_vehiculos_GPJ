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
import { ProvidersService } from './providers.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Provider } from '../../database/entities/provider.entity';

@Controller('providers')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @RequirePermission('providers', 'read')
  findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @RequirePermission('providers', 'read')
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Post()
  @RequirePermission('providers', 'create')
  create(@Body() body: Partial<Provider>) {
    return this.providersService.create(body);
  }

  @Put(':id')
  @RequirePermission('providers', 'update')
  update(@Param('id') id: string, @Body() body: Partial<Provider>) {
    return this.providersService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('providers', 'delete')
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }
}
