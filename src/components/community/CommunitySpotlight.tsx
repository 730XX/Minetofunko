import React from 'react';
import { Star, Download, Zap, FileDown, SlidersHorizontal, Grid, PlusCircle } from 'lucide-react';
import { RollingNumber } from '../common/RollingNumber';
import type { CommunityFigure } from './CommunityGallery';

export interface CommunitySpotlightProps {
  featuredSpotlight: CommunityFigure | null;
  isLoading: boolean;
  totalDesigns: number;
  totalDownloads: number;
  activeCreators: number;
  onOpenPublish: () => void;
  onRemix: (figure: CommunityFigure) => void;
  onDownloadPdf: (figure: CommunityFigure) => void;
  onSelectSpotlight: (figure: CommunityFigure) => void;
}

export const CommunitySpotlight: React.FC<CommunitySpotlightProps> = ({
  featuredSpotlight,
  isLoading,
  totalDesigns,
  totalDownloads,
  activeCreators,
  onOpenPublish,
  onRemix,
  onDownloadPdf,
  onSelectSpotlight,
}) => {
  return (
    <div className="px-space-xl pt-space-xl pb-space-lg flex flex-col gap-space-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
        <div className="max-w-2xl flex flex-col gap-space-xs">
          <div className="inline-flex items-center gap-space-xs text-primary font-mono-badge text-mono-badge uppercase tracking-wider">
            Directorio Abierto de Papercraft Voxel
          </div>
          <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight">
            Galería de Creadores Papercraft
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Descubre, califica y remixa figuras Funko Pop de Minecraft creadas por la comunidad. Listas para imprimir en escala 1:1 o editar en 1 clic.
          </p>
        </div>

        {/* Glassmorphic Community Metrics */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="bg-surface-container-low/80 backdrop-blur-md px-space-lg py-space-sm rounded-xl flex flex-col shadow-sm border border-surface-container-high/40">
            <span className="font-mono-metric text-headline-md text-primary">
              <RollingNumber value={totalDesigns} />
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Diseños Compartidos</span>
          </div>
          <div className="bg-surface-container-low/80 backdrop-blur-md px-space-lg py-space-sm rounded-xl flex flex-col shadow-sm border border-surface-container-high/40">
            <span className="font-mono-metric text-headline-md text-secondary">
              <RollingNumber value={totalDownloads} />
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Moldes Impresos</span>
          </div>
          <div className="bg-surface-container-low/80 backdrop-blur-md px-space-lg py-space-sm rounded-xl flex flex-col shadow-sm border border-surface-container-high/40">
            <span className="font-mono-metric text-headline-md text-tertiary">
              <RollingNumber value={activeCreators} />
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Creadores Activos</span>
          </div>
        </div>
      </div>

      {/* Featured Spotlight: Figura Destacada */}
      {featuredSpotlight ? (
        <div className="w-full bg-gradient-to-r from-surface-container-lowest via-surface-container to-surface-container-low rounded-xl p-space-xl relative overflow-hidden shadow-xl border border-surface-container-high/50">
          {/* Glow Decor */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/3 bottom-0 w-64 h-64 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-space-xl relative z-10">
            {/* Left details */}
            <div className="flex flex-col gap-space-md max-w-xl">
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="px-space-xs py-space-2xs bg-primary text-on-primary font-mono-badge text-mono-badge rounded uppercase flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" /> FIGURA DESTACADA
                </span>
                <span className="px-space-xs py-space-2xs bg-surface-container-highest text-secondary font-mono-badge text-mono-badge rounded uppercase">
                  {featuredSpotlight.tag}
                </span>
                <span className="px-space-xs py-space-2xs bg-surface-container-highest text-on-surface-variant font-mono-badge text-mono-badge rounded">
                  300 DPI Molde Vectorial
                </span>
              </div>

              <div className="flex flex-col">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  {featuredSpotlight.title}
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">
                  {featuredSpotlight.description}
                </p>
              </div>

              {/* Creator & Stats Meta */}
              <div className="flex items-center gap-space-lg flex-wrap">
                <div className="flex items-center gap-space-xs">
                  {featuredSpotlight.avatar_url ? (
                    <img
                      src={featuredSpotlight.avatar_url}
                      alt="Author"
                      className="w-8 h-8 rounded-full object-cover border border-primary/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-mono-metric text-mono-metric font-bold">
                      {featuredSpotlight.authorInitials}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {featuredSpotlight.author.replace('@', '')}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {featuredSpotlight.author}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-space-2xs rounded">
                  <Star className="w-4 h-4 text-tertiary fill-tertiary" />
                  <span className="font-mono-metric text-mono-metric text-on-surface">
                    {featuredSpotlight.rating.toFixed(1)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    ({featuredSpotlight.reviews} reseñas)
                  </span>
                </div>

                <div className="flex items-center gap-space-xs text-on-surface-variant font-mono-metric text-mono-metric">
                  <Download className="w-4 h-4" />
                  <span><RollingNumber value={featuredSpotlight.downloads} /> descargas</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-space-md pt-space-xs flex-wrap">
                <button
                  onClick={() => onRemix(featuredSpotlight)}
                  className="px-space-xl py-space-sm bg-primary text-on-primary font-headline-sm text-headline-sm rounded hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-md cursor-pointer hover:scale-[1.02]"
                >
                  <Zap className="w-4 h-4" />
                  <span>Remix en Taller</span>
                </button>
                <button
                  onClick={() => onDownloadPdf(featuredSpotlight)}
                  className="px-space-lg py-space-sm bg-surface-container-high text-on-surface font-body-lg text-body-lg rounded hover:bg-surface-container-highest transition-all flex items-center gap-space-xs cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Descargar PDF Mold (A4)</span>
                </button>
                <button
                  onClick={() => onSelectSpotlight(featuredSpotlight)}
                  className="px-space-md py-space-sm bg-surface-container-highest text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm rounded flex items-center gap-space-xs transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Inspeccionar Rig</span>
                </button>
              </div>
            </div>

            {/* Right 3D Visual Mockup Canvas */}
            <div
              onClick={() => onSelectSpotlight(featuredSpotlight)}
              className="relative w-full lg:w-96 h-64 lg:h-72 rounded-xl bg-surface-container-lowest flex items-center justify-center overflow-hidden shadow-inner group cursor-pointer border border-surface-container-high/40"
            >
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute bottom-6 w-48 h-12 bg-primary/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 w-40 h-4 bg-surface-container-highest rounded-full shadow-lg"></div>

              <img
                src={featuredSpotlight.image}
                alt={featuredSpotlight.alt || featuredSpotlight.title}
                className="relative z-10 max-h-56 object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-space-xs bg-surface-container-highest/90 px-space-xs py-1 rounded backdrop-blur">
                <div className="w-5 h-5 bg-surface-variant rounded overflow-hidden flex items-center justify-center">
                  <Grid className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="font-mono-badge text-mono-badge text-on-surface">
                  {featuredSpotlight.specLabel}
                </span>
              </div>

              <div className="absolute top-3 right-3 z-20 px-space-xs py-1 bg-surface-container-high/90 backdrop-blur rounded font-mono-badge text-mono-badge text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                PAPERCRAFT READY
              </div>
            </div>
          </div>
        </div>
      ) : !isLoading ? (
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-xl border border-dashed border-surface-container-high flex flex-col items-center justify-center text-center gap-3">
          <PlusCircle className="w-12 h-12 text-primary" />
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            ¡Sé el primero en publicar un Funko en la comunidad!
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
            Personalizá tu personaje en el Taller 3D y hacé clic en &ldquo;Publicar mi Funko&rdquo; para que otros usuarios puedan verlo y descargarlo.
          </p>
          <button
            onClick={onOpenPublish}
            className="mt-2 px-space-xl py-space-sm bg-primary text-on-primary font-headline-sm text-headline-sm rounded hover:bg-primary-container transition-all cursor-pointer shadow-md"
          >
            Publicar Ahora
          </button>
        </div>
      ) : null}
    </div>
  );
};
