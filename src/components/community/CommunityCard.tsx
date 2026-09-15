import React from 'react';
import { Star, Download, RefreshCw, Layers, Zap, MoreVertical, Heart } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { RollingNumber } from '../common/RollingNumber';
import type { CommunityFigure } from './CommunityGallery';

export interface CommunityCardProps {
  figure: CommunityFigure;
  isLiked: boolean;
  onToggleLike: (e: React.MouseEvent, id: string) => void;
  onSelect: (figure: CommunityFigure) => void;
  onRemix: (figure: CommunityFigure) => void;
  onDownloadPdf: (figure: CommunityFigure) => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  figure,
  isLiked,
  onToggleLike,
  onSelect,
  onRemix,
  onDownloadPdf,
}) => {
  return (
    <div className="figure-card bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-all duration-300 group relative border border-surface-container-high/30 hover:border-surface-container-high">
      {/* 3D Preview Frame */}
      <div
        onClick={() => onSelect(figure)}
        className="relative w-full h-56 bg-surface-container-low flex items-center justify-center overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent z-10"></div>
        <div className="absolute bottom-3 w-28 h-2 bg-primary/30 rounded-full blur-sm"></div>

        <img
          src={figure.image}
          alt={figure.alt || figure.title}
          className="relative z-0 max-h-52 object-contain scale-125 group-hover:scale-130 transition-transform duration-200"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
          <span className="px-space-xs py-0.5 bg-surface-container-highest/90 text-primary font-mono-badge text-mono-badge rounded uppercase">
            {figure.tag}
          </span>
          <span className="px-space-xs py-0.5 bg-primary/20 text-primary font-mono-badge text-mono-badge rounded">
            {figure.badge2 || 'Molde A4 Listo'}
          </span>
        </div>

        {/* Like Button */}
        <div className="absolute top-2 right-2 z-20">
          <Tooltip position="left" content={isLiked ? 'Guardado en favoritos' : 'Guardar en favoritos'}>
            <button
              onClick={(e) => onToggleLike(e, figure.id)}
              className="w-7 h-7 rounded-full bg-surface-container-highest/80 hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'text-error fill-error' : 'text-on-surface-variant hover:text-error'
                }`}
              />
            </button>
          </Tooltip>
        </div>

        {/* Skin Preview mini-badge */}
        <div className="absolute bottom-2 left-2 z-20">
          <Tooltip position="right" content="Formato de textura de Skin">
            <div className="flex items-center gap-1 bg-surface-container-highest/90 px-1.5 py-0.5 rounded backdrop-blur">
              <div className="w-3.5 h-3.5 bg-secondary-container rounded-xs"></div>
              <span className="font-mono-badge text-[9px] text-on-surface">{figure.specLabel}</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Info & Metadata */}
      <div className="p-space-md flex flex-col gap-space-sm flex-1 justify-between">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              {figure.avatar_url ? (
                <img
                  src={figure.avatar_url}
                  alt="Author"
                  className="w-5 h-5 rounded-full object-cover border border-surface-container-high"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center font-mono-badge text-mono-badge text-secondary font-bold">
                  {figure.authorInitials || 'AK'}
                </div>
              )}
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[120px]">
                {figure.author}
              </span>
            </div>
            <div className="flex items-center gap-1 text-tertiary">
              <Star className="w-3.5 h-3.5 fill-tertiary text-tertiary" />
              <span className="font-mono-metric text-mono-metric text-on-surface">
                {figure.rating.toFixed(1)}
              </span>
              <span className="font-mono-metric text-[10px] text-on-surface-variant">
                ({figure.reviews})
              </span>
            </div>
          </div>

          <Tooltip position="top" content={figure.title} wrapperClassName="w-full block text-left">
            <h3
              onClick={() => onSelect(figure)}
              className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer truncate text-left block w-full"
            >
              {figure.title}
            </h3>
          </Tooltip>

          <div className="flex items-center gap-space-md text-on-surface-variant font-mono-metric text-[11px] pt-1">
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <RollingNumber value={figure.downloads} />
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <RollingNumber value={figure.remixes} />
            </span>
            <span className="flex items-center gap-1 truncate">
              <Layers className="w-3.5 h-3.5" /> {figure.specLabel || 'Molde 1:1'}
            </span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-space-xs pt-space-xs">
          <button
            onClick={() => onRemix(figure)}
            className="flex-1 py-space-xs bg-primary text-on-primary font-headline-sm text-body-sm rounded hover:bg-primary-container transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Remix en Taller</span>
          </button>
          <Tooltip position="top" content="Descargar Molde PDF (300 DPI)">
            <button
              onClick={() => onDownloadPdf(figure)}
              className="p-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface rounded transition-colors flex items-center justify-center cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip position="top" content="Inspeccionar Rig 3D y despiece">
            <button
              onClick={() => onSelect(figure)}
              className="p-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded transition-colors flex items-center justify-center cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
