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

/**
 * Detecta si una skin es de formato legacy (64x32) y la normaliza a formato moderno (64x64)
 * replicando el algoritmo estándar de Minecraft (espejado de brazo y pierna derechos hacia los izquierdos).
 */
export function normalizeSkinCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number
): HTMLCanvasElement {
  // Si ya es cuadrada (ej. 64x64, 128x128), no es legacy
  if (sourceHeight === sourceWidth) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0);
    }
    return canvas;
  }

  // Es legacy (relación 2:1, ej. 64x32 o 128x64)
  const targetWidth = sourceWidth;
  const targetHeight = sourceWidth; // Convertir a cuadrada (64x64)
  const s = sourceWidth / 64; // Factor de escala para soportar texturas HD

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  ctx.imageSmoothingEnabled = false;

  // 1. Dibujar la mitad superior original (cabeza, torso, brazo der, pierna der)
  ctx.drawImage(source, 0, 0);

  // Helper para copiar y espejar horizontalmente una sección
  const copyMirrored = (
    srcX: number,
    srcY: number,
    w: number,
    h: number,
    destX: number,
    destY: number
  ) => {
    ctx.save();
    ctx.translate(destX + w, destY);
    ctx.scale(-1, 1);
    ctx.drawImage(source, srcX, srcY, w, h, 0, 0, w, h);
    ctx.restore();
  };

  // 2. Espejar Pierna Derecha -> Pierna Izquierda
  // Top (muslo)
  copyMirrored(4 * s, 16 * s, 4 * s, 4 * s, 20 * s, 48 * s);
  // Bottom (pie)
  copyMirrored(8 * s, 16 * s, 4 * s, 4 * s, 24 * s, 48 * s);
  // Lado Exterior (Derecho -> Izquierdo)
  copyMirrored(0 * s, 20 * s, 4 * s, 12 * s, 24 * s, 52 * s);
  // Frente
  copyMirrored(4 * s, 20 * s, 4 * s, 12 * s, 20 * s, 52 * s);
  // Lado Interior (Izquierdo -> Derecho)
  copyMirrored(8 * s, 20 * s, 4 * s, 12 * s, 16 * s, 52 * s);
  // Atrás
  copyMirrored(12 * s, 20 * s, 4 * s, 12 * s, 28 * s, 52 * s);

  // 3. Espejar Brazo Derecho -> Brazo Izquierdo
  // Top (hombro)
  copyMirrored(44 * s, 16 * s, 4 * s, 4 * s, 36 * s, 48 * s);
  // Bottom (mano)
  copyMirrored(48 * s, 16 * s, 4 * s, 4 * s, 40 * s, 48 * s);
  // Lado Exterior (Derecho -> Izquierdo)
  copyMirrored(40 * s, 20 * s, 4 * s, 12 * s, 40 * s, 52 * s);
  // Frente
  copyMirrored(44 * s, 20 * s, 4 * s, 12 * s, 36 * s, 52 * s);
  // Lado Interior (Izquierdo -> Derecho)
  copyMirrored(48 * s, 20 * s, 4 * s, 12 * s, 32 * s, 52 * s);
  // Atrás
  copyMirrored(52 * s, 20 * s, 4 * s, 12 * s, 44 * s, 52 * s);

  return canvas;
}
