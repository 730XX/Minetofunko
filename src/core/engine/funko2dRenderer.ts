import { FUNKO_GROOVER_CONFIG } from '../config/coordinates2d';
import type { PartTransformation } from './types';
import {
  scaleImageNearestNeighbor,
  rotateCanvas,
  mirrorCanvasHorizontal,
} from '../transforms/imageUtils';

export interface RenderFunkoOptions {
  skinImage: HTMLImageElement | ImageBitmap | HTMLCanvasElement;
  templateImage: HTMLImageElement | ImageBitmap | HTMLCanvasElement;
  parts?: PartTransformation[];
  overlayParts?: PartTransformation[];
  preScaledSkin?: HTMLCanvasElement;
  showOverlay?: boolean;
}

/**
 * Renderiza el Funko 2D completo con soporte para capa base y capa de relieve 3D independientes
 */
export function renderFunko2D(options: RenderFunkoOptions): HTMLCanvasElement {
  const {
    skinImage,
    templateImage,
    parts = FUNKO_GROOVER_CONFIG.parts,
    overlayParts,
    preScaledSkin,
    showOverlay = true,
  } = options;

  // 1. Escalar la skin a 1920x1080 con Nearest Neighbor tal como en Java (o reutilizar la ya escalada)
  const scaledSkin = preScaledSkin || scaleImageNearestNeighbor(skinImage, 1920, 1080);

  // 2. Preparar el canvas destino con el tamaño del molde base
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = templateImage.width;
  outputCanvas.height = templateImage.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D para renderizar el Funko');

  ctx.imageSmoothingEnabled = false;

  // 3. Dibujar primero el molde base
  ctx.drawImage(templateImage, 0, 0);

  // 4. Procesar piezas base con sus coordenadas y transformaciones exactas
  for (const part of parts) {
    let pieceCanvas = scaleImageNearestNeighbor(
      scaledSkin,
      part.scale.width,
      part.scale.height,
      part.source
    );

    if (part.rotateDeg) {
      pieceCanvas = rotateCanvas(pieceCanvas, part.rotateDeg);
    }

    if (part.mirrorHorizontal) {
      pieceCanvas = mirrorCanvasHorizontal(pieceCanvas);
    }

    ctx.drawImage(pieceCanvas, part.destination.x, part.destination.y);
  }

  // 5. Si está habilitada la capa 3D / relieve, procesar las piezas de la segunda capa con sus propias transformaciones
  if (showOverlay && overlayParts && overlayParts.length > 0) {
    for (const op of overlayParts) {
      let overlayCanvas = scaleImageNearestNeighbor(
        scaledSkin,
        op.scale.width,
        op.scale.height,
        op.source
      );

      if (op.rotateDeg) {
        overlayCanvas = rotateCanvas(overlayCanvas, op.rotateDeg);
      }

      if (op.mirrorHorizontal) {
        overlayCanvas = mirrorCanvasHorizontal(overlayCanvas);
      }

      ctx.drawImage(overlayCanvas, op.destination.x, op.destination.y);
    }
  }

  return outputCanvas;
}
