import type { Rect } from '../engine/types';

/**
 * Escala una imagen con Nearest Neighbor (conserva píxeles sin difuminar)
 */
export function scaleImageNearestNeighbor(
  source: CanvasImageSource,
  targetWidth: number,
  targetHeight: number,
  srcRect?: Rect
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Desactivar suavizado para preservar estilo pixel art idéntico a Java
  ctx.imageSmoothingEnabled = false;

  if (srcRect) {
    ctx.drawImage(
      source,
      srcRect.x,
      srcRect.y,
      srcRect.width,
      srcRect.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  } else {
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  }

  return canvas;
}

/**
 * Rota un canvas o imagen por un ángulo en grados (90, -90, 180, etc.)
 */
export function rotateCanvas(
  source: HTMLCanvasElement,
  angleDeg: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const rads = (angleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rads));
  const cos = Math.abs(Math.cos(rads));

  const newWidth = Math.floor(source.width * cos + source.height * sin);
  const newHeight = Math.floor(source.width * sin + source.height * cos);

  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');
  ctx.imageSmoothingEnabled = false;

  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rads);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);

  return canvas;
}

/**
 * Refleja horizontalmente (mirror / flip horizontal)
 */
export function mirrorCanvasHorizontal(
  source: HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');
  ctx.imageSmoothingEnabled = false;

  ctx.scale(-1, 1);
  ctx.drawImage(source, -source.width, 0);

  return canvas;
}
