import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Maximize2, Sparkles } from 'lucide-react';

import type { PartTransformation } from '../../core/engine/types';

interface FunkoViewer3DProps {
  skinCanvas: HTMLCanvasElement | null;
  rendered2DCanvas?: HTMLCanvasElement | null;
  parts?: PartTransformation[];
}

export const FunkoViewer3D: React.FC<FunkoViewer3DProps> = ({ skinCanvas, rendered2DCanvas, parts }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const funkoGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.5;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // Neon Ring
    const ringGeo = new THREE.TorusGeometry(1.78, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.44;
    scene.add(ringMesh);

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
      const subCanvas = document.createElement('canvas');
      subCanvas.width = srcW;
      subCanvas.height = srcH;
      const ctx = subCanvas.getContext('2d');
      if (ctx && skinCanvas) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(skinCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      }

      // Rotación y/o espejo si aplica
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
      return tex;
    };

    // Helper que extrae la textura DIRECTAMENTE del lienzo 2D impreso
    // de modo que cualquier ajuste en el lienzo (coordenadas, rotación, escala)
    // se refleje idéntico en el modelo 3D
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

      // Recortar exactamente la pieza del molde 2D
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

      // Compensar o aplicar rotación para que quede orientada verticalmente en el cubo 3D
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
      return tex;
    };

    // Helper para extraer textura de una parte desde la skin escalada
    const getPartTexture = (
      _partId: string,
      cfg: { x: number; y: number; w: number; h: number; rot?: number; flip?: boolean }
    ): THREE.CanvasTexture => {
      return createSubTexture(cfg.x, cfg.y, cfg.w, cfg.h, cfg.rot || 0, cfg.flip || false);
    };

    const makeMat = (tex?: THREE.CanvasTexture, defaultColor: number = 0xe5a67c) =>
      new THREE.MeshStandardMaterial({
        color: tex ? 0xffffff : defaultColor,
        map: tex || undefined,
        roughness: 0.6,
      });

    // Materiales por cara para la CABEZA:
    // Three.js BoxGeometry material array order: [+X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)]
    const headMats = [
      makeMat(getTextureFrom2DSheet('cabeza-derecha', 90) || getPartTexture('cabeza-derecha', { x: 480, y: 136, w: 236, h: 134, rot: -90 })), // Right
      makeMat(getTextureFrom2DSheet('cabeza-izquierda', -90) || getPartTexture('cabeza-izquierda', { x: 0, y: 136, w: 236, h: 134, rot: 90 })),   // Left
      makeMat(getTextureFrom2DSheet('cabeza-arriba', 0) || getPartTexture('cabeza-arriba', { x: 241, y: 0, w: 236, h: 134 })),              // Top
      makeMat(getTextureFrom2DSheet('cabeza-abajo', 180) || getPartTexture('cabeza-abajo', { x: 480, y: 0, w: 236, h: 134, rot: -180 })),    // Bottom
      makeMat(getTextureFrom2DSheet('cabeza-front', 0) || getPartTexture('cabeza-front', { x: 241, y: 136, w: 236, h: 134 })),             // Front
      makeMat(getTextureFrom2DSheet('cabeza-atras', 180) || getPartTexture('cabeza-atras', { x: 720, y: 135, w: 236, h: 134, rot: -180 })),  // Back
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
      makeMat(getTextureFrom2DSheet('brazo-izq-der') || getPartTexture('brazo-izq-der', { x: 1200, y: 876, w: 120, h: 204 })), // Right
      makeMat(getTextureFrom2DSheet('brazo-izq-izq') || getPartTexture('brazo-izq-izq', { x: 960, y: 876, w: 119, h: 204 })),  // Left
      makeMat(getTextureFrom2DSheet('brazo-izq-hombro') || getPartTexture('brazo-izq-hombro', { x: 1080, y: 793, w: 120, h: 68 })),  // Top (Hombro)
      makeMat(getTextureFrom2DSheet('brazo-izq-mano') || getPartTexture('brazo-izq-mano', { x: 1200, y: 809, w: 120, h: 68, flip: true })),  // Bottom (Mano)
      makeMat(getTextureFrom2DSheet('brazo-izq-adelante') || getPartTexture('brazo-izq-adelante', { x: 1080, y: 876, w: 120, h: 204 })), // Front
      makeMat(getTextureFrom2DSheet('brazo-izq-atras') || getPartTexture('brazo-izq-atras', { x: 1321, y: 876, w: 120, h: 204 })), // Back
    ];

    const armRightMats = [
      makeMat(getTextureFrom2DSheet('brazo-der-der') || getPartTexture('brazo-der-der', { x: 1440, y: 337, w: 120, h: 204 })), // Right
      makeMat(getTextureFrom2DSheet('brazo-der-izq') || getPartTexture('brazo-der-izq', { x: 1200, y: 337, w: 120, h: 204 })), // Left
      makeMat(getTextureFrom2DSheet('brazo-der-hombro') || getPartTexture('brazo-der-hombro', { x: 1440, y: 270, w: 120, h: 68 })),  // Top (Hombro)
      makeMat(getTextureFrom2DSheet('brazo-der-mano-espejo') || getPartTexture('brazo-der-mano-espejo', { x: 1320, y: 270, w: 120, h: 68, flip: true })),  // Bottom (Mano)
      makeMat(getTextureFrom2DSheet('brazo-der-adelante') || getPartTexture('brazo-der-adelante', { x: 1320, y: 337, w: 120, h: 204 })), // Front
      makeMat(getTextureFrom2DSheet('brazo-der-atras') || getPartTexture('brazo-der-atras', { x: 1560, y: 337, w: 120, h: 204 })), // Back
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

    // Posiciones calculadas para que cada pieza encastre sin huecos y descanse SOBRE el pedestal (top = -1.44):
    // Desplazamiento global Y = +0.16
    // Head:  h=1.5, center=0.71  → top=1.46, bottom=-0.04
    // Body:  h=0.85, center=-0.465 → top=-0.04, bottom=-0.89
    // Legs:  h=0.55, center=-1.165 → top=-0.89, bottom=-1.44
    // Arms:  h=0.75, center=-0.56

    // 1. Oversized Head (Funko chibi)
    const headGeo = new THREE.BoxGeometry(1.6, 1.5, 1.4);
    const headMesh = new THREE.Mesh(headGeo, headMats);
    headMesh.position.y = 0.71;
    headMesh.castShadow = true;
    funkoGroup.add(headMesh);

    // 2. Body / Torso
    const bodyGeo = new THREE.BoxGeometry(0.9, 0.85, 0.65);
    const bodyMesh = new THREE.Mesh(bodyGeo, torsoMats);
    bodyMesh.position.y = -0.465;
    bodyMesh.castShadow = true;
    funkoGroup.add(bodyMesh);

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.28, 0.75, 0.28);
    const leftArm = new THREE.Mesh(armGeo, armLeftMats);
    leftArm.position.set(-0.62, -0.56, 0);
    leftArm.rotation.z = 0.08;
    funkoGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armRightMats);
    rightArm.position.set(0.62, -0.56, 0);
    rightArm.rotation.z = -0.08;
    funkoGroup.add(rightArm);

    // 4. Legs
    const legGeo = new THREE.BoxGeometry(0.36, 0.55, 0.36);
    const leftLeg = new THREE.Mesh(legGeo, legLeftMats);
    leftLeg.position.set(-0.22, -1.165, 0);
    funkoGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legRightMats);
    rightLeg.position.set(0.22, -1.165, 0);
    funkoGroup.add(rightLeg);


    // Interactive Drag
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      funkoGroup.rotation.y += deltaX * 0.01;
      baseMesh.rotation.y += deltaX * 0.01;
      ringMesh.rotation.z += deltaX * 0.01;

      camera.position.y = Math.max(-0.5, Math.min(3.5, camera.position.y - deltaY * 0.01));
      camera.lookAt(0, 0, 0);

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let reqId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (autoRotate && !isDragging) {
        funkoGroup.rotation.y += 0.008;
        baseMesh.rotation.y += 0.008;
        ringMesh.rotation.z += 0.008;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
    };
  }, [skinCanvas, rendered2DCanvas, autoRotate, parts]);

  const toggleWireframe = () => {
    setWireframe((prev) => !prev);
    materialsRef.current.forEach((m) => {
      m.wireframe = !wireframe;
    });
  };

  const resetCamera = () => {
    if (funkoGroupRef.current) {
      funkoGroupRef.current.rotation.set(0, 0, 0);
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
        <div className="bg-[#262a34]/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow border border-[#3c4a42]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs text-[#dfe2ef]">Proporción Funko Chibi</span>
        </div>
        <div className="bg-[#1c1f29]/70 backdrop-blur px-2.5 py-0.5 rounded text-[10px] font-mono text-[#bbcabf] border border-[#262a34]">
          Cabeza: 160% · Torso: 90% · Acabado: Mate
        </div>
      </div>

      {/* Bottom Floating Controls */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center z-20 pointer-events-none">
        <div className="pointer-events-auto bg-[#262a34]/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl border border-[#3c4a42] text-xs">
          <div className="flex items-center gap-1 text-[#bbcabf] pr-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Arrastrá para rotar</span>
          </div>
          <span className="text-[#3c4a42]">|</span>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              autoRotate ? 'text-emerald-400' : 'text-[#dfe2ef] hover:text-emerald-400'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{autoRotate ? 'Pausar' : 'Girar 360°'}</span>
          </button>
          <button
            onClick={toggleWireframe}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              wireframe ? 'text-[#4cd7f6]' : 'text-[#dfe2ef] hover:text-[#4cd7f6]'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>
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
