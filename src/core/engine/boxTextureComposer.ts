import type { BoxCustomizationConfig } from '../../components/box-wizard/types';

/**
 * Cache de imágenes de plantillas para evitar recargas constantes
 */
const imageCache = new Map<string, HTMLImageElement>();

export function loadTemplateImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (err) => {
      console.warn(`[boxTextureComposer] Error loading template: ${url}`, err);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Coordenadas exactas de recorte medidas sobre las hojas reales a escala 1:1
 * hoja1-frente-atras.png (3331 x 2303)
 * hoja2-laterales.png (3331 x 2303)
 * hoja3-superior-inferior.png (2715 x 1675)
 */
export const TEMPLATE_CROPS = {
  // Hoja 1: Cara Frontal (lado derecho con avatar troquelado y barras de piedra)
  front: { file: '/templates/funkobox/hoja1-frente-atras.png', sx: 1621, sy: 335, sw: 1535, sh: 1653 },
  // Hoja 1: Cara Trasera (lado izquierdo con logo WL Studios y código QR)
  back: { file: '/templates/funkobox/hoja1-frente-atras.png', sx: 86, sy: 335, sw: 1535, sh: 1653 },
  // Hoja 2: Lateral Derecho (+X: lateral con continuación de acetato y franja de nombre)
  right: { file: '/templates/funkobox/hoja2-laterales.png', sx: 258, sy: 315, sw: 1388, sh: 1696 },
  // Hoja 2: Lateral Izquierdo (-X: pared de piedra con gran círculo blanco para número)
  left: { file: '/templates/funkobox/hoja2-laterales.png', sx: 1646, sy: 315, sw: 1388, sh: 1696 },
  // Hoja 3: Tapa Superior (+Y: bloque superior de piedra)
  top: { file: '/templates/funkobox/hoja3-superior-inferior.png', sx: 1000, sy: 30, sw: 1495, sh: 1225 },
};

/**
 * Aplica la fuente seleccionada por el usuario al contexto 2D
 */
function applyFontFamily(ctx: CanvasRenderingContext2D, size: number, weight: number | string, family: string) {
  if (family === 'mono') {
    ctx.font = `${weight} ${size}px "JetBrains Mono", monospace`;
  } else if (family === 'comic') {
    ctx.font = `italic ${weight} ${size}px "Comic Sans MS", cursive, sans-serif`;
  } else if (family === 'sans') {
    ctx.font = `${weight} ${size}px Inter, system-ui, -apple-system, sans-serif`;
  } else {
    ctx.font = `${weight} ${size}px Impact, system-ui, -apple-system, sans-serif`;
  }
}

/**
 * Genera una ilustración 2D en estilo Funkito / Chibi a partir de la skin de Minecraft (64x64)
 * Proporciones: Cabeza grande cúbica con su segunda capa de pelo, torso y brazos compactos.
 */
export function renderChibiCoverAvatar(skinCanvas: HTMLCanvasElement | null): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  if (!skinCanvas) {
    // Si no hay skin cargada, creamos un fallback visual limpio
    ctx.fillStyle = '#b45309';
    ctx.fillRect(40, 40, 360, 360);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(80, 400, 240, 240);
    return canvas;
  }

  const is64x32 = skinCanvas.height === 32;

  const headSize = 360;
  const headX = 10;
  const headY = 10;

  const torsoW = 190;
  const torsoH = 220;
  const torsoX = 50;
  const torsoY = headY + headSize - 30;

  const armW = 75;
  const armH = 200;
  const armX = torsoX + torsoW - 10;
  const armY = torsoY + 10;

  const legW = 85;
  const legH = 170;
  const legY = torsoY + torsoH - 20;

  const drawPart = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => {
    ctx.drawImage(skinCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  // 1. Piernas (base)
  drawPart(4, 20, 4, 12, torsoX + 10, legY, legW, legH);
  if (!is64x32) {
    drawPart(20, 52, 4, 12, torsoX + 95, legY, legW, legH);
  } else {
    drawPart(4, 20, 4, 12, torsoX + 95, legY, legW, legH);
  }

  // 2. Torso (base + segunda capa chaqueta)
  drawPart(20, 20, 8, 12, torsoX, torsoY, torsoW, torsoH);
  if (!is64x32) {
    drawPart(20, 36, 8, 12, torsoX, torsoY, torsoW, torsoH);
  }

  // 3. Brazo derecho que asoma (base + manga)
  if (!is64x32) {
    drawPart(36, 52, 4, 12, armX, armY, armW, armH);
    drawPart(52, 52, 4, 12, armX, armY, armW, armH);
  } else {
    drawPart(44, 20, 4, 12, armX, armY, armW, armH);
  }

  // 4. Cabeza cúbica Funko (cara base + segunda capa de pelo/gorro con transparencias)
  drawPart(8, 8, 8, 8, headX, headY, headSize, headSize);
  drawPart(40, 8, 8, 8, headX, headY, headSize, headSize);

  return canvas;
}

/**
 * Genera el borde blanco sólido (sticker die-cut / borde de troquel)
 * alrededor del avatar para que quede idéntico al molde físico y a las cajas oficiales.
 */
export function createStickerBorder(sourceCanvas: HTMLCanvasElement, borderWidth = 18): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width + borderWidth * 2;
  canvas.height = sourceCanvas.height + borderWidth * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  // Creamos una máscara de silueta blanca del avatar
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = sourceCanvas.width;
  maskCanvas.height = sourceCanvas.height;
  const mctx = maskCanvas.getContext('2d');
  if (mctx) {
    mctx.drawImage(sourceCanvas, 0, 0);
    mctx.globalCompositeOperation = 'source-in';
    mctx.fillStyle = '#ffffff';
    mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  }

  // Estampar la silueta blanca en 24 direcciones para crear un borde sólido y redondeado perfecto
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const ox = Math.round(Math.cos(angle) * borderWidth) + borderWidth;
    const oy = Math.round(Math.sin(angle) * borderWidth) + borderWidth;
    ctx.drawImage(maskCanvas, ox, oy);
  }
  // Pasada intermedia para rellenar esquinas
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const ox = Math.round(Math.cos(angle) * (borderWidth * 0.5)) + borderWidth;
    const oy = Math.round(Math.sin(angle) * (borderWidth * 0.5)) + borderWidth;
    ctx.drawImage(maskCanvas, ox, oy);
  }

  // Dibujar el avatar original a todo color sobre la base blanca
  ctx.drawImage(sourceCanvas, borderWidth, borderWidth);

  return canvas;
}

