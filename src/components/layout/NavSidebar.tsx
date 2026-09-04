import React from 'react';
import type { ViewMode } from '../../types';
import { Box, Grid3X3, FolderOpen, Package } from 'lucide-react';

interface NavSidebarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const NavSidebar: React.FC<NavSidebarProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <aside className="fixed left-0 top-12 bottom-0 w-56 bg-surface-container-low border-r border-outline-variant/30 z-40 flex flex-col justify-between hidden md:flex">
      <div className="p-3 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <span className="text-xs font-semibold text-on-surface">Skin Pipeline</span>
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-mono uppercase">
            64x64 RGBA
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => onViewModeChange('3d')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all ${
              viewMode === '3d'
                ? 'bg-surface-container-high text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Box className="w-4 h-4 text-primary" />
            <span>3D Studio</span>
          </button>

          <button
            onClick={() => onViewModeChange('2d')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all ${
              viewMode === '2d'
                ? 'bg-surface-container-high text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Grid3X3 className="w-4 h-4 text-primary" />
            <span>Print Templates</span>
          </button>

          <button
            className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all opacity-60 cursor-not-allowed"
            title="Próximamente"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Skin Vault</span>
          </button>

          <button
            className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all opacity-60 cursor-not-allowed"
            title="Próximamente"
          >
            <Package className="w-4 h-4" />
            <span>Export Forge</span>
          </button>
        </nav>
      </div>

      <div className="p-3 bg-surface-container-lowest/60 border-t border-outline-variant/30 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-outline">Poly Status</span>
          <span className="text-primary font-semibold">3,420 TRIS</span>
        </div>
        <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
          <div className="bg-primary h-full w-2/3"></div>
        </div>
      </div>
    </aside>
  );
};

