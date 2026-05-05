import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { FilesService } from './files.service';
import type { Express, Response } from 'express';
import { diskStorage } from 'multer';
import { fileFilter, fileNamer } from './helpers';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @Get('product/:imageName')
  serveProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string,
  ) {
    const imagePath = this.filesService.getStaticProductImage(imageName);
    res.sendFile(imagePath);
  }

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
      secureUrl: `${this.configService.get('HOST_API')}/files/product/${file.filename}`,
    };
  }
}
