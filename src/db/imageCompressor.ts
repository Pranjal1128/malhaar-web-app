/**
 * Helper to compress local images in-browser using a hidden canvas.
 * Reduces Base64 size from 4MB-10MB down to 20KB-50KB.
 */
export function compressImageBase64(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate proportions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Failure fallback: return uncompressed base64
          resolve(event.target?.result as string);
          return;
        }

        try {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch (err) {
          console.error("Canvas draw failed, falling back:", err);
          resolve(event.target?.result as string);
        }
      };

      img.onerror = () => {
        resolve(event.target?.result as string);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      // FileReader error fallback
      resolve("");
    };

    reader.readAsDataURL(file);
  });
}
