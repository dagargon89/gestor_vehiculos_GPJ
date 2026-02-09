import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('storage')
@UseGuards(FirebaseAuthGuard)
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { entityType?: string; entityId?: string },
  ) {
    if (!file) throw new BadRequestException('No se envió archivo');
    const entityType = body.entityType || 'misc';
    const entityId = body.entityId || 'misc';
    const result = await this.storageService.uploadFile(
      file,
      entityType,
      entityId,
      user.id,
    );
    return { firebaseUrl: result.firebaseUrl, id: result.id };
  }

  @Get(':entityType/:entityId')
  getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.storageService.getFilesByEntity(entityType, entityId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.storageService.deleteFile(id);
  }
}
