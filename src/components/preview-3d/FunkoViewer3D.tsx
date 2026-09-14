import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Eye, Pause } from 'lucide-react';

import type { PartTransformation } from '../../core/engine/types';
import { FUNKO_GROOVER_CONFIG } from '../../core/config/coordinates2d';

interface FunkoViewer3DProps {
  skinCanvas: HTMLCanvasElement | null;
  rendered2DCanvas?: HTMLCanvasElement | null;
  parts?: PartTransformation[];
  skinFormat?: 'legacy' | 'standard';
  selectedPartId?: string | null;
}

interface FocusTarget {
  cameraPos: THREE.Vector3;
  lookAt: THREE.Vector3;
}

/**
 * Calcula la posición y punto focal de la cámara para enfocar una pieza específica con buen campo visual
 */
function getFocusTarget(partId: string | null): FocusTarget {
  const DEFAULT_TARGET: FocusTarget = {
    cameraPos: new THREE.Vector3(0, 0.45, 5.6),
    lookAt: new THREE.Vector3(0, 0.05, 0),
  };

  if (!partId) return DEFAULT_TARGET;

  // 1. Cabeza (distancia moderada ~4.3 para ver toda la cabeza y el cuello cómodamente)
  if (partId === 'cabeza-front') {
    return {
      cameraPos: new THREE.Vector3(0, 0.65, 4.3),
      lookAt: new THREE.Vector3(0, 0.45, 0),
    };
  }
  if (partId === 'cabeza-atras') {
    return {
      cameraPos: new THREE.Vector3(0, 0.65, -4.3),
      lookAt: new THREE.Vector3(0, 0.45, 0),
    };
  }
  if (partId === 'cabeza-derecha') {
    return {
      cameraPos: new THREE.Vector3(4.3, 0.65, 0),
      lookAt: new THREE.Vector3(0, 0.45, 0),
    };
  }
  if (partId === 'cabeza-izquierda') {
    return {
      cameraPos: new THREE.Vector3(-4.3, 0.65, 0),
      lookAt: new THREE.Vector3(0, 0.45, 0),
    };
  }
  if (partId === 'cabeza-arriba') {
    return {
      cameraPos: new THREE.Vector3(0, 3.8, 2.2),
      lookAt: new THREE.Vector3(0, 0.35, 0),
    };
  }
  if (partId === 'cabeza-abajo') {
    return {
      cameraPos: new THREE.Vector3(0, -1.8, 3.8),
      lookAt: new THREE.Vector3(0, 0.35, 0),
    };
  }

  // 2. Torso
  if (partId === 'pecho-delantero') {
    return {
      cameraPos: new THREE.Vector3(0, -0.25, 4.2),
      lookAt: new THREE.Vector3(0, -0.3, 0),
    };
  }
  if (partId === 'pecho-trasero') {
    return {
      cameraPos: new THREE.Vector3(0, -0.25, -4.2),
      lookAt: new THREE.Vector3(0, -0.3, 0),
    };
  }
  if (partId === 'capucha-trasera' || partId === 'cuello-capucha') {
    return {
      cameraPos: new THREE.Vector3(0, 1.2, 3.8),
      lookAt: new THREE.Vector3(0, -0.2, 0),
    };
  }

  // 3. Brazo Izquierdo (+X / Lado derecho de pantalla)
  if (partId.startsWith('brazo-izq-')) {
    if (partId === 'brazo-izq-atras') {
      return {
        cameraPos: new THREE.Vector3(1.6, -0.4, -3.8),
        lookAt: new THREE.Vector3(0.45, -0.45, 0),
      };
    }
    if (partId === 'brazo-izq-der') {
      return {
        cameraPos: new THREE.Vector3(3.8, -0.4, 0),
        lookAt: new THREE.Vector3(0.45, -0.45, 0),
      };
    }
    return {
      cameraPos: new THREE.Vector3(1.6, -0.4, 3.8),
      lookAt: new THREE.Vector3(0.45, -0.45, 0),
    };
  }

  // 4. Brazo Derecho (-X / Lado izquierdo de pantalla)
  if (partId.startsWith('brazo-der-')) {
    if (partId === 'brazo-der-atras') {
      return {
        cameraPos: new THREE.Vector3(-1.6, -0.4, -3.8),
        lookAt: new THREE.Vector3(-0.45, -0.45, 0),
      };
    }
    if (partId === 'brazo-der-izq') {
      return {
        cameraPos: new THREE.Vector3(-3.8, -0.4, 0),
        lookAt: new THREE.Vector3(-0.45, -0.45, 0),
      };
    }
    return {
      cameraPos: new THREE.Vector3(-1.6, -0.4, 3.8),
      lookAt: new THREE.Vector3(-0.45, -0.45, 0),
    };
  }

  // 5. Piernas
  if (partId.startsWith('pierna-izq-')) {
    return {
      cameraPos: new THREE.Vector3(0.8, -0.85, 4.0),
      lookAt: new THREE.Vector3(0.15, -0.9, 0),
    };
  }
  if (partId.startsWith('pierna-der-')) {
    return {
      cameraPos: new THREE.Vector3(-0.8, -0.85, 4.0),
      lookAt: new THREE.Vector3(-0.15, -0.9, 0),
    };
  }

  return DEFAULT_TARGET;
}

