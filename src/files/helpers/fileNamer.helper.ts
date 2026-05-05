import { v4 as uuid } from 'uuid';

export function fileNamer(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, fileName: string) => void,
): void {
  if (!file) {
    return callback(new Error('No file provided!'), '');
  }

  const fileExtension = file.mimetype.split('/')[1];

  if (!fileExtension) {
    return callback(new Error('Only image files are allowed!'), '');
  }

  const fileName = `${uuid()}.${fileExtension}`;
  callback(null, fileName);
}
