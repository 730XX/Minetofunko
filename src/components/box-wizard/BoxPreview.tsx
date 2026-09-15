import React, { useState } from 'react';
import type { BoxCustomizationConfig, WizardViewMode } from './types';
import type { PartTransformation } from '../../core/engine/types';
import { BoxViewer3D } from './BoxViewer3D';
import { RotateCw, RotateCcw, Focus, Box, Crop } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface BoxPreviewProps {
  config: BoxCustomizationConfig;
  skinCanvas: HTMLCanvasElement | null;
  rendered2DCanvas?: HTMLCanvasElement | null;
  parts?: PartTransformation[];
}

export const BoxPreview: React.FC<BoxPreviewProps> = ({
  config,
  skinCanvas,
  rendered2DCanvas,
  parts,
}) => {
  const [viewMode, setViewMode] = useState<WizardViewMode>('3d');
  const [rotationAngle, setRotationAngle] = useState(0);

  const rotateBox = (delta: number) => {
    setRotationAngle((prev) => prev + delta);
  };

  const resetAngle = () => {
    setRotationAngle(0);
  };

  return (
    <main className="flex-1 bg-surface-container-lowest relative flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Botones Flotantes Superiores 3D / 2D */}
      <div className="absolute top-4 inset-x-0 mx-auto w-fit z-20 bg-surface-container-high/90 backdrop-blur-md p-1 rounded-full shadow-xl flex items-center gap-1 border border-outline-variant/30">
        <button
          type="button"
          onClick={() => setViewMode('3d')}
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
            viewMode === '3d'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Caja 3D Montada</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('2d')}
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
            viewMode === '2d'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Molde 2D Troquelado</span>
        </button>
      </div>

      {/* Controles de Rotación */}
      {viewMode === '3d' && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-surface-container-high/80 backdrop-blur-md px-2 py-1 rounded-lg border border-outline-variant/30">
          <Tooltip position="top" content="Giro izquierda (-15°)">
            <button
              type="button"
              onClick={() => rotateBox(-15)}
              className="w-7 h-7 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip position="top" content="Centrar vista frontal">
            <button
              type="button"
              onClick={resetAngle}
              className="w-7 h-7 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            >
              <Focus className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip position="top" content="Giro derecha (+15°)">
            <button
              type="button"
              onClick={() => rotateBox(15)}
              className="w-7 h-7 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <span className="font-mono text-[11px] text-on-surface-variant pl-1">
            ROT: <span className="text-secondary font-semibold">{rotationAngle}°</span>
          </span>
        </div>
      )}

      {/* Indicador de Acetato */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-surface-container-high/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-outline-variant/30">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[10px] text-on-surface uppercase tracking-wider">
          ACETATO TRASLÚCIDO ACTIVO
        </span>
      </div>

      {/* Viewport Principal */}
      <div className="w-full h-full flex items-center justify-center relative [perspective:1200px]">
        {viewMode === '3d' ? (
          <div className="w-full h-full flex items-center justify-center relative">
            <BoxViewer3D
              config={config}
              skinCanvas={skinCanvas}
              rendered2DCanvas={rendered2DCanvas}
              parts={parts}
              rotationAngle={rotationAngle}
              onRotationChange={setRotationAngle}
            />
          </div>
        ) : (
          /* Molde 2D Troquelado Desplegado */
          <div className="w-full max-w-lg h-auto aspect-[4/3] p-4 bg-surface-container-high rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-outline-variant/30 shadow-inner">
            <svg className="w-full h-full text-primary" viewBox="0 0 600 450">
              <rect
                x="50"
                y="50"
                width="500"
                height="350"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-90"
              />
              <line x1="170" y1="50" x2="170" y2="400" stroke="#4cd7f6" strokeWidth="1.5" strokeDasharray="6,4" />
              <line x1="330" y1="50" x2="330" y2="400" stroke="#4cd7f6" strokeWidth="1.5" strokeDasharray="6,4" />
              <line x1="450" y1="50" x2="450" y2="400" stroke="#4cd7f6" strokeWidth="1.5" strokeDasharray="6,4" />
              <line x1="50" y1="130" x2="550" y2="130" stroke="#4cd7f6" strokeWidth="1.5" strokeDasharray="6,4" />
              <line x1="50" y1="320" x2="550" y2="320" stroke="#4cd7f6" strokeWidth="1.5" strokeDasharray="6,4" />
              <rect
                x="200"
                y="150"
                width="100"
                height="150"
                rx="8"
                fill="#000"
                fillOpacity="0.4"
                stroke="#4edea3"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />
              <text x="250" y="225" fill="#4edea3" fontSize="11" fontFamily="monospace" textAnchor="middle">
                VENTANA ACETATO
              </text>
              <text x="110" y="225" fill="#bbcabf" fontSize="10" fontFamily="monospace" textAnchor="middle">
                LATERAL IZQ
              </text>
              <text x="390" y="225" fill="#bbcabf" fontSize="10" fontFamily="monospace" textAnchor="middle">
                LATERAL DER
              </text>
              <text x="500" y="225" fill="#86948a" fontSize="9" fontFamily="monospace" textAnchor="middle">
                LENGÜETA
              </text>
              <text x="250" y="90" fill="#bbcabf" fontSize="10" fontFamily="monospace" textAnchor="middle">
                TAPA SUPERIOR
              </text>
              <text x="250" y="365" fill="#bbcabf" fontSize="10" fontFamily="monospace" textAnchor="middle">
                FONDO CIERRE
              </text>
            </svg>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 font-mono text-[10px] bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-on-surface">ESCALA 1:1 • COTAS VECTORIALES CON BLEED DE 3MM</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};