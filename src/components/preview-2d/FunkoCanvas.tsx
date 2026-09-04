import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Printer, Grid, RotateCw, RotateCcw, FlipHorizontal, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import type { PartTransformation } from '../../core/engine/types';

interface FunkoCanvasProps {
  canvasElement: HTMLCanvasElement | null;
  parts: PartTransformation[];
  onPartsChange: (newParts: PartTransformation[]) => void;
  onResetParts: () => void;
  onPrint: () => void;
}

export const FunkoCanvas: React.FC<FunkoCanvasProps> = ({
  canvasElement,
  parts,
  onPartsChange,
  onResetParts,
  onPrint,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredPart, setHoveredPart] = useState<PartTransformation | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Dragging & Resizing state
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  
  type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';
  const resizeStateRef = useRef<{
    handle: ResizeHandle;
    mouseX: number;
    mouseY: number;
    initialDest: { x: number; y: number };
    initialScale: { width: number; height: number };
    aspectRatio: number;
    isRotated90: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPart = parts.find((p) => p.id === selectedPartId) || null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoom(1);

  const baseW = canvasElement?.width || 606;
  const baseH = canvasElement?.height || 882;

  // Actualizar una propiedad de la pieza seleccionada
  const updateSelectedPart = (updater: (part: PartTransformation) => PartTransformation) => {
    if (!selectedPartId) return;
    const updated = parts.map((p) => (p.id === selectedPartId ? updater({ ...p }) : p));
    onPartsChange(updated);
  };

  // Mover con teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPartId) return;
      // Evitar si el foco está en un input
      if (document.activeElement?.tagName === 'INPUT') return;

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'Escape') {
        setSelectedPartId(null);
        return;
      } else return;

      e.preventDefault();
      updateSelectedPart((p) => ({
        ...p,
        destination: { x: p.destination.x + dx, y: p.destination.y + dy },
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPartId, parts]);

  // Manejador de inicio de arrastre o selección
  const handlePartMouseDown = (e: React.MouseEvent, part: PartTransformation) => {
    e.stopPropagation();
    setSelectedPartId(part.id);
    isDraggingRef.current = true;
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: part.destination.x,
      initialY: part.destination.y,
    };
  };

  // Manejador para iniciar redimensionamiento desde un vértice o punto medio
  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle, part: PartTransformation) => {
    e.stopPropagation();
    const isRotated90 = Math.abs((part.rotateDeg || 0) % 180) === 90;
    const visualInitW = isRotated90 ? part.scale.height : part.scale.width;
    const visualInitH = isRotated90 ? part.scale.width : part.scale.height;
    const aspectRatio = visualInitW / Math.max(1, visualInitH);

    resizeStateRef.current = {
      handle,
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialDest: { ...part.destination },
      initialScale: { ...part.scale },
      aspectRatio,
      isRotated90,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = baseW / (rect.width * zoom);
      const scaleY = baseH / (rect.height * zoom);

      // 1. Manejo de Redimensionamiento (Esquinas proporcionales y Bordes unidireccionales)
      if (resizeStateRef.current) {
        const { handle, mouseX, mouseY, initialDest, initialScale, aspectRatio, isRotated90 } = resizeStateRef.current;
        const deltaX = (e.clientX - mouseX) * scaleX;
        const deltaY = (e.clientY - mouseY) * scaleY;

        let newDestX = initialDest.x;
        let newDestY = initialDest.y;

        // Ancho y alto visual en pantalla
        const visualInitW = isRotated90 ? initialScale.height : initialScale.width;
        const visualInitH = isRotated90 ? initialScale.width : initialScale.height;

        let visualW = visualInitW;
        let visualH = visualInitH;

        if (handle === 'se') {
          // Esquina Sureste: Proporcional parejo
          const scaleFactor = Math.max(0.2, 1 + (deltaX / visualInitW + deltaY / visualInitH) / 2);
          visualW = Math.max(8, Math.round(visualInitW * scaleFactor));
          visualH = Math.max(8, Math.round(visualW / aspectRatio));
        } else if (handle === 'nw') {
          // Esquina Noroeste: Proporcional parejo
          const scaleFactor = Math.max(0.2, 1 - (deltaX / visualInitW + deltaY / visualInitH) / 2);
          visualW = Math.max(8, Math.round(visualInitW * scaleFactor));
          visualH = Math.max(8, Math.round(visualW / aspectRatio));
          newDestX = Math.round(initialDest.x + (visualInitW - visualW));
          newDestY = Math.round(initialDest.y + (visualInitH - visualH));
        } else if (handle === 'ne') {
          // Esquina Noreste: Proporcional parejo
          const scaleFactor = Math.max(0.2, 1 + (deltaX / visualInitW - deltaY / visualInitH) / 2);
          visualW = Math.max(8, Math.round(visualInitW * scaleFactor));
          visualH = Math.max(8, Math.round(visualW / aspectRatio));
          newDestY = Math.round(initialDest.y + (visualInitH - visualH));
        } else if (handle === 'sw') {
          // Esquina Suroeste: Proporcional parejo
          const scaleFactor = Math.max(0.2, 1 - (deltaX / visualInitW - deltaY / visualInitH) / 2);
          visualW = Math.max(8, Math.round(visualInitW * scaleFactor));
          visualH = Math.max(8, Math.round(visualW / aspectRatio));
          newDestX = Math.round(initialDest.x + (visualInitW - visualW));
        } else if (handle === 'e') {
          // Borde Este: Solo ancho hacia la derecha
          visualW = Math.max(8, Math.round(visualInitW + deltaX));
        } else if (handle === 'w') {
          // Borde Oeste: Solo ancho hacia la izquierda
          visualW = Math.max(8, Math.round(visualInitW - deltaX));
          newDestX = Math.round(initialDest.x + (visualInitW - visualW));
        } else if (handle === 's') {
          // Borde Sur: Solo alto hacia abajo
          visualH = Math.max(8, Math.round(visualInitH + deltaY));
        } else if (handle === 'n') {
          // Borde Norte: Solo alto hacia arriba
          visualH = Math.max(8, Math.round(visualInitH - deltaY));
          newDestY = Math.round(initialDest.y + (visualInitH - visualH));
        }

        const newScaleW = isRotated90 ? visualH : visualW;
        const newScaleH = isRotated90 ? visualW : visualH;

        updateSelectedPart((p) => ({
          ...p,
          destination: { x: newDestX, y: newDestY },
          scale: { width: newScaleW, height: newScaleH },
        }));
        return;
      }

      // 2. Manejo de Arrastre de Posición
      if (isDraggingRef.current && dragStartPosRef.current) {
        const deltaX = (e.clientX - dragStartPosRef.current.mouseX) * scaleX;
        const deltaY = (e.clientY - dragStartPosRef.current.mouseY) * scaleY;

        if (Math.hypot(deltaX, deltaY) < 1) return;

        setIsMoving(true);

        const newX = Math.round(dragStartPosRef.current.initialX + deltaX);
        const newY = Math.round(dragStartPosRef.current.initialY + deltaY);

        updateSelectedPart((p) => ({
          ...p,
          destination: { x: newX, y: newY },
        }));
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
      resizeStateRef.current = null;
      setIsMoving(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoom, baseW, baseH, selectedPartId, parts]);

  return (
    <div
      onClick={() => {
        // Solo deseleccionar si se hace click directamente en el fondo oscuro exterior
        setSelectedPartId(null);
      }}
      className="relative w-full h-full flex items-center justify-center overflow-hidden p-6 select-none bg-[#0a0e17]"
    >
      {/* Blueprint Grid Background */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #4edea3 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* Virtual 195mm x 282mm Funko Papercraft Artboard Canvas */}
      <div
        onClick={() => {
          // Deseleccionar al hacer clic en cualquier área vacía del artboard
          setSelectedPartId(null);
        }}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        className="relative bg-[#121620] text-on-surface w-full max-w-[820px] h-[calc(100vh-8.5rem)] max-h-[820px] shadow-2xl rounded-2xl p-6 flex flex-col justify-center select-none transition-transform duration-150 border-0"
      >
        {/* Dynamic Canvas Container with Interactive Hotspots */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {canvasElement ? (
            <div
              ref={containerRef}
              className="relative shadow-md"
              style={{
                aspectRatio: `${baseW} / ${baseH}`,
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={canvasElement.toDataURL()}
                alt="Funko Mold"
                className="w-full h-full object-contain [image-rendering:pixelated] block"
              />

              {/* Interactive Hotspots & Gizmos */}
              <div className="absolute inset-0 pointer-events-none">
                {parts.map((part) => {
                  const normRot = Math.abs((part.rotateDeg || 0) % 180);
                  const isRotated90 = normRot === 90;
                  const partW = isRotated90 ? part.scale.height : part.scale.width;
                  const partH = isRotated90 ? part.scale.width : part.scale.height;

                  const leftPct = (part.destination.x / baseW) * 100;
                  const topPct = (part.destination.y / baseH) * 100;
                  const widthPct = (partW / baseW) * 100;
                  const heightPct = (partH / baseH) * 100;

                  const isSelected = selectedPartId === part.id;
                  const isHovered = hoveredPart?.id === part.id;

                  return (
                    <div
                      key={part.id}
                      onMouseDown={(e) => handlePartMouseDown(e, part)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPartId(part.id);
                      }}
                      onMouseEnter={() => setHoveredPart(part)}
                      onMouseLeave={() => setHoveredPart(null)}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                      }}
                      className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing rounded-[1px] ${
                        isSelected
                          ? isMoving
                            ? 'bg-[#4cd7f6]/20 z-40'
                            : 'outline outline-1 outline-[#4cd7f6] z-40'
                          : isHovered
                          ? 'outline outline-1 outline-[#4cd7f6]/40 z-30'
                          : 'hover:outline hover:outline-1 hover:outline-[#4cd7f6]/20'
                      }`}
                    >
                      {/* Selection Handles (Balanced Figma standard markers) - Ocultos durante arrastre */}
                      {isSelected && !isMoving && (
                        <>
                          {/* 4 Esquinas: Escala Proporcional Pareja (8px equilibrados) */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'nw', part)}
                            className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-[#181b25] rounded-[1px] cursor-nwse-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Proporcional (Noroeste)"
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'ne', part)}
                            className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-[#181b25] rounded-[1px] cursor-nesw-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Proporcional (Noreste)"
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'sw', part)}
                            className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-[#181b25] rounded-[1px] cursor-nesw-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Proporcional (Suroeste)"
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'se', part)}
                            className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-[#181b25] rounded-[1px] cursor-nwse-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Proporcional (Sureste)"
                          />

                          {/* 4 Puntos Medios: Escala Unidireccional (Equilibrados) */}
                          {/* Top / North */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'n', part)}
                            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-white border border-[#181b25] rounded-[1px] cursor-ns-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Alto (Arriba)"
                          />
                          {/* Bottom / South */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 's', part)}
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-white border border-[#181b25] rounded-[1px] cursor-ns-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Alto (Abajo)"
                          />
                          {/* Left / West */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'w', part)}
                            className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-white border border-[#181b25] rounded-[1px] cursor-ew-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Ancho (Izquierda)"
                          />
                          {/* Right / East */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'e', part)}
                            className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-white border border-[#181b25] rounded-[1px] cursor-ew-resize shadow-xs z-50 pointer-events-auto"
                            title="Escalar Ancho (Derecha)"
                          />
                        </>
                      )}

                      {/* Tooltip Pill */}
                      <div
                        className={`absolute left-1/2 -top-14 -translate-x-1/2 px-2.5 py-1 rounded bg-[#0a0e17]/95 border border-[#3c4a42] text-primary text-[10px] font-mono whitespace-nowrap shadow-2xl z-50 pointer-events-none transition-all ${
                          isSelected || isHovered
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95 pointer-events-none'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{part.name}</span>
                          {isSelected && <span className="text-[8px] bg-primary text-black font-semibold px-1 rounded-[2px]">ACTIVO</span>}
                        </div>
                        <div className="text-[8px] text-[#bbcabf] font-mono">
                          X:{part.destination.x} Y:{part.destination.y} · {part.scale.width}x{part.scale.height} · {part.rotateDeg || 0}°
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
              <span className="text-xs font-mono">Renderizando molde...</span>
            </div>
          )}
        </div>

      </div>

      {/* Floating Selected Piece Inspector & Quick Actions (Geometry Dash style) */}
      {selectedPart && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#181b25]/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl border border-[#3c4a42] flex items-center gap-4 z-50 text-xs font-mono select-none animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex flex-col border-r border-[#262a34] pr-3">
            <span className="text-primary font-bold text-[11px] truncate max-w-[140px]">
              {selectedPart.name}
            </span>
            <span className="text-[9px] text-[#86948a]">Pieza Seleccionada</span>
          </div>

          {/* Position Inputs */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <span className="text-[#86948a] text-[10px]">X:</span>
              <input
                type="number"
                value={selectedPart.destination.x}
                onChange={(e) =>
                  updateSelectedPart((p) => ({
                    ...p,
                    destination: { ...p.destination, x: parseInt(e.target.value) || 0 },
                  }))
                }
                className="w-14 bg-[#0a0e17] text-primary px-1.5 py-0.5 rounded border border-[#262a34] text-center focus:outline-none focus:border-primary"
              />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-[#86948a] text-[10px]">Y:</span>
              <input
                type="number"
                value={selectedPart.destination.y}
                onChange={(e) =>
                  updateSelectedPart((p) => ({
                    ...p,
                    destination: { ...p.destination, y: parseInt(e.target.value) || 0 },
                  }))
                }
                className="w-14 bg-[#0a0e17] text-primary px-1.5 py-0.5 rounded border border-[#262a34] text-center focus:outline-none focus:border-primary"
              />
            </label>
          </div>

          {/* Quick D-Pad movement */}
          <div className="flex items-center gap-0.5 border-l border-[#262a34] pl-2">
            <button
              onClick={() =>
                updateSelectedPart((p) => ({
                  ...p,
                  destination: { ...p.destination, x: p.destination.x - 1 },
                }))
              }
              className="p-1 rounded bg-[#0a0e17] hover:bg-surface-container text-[#dfe2ef] hover:text-primary"
              title="Izquierda (-1px)"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() =>
                updateSelectedPart((p) => ({
                  ...p,
                  destination: { ...p.destination, y: p.destination.y - 1 },
                }))
              }
              className="p-1 rounded bg-[#0a0e17] hover:bg-surface-container text-[#dfe2ef] hover:text-primary"
              title="Arriba (-1px)"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() =>
                updateSelectedPart((p) => ({
                  ...p,
                  destination: { ...p.destination, y: p.destination.y + 1 },
                }))
              }
              className="p-1 rounded bg-[#0a0e17] hover:bg-surface-container text-[#dfe2ef] hover:text-primary"
              title="Abajo (+1px)"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              onClick={() =>
                updateSelectedPart((p) => ({
                  ...p,
                  destination: { ...p.destination, x: p.destination.x + 1 },
                }))
              }
              className="p-1 rounded bg-[#0a0e17] hover:bg-surface-container text-[#dfe2ef] hover:text-primary"
              title="Derecha (+1px)"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Scale Inputs */}
          <div className="flex items-center gap-2 border-l border-[#262a34] pl-2">
            <label className="flex items-center gap-1">
              <span className="text-[#86948a] text-[10px]">W:</span>
              <input
                type="number"
                value={selectedPart.scale.width}
                onChange={(e) =>
                  updateSelectedPart((p) => ({
                    ...p,
                    scale: { ...p.scale, width: Math.max(1, parseInt(e.target.value) || 1) },
                  }))
                }
                className="w-12 bg-[#0a0e17] text-secondary px-1.5 py-0.5 rounded border border-[#262a34] text-center focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-[#86948a] text-[10px]">H:</span>
              <input
                type="number"
                value={selectedPart.scale.height}
                onChange={(e) =>
                  updateSelectedPart((p) => ({
                    ...p,
                    scale: { ...p.scale, height: Math.max(1, parseInt(e.target.value) || 1) },
                  }))
                }
                className="w-12 bg-[#0a0e17] text-secondary px-1.5 py-0.5 rounded border border-[#262a34] text-center focus:outline-none"
              />
            </label>
          </div>

          {/* Transformation Buttons: Rotate & Mirror */}
          <div className="flex items-center gap-1 border-l border-[#262a34] pl-2">
            <button
              onClick={() =>
                updateSelectedPart((p) => ({
                  ...p,
                  rotateDeg: ((((p.rotateDeg || 0) - 90) % 360) + 360) % 360,
                }))
              }
              className="p-1.5 rounded bg-[#0a0e17] hover:bg-[#262a34] text-[#dfe2ef] hover:text-primary transition-colors"
              title="Rotar -90°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                updateSelectedPart((p) => ({
                  ...p,
                  rotateDeg: ((((p.rotateDeg || 0) + 90) % 360) + 360) % 360,
                }))
              }
              className="p-1.5 rounded bg-[#0a0e17] hover:bg-[#262a34] text-[#dfe2ef] hover:text-primary transition-colors"
              title="Rotar +90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                updateSelectedPart((p) => ({
                  ...p,
                  mirrorHorizontal: !p.mirrorHorizontal,
                }))
              }
              className={`p-1.5 rounded border transition-colors ${
                selectedPart.mirrorHorizontal
                  ? 'bg-secondary/20 text-secondary border-secondary/40'
                  : 'bg-[#0a0e17] hover:bg-[#262a34] text-[#dfe2ef] border-transparent'
              }`}
              title="Invertir horizontal (Mirror)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Deselect button */}
          <button
            onClick={() => setSelectedPartId(null)}
            className="px-2 py-1 rounded bg-[#262a34] hover:bg-[#31353f] text-[#bbcabf] text-[10px]"
          >
            Listo
          </button>
        </div>
      )}

      {/* Floating Vertical Toolbar (Docked Left) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none z-30">
        <div className="pointer-events-auto bg-[#181b25]/95 backdrop-blur-md px-2 py-3 rounded-2xl flex flex-col items-center gap-3 shadow-2xl border border-[#262a34]">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleZoomIn}
              title="Acercar"
              className="p-2 rounded-xl text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#262a34] transition-all cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Restablecer Zoom (100%)"
              className="font-mono text-[10px] font-semibold text-[#dfe2ef] hover:text-[#4edea3] px-1 py-0.5 rounded hover:bg-[#262a34] transition-colors cursor-pointer"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomOut}
              title="Alejar"
              className="p-2 rounded-xl text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#262a34] transition-all cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <div className="w-5 h-[1px] bg-[#262a34]" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            title={showGrid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              showGrid
                ? 'text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/30'
                : 'text-[#bbcabf] hover:text-[#dfe2ef] hover:bg-[#262a34]'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={onResetParts}
            title="Restablecer piezas a posición original"
            className="p-2 rounded-xl text-[#bbcabf] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="w-5 h-[1px] bg-[#262a34]" />

          <button
            onClick={onPrint}
            title="Exportar PDF"
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

