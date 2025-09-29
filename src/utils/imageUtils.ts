import Compressor from 'compressorjs';

export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      convertSize: 1000000, // Only process files larger than 1MB
      success(result) {
        resolve(new File([result], file.name, { 
          type: result.type,
          lastModified: Date.now()
        }));
      },
      error(err) {
        console.error('Image compression failed:', err);
        resolve(file); // Fallback to original if compression fails
      },
    });
  });
};

export const validateImageFile = (file: File): { valid: boolean; message?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: 'Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF).' 
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`
    };
  }

  return { valid: true };
};
