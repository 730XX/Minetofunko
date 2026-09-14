import * as THREE from 'three';
import type { PartTransformation } from './types';

export interface FunkoMeshBuildResult {
  group: THREE.Group;
  materials: THREE.Material[];
  textures: THREE.Texture[];
}

/**
 * Crea una subtextura desde un canvas 2D con rotación y flip opcionales
 */
function createSubTexture(
  sourceCanvas: HTMLCanvasElement,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  rotateDeg: number = 0,
  flipH: boolean = false
): THREE.CanvasTexture {
  const subCanvas = document.createElement('canvas');
  subCanvas.width = srcW;
  subCanvas.height = srcH;
  const ctx = subCanvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
  }

  let finalCanvas = subCanvas;
  if (rotateDeg !== 0) {
    const rotCanvas = document.createElement('canvas');
    const rads = (rotateDeg * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rads));
    const cos = Math.abs(Math.cos(rads));
    rotCanvas.width = Math.floor(finalCanvas.width * cos + finalCanvas.height * sin);
    rotCanvas.height = Math.floor(finalCanvas.width * sin + finalCanvas.height * cos);
    const rCtx = rotCanvas.getContext('2d');
    if (rCtx) {
      rCtx.imageSmoothingEnabled = false;
      rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rCtx.rotate(rads);
      rCtx.drawImage(finalCanvas, -finalCanvas.width / 2, -finalCanvas.height / 2);
    }
    finalCanvas = rotCanvas;
  }

  if (flipH) {
    const flipCanvas = document.createElement('canvas');
    flipCanvas.width = finalCanvas.width;
    flipCanvas.height = finalCanvas.height;
    const fCtx = flipCanvas.getContext('2d');
    if (fCtx) {
      fCtx.imageSmoothingEnabled = false;
      fCtx.scale(-1, 1);
      fCtx.drawImage(finalCanvas, -finalCanvas.width, 0);
    }
    finalCanvas = flipCanvas;
  }

  const tex = new THREE.CanvasTexture(finalCanvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Construye el grupo de malla Three.js completo del Funko Pop a partir del skinCanvas y el molde 2D
 */
export function buildFunkoMeshGroup(
  skinCanvas: HTMLCanvasElement | null,
  rendered2DCanvas?: HTMLCanvasElement | null,
  parts?: PartTransformation[]
): FunkoMeshBuildResult {
  const group = new THREE.Group();
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const registerTex = (tex?: THREE.CanvasTexture) => {
    if (tex) textures.push(tex);
    return tex;
  };

  const getTextureFrom2DSheet = (
    partId: string,
    additionalRotDeg: number = 0,
    flipH: boolean = false
  ): THREE.CanvasTexture | undefined => {
    if (!rendered2DCanvas) return undefined;
    const found = parts?.find((p) => p.id === partId);
    if (!found) return undefined;

    const normRot = Math.abs((found.rotateDeg || 0) % 180);
    const isRotated90 = normRot === 90;
    const partW = isRotated90 ? found.scale.height : found.scale.width;
    const partH = isRotated90 ? found.scale.width : found.scale.height;

    const subCanvas = document.createElement('canvas');
    subCanvas.width = partW;
    subCanvas.height = partH;
    const ctx = subCanvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      rendered2DCanvas,
      found.destination.x,
      found.destination.y,
      partW,
      partH,
      0,
      0,
      partW,
      partH
    );

    let finalCanvas = subCanvas;
    if (additionalRotDeg !== 0) {
      const rotCanvas = document.createElement('canvas');
      const rads = (additionalRotDeg * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rads));
      const cos = Math.abs(Math.cos(rads));
      rotCanvas.width = Math.floor(finalCanvas.width * cos + finalCanvas.height * sin);
      rotCanvas.height = Math.floor(finalCanvas.width * sin + finalCanvas.height * cos);
      const rCtx = rotCanvas.getContext('2d');
      if (rCtx) {
        rCtx.imageSmoothingEnabled = false;
        rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rCtx.rotate(rads);
        rCtx.drawImage(finalCanvas, -finalCanvas.width / 2, -finalCanvas.height / 2);
      }
      finalCanvas = rotCanvas;
    }

    if (flipH) {
      const flipCanvas = document.createElement('canvas');
      flipCanvas.width = finalCanvas.width;
      flipCanvas.height = finalCanvas.height;
      const fCtx = flipCanvas.getContext('2d');
      if (fCtx) {
        fCtx.imageSmoothingEnabled = false;
        fCtx.scale(-1, 1);
        fCtx.drawImage(finalCanvas, -finalCanvas.width, 0);
      }
      finalCanvas = flipCanvas;
    }

    const tex = new THREE.CanvasTexture(finalCanvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return registerTex(tex);
  };

  const getSubTex = (
    srcX: number,
    srcY: number,
    srcW: number,
    srcH: number,
    rotateDeg: number = 0,
    flipH: boolean = false
  ): THREE.CanvasTexture | undefined => {
    if (!skinCanvas) return undefined;
    return registerTex(createSubTexture(skinCanvas, srcX, srcY, srcW, srcH, rotateDeg, flipH));
  };

  const makeMat = (tex?: THREE.CanvasTexture, defaultColor: number = 0xe5a67c) => {
    const matParams: THREE.MeshStandardMaterialParameters = {
      color: tex ? 0xffffff : defaultColor,
      roughness: 0.6,
    };
    if (tex) {
      matParams.map = tex;
    }
    const mat = new THREE.MeshStandardMaterial(matParams);
    materials.push(mat);
    return mat;
  };

  // Material para la segunda capa (Overlay 3D) con canal alfa y descarte de fragmentos vacíos
  const makeOverlayMat = (tex?: THREE.CanvasTexture) => {
    const matParams: THREE.MeshStandardMaterialParameters = {
      color: 0xffffff,
      roughness: 0.6,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: true,
      side: THREE.DoubleSide,
    };
    if (tex) {
      matParams.map = tex;
    } else {
      matParams.opacity = 0;
      matParams.transparent = true;
    }
    const mat = new THREE.MeshStandardMaterial(matParams);
    materials.push(mat);
    return mat;
  };

  // 1. Materiales de CABEZA (Base - Capa Primaria sin tocar)
  const headMats = [
    makeMat(getTextureFrom2DSheet('cabeza-derecha', 90) || getSubTex(480, 136, 236, 134, -90)),
    makeMat(getTextureFrom2DSheet('cabeza-izquierda', -90) || getSubTex(0, 136, 236, 134, 90)),
    makeMat(getTextureFrom2DSheet('cabeza-arriba', 0) || getSubTex(241, 0, 236, 134)),
    makeMat(getTextureFrom2DSheet('cabeza-abajo', 0) || getSubTex(480, 0, 236, 134)),
    makeMat(getTextureFrom2DSheet('cabeza-front', 0) || getSubTex(241, 136, 236, 134)),
    makeMat(getTextureFrom2DSheet('cabeza-atras', 180) || getSubTex(720, 135, 236, 134, -180)),
  ];

  // Materiales de CABEZA (Segunda Capa / Sombrero / Pelo 3D: shift +960 en X)
  const headOverlayMats = [
    makeOverlayMat(getSubTex(960, 136, 236, 134, 0, true)),   // Right (+X)
    makeOverlayMat(getSubTex(1440, 136, 236, 134, 0, true)), // Left (-X)
    makeOverlayMat(getSubTex(1201, 0, 236, 134, 0)),     // Top (+Y): 0°
    makeOverlayMat(getSubTex(1440, 0, 236, 134, 0)),     // Bottom (-Y): 0°
    makeOverlayMat(getSubTex(1201, 136, 236, 134, 0)),   // Front (+Z): 0°
    makeOverlayMat(getSubTex(1680, 135, 236, 134, 0, true)), // Back (-Z)
  ];

  // 2. Materiales de TORSO (Base)
  const capuchaPart = parts?.find((p) => p.id === 'capucha-trasera');
  const torsoTopTex = capuchaPart && skinCanvas
    ? getSubTex(capuchaPart.source.x, capuchaPart.source.y, capuchaPart.source.width, capuchaPart.source.height)
    : getSubTex(600, 270, 240, 68);

  const torsoMats = [
    makeMat(getSubTex(480, 337, 120, 203), 0x059669), // Right (+X)
    makeMat(getSubTex(840, 337, 120, 203), 0x059669), // Left (-X)
    makeMat(torsoTopTex, 0x059669),                   // Top (+Y)
    makeMat(undefined, 0x059669),                     // Bottom (-Y)
    makeMat(getSubTex(600, 337, 240, 203), 0x059669), // Front (+Z Pecho)
    makeMat(getSubTex(960, 337, 240, 203), 0x059669), // Back (-Z Espalda)
  ];

  // Materiales de TORSO (Segunda Capa / Chaqueta 3D: shift +270 en Y)
  const torsoOverlayMats = [
    makeOverlayMat(getSubTex(480, 607, 120, 203)), // Right (+X)
    makeOverlayMat(getSubTex(840, 607, 120, 203)), // Left (-X)
    makeOverlayMat(getSubTex(600, 540, 240, 68)),  // Top (+Y)
    makeOverlayMat(getSubTex(840, 540, 240, 68)),  // Bottom (-Y)
    makeOverlayMat(getSubTex(600, 607, 240, 203)), // Front (+Z Pecho)
    makeOverlayMat(getSubTex(960, 607, 240, 203)), // Back (-Z Espalda / Espada)
  ];

  // 3. Materiales de BRAZO IZQUIERDO (+X en nuestro modelo anatómico) (Base)
  const armLeftMats = [
    makeMat(getTextureFrom2DSheet('brazo-izq-der') || getSubTex(1200, 876, 120, 204)),
    makeMat(getTextureFrom2DSheet('brazo-izq-izq') || getSubTex(960, 876, 119, 204)),
    makeMat(getTextureFrom2DSheet('brazo-izq-hombro') || getSubTex(1080, 793, 120, 68)),
    makeMat(getTextureFrom2DSheet('brazo-izq-mano') || getSubTex(1200, 809, 120, 68, 0, true)),
    makeMat(getTextureFrom2DSheet('brazo-izq-adelante') || getSubTex(1080, 876, 120, 204)),
    makeMat(getTextureFrom2DSheet('brazo-izq-atras') || getSubTex(1321, 876, 120, 204)),
  ];

  // Materiales de BRAZO IZQUIERDO (Segunda Capa / Manga 3D: shift +480 en X)
  const armLeftOverlayMats = [
    makeOverlayMat(getSubTex(1680, 876, 120, 204)),
    makeOverlayMat(getSubTex(1440, 876, 119, 204)),
    makeOverlayMat(getSubTex(1560, 793, 120, 68)),
    makeOverlayMat(getSubTex(1680, 809, 120, 68, 0, true)),
    makeOverlayMat(getSubTex(1560, 876, 120, 204)),
    makeOverlayMat(getSubTex(1801, 876, 120, 204)),
  ];

  // 4. Materiales de BRAZO DERECHO (-X) (Base)
  const armRightMats = [
    makeMat(getTextureFrom2DSheet('brazo-der-der') || getSubTex(1440, 337, 120, 204)),
    makeMat(getTextureFrom2DSheet('brazo-der-izq') || getSubTex(1200, 337, 120, 204)),
    makeMat(getTextureFrom2DSheet('brazo-der-hombro') || getSubTex(1320, 270, 120, 68)),
    makeMat(getTextureFrom2DSheet('brazo-der-mano') || getSubTex(1440, 270, 120, 68, 0, true)),
    makeMat(getTextureFrom2DSheet('brazo-der-adelante') || getSubTex(1320, 337, 120, 204)),
    makeMat(getTextureFrom2DSheet('brazo-der-atras') || getSubTex(1560, 337, 120, 204)),
  ];

  // Materiales de BRAZO DERECHO (Segunda Capa / Manga 3D: shift +270 en Y)
  const armRightOverlayMats = [
    makeOverlayMat(getSubTex(1440, 607, 120, 204)),
    makeOverlayMat(getSubTex(1200, 607, 120, 204)),
    makeOverlayMat(getSubTex(1320, 540, 120, 68)),
    makeOverlayMat(getSubTex(1440, 540, 120, 68, 0, true)),
    makeOverlayMat(getSubTex(1320, 607, 120, 204)),
    makeOverlayMat(getSubTex(1560, 607, 120, 204)),
  ];

  // 5. Materiales de PIERNAS (Base)
  const legLeftMats = [
    makeMat(getSubTex(720, 876, 120, 204)),
    makeMat(getSubTex(480, 876, 120, 204)),
    makeMat(getSubTex(600, 810, 120, 68)),
    makeMat(getSubTex(720, 810, 120, 68, 180)),
    makeMat(getSubTex(600, 876, 120, 204)),
    makeMat(getSubTex(840, 876, 120, 204)),
  ];

  // Pierna Izquierda (Segunda Capa / Pantalón 3D: shift -480 en X)
  const legLeftOverlayMats = [
    makeOverlayMat(getSubTex(240, 876, 120, 204)),
    makeOverlayMat(getSubTex(0, 876, 120, 204)),
    makeOverlayMat(getSubTex(120, 810, 120, 68)),
    makeOverlayMat(getSubTex(240, 810, 120, 68, 180)),
    makeOverlayMat(getSubTex(120, 876, 120, 204)),
    makeOverlayMat(getSubTex(360, 876, 120, 204)),
  ];

  const legRightMats = [
    makeMat(getSubTex(0, 337, 120, 204)),
    makeMat(getSubTex(240, 337, 120, 204)),
    makeMat(getSubTex(120, 270, 120, 68)),
    makeMat(getSubTex(240, 270, 120, 68, 180)),
    makeMat(getSubTex(120, 337, 120, 204)),
    makeMat(getSubTex(360, 337, 120, 204)),
  ];

  // Pierna Derecha (Segunda Capa / Pantalón 3D: shift +270 en Y)
  const legRightOverlayMats = [
    makeOverlayMat(getSubTex(0, 607, 120, 204)),
    makeOverlayMat(getSubTex(240, 607, 120, 204)),
    makeOverlayMat(getSubTex(120, 540, 120, 68)),
    makeOverlayMat(getSubTex(240, 540, 120, 68, 180)),
    makeOverlayMat(getSubTex(120, 607, 120, 204)),
    makeOverlayMat(getSubTex(360, 607, 120, 204)),
  ];

  // Función helper para crear miembro sólido con su segunda capa 3D despegada
  const createMemberBox = (
    w: number,
    h: number,
    d: number,
    pos: { x: number; y: number; z: number },
    mats: THREE.Material[],
    rotZ: number = 0,
    overlayMats?: THREE.Material[],
    overlayOffset: number = 0.04
  ) => {
    const memberGroup = new THREE.Group();
    memberGroup.position.set(pos.x, pos.y, pos.z);
    if (rotZ !== 0) memberGroup.rotation.z = rotZ;

    // 1. Malla Base Sólida
    const baseGeo = new THREE.BoxGeometry(w, h, d);
    const baseMesh = new THREE.Mesh(baseGeo, mats);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    memberGroup.add(baseMesh);

    // 2. Malla Segunda Capa / Relieve 3D (Overlay) despegada un par de milímetros/píxeles
    if (overlayMats && overlayMats.length === 6) {
      const overlayGeo = new THREE.BoxGeometry(
        w + overlayOffset * 2,
        h + overlayOffset * 2,
        d + overlayOffset * 2
      );
      const overlayMesh = new THREE.Mesh(overlayGeo, overlayMats);
      overlayMesh.castShadow = true;
      overlayMesh.receiveShadow = true;
      memberGroup.add(overlayMesh);
    }

    group.add(memberGroup);
    return memberGroup;
  };

  // Dimensiones proporcionales Funko Pop con relieve volumétrico
  // 1. Cabeza (despegue 0.04 uniforme)
  createMemberBox(1.5, 1.45, 1.25, { x: 0, y: 0.71, z: 0 }, headMats, 0, headOverlayMats, 0.04);

  // 2. Torso (despegue 0.04 uniforme)
  createMemberBox(0.85, 0.9, 0.6, { x: 0, y: -0.465, z: 0 }, torsoMats, 0, torsoOverlayMats, 0.04);

  // 3. Brazos (despegue 0.04 para las mangas)
  createMemberBox(0.32, 0.85, 0.38, { x: 0.62, y: -0.56, z: 0 }, armLeftMats, -0.12, armLeftOverlayMats, 0.04);
  createMemberBox(0.32, 0.85, 0.38, { x: -0.62, y: -0.56, z: 0 }, armRightMats, 0.12, armRightOverlayMats, 0.04);

  // 4. Piernas (despegue 0.04 para los pantalones y zapatillas)
  createMemberBox(0.38, 0.5, 0.42, { x: 0.22, y: -1.165, z: 0 }, legLeftMats, 0, legLeftOverlayMats, 0.04);
  createMemberBox(0.38, 0.5, 0.42, { x: -0.22, y: -1.165, z: 0 }, legRightMats, 0, legRightOverlayMats, 0.04);

  return { group, materials, textures };
}
