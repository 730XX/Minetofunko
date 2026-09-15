import React from 'react';
import { createPortal } from 'react-dom';
import { Database, X, Zap, FileDown } from 'lucide-react';
import type { CommunityFigure } from './CommunityGallery';

export interface CommunityDrawerProps {
  figure: CommunityFigure | null;
  isOpen: boolean;
  onClose: () => void;
  onRemix: (figure: CommunityFigure) => void;
  onDownloadPdf: (figure: CommunityFigure) => void;
}

export const CommunityDrawer: React.FC<CommunityDrawerProps> = ({
  figure,
  isOpen,
  onClose,
  onRemix,
  onDownloadPdf,
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[9998] transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[28rem] h-full bg-[#11141d] shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col justify-between border-l border-[#232838] ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header Drawer */}
        <div className="p-4 bg-[#161a26] flex items-center justify-between border-b border-[#232838] shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-gray-100">Inspección de Esquema</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1e2332] hover:bg-[#282f44] text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Specs Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Title & Creator profile */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold rounded uppercase border border-emerald-500/20">
                Supabase Sync
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                ID: {figure?.id ? figure.id.slice(0, 8) : 'sync'}
              </span>
            </div>
            <h2 className="font-bold text-lg text-white mt-1">
              {figure?.title || 'Funko Personalizado'}
            </h2>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <span>Creado por</span>
              <span className="text-emerald-400 font-medium">{figure?.author || '@usuario'}</span>
              <span>• Licencia CC-BY 4.0</span>
            </div>
            {figure?.description && (
              <p className="text-gray-400 text-xs leading-relaxed mt-2 bg-[#161a26] p-2.5 rounded-lg border border-[#232838]">
                {figure.description}
              </p>
            )}
          </div>

          {/* Visual Preview */}
          {figure?.image && (
            <div className="w-full h-52 bg-gradient-to-b from-[#181d28] via-[#11141d] to-[#0a0c12] rounded-xl flex items-center justify-center overflow-hidden relative border border-[#232838] shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.18),transparent_70%)] pointer-events-none" />
              {/* Podium glow */}
              <div className="absolute bottom-3 w-40 h-6 rounded-[100%] border border-emerald-400/30 bg-emerald-500/15 blur-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] pointer-events-none" />
              <img
                src={figure.image}
                alt={figure.title}
                className="w-full h-full object-contain scale-[1.32] drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]"
              />
            </div>
          )}

          {/* Live 3D Calibrations JSON Dump Display */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-300">Parámetros Rig 3D</span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                CALIBRACIÓN 1:1
              </span>
            </div>
            <div className="bg-[#161a26] p-3.5 rounded-xl font-mono text-[11px] text-gray-400 flex flex-col gap-2 border border-[#232838]">
              <div className="flex justify-between">
                <span className="text-gray-400">Escala Cabeza Chibi:</span>
                <span className="text-emerald-400 font-semibold">1.62x (Deformado Funko)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Proporción Ojos:</span>
                <span className="text-gray-200 font-semibold">Bevel 2px / 2x2 px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Formato de Brazo:</span>
                <span className="text-gray-200 font-semibold">
                  {figure?.config?.skinFormat === 'legacy' ? 'Classic 4px (Steve)' : 'Slim (Alex 3px)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mesh Overlay 2nd Layer:</span>
                <span className="text-cyan-400 font-semibold">
                  {figure?.config?.overlayParts && figure.config.overlayParts.length > 0
                    ? 'Habilitada (Offset +0.4mm)'
                    : 'Deshabilitada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Textura Base:</span>
                <span className="text-gray-200 font-semibold">
                  {figure?.config?.skinFormat === 'legacy' ? '64x32 Legacy RGBA' : '64x64 HD RGBA'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pestañas de Pegado:</span>
                <span className="text-emerald-400 font-semibold">Trapezoidal 45° Auto-cut</span>
              </div>
            </div>
          </div>

          {/* Color Palette Scheme for Box */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-xs text-gray-300">Paleta Caja Coleccionista</span>
            <div className="flex items-center gap-2">
              {(figure?.palette || ['#0f172a', '#10b981', '#4cd7f6', '#ffb95f']).map((hex, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: hex }}
                  className="h-8 flex-1 rounded-lg flex items-center justify-center text-[10px] font-mono text-white font-bold drop-shadow-sm border border-black/30"
                >
                  {hex}
                </div>
              ))}
            </div>
          </div>

          {/* Version Changelog / History */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-xs text-gray-300">Historial de Revisiones</span>
            <div className="p-3 bg-[#161a26] rounded-xl flex flex-col gap-1 border border-[#232838]">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  Publicación Inicial
                </span>
                <span className="font-mono text-[10px] text-gray-400">
                  {figure?.created_at
                    ? new Date(figure.created_at).toLocaleDateString()
                    : 'Reciente'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Publicado en la galería pública de Minetofunko listo para descargar y ensamblar.
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Footer CTAs */}
        <div className="p-4 bg-[#161a26] flex flex-col gap-2 border-t border-[#232838] shrink-0">
          <button
            onClick={() => {
              if (figure) {
                onClose();
                onRemix(figure);
              }
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Clonar Configuración en Editor</span>
          </button>
          <button
            onClick={() => {
              if (figure) {
                onDownloadPdf(figure);
              }
            }}
            className="w-full py-2 px-4 bg-[#1e2332] hover:bg-[#282f44] border border-[#2b3447] text-gray-200 hover:text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Descargar Molde PDF Vectorial</span>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};
