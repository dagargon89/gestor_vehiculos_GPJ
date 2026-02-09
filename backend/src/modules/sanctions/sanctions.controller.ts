import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SanctionsService } from './sanctions.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { Sanction } from '../../database/entities/sanction.entity';

@Controller('sanctions')
@UseGuards(FirebaseAuthGuard)
export class SanctionsController {
  constructor(private sanctionsService: SanctionsService) {}

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.sanctionsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sanctionsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Sanction>) {
    return this.sanctionsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Sanction>) {
    return this.sanctionsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sanctionsService.remove(id);
  }
}