// Posiciones base de cada miembro en el espacio 3D para encaje perfecto
const BASE_POSITIONS = {
  head: { x: 0, y: 0.71, z: 0 },
  body: { x: 0, y: -0.465, z: 0 },
  leftArm: { x: 0.62, y: -0.56, z: 0 },
  rightArm: { x: -0.62, y: -0.56, z: 0 },
  leftLeg: { x: 0.22, y: -1.165, z: 0 },
  rightLeg: { x: -0.22, y: -1.165, z: 0 },
};

const DEFAULT_FACE_CFGS: Record<string, { x: number; y: number; w: number; h: number; rot?: number; flip?: boolean }> = {
  'cabeza-derecha': { x: 480, y: 136, w: 236, h: 134, rot: -90 },
  'cabeza-izquierda': { x: 0, y: 136, w: 236, h: 134, rot: 90 },
  'cabeza-arriba': { x: 241, y: 0, w: 236, h: 134 },
  'cabeza-abajo': { x: 480, y: 0, w: 236, h: 134, rot: 0 },
  'cabeza-front': { x: 241, y: 136, w: 236, h: 134 },
  'cabeza-atras': { x: 720, y: 135, w: 236, h: 134, rot: -180 },
  'brazo-izq-der': { x: 1200, y: 876, w: 120, h: 204 },
  'brazo-izq-izq': { x: 960, y: 876, w: 119, h: 204 },
  'brazo-izq-hombro': { x: 1080, y: 793, w: 120, h: 68 },
  'brazo-izq-mano': { x: 1200, y: 809, w: 120, h: 68, flip: true },
  'brazo-izq-adelante': { x: 1080, y: 876, w: 120, h: 204 },
  'brazo-izq-atras': { x: 1321, y: 876, w: 120, h: 204 },
  'brazo-der-der': { x: 1440, y: 337, w: 120, h: 204 },
  'brazo-der-izq': { x: 1200, y: 337, w: 120, h: 204 },
  'brazo-der-hombro': { x: 1320, y: 270, w: 120, h: 68 },
  'brazo-der-mano': { x: 1440, y: 270, w: 120, h: 68, flip: true },
  'brazo-der-adelante': { x: 1320, y: 337, w: 120, h: 204 },
  'brazo-der-atras': { x: 1560, y: 337, w: 120, h: 204 },
  'pecho-delantero': { x: 600, y: 337, w: 240, h: 203 },
  'espalda': { x: 960, y: 337, w: 240, h: 203 },
  'capucha-trasera': { x: 600, y: 270, w: 240, h: 68 },
  'torso-der': { x: 480, y: 337, w: 120, h: 203 },
  'torso-izq': { x: 840, y: 337, w: 120, h: 203 },
};

