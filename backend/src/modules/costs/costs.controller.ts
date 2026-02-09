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
import { CostsService } from './costs.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { Cost } from '../../database/entities/cost.entity';

@Controller('costs')
@UseGuards(FirebaseAuthGuard)
export class CostsController {
  constructor(private costsService: CostsService) {}

  @Get()
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('category') category?: string,
  ) {
    return this.costsService.findAll(
      vehicleId || category ? { vehicleId, category } : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.costsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Cost>) {
    return this.costsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Cost>) {
    return this.costsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.costsService.remove(id);
  }
}
