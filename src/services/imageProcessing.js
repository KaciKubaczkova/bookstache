/**
 * Preprocesses a video frame region for OCR to maximize recognition accuracy.
 * Performs grayscale conversion, contrast stretching, and optional thresholding.
 */
export function preprocessCanvasForOcr(sourceCanvas, targetWidth, targetHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Draw scaled source onto target canvas
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const d = imgData.data;

  // Find min and max luminance for contrast stretching
  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < d.length; i += 4) {
    // Luminance standard
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = maxLum - minLum || 1;

  // Apply contrast stretch and threshold
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const stretched = ((lum - minLum) / range) * 255;

    // High contrast binarization-like smoothing
    const val = stretched > 128 ? Math.min(255, stretched * 1.15) : Math.max(0, stretched * 0.85);

    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Crops the video feed to the target guide box coordinates (relative 0..1).
 */
export function cropVideoTarget(video, relBox = { x: 0.1, y: 0.35, width: 0.8, height: 0.3 }) {
  if (!video || !video.videoWidth || !video.videoHeight) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  const cropX = Math.max(0, Math.floor(vw * relBox.x));
  const cropY = Math.max(0, Math.floor(vh * relBox.y));
  const cropW = Math.min(vw - cropX, Math.floor(vw * relBox.width));
  const cropH = Math.min(vh - cropY, Math.floor(vh * relBox.height));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const ctx = cropCanvas.getContext('2d', { willReadFrequently: true });

  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Scale up if the crop is small, for better OCR character size (ideally 30-35px height per char)
  const targetScale = Math.max(1, Math.min(2.5, 600 / cropW));
  const targetW = Math.round(cropW * targetScale);
  const targetH = Math.round(cropH * targetScale);

  return preprocessCanvasForOcr(cropCanvas, targetW, targetH);
}