function createSubTextureFromCanvas(
  skinCanvas: HTMLCanvasElement | null,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  rotateDeg: number = 0,
  flipH: boolean = false
): THREE.CanvasTexture {
  const subCanvas = document.createElement('canvas');
  subCanvas.width = Math.max(1, srcW);
  subCanvas.height = Math.max(1, srcH);
  const ctx = subCanvas.getContext('2d');
  if (ctx && skinCanvas) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(skinCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
  }

  let finalCanvas = subCanvas;
  if (rotateDeg !== 0) {
    const rotCanvas = document.createElement('canvas');
    const rads = (rotateDeg * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rads));
    const cos = Math.abs(Math.cos(rads));
    rotCanvas.width = Math.max(1, Math.floor(finalCanvas.width * cos + finalCanvas.height * sin));
    rotCanvas.height = Math.max(1, Math.floor(finalCanvas.width * sin + finalCanvas.height * cos));
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

interface FaceMeshEntry {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  normal: THREE.Vector3;
}

interface BoxFaceConfig {
  partId: string;
  material: THREE.Material;
  face: 'front' | 'back' | 'top' | 'bottom' | 'right' | 'left';
}

/**
 * Crea una caja 3D conformada por 6 planos independientes desarmables
 */
function createExplodedBox(
  parentGroup: THREE.Group,
  w: number,
  h: number,
  d: number,
  center: { x: number; y: number; z: number },
  faces: BoxFaceConfig[],
  registry: Map<string, FaceMeshEntry>,
  memberRotationZ: number = 0,
  overlayMats?: THREE.Material[],
  overlayOffset: number = 0.04,
  overlayRegistry?: THREE.Mesh[],
  initialOverlayVisible: boolean = true
) {
  const memberGroup = new THREE.Group();
  memberGroup.position.set(center.x, center.y, center.z);
  if (memberRotationZ !== 0) {
    memberGroup.rotation.z = memberRotationZ;
  }
  parentGroup.add(memberGroup);

  // Segunda Capa 3D (Overlay extruido/despegado)
  if (overlayMats && overlayMats.length === 6) {
    const overlayGeo = new THREE.BoxGeometry(
      w + overlayOffset * 2,
      h + overlayOffset * 2,
      d + overlayOffset * 2
    );
    const overlayMesh = new THREE.Mesh(overlayGeo, overlayMats);
    overlayMesh.castShadow = true;
    overlayMesh.receiveShadow = true;
    overlayMesh.visible = initialOverlayVisible;
    memberGroup.add(overlayMesh);
    if (overlayRegistry) {
      overlayRegistry.push(overlayMesh);
    }
  }

  faces.forEach(({ partId, material, face }) => {
    material.side = THREE.DoubleSide;

    let geo: THREE.PlaneGeometry;
    let localPos: THREE.Vector3;
    let rot = new THREE.Euler();
    let normal: THREE.Vector3;

    switch (face) {
      case 'front':
        geo = new THREE.PlaneGeometry(w, h);
        localPos = new THREE.Vector3(0, 0, d / 2);
        rot.set(0, 0, 0);
        normal = new THREE.Vector3(0, 0, 1);
        break;
      case 'back':
        geo = new THREE.PlaneGeometry(w, h);
        localPos = new THREE.Vector3(0, 0, -d / 2);
        rot.set(0, Math.PI, 0);
        normal = new THREE.Vector3(0, 0, -1);
        break;
      case 'right': // Cara +X en Three.js
        geo = new THREE.PlaneGeometry(d, h);
        localPos = new THREE.Vector3(w / 2, 0, 0);
        rot.set(0, Math.PI / 2, 0);
        normal = new THREE.Vector3(1, 0, 0);
        break;
      case 'left': // Cara -X en Three.js
        geo = new THREE.PlaneGeometry(d, h);
        localPos = new THREE.Vector3(-w / 2, 0, 0);
        rot.set(0, -Math.PI / 2, 0);
        normal = new THREE.Vector3(-1, 0, 0);
        break;
      case 'top': // Cara +Y
        geo = new THREE.PlaneGeometry(w, d);
        localPos = new THREE.Vector3(0, h / 2, 0);
        rot.set(-Math.PI / 2, 0, 0);
        normal = new THREE.Vector3(0, 1, 0);
        break;
      case 'bottom': // Cara -Y
        geo = new THREE.PlaneGeometry(w, d);
        localPos = new THREE.Vector3(0, -h / 2, 0);
        rot.set(Math.PI / 2, 0, 0);
        normal = new THREE.Vector3(0, -1, 0);
        break;
    }

    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.copy(rot);
    mesh.position.copy(localPos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    memberGroup.add(mesh);
    registry.set(partId, {
      mesh,
      basePos: localPos.clone(),
      normal,
    });
  });
}

export const FunkoViewer3D: React.FC<FunkoViewer3DProps> = ({
  skinCanvas,
  rendered2DCanvas: _rendered2DCanvas,
  parts,
  skinFormat = 'standard',
  selectedPartId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const selectedPartIdRef = useRef(selectedPartId);
  selectedPartIdRef.current = selectedPartId;

  const targetCameraPosRef = useRef(new THREE.Vector3(0, 0.45, 5.6));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.05, 0));

  // Actualizar objetivo de la cámara cuando cambia la pieza seleccionada (Modo Focus)
  useEffect(() => {
    const target = getFocusTarget(selectedPartId || null);
    targetCameraPosRef.current.copy(target.cameraPos);
    targetLookAtRef.current.copy(target.lookAt);
  }, [selectedPartId]);

  const [wireframe, setWireframe] = useState(false);
  const [isAligned, setIsAligned] = useState(true);
  const [showOverlay3D, setShowOverlay3D] = useState(true);
  const showOverlay3DRef = useRef(true);
  showOverlay3DRef.current = showOverlay3D;

  const funkoGroupRef = useRef<THREE.Group | null>(null);
  const baseMeshRef = useRef<THREE.Mesh | null>(null);
  const ringMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const overlayMeshesRef = useRef<THREE.Mesh[]>([]);

  // Registro de cada cara independiente para despiece O(1) reactivo en tiempo real
  const faceMeshesRef = useRef<Map<string, FaceMeshEntry>>(new Map());

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera: Calibrada al centro óptico del Funko con más aire/campo visual
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.45, 5.6);
    camera.lookAt(0, 0.05, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.id = 'funko-3d-canvas';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x10b981, 1.4);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa7f3d0, 1.2, 10);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.8, 1.9, 0.12, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x181e2b,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 1,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.5;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    baseMeshRef.current = baseMesh;

    // Neon Ring
    const ringGeo = new THREE.TorusGeometry(1.78, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 1,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.44;
    scene.add(ringMesh);
    ringMeshRef.current = ringMesh;

    // Funko Group
    const funkoGroup = new THREE.Group();
    scene.add(funkoGroup);
    funkoGroupRef.current = funkoGroup;

    // Helpers para recortar una sección de la skin de 1920x1080 y crear un CanvasTexture con NearestFilter
    const createSubTexture = (
      srcX: number,
      srcY: number,
      srcW: number,
      srcH: number,
      rotateDeg: number = 0,
      flipH: boolean = false
    ): THREE.CanvasTexture => {
      return createSubTextureFromCanvas(skinCanvas, srcX, srcY, srcW, srcH, rotateDeg, flipH);
    };

    // Helper para extraer textura de una parte desde la skin escalada respetando rotación/espejo activo
    const getPartTexture = (
      partId: string,
      cfg: { x: number; y: number; w: number; h: number; rot?: number; flip?: boolean }
    ): THREE.CanvasTexture => {
      const part = parts?.find((p) => p.id === partId);
      const rot = part?.rotateDeg !== undefined ? (part.rotateDeg + (cfg.rot || 0)) : (cfg.rot || 0);
      const flip = part?.mirrorHorizontal !== undefined ? (part.mirrorHorizontal !== !(cfg.flip)) : (cfg.flip || false);
      const srcX = part?.source ? part.source.x : cfg.x;
      const srcY = part?.source ? part.source.y : cfg.y;
      const srcW = part?.source ? part.source.width : cfg.w;
      const srcH = part?.source ? part.source.height : cfg.h;
      return createSubTexture(srcX, srcY, srcW, srcH, rot, flip);
    };

    const makeMat = (tex?: THREE.CanvasTexture, defaultColor: number = 0xe5a67c) => {
      const mat = new THREE.MeshStandardMaterial({
        color: tex ? 0xffffff : defaultColor,
        roughness: 0.6,
      });
      if (tex) mat.map = tex;
      return mat;
    };

    // Materiales por cara para la CABEZA (Base - Capa Primaria sin tocar):
    // Three.js BoxGeometry material array order: [+X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)]
    const headMats = [
      makeMat(getPartTexture('cabeza-derecha', { x: 480, y: 136, w: 236, h: 134, rot: -90 })), // Right
      makeMat(getPartTexture('cabeza-izquierda', { x: 0, y: 136, w: 236, h: 134, rot: 90 })), // Left
      makeMat(getPartTexture('cabeza-arriba', { x: 241, y: 0, w: 236, h: 134 })), // Top
      makeMat(getPartTexture('cabeza-abajo', { x: 480, y: 0, w: 236, h: 134, rot: 0 })), // Bottom
      makeMat(getPartTexture('cabeza-front', { x: 241, y: 136, w: 236, h: 134 })), // Front
      makeMat(getPartTexture('cabeza-atras', { x: 720, y: 135, w: 236, h: 134, rot: -180 })), // Back
    ];

    // Materiales por cara para el TORSO [+X (right), -X (left), +Y (top), -Y (bottom), +Z (front/pecho), -Z (back/espalda)]
    // Minecraft skin UV (64x64 → 1920x1080, scaleX=30, scaleY=16.875):
    //   Body front:  (20,20)→(28,32) = x:600, y:337, w:240, h:203
    //   Body right:  (16,20)→(20,32) = x:480, y:337, w:120, h:203
    //   Body left:   (28,20)→(32,32) = x:840, y:337, w:120, h:203
    //   Body back:   (32,20)→(40,32) = x:960, y:337, w:240, h:203
    //   Body top:    (20,16)→(28,20) = x:600, y:270, w:240, h:68
    const capuchaPart = parts?.find((p) => p.id === 'capucha-trasera');

    const torsoFrontTex = createSubTexture(600, 337, 240, 203);
    const torsoBackTex = createSubTexture(960, 337, 240, 203);
    const torsoRightTex = createSubTexture(480, 337, 120, 203);
    const torsoLeftTex = createSubTexture(840, 337, 120, 203);
    const torsoTopTex = capuchaPart && skinCanvas
      ? createSubTexture(capuchaPart.source.x, capuchaPart.source.y, capuchaPart.source.width, capuchaPart.source.height)
      : createSubTexture(600, 270, 240, 68);

    const torsoMats = [
      makeMat(torsoRightTex, 0x059669), // Right (+X)
      makeMat(torsoLeftTex, 0x059669),  // Left (-X)
      makeMat(torsoTopTex, 0x059669),   // Top (+Y)
      makeMat(undefined, 0x059669),     // Bottom (-Y)
      makeMat(torsoFrontTex, 0x059669), // Front (+Z Pecho)
      makeMat(torsoBackTex, 0x059669),  // Back (-Z Espalda)
    ];

    // Materiales para BRAZOS
    const armLeftMats = [
      makeMat(getPartTexture('brazo-izq-der', { x: 1200, y: 876, w: 120, h: 204 })), // Right
      makeMat(getPartTexture('brazo-izq-izq', { x: 960, y: 876, w: 119, h: 204 })),  // Left
      makeMat(getPartTexture('brazo-izq-hombro', { x: 1080, y: 793, w: 120, h: 68 })),  // Top (Hombro)
      makeMat(getPartTexture('brazo-izq-mano', { x: 1200, y: 809, w: 120, h: 68, flip: true })),  // Bottom (Mano)
      makeMat(getPartTexture('brazo-izq-adelante', { x: 1080, y: 876, w: 120, h: 204 })), // Front
      makeMat(getPartTexture('brazo-izq-atras', { x: 1321, y: 876, w: 120, h: 204 })), // Back
    ];

    const armRightMats = [
      makeMat(getPartTexture('brazo-der-der', { x: 1440, y: 337, w: 120, h: 204 })), // Right
      makeMat(getPartTexture('brazo-der-izq', { x: 1200, y: 337, w: 120, h: 204 })), // Left
      makeMat(getPartTexture('brazo-der-hombro', { x: 1320, y: 270, w: 120, h: 68 })),  // Top (Hombro)
      makeMat(getPartTexture('brazo-der-mano', { x: 1440, y: 270, w: 120, h: 68, flip: true })),  // Bottom (Mano)
      makeMat(getPartTexture('brazo-der-adelante', { x: 1320, y: 337, w: 120, h: 204 })), // Front
      makeMat(getPartTexture('brazo-der-atras', { x: 1560, y: 337, w: 120, h: 204 })), // Back
    ];

    // Materiales para PIERNAS — directo de la skin sin rotaciones
    // Minecraft skin UV (pierna derecha del personaje):
    //   Front: (4,20)→(8,32) = x:120, y:337, w:120, h:204
    //   Right: (0,20)→(4,32) = x:0,   y:337, w:120, h:204
    //   Left:  (8,20)→(12,32)= x:240, y:337, w:120, h:204
    //   Back: (12,20)→(16,32)= x:360, y:337, w:120, h:204
    //   Top:   (4,16)→(8,20) = x:120, y:270, w:120, h:68
    //   Bot:   (8,16)→(12,20)= x:240, y:270, w:120, h:68
    // Minecraft skin UV (pierna izquierda del personaje, 64x64 format):
    //   Front: (20,52)→(24,64) = x:600, y:876, w:120, h:204
    //   Right: (16,52)→(20,64) = x:480, y:876, w:120, h:204
    //   Left:  (24,52)→(28,64) = x:720, y:876, w:120, h:204
    //   Back:  (28,52)→(32,64) = x:840, y:876, w:120, h:204
    //   Top:   (20,48)→(24,52) = x:600, y:810, w:120, h:68
    //   Bot:   (24,48)→(28,52) = x:720, y:810, w:120, h:68
    const legLeftMats = [
      makeMat(createSubTexture(720, 876, 120, 204)), // Right (+X)
      makeMat(createSubTexture(480, 876, 120, 204)), // Left (-X)
      makeMat(createSubTexture(600, 810, 120, 68)),  // Top (+Y Muslo)
      makeMat(createSubTexture(720, 810, 120, 68, 180)),  // Bottom (-Y Pie)
      makeMat(createSubTexture(600, 876, 120, 204)), // Front (+Z)
      makeMat(createSubTexture(840, 876, 120, 204)), // Back (-Z)
    ];

    const legRightMats = [
      makeMat(createSubTexture(0, 337, 120, 204)),   // Right (+X)
      makeMat(createSubTexture(240, 337, 120, 204)), // Left (-X)
      makeMat(createSubTexture(120, 270, 120, 68)),  // Top (+Y Muslo)
      makeMat(createSubTexture(240, 270, 120, 68, 180)),  // Bottom (-Y Pie)
      makeMat(createSubTexture(120, 337, 120, 204)), // Front (+Z)
      makeMat(createSubTexture(360, 337, 120, 204)), // Back (-Z)
    ];

    materialsRef.current = [
      ...headMats,
      ...torsoMats,
      ...armLeftMats,
      ...armRightMats,
      ...legLeftMats,
      ...legRightMats,
    ];

    // Material para la segunda capa (Overlay 3D) con canal alfa y descarte de fragmentos vacíos
    const makeOverlayMat = (tex?: THREE.CanvasTexture) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.6,
        transparent: true,
        alphaTest: 0.1,
        depthWrite: true,
        side: THREE.DoubleSide,
      });
      if (tex) mat.map = tex;
      materialsRef.current.push(mat);
      return mat;
    };

    // Materiales de CABEZA (Segunda Capa / Sombrero / Pelo 3D: shift +960 en X)
    // Derecha (+X) es u:32 (x:960) con 90°; Izquierda (-X) es u:48 (x:1440) con -90°; Atrás (-Z) con 180°
    const headOverlayMats = [
      makeOverlayMat(createSubTexture(960, 136, 236, 134, 0, true)),   // Right (+X): 90°
      makeOverlayMat(createSubTexture(1440, 136, 236, 134, 0, true)), // Left (-X): -90°
      makeOverlayMat(createSubTexture(1201, 0, 236, 134, 0)),     // Top (+Y): 0°
      makeOverlayMat(createSubTexture(1440, 0, 236, 134, 180)),     // Bottom (-Y): 0°
      makeOverlayMat(createSubTexture(1201, 136, 236, 134, 0)),   // Front (+Z): 0°
      makeOverlayMat(createSubTexture(1680, 135, 236, 134, 0, true)), // Back (-Z): 180°
    ];

    // Materiales de TORSO (Segunda Capa / Chaqueta 3D: shift +270 en Y)
    const torsoOverlayMats = [
      makeOverlayMat(createSubTexture(480, 607, 120, 203)), // Right (+X)
      makeOverlayMat(createSubTexture(840, 607, 120, 203)), // Left (-X)
      makeOverlayMat(createSubTexture(600, 540, 240, 68)),  // Top (+Y)
      makeOverlayMat(createSubTexture(840, 540, 240, 68)),  // Bottom (-Y)
      makeOverlayMat(createSubTexture(600, 607, 240, 203)), // Front (+Z Pecho)
      makeOverlayMat(createSubTexture(960, 607, 240, 203)), // Back (-Z Espalda / Espada)
    ];

    // Materiales de BRAZO IZQUIERDO (Segunda Capa / Manga 3D: shift +480 en X)
    const armLeftOverlayMats = [
      makeOverlayMat(createSubTexture(1680, 876, 120, 204)),
      makeOverlayMat(createSubTexture(1440, 876, 119, 204)),
      makeOverlayMat(createSubTexture(1560, 793, 120, 68)),
      makeOverlayMat(createSubTexture(1680, 809, 120, 68, -180, true)),
      makeOverlayMat(createSubTexture(1560, 876, 120, 204)),
      makeOverlayMat(createSubTexture(1801, 876, 120, 204)),
    ];

    // Materiales de BRAZO DERECHO (Segunda Capa / Manga 3D: shift +270 en Y)
    const armRightOverlayMats = [
      makeOverlayMat(createSubTexture(1440, 607, 120, 204)),
      makeOverlayMat(createSubTexture(1200, 607, 120, 204)),
      makeOverlayMat(createSubTexture(1320, 540, 120, 68)),
      makeOverlayMat(createSubTexture(1440, 540, 120, 68, 180, true)),
      makeOverlayMat(createSubTexture(1320, 607, 120, 204)),
      makeOverlayMat(createSubTexture(1560, 607, 120, 204)),
    ];

    // Pierna Izquierda (Segunda Capa / Pantalón 3D: shift -480 en X)
    const legLeftOverlayMats = [
      makeOverlayMat(createSubTexture(240, 876, 120, 204)),
      makeOverlayMat(createSubTexture(0, 876, 120, 204)),
      makeOverlayMat(createSubTexture(120, 810, 120, 68)),
      makeOverlayMat(createSubTexture(240, 810, 120, 68, 180)),
      makeOverlayMat(createSubTexture(120, 876, 120, 204)),
      makeOverlayMat(createSubTexture(360, 876, 120, 204)),
    ];

    // Pierna Derecha (Segunda Capa / Pantalón 3D: shift +270 en Y)
    const legRightOverlayMats = [
      makeOverlayMat(createSubTexture(0, 607, 120, 204)),
      makeOverlayMat(createSubTexture(240, 607, 120, 204)),
      makeOverlayMat(createSubTexture(120, 540, 120, 68)),
      makeOverlayMat(createSubTexture(240, 540, 120, 68, 180)),
      makeOverlayMat(createSubTexture(120, 607, 120, 204)),
      makeOverlayMat(createSubTexture(360, 607, 120, 204)),
    ];

    // Posiciones calculadas para que cada pieza encastre sin huecos y descanse SOBRE el pedestal (top = -1.44):
    // Desplazamiento global Y = +0.16
    // Head:  h=1.5, center=0.71  → top=1.46, bottom=-0.04
    // Body:  h=0.85, center=-0.465 → top=-0.04, bottom=-0.89
    // Legs:  h=0.55, center=-1.165 → top=-0.89, bottom=-1.44
    // Arms:  h=0.75, center=-0.56

    // 1. Oversized Head (Funko chibi) - 6 caras independientes desarmables + overlay 3D
    createExplodedBox(
      funkoGroup,
      1.6, 1.5, 1.4,
      BASE_POSITIONS.head,
      [
        { partId: 'cabeza-front', material: headMats[4], face: 'front' },
        { partId: 'cabeza-atras', material: headMats[5], face: 'back' },
        { partId: 'cabeza-derecha', material: headMats[0], face: 'right' },
        { partId: 'cabeza-izquierda', material: headMats[1], face: 'left' },
        { partId: 'cabeza-arriba', material: headMats[2], face: 'top' },
        { partId: 'cabeza-abajo', material: headMats[3], face: 'bottom' },
      ],
      faceMeshesRef.current,
      0,
      headOverlayMats,
      0.04,
      overlayMeshesRef.current,
      showOverlay3DRef.current
    );

    // 2. Body / Torso - Caras independientes desarmables + overlay 3D
    createExplodedBox(
      funkoGroup,
      0.9, 0.85, 0.65,
      BASE_POSITIONS.body,
      [
        { partId: 'pecho-delantero', material: torsoMats[4], face: 'front' },
        { partId: 'pecho-trasero', material: torsoMats[5], face: 'back' },
        { partId: 'pecho-der', material: torsoMats[0], face: 'right' },
        { partId: 'pecho-izq', material: torsoMats[1], face: 'left' },
        { partId: 'capucha-trasera', material: torsoMats[2], face: 'top' },
        { partId: 'cuello-capucha', material: torsoMats[3], face: 'bottom' },
      ],
      faceMeshesRef.current,
      0,
      torsoOverlayMats,
      0.04,
      overlayMeshesRef.current,
      showOverlay3DRef.current
    );

    // 3. Brazo Izquierdo (Character Left / Screen Right: +X)
    createExplodedBox(
      funkoGroup,
      0.28, 0.75, 0.28,
      BASE_POSITIONS.leftArm,
      [
        { partId: 'brazo-izq-adelante', material: armLeftMats[4], face: 'front' },
        { partId: 'brazo-izq-atras', material: armLeftMats[5], face: 'back' },
        { partId: 'brazo-izq-der', material: armLeftMats[0], face: 'right' },
        { partId: 'brazo-izq-izq', material: armLeftMats[1], face: 'left' },
        { partId: 'brazo-izq-hombro', material: armLeftMats[2], face: 'top' },
        { partId: 'brazo-izq-mano', material: armLeftMats[3], face: 'bottom' },
      ],
      faceMeshesRef.current,
      -0.08,
      armLeftOverlayMats,
      0.04,
      overlayMeshesRef.current,
      showOverlay3DRef.current
    );

    // 4. Brazo Derecho (Character Right / Screen Left: -X)
    createExplodedBox(
      funkoGroup,
      0.28, 0.75, 0.28,
      BASE_POSITIONS.rightArm,
      [
        { partId: 'brazo-der-adelante', material: armRightMats[4], face: 'front' },
        { partId: 'brazo-der-atras', material: armRightMats[5], face: 'back' },
        { partId: 'brazo-der-der', material: armRightMats[0], face: 'right' },
        { partId: 'brazo-der-izq', material: armRightMats[1], face: 'left' },
        { partId: 'brazo-der-hombro', material: armRightMats[2], face: 'top' },
        { partId: 'brazo-der-mano', material: armRightMats[3], face: 'bottom' },
      ],
      faceMeshesRef.current,
      0.08,
      armRightOverlayMats,
      0.04,
      overlayMeshesRef.current,
      showOverlay3DRef.current
    );

    // 5. Pierna Izquierda (Character Left / Screen Right: +X)
    createExplodedBox(
      funkoGroup,
      0.36, 0.55, 0.36,
      BASE_POSITIONS.leftLeg,
      [
        { partId: 'pierna-izq-adelante', material: legLeftMats[4], face: 'front' },
        { partId: 'pierna-izq-atras', material: legLeftMats[5], face: 'back' },
        { partId: 'pierna-izq-der', material: legLeftMats[0], face: 'right' },
        { partId: 'pierna-izq-izq', material: legLeftMats[1], face: 'left' },
        { partId: 'pierna-izq-muslo', material: legLeftMats[2], face: 'top' },
        { partId: 'pierna-izq-pie', material: legLeftMats[3], face: 'bottom' },
      ],
      faceMeshesRef.current,
      0,
      legLeftOverlayMats,
      0.04,
      overlayMeshesRef.current,
      showOverlay3DRef.current
    );

    // 6. Pierna Derecha (Character Right / Screen Left: -X)
    createExplodedBox(
      funkoGroup,
      0.36, 0.55, 0.36,
      BASE_POSITIONS.rightLeg,
      [
        { partId: 'pierna-der-adelante', material: legRightMats[4], face: 'front' },
        { partId: 'pierna-der-atras', material: legRightMats[5], face: 'back' },
        { partId: 'pierna-der-der', material: legRightMats[0], face: 'right' },
        { partId: 'pierna-der-izq', material: legRightMats[1], face: 'left' },
        { partId: 'pierna-der-muslo', material: legRightMats[2], face: 'top' },
        { partId: 'pierna-der-pie', material: legRightMats[3], face: 'bottom' },
      ],
      faceMeshesRef.current,
      0,
      legRightOverlayMats,
      0.04,
      overlayMeshesRef.current,
      showOverlay3DRef.current
    );


    // 7. Orbit Controls para navegación 3D profesional y libertad angular completa
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.05, 0);
    // Rango vertical de 180°: desde la coronilla (0.01) hasta debajo de los pies (Math.PI - 0.01)
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI - 0.01;
    // Rango de zoom cómodo
    controls.minDistance = 1.2;
    controls.maxDistance = 15;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 1.6;
    controlsRef.current = controls;

    // Animation Loop
    // Animation Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      // Si el contenedor está oculto (tab en background), no procesar frames en GPU
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
        return;
      }

      // Si hay una pieza seleccionada, pausar rotación y rotar suavemente el personaje al frente (neutral front)
      if (selectedPartIdRef.current) {
        funkoGroup.rotation.y += (0 - funkoGroup.rotation.y) * 0.08;
        baseMesh.rotation.y += (0 - baseMesh.rotation.y) * 0.08;
        camera.position.lerp(targetCameraPosRef.current, 0.08);
        controls.target.lerp(targetLookAtRef.current, 0.08);
        camera.lookAt(controls.target);
      } else {
        controls.autoRotate = autoRotateRef.current;
        controls.update();
        if (ringMesh && autoRotateRef.current) {
          ringMesh.rotation.z += 0.008;
        }
      }

      // Desvanecimiento suave de la peana cuando la cámara mira desde abajo para no tapar los pies
      const polarAngle = controls.getPolarAngle();
      const fadeStart = 1.65; // ~95°
      const fadeEnd = 2.05;   // ~117°
      let baseOpacity = 1;
      if (polarAngle > fadeStart) {
        const factor = Math.max(0, Math.min(1, (polarAngle - fadeStart) / (fadeEnd - fadeStart)));
        baseOpacity = 1 - factor;
      }
      baseMat.opacity = baseOpacity;
      ringMat.opacity = baseOpacity;
      baseMesh.visible = baseOpacity > 0.01;
      ringMesh.visible = baseOpacity > 0.01;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      controls.dispose();
      faceMeshesRef.current.clear();
      overlayMeshesRef.current = [];
      renderer.dispose();
    };
  }, [skinCanvas, skinFormat]);

  // Actualización reactiva ultrarrápida de cada cara independiente según el desfasaje del 2D (O(1) por cara)
  useEffect(() => {
    const SCALE_2D_TO_3D = 0.007;
    const defaultParts = FUNKO_GROOVER_CONFIG.parts;
    const defaultMap = new Map(defaultParts.map((p) => [p.id, p]));

    let anyDisplaced = false;

    if (parts) {
      for (const part of parts) {
        const entry = faceMeshesRef.current.get(part.id);
        if (!entry) continue;

        const def = defaultMap.get(part.id);
        if (!def) continue;

        const dx = part.destination.x - def.destination.x;
        const dy = part.destination.y - def.destination.y;

        const dist = Math.hypot(dx, dy);
        if (dist > 1.5) {
          anyDisplaced = true;
          // Separación suave hacia afuera en la normal de la cara para que despegue en 3D
          const normalPush = Math.min(0.3, dist * 0.003);
          entry.mesh.position.x = entry.basePos.x + dx * SCALE_2D_TO_3D + entry.normal.x * normalPush;
          entry.mesh.position.y = entry.basePos.y - dy * SCALE_2D_TO_3D + entry.normal.y * normalPush;
          entry.mesh.position.z = entry.basePos.z + entry.normal.z * normalPush;
        } else {
          entry.mesh.position.copy(entry.basePos);
        }
      }
    }

    setIsAligned(!anyDisplaced);
  }, [parts]);

  // Hot-swap de textura en tiempo real (O(1)) para la cara específica cuando cambia rotación/espejo/fuente en 2D
  const lastPropsRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (!parts || !skinCanvas) return;
    for (const part of parts) {
      const entry = faceMeshesRef.current.get(part.id);
      if (!entry) continue;

      const cfg = DEFAULT_FACE_CFGS[part.id];
      if (!cfg) continue;

      const key = `${part.rotateDeg || 0}_${!!part.mirrorHorizontal}_${part.source.x}_${part.source.y}_${part.source.width}_${part.source.height}`;
      const prev = lastPropsRef.current.get(part.id);
      if (prev !== undefined && prev !== key) {
        const rot = part.rotateDeg !== undefined ? (part.rotateDeg + (cfg.rot || 0)) : (cfg.rot || 0);
        const flip = part.mirrorHorizontal !== undefined ? (part.mirrorHorizontal !== !(cfg.flip)) : (cfg.flip || false);
        const src = part.source || cfg;
        const newTex = createSubTextureFromCanvas(skinCanvas, src.x, src.y, src.width || cfg.w, src.height || cfg.h, rot, flip);
        const mat = entry.mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          if (mat.map) mat.map.dispose();
          mat.map = newTex;
          mat.needsUpdate = true;
        }
      }
      lastPropsRef.current.set(part.id, key);
    }
  }, [parts, skinCanvas]);

  // Alternar visibilidad de la capa 3D (Overlay) en tiempo real
  useEffect(() => {
    overlayMeshesRef.current.forEach((mesh) => {
      mesh.visible = showOverlay3D;
    });
  }, [showOverlay3D]);

  const toggleWireframe = () => {
    setWireframe((prev) => !prev);
    materialsRef.current.forEach((m) => {
      m.wireframe = !wireframe;
    });
  };

  const resetCamera = () => {
    targetCameraPosRef.current.set(0, 0.45, 5.6);
    targetLookAtRef.current.set(0, 0.05, 0);
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0.45, 5.6);
      cameraRef.current.lookAt(0, 0.05, 0);
    }
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.05, 0);
      controlsRef.current.update();
    }
    if (funkoGroupRef.current) {
      funkoGroupRef.current.rotation.set(0, 0, 0);
    }
    if (baseMeshRef.current) {
      baseMeshRef.current.rotation.set(0, 0, 0);
    }
    if (ringMeshRef.current) {
      ringMeshRef.current.rotation.set(Math.PI / 2, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#0e1626] via-[#090d16] to-[#04070d] flex items-center justify-center select-none">
      {/* Lights glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Mount for Three.js Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1.5">
          {selectedPartId && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono border font-medium bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm animate-pulse">
              Modo Focus: {parts?.find((p) => p.id === selectedPartId)?.name || selectedPartId}
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${
              skinFormat === 'legacy'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
            }`}
          >
            {skinFormat === 'legacy' ? 'Skin Clásica (64×32)' : 'Skin Estándar (64×64)'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium transition-colors ${
              isAligned
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm animate-pulse'
            }`}
          >
            {isAligned ? '✓ Molde Alineado' : '⚠ Pieza Desplazada'}
          </span>
          <div className="bg-[#1c1f29]/70 backdrop-blur px-2.5 py-0.5 rounded text-[10px] font-mono text-[#bbcabf] border border-[#262a34]">
            Cabeza: 160% · Torso: 90%
          </div>
        </div>
      </div>

      {/* Bottom Floating Controls */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center z-20 pointer-events-none">
        <div className="pointer-events-auto bg-[#262a34]/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl border border-[#3c4a42] text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#dfe2ef] hover:text-emerald-400 select-none px-1.5 py-0.5 rounded transition-colors">
            <input
              type="checkbox"
              checked={showOverlay3D}
              onChange={(e) => setShowOverlay3D(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#3c4a42] bg-[#1c1f29] text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
            />
            <span className={showOverlay3D ? 'text-emerald-400 font-medium' : 'text-[#dfe2ef]'}>
              Relieve 3D
            </span>
          </label>
          <span className="text-[#3c4a42]">|</span>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              autoRotate ? 'text-emerald-400' : 'text-[#dfe2ef] hover:text-emerald-400'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            <span>{autoRotate ? 'Pausar' : 'Girar'}</span>
          </button>
          <span className="text-[#3c4a42]">|</span>
          <button
            onClick={toggleWireframe}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              wireframe ? 'text-[#4cd7f6]' : 'text-[#dfe2ef] hover:text-[#4cd7f6]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>
           <span className="text-[#3c4a42]">|</span>
          <button
            onClick={resetCamera}
            className="flex items-center gap-1 text-[#dfe2ef] hover:text-emerald-400 px-2 py-0.5 rounded transition-colors"
          >
            <span>Reset Cam</span>
          </button>
        </div>
      </div>
    </div>
  );
};
