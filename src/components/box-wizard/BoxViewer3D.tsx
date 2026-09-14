import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BoxCustomizationConfig } from './types';
import type { PartTransformation } from '../../core/engine/types';
import { buildFunkoMeshGroup } from '../../core/engine/funkoMeshBuilder';
import { composeAllBoxFaces } from '../../core/engine/boxTextureComposer';

interface BoxViewer3DProps {
  config: BoxCustomizationConfig;
  skinCanvas: HTMLCanvasElement | null;
  rendered2DCanvas?: HTMLCanvasElement | null;
  parts?: PartTransformation[];
  rotationAngle: number;
  onRotationChange?: (angle: number) => void;
}

export const BoxViewer3D: React.FC<BoxViewer3DProps> = ({
  config,
  skinCanvas,
  rendered2DCanvas,
  parts,
  rotationAngle,
  onRotationChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boxRootRef = useRef<THREE.Group | null>(null);

  // Mallas de las 6 caras exteriores de la caja
  const frontMeshRef = useRef<THREE.Mesh | null>(null);
  const backMeshRef = useRef<THREE.Mesh | null>(null);
  const leftMeshRef = useRef<THREE.Mesh | null>(null);
  const rightMeshRef = useRef<THREE.Mesh | null>(null);
  const topMeshRef = useRef<THREE.Mesh | null>(null);
  const bottomMeshRef = useRef<THREE.Mesh | null>(null);

  // Mallas del diorama interior (fondo, lateral y piso)
  const dioramaBackMeshRef = useRef<THREE.Mesh | null>(null);
  const dioramaLeftMeshRef = useRef<THREE.Mesh | null>(null);
  const dioramaFloorMeshRef = useRef<THREE.Mesh | null>(null);

  // Texturas activas para gestión de memoria y liberación de VRAM
  const texturesRef = useRef<{
    front: THREE.CanvasTexture | null;
    back: THREE.CanvasTexture | null;
    left: THREE.CanvasTexture | null;
    right: THREE.CanvasTexture | null;
    top: THREE.CanvasTexture | null;
    bottom: THREE.CanvasTexture | null;
    diorama: THREE.CanvasTexture | null;
  }>({
    front: null,
    back: null,
    left: null,
    right: null,
    top: null,
    bottom: null,
    diorama: null,
  });

  const animationFrameIdRef = useRef<number | null>(null);

  // Dimensiones exactas basadas en el plano físico real (hojas 1, 2 y 3)
  // Ancho: 1535px, Alto: 1653px, Profundidad: 1388px -> Ratios: 2.60 : 2.80 : 2.35
  const BOX_W = 2.6;
  const BOX_H = 2.8;
  const BOX_D = 2.35;

  // Inicializar Escena Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // 1. Escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Cámara (focal óptimo para caja física de proporciones reales)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 7.2);
    camera.lookAt(0, 0, 0);

    // 3. Renderer WebGL optimizado
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Iluminación de Vitrina Coleccionista
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    fillLight.position.set(-5, 3, -2);
    scene.add(fillLight);

    const blisterGlintLight = new THREE.PointLight(0xffffff, 1.3, 12);
    blisterGlintLight.position.set(1.5, 1.5, 4.5);
    scene.add(blisterGlintLight);

    // 5. Grupo Raíz de la Caja
    const boxRoot = new THREE.Group();
    scene.add(boxRoot);
    boxRootRef.current = boxRoot;

    // 6. Sombra de Contacto en el Suelo
    const shadowGeo = new THREE.PlaneGeometry(BOX_W * 1.5, BOX_D * 1.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -BOX_H / 2 - 0.02;
    boxRoot.add(shadowMesh);

    // 7. Paneles de la Caja Funko Pop
    // A. Diorama Interior (Fondo, Lateral y Piso)
    const dioramaMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
    });

    const dioramaBackGeo = new THREE.PlaneGeometry(BOX_W * 0.97, BOX_H * 0.96);
    const dioramaBackMesh = new THREE.Mesh(dioramaBackGeo, dioramaMat);
    dioramaBackMesh.position.set(0, 0, -BOX_D / 2 + 0.04);
    boxRoot.add(dioramaBackMesh);
    dioramaBackMeshRef.current = dioramaBackMesh;

    const dioramaLeftGeo = new THREE.PlaneGeometry(BOX_D * 0.97, BOX_H * 0.96);
    const dioramaLeftMesh = new THREE.Mesh(dioramaLeftGeo, dioramaMat);
    dioramaLeftMesh.rotation.y = Math.PI / 2;
    dioramaLeftMesh.position.set(-BOX_W / 2 + 0.04, 0, 0);
    boxRoot.add(dioramaLeftMesh);
    dioramaLeftMeshRef.current = dioramaLeftMesh;

    const dioramaFloorGeo = new THREE.PlaneGeometry(BOX_W * 0.97, BOX_D * 0.97);
    const dioramaFloorMesh = new THREE.Mesh(dioramaFloorGeo, dioramaMat);
    dioramaFloorMesh.rotation.x = -Math.PI / 2;
    dioramaFloorMesh.position.set(0, -BOX_H / 2 + 0.04, 0);
    boxRoot.add(dioramaFloorMesh);
    dioramaFloorMeshRef.current = dioramaFloorMesh;

    // B. Panel de Espalda Exterior (-Z)
    const backGeo = new THREE.PlaneGeometry(BOX_W, BOX_H);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: config.finish === 'gloss' ? 0.25 : 0.75,
      metalness: config.finish === 'gloss' ? 0.2 : 0.05,
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.set(0, 0, -BOX_D / 2);
    boxRoot.add(backMesh);
    backMeshRef.current = backMesh;

    // C. Panel Lateral Izquierdo (-X): Pared de piedra con círculo número #1
    const leftGeo = new THREE.PlaneGeometry(BOX_D, BOX_H);
    const leftMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: config.finish === 'gloss' ? 0.25 : 0.75,
      metalness: config.finish === 'gloss' ? 0.2 : 0.05,
    });
    const leftMesh = new THREE.Mesh(leftGeo, leftMat);
    leftMesh.rotation.y = -Math.PI / 2;
    leftMesh.position.set(-BOX_W / 2, 0, 0);
    boxRoot.add(leftMesh);
    leftMeshRef.current = leftMesh;

    // D. Panel Lateral Derecho (+X): Ventana de acetato que envuelve esquina y franja de nombre
    const rightGeo = new THREE.PlaneGeometry(BOX_D, BOX_H);
    const rightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: true,
      roughness: config.finish === 'gloss' ? 0.25 : 0.75,
      metalness: config.finish === 'gloss' ? 0.2 : 0.05,
    });
    const rightMesh = new THREE.Mesh(rightGeo, rightMat);
    rightMesh.rotation.y = Math.PI / 2;
    rightMesh.position.set(BOX_W / 2, 0, 0);
    boxRoot.add(rightMesh);
    rightMeshRef.current = rightMesh;

    // E. Tapa Superior (+Y)
    const capGeo = new THREE.PlaneGeometry(BOX_W, BOX_D);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: config.finish === 'gloss' ? 0.25 : 0.75,
      metalness: config.finish === 'gloss' ? 0.2 : 0.05,
    });
    const topMesh = new THREE.Mesh(capGeo, topMat);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.set(0, BOX_H / 2, 0);
    boxRoot.add(topMesh);
    topMeshRef.current = topMesh;

    // F. Base Inferior (-Y)
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
    });
    const bottomMesh = new THREE.Mesh(capGeo, bottomMat);
    bottomMesh.rotation.x = Math.PI / 2;
    bottomMesh.position.set(0, -BOX_H / 2, 0);
    boxRoot.add(bottomMesh);
    bottomMeshRef.current = bottomMesh;

    // G. Cara Frontal (+Z): Troquel escalonado con avatar peeking
    const frontGeo = new THREE.PlaneGeometry(BOX_W, BOX_H);
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: true,
      roughness: config.finish === 'gloss' ? 0.25 : 0.75,
      metalness: config.finish === 'gloss' ? 0.2 : 0.05,
    });
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.set(0, 0, BOX_D / 2);
    boxRoot.add(frontMesh);
    frontMeshRef.current = frontMesh;

    // H. Acetato Translúcido Doble (Frontal y Lateral) - Ubicado justo detrás del cartón troquelado
    const blisterMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.04,
      metalness: 0.05,
      transmission: 0.96,
      ior: 1.48,
      reflectivity: 0.75,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
    });

    // Blíster Frontal (cara interna del cartón)
    const frontBlisterGeo = new THREE.PlaneGeometry(BOX_W * 0.88, BOX_H * 0.73);
    const frontBlisterMesh = new THREE.Mesh(frontBlisterGeo, blisterMat);
    frontBlisterMesh.position.set(0.12, -0.06, BOX_D / 2 - 0.005);
    boxRoot.add(frontBlisterMesh);

    // Blíster Lateral Derecho (cara interna del cartón)
    const sideBlisterGeo = new THREE.PlaneGeometry(BOX_D * 0.64, BOX_H * 0.71);
    const sideBlisterMesh = new THREE.Mesh(sideBlisterGeo, blisterMat);
    sideBlisterMesh.rotation.y = Math.PI / 2;
    sideBlisterMesh.position.set(BOX_W / 2 - 0.005, -0.06, (BOX_D / 2) - (BOX_D * 0.64 / 2));
    boxRoot.add(sideBlisterMesh);

    // 8. Insertar el Funko 3D Real dentro de la Caja
    const { group: funkoFigure, materials, textures } = buildFunkoMeshGroup(
      skinCanvas,
      rendered2DCanvas,
      parts
    );
    // Escalar la figura proporcional a la caja y posicionarla en el vano de la ventana
    funkoFigure.scale.set(0.72, 0.72, 0.72);
    // x = 0.18 centra la figura en la ventana visible sin tapar el avatar 2D
    funkoFigure.position.set(0.18, -0.36, 0.05);
    boxRoot.add(funkoFigure);

    // 9. Eventos de arrastre con mouse para rotar la caja libremente
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
      if (!isDragging || !boxRootRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      boxRootRef.current.rotation.y += deltaX * 0.01;
      camera.position.y = Math.max(-1.5, Math.min(2.5, camera.position.y - deltaY * 0.01));
      camera.lookAt(0, 0, 0);

      if (onRotationChange) {
        const deg = Math.round((boxRootRef.current.rotation.y * 180) / Math.PI) % 360;
        onRotationChange(deg);
      }

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // 10. Loop de Animación
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 11. Manejador de Resize
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup exhaustivo al desmontar para evitar memory leaks
    return () => {
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      renderer.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());

      dioramaMat.dispose();
      backMat.dispose();
      leftMat.dispose();
      rightMat.dispose();
      topMat.dispose();
      bottomMat.dispose();
      frontMat.dispose();
      blisterMat.dispose();

      Object.values(texturesRef.current).forEach((tex) => {
        if (tex) tex.dispose();
      });
    };
  }, [skinCanvas, rendered2DCanvas, parts]);

  // Sincronizar rotación con controles externos (slider / botones)
  useEffect(() => {
    if (boxRootRef.current) {
      boxRootRef.current.rotation.y = (rotationAngle * Math.PI) / 180;
    }
  }, [rotationAngle]);

  // Actualizar textura del diorama interior (presets o personalizada)
  useEffect(() => {
    const updateDioramaTexture = (canvasOrImg: CanvasImageSource) => {
      if (texturesRef.current.diorama) {
        texturesRef.current.diorama.dispose();
      }
      const tex = new THREE.CanvasTexture(canvasOrImg as HTMLCanvasElement);
      tex.colorSpace = THREE.SRGBColorSpace;
      texturesRef.current.diorama = tex;

      [dioramaBackMeshRef.current, dioramaLeftMeshRef.current, dioramaFloorMeshRef.current].forEach((mesh) => {
        if (mesh) {
          (mesh.material as THREE.MeshStandardMaterial).map = tex;
          (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      });
    };

    if (config.customDioramaUrl) {
      const img = new Image();
      img.src = config.customDioramaUrl;
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 512;
        offCanvas.height = 768;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 512, 768);
          updateDioramaTexture(offCanvas);
        }
      };
    } else {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 512;
      offCanvas.height = 768;
      const ctx = offCanvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 768);
        if (config.dioramaPreset === 'amatista') {
          grad.addColorStop(0, '#581c87');
          grad.addColorStop(1, '#2e1065');
        } else if (config.dioramaPreset === 'nether') {
          grad.addColorStop(0, '#7f1d1d');
          grad.addColorStop(1, '#450a0a');
        } else if (config.dioramaPreset === 'studio') {
          grad.addColorStop(0, '#334155');
          grad.addColorStop(1, '#0f172a');
        } else {
          // Bosque por defecto
          grad.addColorStop(0, '#14532d');
          grad.addColorStop(1, '#052e16');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 768);

        if (config.dioramaPreset === 'bosque') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(40, 60, 160, 50);
          ctx.fillRect(300, 140, 180, 60);
        }

        updateDioramaTexture(offCanvas);
      }
    }
  }, [config.dioramaPreset, config.customDioramaUrl]);

  // Actualizar todas las texturas compuestas de las 6 caras de la caja en tiempo real
  useEffect(() => {
    let isCancelled = false;

    composeAllBoxFaces(config, skinCanvas).then((composed) => {
      if (isCancelled) return;

      const updateMeshTexture = (
        mesh: THREE.Mesh | null,
        canvas: HTMLCanvasElement,
        key: keyof typeof texturesRef.current
      ) => {
        if (!mesh) return;
        if (texturesRef.current[key]) {
          texturesRef.current[key]?.dispose();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        texturesRef.current[key] = tex;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map = tex;
        mat.roughness = config.finish === 'gloss' ? 0.25 : 0.75;
        mat.metalness = config.finish === 'gloss' ? 0.2 : 0.05;
        if (key === 'front' || key === 'right') {
          mat.transparent = true;
          mat.alphaTest = 0.05;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      };

      updateMeshTexture(frontMeshRef.current, composed.front, 'front');
      updateMeshTexture(backMeshRef.current, composed.back, 'back');
      updateMeshTexture(leftMeshRef.current, composed.left, 'left');
      updateMeshTexture(rightMeshRef.current, composed.right, 'right');
      updateMeshTexture(topMeshRef.current, composed.top, 'top');
      updateMeshTexture(bottomMeshRef.current, composed.bottom, 'bottom');
    });

    return () => {
      isCancelled = true;
    };
  }, [
    config.primaryColor,
    config.finish,
    config.characterName,
    config.collectionNumber,
    config.franchiseTag,
    config.fontFamily,
    skinCanvas,
  ]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
    />
  );
};

