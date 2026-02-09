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
import { PermissionsService } from './permissions.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('permissions')
@UseGuards(FirebaseAuthGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Post()
  create(@Body() body: { resource: string; action: string }) {
    return this.permissionsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ resource: string; action: string }>,
  ) {
    return this.permissionsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
