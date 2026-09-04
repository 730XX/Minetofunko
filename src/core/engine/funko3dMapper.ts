import { scaleImageNearestNeighbor } from '../transforms/imageUtils';

export interface Funko3DTextures {
  headFront: string;
  headBack: string;
  headLeft: string;
  headRight: string;
  headTop: string;
  headBottom: string;

  torsoFront: string;
  torsoBack: string;
  
  skinCanvas: HTMLCanvasElement;
}

/**
 * Extrae las texturas de cada cara del modelo Funko a partir de la skin de 1920x1080
 * para ser usadas como materiales en Three.js con NearestFilter.
 */
export function extractFunko3DTextures(skinImage: HTMLImageElement | HTMLCanvasElement): Funko3DTextures {
  const scaledSkin = scaleImageNearestNeighbor(skinImage, 1920, 1080);

  const getSubCanvasDataUrl = (x: number, y: number, w: number, h: number): string => {
    const subCanvas = scaleImageNearestNeighbor(scaledSkin, w, h, { x, y, width: w, height: h });
    return subCanvas.toDataURL('image/png');
  };

  return {
    headFront: getSubCanvasDataUrl(241, 136, 236, 134),
    headRight: getSubCanvasDataUrl(480, 136, 236, 134),
    headLeft: getSubCanvasDataUrl(0, 136, 236, 134),
    headTop: getSubCanvasDataUrl(241, 0, 236, 134),
    headBack: getSubCanvasDataUrl(720, 135, 236, 134),
    headBottom: getSubCanvasDataUrl(480, 0, 236, 134),

    torsoFront: getSubCanvasDataUrl(480, 337, 360, 266),
    torsoBack: getSubCanvasDataUrl(810, 337, 390, 266),

    skinCanvas: scaledSkin,
  };
}
