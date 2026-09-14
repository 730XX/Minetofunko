import React from 'react';
import type { BoxCustomizationConfig, BoxFinish } from '../types';
import { BOX_PALETTES } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface Step1ColorsProps {
  config: BoxCustomizationConfig;
  onChange: (updates: Partial<BoxCustomizationConfig>) => void;
}

export const Step1Colors: React.FC<Step1ColorsProps> = ({ config, onChange }) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-on-surface">Acabado de la Caja</span>
          <span className="text-xs text-on-surface-variant">Selecciona el chasis cromático y el gramaje superficial</span>
        </div>
        <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded font-mono text-[10px] font-semibold">
          FASE 1/4
        </span>
      </div>

      {/* Paletas Rápidas */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
          Paletas Rápidas
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BOX_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => onChange({ primaryColor: palette.primary, accentColor: palette.accent })}
              className={`p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex items-center gap-2.5 text-left transition-all border ${
                config.primaryColor.toLowerCase() === palette.primary.toLowerCase()
                  ? 'border-primary shadow-sm'
                  : 'border-transparent'
              }`}
            >
              <span
                className="w-6 h-6 rounded-md shadow flex-shrink-0"
                style={{ backgroundColor: palette.primary }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-on-surface truncate">{palette.name}</span>
                <span className="text-[10px] font-mono text-on-surface-variant">{palette.tag}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Personalizado */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
          Color Personalizado
        </label>
        <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            className="w-8 h-8 rounded bg-transparent cursor-pointer border-0 p-0"
          />
          <div className="flex-1 flex items-center justify-between px-2 bg-surface-container-high rounded h-8">
            <span className="text-xs font-mono text-on-surface-variant">HEX:</span>
            <input
              type="text"
              value={config.primaryColor.toUpperCase()}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="bg-transparent text-right font-mono text-xs text-on-surface focus:outline-none w-24"
            />
          </div>
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-mono text-[10px] font-semibold rounded">
            300 DPI
          </span>
        </div>
      </div>

      {/* Acabado Táctil & Barniz */}
      <div className="flex flex-col gap-2 pt-1">
        <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
          Acabado Táctil & Barniz
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ finish: 'matte' as BoxFinish })}
            className={`p-3 rounded-lg text-left flex flex-col gap-1 transition-all border ${
              config.finish === 'matte'
                ? 'bg-surface-container-highest text-on-surface border-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Mate Sedoso</span>
              {config.finish === 'matte' ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Circle className="w-4 h-4 opacity-30" />
              )}
            </div>
            <span className="text-[11px] text-on-surface-variant leading-snug">
              Reflectividad 12%, anti-huellas microtexturizado.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ finish: 'gloss' as BoxFinish })}
            className={`p-3 rounded-lg text-left flex flex-col gap-1 transition-all border ${
              config.finish === 'gloss'
                ? 'bg-surface-container-highest text-on-surface border-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Brillo Vinílico</span>
              {config.finish === 'gloss' ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Circle className="w-4 h-4 opacity-30" />
              )}
            </div>
            <span className="text-[11px] text-on-surface-variant leading-snug">
              Laminado brillante UV de alta reflectancia tipo vitrina.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
