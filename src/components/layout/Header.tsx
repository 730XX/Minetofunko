import React, { useState } from 'react';
import type { ViewMode } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Columns2, Box, Layers, Globe, FolderKanban, Package, UploadCloud, ChevronDown, LogOut, Boxes, Loader2 } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface HeaderProps {
  activeHubTab: 'editor' | 'community';
  onHubTabChange: (tab: 'editor' | 'community') => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenBoxWizard: () => void;
  onOpenPublish: () => void;
  onOpenMyProjects?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeHubTab,
  onHubTabChange,
  viewMode,
  onViewModeChange,
  onOpenBoxWizard,
  onOpenPublish,
  onOpenMyProjects,
}) => {
  const { user, authStatus, signInWithGoogle, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="w-full bg-surface-container-lowest px-space-xl py-space-sm flex flex-wrap items-center justify-between gap-space-md shadow-sm border-b border-surface-container-high/40 sticky top-0 z-50 backdrop-blur-md">
      {/* Brand & Breadcrumbs */}
      <div className="flex items-center gap-space-md">
        <div
          className="flex items-center gap-space-xs cursor-pointer group select-none"
          onClick={() => onHubTabChange('editor')}
        >
          <Boxes className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-headline-sm text-headline-sm text-on-surface">Minetofunko</span>
          <span className="text-on-surface-variant font-mono-metric text-mono-metric">/</span>
          <span className="font-headline-sm text-headline-sm text-primary">
            {activeHubTab === 'editor' ? 'Taller 3D & Molde' : 'Skin Vault Hub'}
          </span>
        </div>
      </div>

      {/* Hub Central Tabs Navigation (Exacto al template) */}
      <nav className="flex items-center gap-space-xs bg-surface-container-low p-space-2xs rounded-full border border-surface-container-high/60">
        <button
          onClick={() => onHubTabChange('editor')}
          className={`px-space-md py-space-xs rounded-full flex items-center gap-space-xs transition-all cursor-pointer ${
            activeHubTab === 'editor'
              ? 'bg-surface-container-highest text-primary shadow-inner font-headline-sm text-headline-sm'
              : 'font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Box className="w-3.5 h-3.5 shrink-0" />
          <span>Taller 3D & Molde</span>
        </button>

        <button
          onClick={() => onHubTabChange('community')}
          className={`px-space-md py-space-xs rounded-full flex items-center gap-space-xs transition-all cursor-pointer ${
            activeHubTab === 'community'
              ? 'bg-surface-container-highest text-primary shadow-inner font-headline-sm text-headline-sm'
              : 'font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>Galería de la Comunidad</span>
        </button>

        <button
          onClick={() => {
            if (onOpenMyProjects) onOpenMyProjects();
            else onHubTabChange('community');
          }}
          className="px-space-md py-space-xs rounded-full font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-space-xs cursor-pointer"
        >
          <FolderKanban className="w-3.5 h-3.5 shrink-0" />
          <span>Mis Proyectos</span>
        </button>

        <Tooltip position="bottom" content="Personalizar y exportar caja coleccionista 3D con diorama">
          <button
            onClick={onOpenBoxWizard}
            className="px-space-md py-space-xs rounded-full font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-space-xs cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Cajas Coleccionista</span>
          </button>
        </Tooltip>
      </nav>

      {/* Actions, Viewport & Creator Auth */}
      <div className="flex items-center gap-space-sm">
        {/* En el Taller: Botón unificado cíclico de vista (Split → 3D → 2D → Split) */}
        {activeHubTab === 'editor' && (
          <Tooltip
            position="bottom"
            content={
              <div className="flex flex-col gap-0.5 text-left">
                <span className="font-semibold text-primary">
                  {viewMode === 'split' ? 'Vista Split (2D + 3D)' : viewMode === '3d' ? 'Vista Solo 3D' : 'Vista Solo 2D'}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  Clic para alternar a {viewMode === 'split' ? 'Solo 3D' : viewMode === '3d' ? 'Solo 2D' : 'Split'}
                </span>
              </div>
            }
          >
            <button
              onClick={() => {
                const nextMode: Record<ViewMode, ViewMode> = {
                  split: '3d',
                  '3d': '2d',
                  '2d': 'split',
                };
                onViewModeChange(nextMode[viewMode]);
              }}
              className="px-space-md py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-container-high/70 text-on-surface font-mono-metric text-[11px] flex items-center gap-space-xs transition-all cursor-pointer shadow-xs group mr-1"
            >
              {viewMode === 'split' && (
                <Columns2 className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              )}
              {viewMode === '3d' && (
                <Box className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              )}
              {viewMode === '2d' && (
                <Layers className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              )}
              <span className="font-semibold text-primary">
                {viewMode === 'split' ? 'Split' : viewMode === '3d' ? 'Solo 3D' : 'Solo 2D'}
              </span>
            </button>
          </Tooltip>
        )}

        {/* Publicar mi Funko Button */}
        <Tooltip position="bottom" content="Compartir tu figura en la galería pública de la comunidad">
          <button
            onClick={onOpenPublish}
            className="px-space-md py-space-xs bg-primary text-on-primary font-headline-sm text-headline-sm rounded hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-md cursor-pointer hover:shadow-primary/20 active:scale-95"
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            <span>Publicar mi Funko</span>
          </button>
        </Tooltip>

        <div className="h-6 w-px bg-surface-container-highest"></div>

        {/* Creator Auth Badge / Google Login */}
        <div className="relative">
          {authStatus === 'signing_in' ? (
            <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-space-2xs rounded-full border border-primary/40 text-primary text-xs font-mono-metric animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Iniciando...</span>
            </div>
          ) : authStatus === 'signing_out' ? (
            <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-space-2xs rounded-full border border-error/40 text-error text-xs font-mono-metric animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-error" />
              <span>Saliendo...</span>
            </div>
          ) : user ? (
            <>
              <Tooltip position="bottom" content="Ver opciones de cuenta y proyectos">
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-space-xs bg-surface-container hover:bg-surface-container-high px-space-sm py-space-2xs rounded-full border border-surface-container-high/60 cursor-pointer transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover border border-primary/40"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-mono-badge text-mono-badge font-bold">
                      {user.email ? user.email.substring(0, 2).toUpperCase() : 'AK'}
                    </div>
                  )}
                  <span className="font-body-sm text-body-sm text-on-surface max-w-[140px] truncate">
                    {user.user_metadata?.full_name || (user.email ? `@${user.email.split('@')[0]}` : '@Creador')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                </button>
              </Tooltip>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-low border border-surface-container-high rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs animate-in fade-in duration-150">
                    <div className="px-2.5 py-2 border-b border-surface-container-high flex flex-col gap-0.5">
                      <span className="font-headline-sm text-body-sm text-on-surface truncate">
                        {user.user_metadata?.full_name || 'Usuario'}
                      </span>
                      <span className="font-mono-metric text-[10px] text-on-surface-variant truncate">
                        {user.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenMyProjects) onOpenMyProjects();
                        else onHubTabChange('community');
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded text-on-surface hover:bg-surface-container-high transition-colors text-left cursor-pointer"
                    >
                      <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                      <span>Mis Proyectos</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded text-error hover:bg-error/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Tooltip position="bottom" content="Acceder con Google para guardar y publicar Funkos">
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-space-xs bg-surface-container hover:bg-surface-container-high px-space-md py-space-2xs rounded-full border border-surface-container-high text-on-surface font-body-sm text-body-sm transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Acceder</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  );
};
