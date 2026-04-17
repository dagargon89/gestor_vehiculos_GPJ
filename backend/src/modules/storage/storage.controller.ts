import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('storage')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
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

  @Get('proxy')
  async proxyImage(
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    if (!url) throw new BadRequestException('Falta parámetro url');
    const { buffer, contentType } = await this.storageService.fetchRemoteImage(decodeURIComponent(url));
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Get('record/:id')
  @RequirePermission('storage_files', 'read')
  getOne(@Param('id') id: string) {
    return this.storageService.findOne(id);
  }

  @Get(':entityType/:entityId')
  @RequirePermission('storage_files', 'read')
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