/**
 * 1. Cara Frontal (+Z)
 * Recorta la cara frontal de hoja1, estampa el Funkito 2D con su borde blanco
 * sobre el cartón y cala la ventana de acetato contorneándolo.
 */
export async function composeBoxFrontCanvas(
  config: BoxCustomizationConfig,
  skinCanvas: HTMLCanvasElement | null = null
): Promise<HTMLCanvasElement> {
  const { sx, sy, sw, sh, file } = TEMPLATE_CROPS.front;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Base blanca de cartón
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const img = await loadTemplateImage(file);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  } catch {
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Aplicar teñido de color si el usuario eligió un color primario personalizado
  if (config.primaryColor && config.primaryColor !== '#ffffff' && config.primaryColor !== '#f8fafc') {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 1. Troquel de la ventana transparente (destination-out)
  // El vano se mantiene estrictamente a la derecha del funkito (x >= chibiRightEdge)
  // y por encima de su cabeza (y <= chibiTopEdge), respetando el escalón en L del cartón.
  const windowTop = 175;
  const windowRight = 1475;
  const windowBottom = 1365;
  const pillarX = 180;
  const chibiRightEdge = 530;
  const chibiTopEdge = 710;

  // Calar la ventana transparente en el cartón
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(pillarX, windowTop);
  ctx.lineTo(windowRight, windowTop);
  ctx.lineTo(windowRight, windowBottom);
  ctx.lineTo(chibiRightEdge, windowBottom);
  ctx.lineTo(chibiRightEdge, chibiTopEdge);
  ctx.lineTo(pillarX, chibiTopEdge);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Marco blanco de corte / troquel alrededor del vano de la ventana
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  ctx.moveTo(pillarX - 6, windowTop - 6);
  ctx.lineTo(windowRight + 6, windowTop - 6);
  ctx.lineTo(windowRight + 6, windowBottom + 6);
  ctx.lineTo(chibiRightEdge - 6, windowBottom + 6);
  ctx.lineTo(chibiRightEdge - 6, chibiTopEdge);
  ctx.lineTo(pillarX - 6, chibiTopEdge);
  ctx.lineTo(pillarX - 6, windowTop - 6);
  ctx.stroke();
  ctx.restore();

  // 3. Renderizar el Funkito 2D de la skin con su borde blanco de troquel
  // Al dibujarse DESPUÉS del destination-out, queda 100% sólido y nítido sobre el cartón
  const rawChibi = renderChibiCoverAvatar(skinCanvas);
  const borderedChibi = createStickerBorder(rawChibi, 22);

  // Posición del avatar en la carátula frontal (esquina inferior izquierda)
  const avatarDrawX = -20;
  const avatarDrawY = 720;
  ctx.drawImage(borderedChibi, avatarDrawX, avatarDrawY);

  // 4. Textos y sellos sobre la cara frontal
  ctx.save();

  // Franja superior de franquicia / logo
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.textAlign = 'left';
  applyFontFamily(ctx, 42, 900, config.fontFamily);
  ctx.fillText(config.franchiseTag || 'WARD LAND', 240, 110);

  // Badge / Círculo superior derecho con el número de colección
  const badgeX = canvas.width - 120;
  const badgeY = 100;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 64, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  applyFontFamily(ctx, 48, 900, config.fontFamily);
  ctx.fillText(config.collectionNumber || '#01', badgeX, badgeY + 2);

  // Nombre del personaje en el pie de caja
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  applyFontFamily(ctx, 72, 900, config.fontFamily);
  const name = (config.characterName || 'LEO 9970').toUpperCase();
  ctx.fillText(name, 560, canvas.height - 110);

  ctx.font = '700 24px monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.shadowBlur = 4;
  ctx.fillText('VINYL FIGURE / FIGURINE EN VINYLE', 560, canvas.height - 50);

  ctx.restore();

  return canvas;
}

/**
 * 2. Lateral Derecho (+X)
 * Panel con ventana de acetato que envuelve la esquina y franja vertical
 * con el nombre y número del personaje (hoja2 lado izquierdo).
 */
export async function composeBoxRightCanvas(config: BoxCustomizationConfig): Promise<HTMLCanvasElement> {
  const { sx, sy, sw, sh, file } = TEMPLATE_CROPS.right;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const img = await loadTemplateImage(file);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  } catch {
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Texto vertical con el nombre del personaje en la franja derecha
  ctx.save();
  ctx.translate(1120, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  applyFontFamily(ctx, 80, 900, config.fontFamily);
  ctx.fillText((config.characterName || 'LEO 9970').toUpperCase(), 0, 0);
  ctx.restore();

  // Marco blanco de la ventana lateral
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 182, 866, 1365 - 182);
  ctx.restore();

  // Troquel de ventana transparente en el lateral
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.rect(0, 185, 870, 1365 - 185);
  ctx.fill();
  ctx.restore();

  return canvas;
}

/**
 * 3. Lateral Izquierdo (-X)
 * Pared de piedra completa con gran círculo blanco para el número de edición
 * y logotipo de la franquicia (hoja2 lado derecho).
 */
export async function composeBoxLeftCanvas(config: BoxCustomizationConfig): Promise<HTMLCanvasElement> {
  const { sx, sy, sw, sh, file } = TEMPLATE_CROPS.left;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const img = await loadTemplateImage(file);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  } catch {
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Número gigante de colección centrado dentro del círculo blanco
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  applyFontFamily(ctx, 280, 900, config.fontFamily);

  const cleanNumber = (config.collectionNumber || '1').replace(/^#0*/, '') || '1';
  ctx.fillText(cleanNumber, 694, 770);

  // Subtítulo de franquicia debajo del círculo
  applyFontFamily(ctx, 48, 900, config.fontFamily);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText(config.franchiseTag || 'WARD LAND', 694, 1260);

  ctx.restore();
  return canvas;
}

/**
 * 4. Cara Trasera (-Z)
 * Hoja1 lado izquierdo: logotipo WL Studios, código QR e ilustración de la skin
 */
export async function composeBoxBackCanvas(
  config: BoxCustomizationConfig,
  skinCanvas: HTMLCanvasElement | null = null
): Promise<HTMLCanvasElement> {
  const { sx, sy, sw, sh, file } = TEMPLATE_CROPS.back;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const img = await loadTemplateImage(file);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  } catch {
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Si hay skin cargada, renderizamos el avatar de cuerpo completo en el lado derecho de la espalda
  if (skinCanvas) {
    const backChibi = renderChibiCoverAvatar(skinCanvas);
    const borderedBackChibi = createStickerBorder(backChibi, 16);
    ctx.drawImage(borderedBackChibi, canvas.width - 560, 480);
  }

  // Título e identidad en la parte trasera
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  applyFontFamily(ctx, 54, 900, config.fontFamily);
  ctx.fillText((config.characterName || 'LEO 9970').toUpperCase(), canvas.width / 2, 220);

  ctx.font = '600 28px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`COLLECTION NO. ${config.collectionNumber || '#01'}`, canvas.width / 2, 275);
  ctx.restore();

  return canvas;
}

/**
 * 5. Tapa Superior (+Y)
 * Bloque de piedra de hoja3 con logotipo central
 */
export async function composeBoxTopCanvas(config: BoxCustomizationConfig): Promise<HTMLCanvasElement> {
  const { sx, sy, sw, sh, file } = TEMPLATE_CROPS.top;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const img = await loadTemplateImage(file);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  } catch {
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Logotipo o nombre de franquicia sutil en la tapa
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.textAlign = 'center';
  applyFontFamily(ctx, 64, 900, config.fontFamily);
  ctx.fillText(config.franchiseTag || 'WARD LAND', canvas.width / 2, canvas.height / 2);
  ctx.restore();

  return canvas;
}

/**
 * 6. Fondo / Base (-Y)
 */
export function composeBoxBottomCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 10, 492, 492);
  }
  return canvas;
}

export interface ComposedBoxTextures {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  left: HTMLCanvasElement;
  right: HTMLCanvasElement;
  top: HTMLCanvasElement;
  bottom: HTMLCanvasElement;
}

/**
 * Compone en paralelo todas las caras de la caja Funko Pop pasando la skinCanvas activa
 */
export async function composeAllBoxFaces(
  config: BoxCustomizationConfig,
  skinCanvas: HTMLCanvasElement | null = null
): Promise<ComposedBoxTextures> {
  const [front, back, left, right, top] = await Promise.all([
    composeBoxFrontCanvas(config, skinCanvas),
    composeBoxBackCanvas(config, skinCanvas),
    composeBoxLeftCanvas(config),
    composeBoxRightCanvas(config),
    composeBoxTopCanvas(config),
  ]);

  const bottom = composeBoxBottomCanvas();

  return { front, back, left, right, top, bottom };
}


