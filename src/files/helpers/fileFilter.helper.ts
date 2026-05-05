export function fileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!file) {
    return callback(new Error('No file provided!'), false);
  }

  const fileExtension = file.mimetype.split('/')[1];
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
}
