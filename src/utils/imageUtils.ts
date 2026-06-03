/**
 * Resize and re-encode an image with Canvas; returns the compressed base64 data.
 */
export const compressImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Tidak dapat membuat konteks Canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(file.type || "image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error("Gagal memuat gambar"));
      };
    };
    reader.onerror = () => {
      reject(new Error("Gagal membaca file"));
    };
  });
};

/**
 * Estimate the actual size in bytes of base64 image data.
 * base64 encodes 3 bytes per 4 chars, so size is roughly length * 3/4.
 */
export const estimateBase64Size = (base64String: string): number => {
  const base64Data = base64String.split(",")[1] || base64String;
  return Math.round((base64Data.length * 3) / 4);
};
