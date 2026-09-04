export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PartTransformation {
  id: string;
  name: string;
  // Recorte de la skin escalada a 1920x1080
  source: Rect;
  // Escala previa de la pieza (ancho x alto)
  scale: {
    width: number;
    height: number;
  };
  // Transformaciones
  rotateDeg?: number; // 90, -90, 180, -180
  mirrorHorizontal?: boolean;
  // Posición de pegado en el molde
  destination: {
    x: number;
    y: number;
  };
}

export interface Funko2DRenderConfig {
  baseWidth: number;
  baseHeight: number;
  parts: PartTransformation[];
}
