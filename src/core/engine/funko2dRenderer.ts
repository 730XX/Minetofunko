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
  preScaledSkin?: HTMLCanvasElement;
}

/**
 * Renderiza el Funko 2D completo replicando exactamente la lógica de ProyectoFunko.java
 */
export function renderFunko2D(options: RenderFunkoOptions): HTMLCanvasElement {
  const { skinImage, templateImage, parts = FUNKO_GROOVER_CONFIG.parts, preScaledSkin } = options;

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

  // 4. Procesar cada pieza con sus coordenadas y transformaciones exactas
  for (const part of parts) {
    // Recorte de la skin escalada a 1920x1080 y escalado a la medida de la pieza

    let pieceCanvas = scaleImageNearestNeighbor(
      scaledSkin,
      part.scale.width,
      part.scale.height,
      part.source
    );

    // Rotación si aplica
    if (part.rotateDeg) {
      pieceCanvas = rotateCanvas(pieceCanvas, part.rotateDeg);
    }

    // Espejado horizontal si aplica
    if (part.mirrorHorizontal) {
      pieceCanvas = mirrorCanvasHorizontal(pieceCanvas);
    }

    // Dibujar en la posición exacta del molde
    ctx.drawImage(pieceCanvas, part.destination.x, part.destination.y);
  }

  return outputCanvas;
}
