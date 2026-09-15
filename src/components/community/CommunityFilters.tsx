import React from 'react';
import { Search, X, TrendingUp, Award, Download, Clock, LayoutGrid, Grid3X3 } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

export type SortTab = 'trending' | 'top' | 'downloads' | 'newest';
export type ViewDensity = 'large' | 'compact';

export interface TagItem {
  key: string;
  label: string;
}

export interface CommunityFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortTab: SortTab;
  onSortTabChange: (tab: SortTab) => void;
  viewDensity: ViewDensity;
  onViewDensityChange: (density: ViewDensity) => void;
  tagsList: TagItem[];
  activeTag: string;
  onTagChange: (tag: string) => void;
}

export const CommunityFilters: React.FC<CommunityFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortTab,
  onSortTabChange,
  viewDensity,
  onViewDensityChange,
  tagsList,
  activeTag,
  onTagChange,
}) => {
  return (
    <div className="px-space-xl flex flex-col gap-space-md">
      {/* Top Row: Search input + Sorting Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-space-md">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar figuras, mobs, skins..."
            className="w-full pl-9 pr-4 py-space-xs bg-surface-container-lowest border border-surface-container-high focus:border-primary focus:outline-none rounded text-on-surface font-body-sm text-body-sm transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ordering Segments */}
        <div className="flex items-center gap-space-xs bg-surface-container-lowest p-space-2xs rounded border border-surface-container-high/60 overflow-x-auto max-w-full">
          <button
            onClick={() => onSortTabChange('trending')}
            className={`sort-tab px-space-md py-space-xs rounded font-body-sm text-body-sm flex items-center gap-space-xs transition-all cursor-pointer ${
              sortTab === 'trending'
                ? 'bg-surface-container-highest text-primary font-headline-sm text-headline-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>En Tendencia</span>
          </button>
          <button
            onClick={() => onSortTabChange('top')}
            className={`sort-tab px-space-md py-space-xs rounded font-body-sm text-body-sm flex items-center gap-space-xs transition-all cursor-pointer ${
              sortTab === 'top'
                ? 'bg-surface-container-highest text-primary font-headline-sm text-headline-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Mejor Valorados</span>
          </button>
          <button
            onClick={() => onSortTabChange('downloads')}
            className={`sort-tab px-space-md py-space-xs rounded font-body-sm text-body-sm flex items-center gap-space-xs transition-all cursor-pointer ${
              sortTab === 'downloads'
                ? 'bg-surface-container-highest text-primary font-headline-sm text-headline-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Más Descargados</span>
          </button>
          <button
            onClick={() => onSortTabChange('newest')}
            className={`sort-tab px-space-md py-space-xs rounded font-body-sm text-body-sm flex items-center gap-space-xs transition-all cursor-pointer ${
              sortTab === 'newest'
                ? 'bg-surface-container-highest text-primary font-headline-sm text-headline-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Nuevos</span>
          </button>
        </div>

        {/* Density Switcher */}
        <div className="hidden sm:flex items-center bg-surface-container-lowest p-space-2xs rounded border border-surface-container-high/60 gap-1">
          <Tooltip position="bottom" content="Vista Detallada">
            <button
              onClick={() => onViewDensityChange('large')}
              className={`p-space-2xs rounded transition-colors cursor-pointer ${
                viewDensity === 'large'
                  ? 'bg-surface-container-highest text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip position="bottom" content="Vista Compacta">
            <button
              onClick={() => onViewDensityChange('compact')}
              className={`p-space-2xs rounded transition-colors cursor-pointer ${
                viewDensity === 'compact'
                  ? 'bg-surface-container-highest text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Bottom Row: Tag Pills Filter */}
      <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs scrollbar-none">
        {tagsList.map((tagItem) => {
          const isSelected = activeTag === tagItem.key;
          return (
            <button
              key={tagItem.key}
              onClick={() => onTagChange(tagItem.key)}
              className={`tag-pill px-space-sm py-space-2xs font-mono-badge text-mono-badge rounded-full uppercase transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {tagItem.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
