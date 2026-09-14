import React, { useRef } from 'react';
import type { BoxCustomizationConfig, BoxFont } from '../types';
import { BadgeCheck, Upload } from 'lucide-react';

interface Step3IdentityProps {
  config: BoxCustomizationConfig;
  onChange: (updates: Partial<BoxCustomizationConfig>) => void;
}

export const Step3Identity: React.FC<Step3IdentityProps> = ({ config, onChange }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({
          logoUrl: event.target?.result as string,
          logoName: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-on-surface">Identidad & Tipografía</span>
          <span className="text-xs text-on-surface-variant">Configura rótulos, numeración y logo de cabecera</span>
        </div>
        <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded font-mono text-[10px] font-semibold">
          FASE 3/4
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Nombre del Personaje */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
            Nombre del Personaje
          </label>
          <div className="flex items-center bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/30">
            <span className="text-xs font-mono text-on-surface-variant pr-2">NAME:</span>
            <input
              type="text"
              value={config.characterName}
              onChange={(e) => onChange({ characterName: e.target.value })}
              placeholder="Steve_Hero"
              className="w-full bg-transparent text-on-surface text-sm font-semibold focus:outline-none"
            />
          </div>
        </div>

        {/* Colección & Franja */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
              Nº Edición
            </label>
            <input
              type="text"
              value={config.collectionNumber}
              onChange={(e) => onChange({ collectionNumber: e.target.value })}
              placeholder="#01"
              className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-on-surface font-mono text-xs font-semibold focus:outline-none text-center border border-outline-variant/30"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
              Franja de Categoría
            </label>
            <input
              type="text"
              value={config.franchiseTag}
              onChange={(e) => onChange({ franchiseTag: e.target.value.toUpperCase() })}
              placeholder="MINECRAFT GAMES"
              className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-on-surface text-xs font-semibold focus:outline-none uppercase border border-outline-variant/30"
            />
          </div>
        </div>

        {/* Estilo de Fuente */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
            Estilo de Fuente
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ fontFamily: 'display' as BoxFont })}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                config.fontFamily === 'display'
                  ? 'bg-surface-container-highest text-on-surface border-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant border-transparent'
              }`}
            >
              <span className="text-sm font-extrabold tracking-tight block text-on-surface uppercase">Display Bold</span>
              <span className="text-[10px] font-mono text-on-surface-variant">Estilo Funko Pop</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ fontFamily: 'mono' as BoxFont })}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                config.fontFamily === 'mono'
                  ? 'bg-surface-container-highest text-on-surface border-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant border-transparent'
              }`}
            >
              <span className="text-xs font-mono font-bold block text-on-surface tracking-wider uppercase">PIXEL VOXEL</span>
              <span className="text-[10px] font-mono text-on-surface-variant">Minecraft Pixelado</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ fontFamily: 'sans' as BoxFont })}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                config.fontFamily === 'sans'
                  ? 'bg-surface-container-highest text-on-surface border-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant border-transparent'
              }`}
            >
              <span className="text-xs font-semibold block text-on-surface tracking-wide uppercase">Sans Collector</span>
              <span className="text-[10px] font-mono text-on-surface-variant">Moderno & Limpio</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ fontFamily: 'comic' as BoxFont })}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                config.fontFamily === 'comic'
                  ? 'bg-surface-container-highest text-on-surface border-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant border-transparent'
              }`}
            >
              <span className="text-xs italic font-black block text-amber-300 tracking-tight uppercase">Comic Action</span>
              <span className="text-[10px] font-mono text-on-surface-variant">Retro Toy Action</span>
            </button>
          </div>
        </div>

        {/* Logo Frontal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
            Logo Frontal (PNG Transparente)
          </label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
                <BadgeCheck className="w-4 h-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-on-surface truncate">{config.logoName}</span>
                <span className="text-[10px] font-mono text-on-surface-variant">PNG con transparencia</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded text-xs font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
