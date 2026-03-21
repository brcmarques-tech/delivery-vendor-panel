/**
 * Compress and resize an image in the browser before upload.
 * Returns a base64 data URL (data:image/jpeg;base64,...).
 */
export function compressImage(
  base64DataUrl: string,
  maxWidth = 800,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64DataUrl;
  });
}
