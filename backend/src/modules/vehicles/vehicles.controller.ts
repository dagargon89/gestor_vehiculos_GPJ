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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicles.service';
import { StorageService } from '../storage/storage.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
@UseGuards(FirebaseAuthGuard)
export class VehiclesController {
  constructor(
    private vehiclesService: VehiclesService,
    private storageService: StorageService,
  ) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.vehiclesService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateVehicleDto) {
    return this.vehiclesService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateVehicleDto) {
    return this.vehiclesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) return { message: 'No file' };
    const storageFile = await this.storageService.uploadFile(file, 'vehicle', id, user.id);
    await this.vehiclesService.addPhoto(id, storageFile.firebaseUrl);
    return storageFile;
  }

  @Delete('photos/:photoId')
  deletePhoto(@Param('photoId') photoId: string) {
    return this.storageService.deleteFile(photoId);
  }
}
