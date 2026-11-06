// Crops a chosen picture to a small square so it fits in the teacher's record.
export function resizePhoto(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(
        image,
        (image.width - side) / 2, (image.height - side) / 2, side, side,
        0, 0, size, size,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the picture'));
    };
    image.src = url;
  });
}
