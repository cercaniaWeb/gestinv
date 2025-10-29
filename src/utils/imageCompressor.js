/**
 * Compress image to reduce file size before storing
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width for the compressed image (default: 800)
 * @param {number} maxHeight - Maximum height for the compressed image (default: 600)
 * @param {number} quality - Quality of the compressed image (0-1, default: 0.7)
 * @returns {Promise<string>} - Promise that resolves to the Base64 data URL of the compressed image
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Set canvas dimensions to new size
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas with new dimensions
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to Base64 with reduced quality
      try {
        const base64String = canvas.toDataURL('image/jpeg', quality);
        resolve(base64String);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};