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
import { Provider } from '../../database/entities/provider.entity';

@Controller('providers')
@UseGuards(FirebaseAuthGuard)
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Provider>) {
    return this.providersService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Provider>) {
    return this.providersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }
}
