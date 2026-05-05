import {
  BadRequestException,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { FilesService } from './files.service';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { fileFilter, fileNamer } from './helpers';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('product')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: fileFilter,
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
      storage: diskStorage({
        destination: './static/products', // Specify the destination directory for uploaded files
        filename: fileNamer,
      }),
    }),
  )
  uploadProductImg(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is not an image');
    }
    return {
      fileName: file.originalname,
    };
  }
}
