import React from 'react';
import type { ViewMode } from '../../types';
import { Box, Grid3X3, HelpCircle, Code, User } from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <header className="fixed top-0 inset-x-0 h-11 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30">
      <div className="w-full h-full px-4 flex items-center justify-between">
        {/* Logo & Version */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm shadow-md shadow-primary/20">
            CP
          </div>
          <span className="text-sm font-semibold tracking-tight text-on-surface font-headline-sm">CraftPop</span>
          <span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface-variant rounded text-[10px] font-mono uppercase tracking-wider">
            v1.0-beta
          </span>
          <div className="flex items-center gap-1 pl-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
              Engine: Ready
            </span>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center">
          <nav className="flex items-center bg-surface-container p-0.5 rounded-full border border-outline-variant/30">
            <button
              onClick={() => onViewModeChange('2d')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === '2d'
                  ? 'bg-surface-container-highest text-primary font-semibold shadow-inner'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>2D Print Mold</span>
            </button>
            <button
              onClick={() => onViewModeChange('3d')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === '3d'
                  ? 'bg-surface-container-highest text-primary font-semibold shadow-inner'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Funko Preview</span>
            </button>
          </nav>
        </div>

        {/* Technical Calibration & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 bg-surface-container px-2.5 py-1 rounded text-xs font-mono border border-outline-variant/30">
            <span className="text-outline">DIM:</span>
            <span className="text-on-surface">195 × 282 mm</span>
            <span className="text-outline-variant">|</span>
            <span className="text-primary font-semibold">1:1 Calibrated</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              title="Documentation & Help"
              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              title="GitHub Repository"
              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
};

