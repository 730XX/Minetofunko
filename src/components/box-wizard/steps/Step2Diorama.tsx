import React, { useRef } from 'react';
import type { BoxCustomizationConfig, DioramaPreset } from '../types';
import { Trees, Gem, Flame, Sparkles, ImagePlus } from 'lucide-react';

interface Step2DioramaProps {
  config: BoxCustomizationConfig;
  onChange: (updates: Partial<BoxCustomizationConfig>) => void;
}

export const Step2Diorama: React.FC<Step2DioramaProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({
          customDioramaUrl: event.target?.result as string,
          dioramaPreset: 'custom',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-on-surface">Diorama Trasero</span>
          <span className="text-xs text-on-surface-variant">Ambiente visible a través del blíster transparente</span>
        </div>
        <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded font-mono text-[10px] font-semibold">
          FASE 2/4
        </span>
      </div>

      {/* Escenarios Prediseñados */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
          Escenario Prediseñado
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ dioramaPreset: 'bosque' as DioramaPreset, customDioramaUrl: null })}
            className={`p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex flex-col gap-1.5 transition-all border ${
              config.dioramaPreset === 'bosque' ? 'border-primary shadow-sm' : 'border-transparent'
            }`}
          >
            <div className="w-full h-12 rounded bg-gradient-to-t from-emerald-950 to-green-800 flex items-center justify-center">
              <Trees className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-on-surface">Bosque Minecraft</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ dioramaPreset: 'amatista' as DioramaPreset, customDioramaUrl: null })}
            className={`p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex flex-col gap-1.5 transition-all border ${
              config.dioramaPreset === 'amatista' ? 'border-primary shadow-sm' : 'border-transparent'
            }`}
          >
            <div className="w-full h-12 rounded bg-gradient-to-t from-indigo-950 to-fuchsia-900 flex items-center justify-center">
              <Gem className="w-5 h-5 text-fuchsia-300" />
            </div>
            <span className="text-xs font-semibold text-on-surface">Cueva Amatista</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ dioramaPreset: 'nether' as DioramaPreset, customDioramaUrl: null })}
            className={`p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex flex-col gap-1.5 transition-all border ${
              config.dioramaPreset === 'nether' ? 'border-primary shadow-sm' : 'border-transparent'
            }`}
          >
            <div className="w-full h-12 rounded bg-gradient-to-t from-red-950 to-amber-900 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-semibold text-on-surface">Fortaleza Nether</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ dioramaPreset: 'studio' as DioramaPreset, customDioramaUrl: null })}
            className={`p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex flex-col gap-1.5 transition-all border ${
              config.dioramaPreset === 'studio' ? 'border-primary shadow-sm' : 'border-transparent'
            }`}
          >
            <div className="w-full h-12 rounded bg-gradient-to-t from-slate-900 to-slate-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-xs font-semibold text-on-surface">Degradado Studio</span>
          </button>
        </div>
      </div>

      {/* Sliders de Ajuste */}
      <div className="flex flex-col gap-3.5 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-on-surface-variant">Escala / Zoom</span>
            <span className="text-primary font-semibold">{config.dioramaZoom}%</span>
          </div>
          <input
            type="range"
            min="80"
            max="180"
            value={config.dioramaZoom}
            onChange={(e) => onChange({ dioramaZoom: Number(e.target.value) })}
            className="w-full accent-primary h-1 bg-surface-container-highest rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-on-surface-variant">Posición Vertical (Offset Y)</span>
            <span className="text-secondary font-semibold">{config.dioramaOffsetY} mm</span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            value={config.dioramaOffsetY}
            onChange={(e) => onChange({ dioramaOffsetY: Number(e.target.value) })}
            className="w-full accent-secondary h-1 bg-surface-container-highest rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-on-surface-variant">Intensidad de Luz Blíster</span>
            <span className="text-primary font-semibold">{config.blisterLightIntensity}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={config.blisterLightIntensity}
            onChange={(e) => onChange({ blisterLightIntensity: Number(e.target.value) })}
            className="w-full accent-primary h-1 bg-surface-container-highest rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Subir fondo personalizado */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-4 rounded-lg bg-surface-container-high/40 hover:bg-surface-container-high/70 border border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all"
      >
        <ImagePlus className="w-7 h-7 text-primary mb-1" />
        <span className="text-xs font-semibold text-on-surface">Subir fondo personalizado</span>
        <span className="text-[11px] text-on-surface-variant">
          {config.customDioramaUrl ? '✓ Imagen personalizada activa (clic para cambiar)' : 'Arrastra un archivo PNG, JPG o WebP'}
        </span>
      </div>
    </div>
  );
};
