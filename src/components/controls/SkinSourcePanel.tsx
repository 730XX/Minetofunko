import React, { useState, useRef } from 'react';
import type { SkinMetadata } from '../../types';

interface SkinSourcePanelProps {
  currentSkin: SkinMetadata;
  isLoading: boolean;
  onFetchUsername: (username: string) => Promise<void>;
  onUploadFile: (file: File) => void;
}

export const SkinSourcePanel: React.FC<SkinSourcePanelProps> = ({
  currentSkin,
  isLoading,
  onFetchUsername,
  onUploadFile,
}) => {
  const [tab, setTab] = useState<'username' | 'upload'>('username');
  const [usernameInput, setUsernameInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Historial de búsquedas recientes con persistencia local
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('craftpop_recent_skins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 16);
      try {
        localStorage.setItem('craftpop_recent_skins', JSON.stringify(updated));
      } catch {
        // Ignore local storage error
      }
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, nameToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== nameToRemove.toLowerCase());
      try {
        localStorage.setItem('craftpop_recent_skins', JSON.stringify(updated));
      } catch {
        // Ignore local storage error
      }
      return updated;
    });
  };

  const handleFetch = async (e?: React.FormEvent, customName?: string) => {
    if (e) e.preventDefault();
    const query = (customName || usernameInput).trim();
    if (query) {
      await onFetchUsername(query);
      saveRecentSearch(query);
      if (!customName) setUsernameInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.includes('png')) {
      onUploadFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* Selector de modo: Nickname vs Subir Archivo */}
      <div className="grid grid-cols-2 p-space-2xs bg-surface-container-low rounded-xl gap-space-2xs border border-surface-container-high/60">
        <button
          onClick={() => setTab('username')}
          className={`flex items-center justify-center gap-1.5 py-space-xs px-space-sm rounded-lg font-headline-sm text-body-sm transition-all cursor-pointer ${
            tab === 'username'
              ? 'bg-surface-container-highest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">person</span>
          <span>Buscar por User</span>
        </button>
        <button
          onClick={() => setTab('upload')}
          className={`flex items-center justify-center gap-1.5 py-space-xs px-space-sm rounded-lg font-headline-sm text-body-sm transition-all cursor-pointer ${
            tab === 'upload'
              ? 'bg-surface-container-highest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">image</span>
          <span>Subir PNG</span>
        </button>
      </div>

      {/* Vista: Buscar por Nickname */}
      {tab === 'username' ? (
        <div className="flex flex-col gap-space-sm">
          <form onSubmit={(e) => handleFetch(e)} className="flex items-center gap-space-xs">
            <div className="relative flex-1 flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[16px]">
                search
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Nombre / UUID de Minecraft"
                className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-9 pr-3 py-2 rounded-xl border border-surface-container-high/60 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !usernameInput.trim()}
              className="px-space-md py-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <span>{isLoading ? '...' : 'Cargar'}</span>
              <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
                sync
              </span>
            </button>
          </form>

          {/* Búsquedas recientes con rostros */}
          {recentSearches.length > 0 && (
            <div className="flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs text-[11px] text-on-surface-variant font-mono-metric">
                <span className="material-symbols-outlined text-[13px]">history</span>
                <span>Recientes:</span>
              </div>
              <div className="grid grid-cols-2 gap-space-xs">
                {recentSearches.map((name) => (
                  <div
                    key={name}
                    onClick={() => handleFetch(undefined, name)}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 hover:border-primary/40 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={`https://minotar.net/avatar/${encodeURIComponent(name)}/24`}
                        alt={name}
                        className="w-5 h-5 rounded [image-rendering:pixelated] shrink-0 border border-surface-container-high"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="font-mono-metric text-[11px] text-on-surface group-hover:text-primary truncate">
                        {name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(e, name)}
                      title={`Eliminar ${name} de recientes`}
                      className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors opacity-60 group-hover:opacity-100 shrink-0 cursor-pointer ml-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vista: Subir PNG Dropzone */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group p-6 rounded-xl bg-surface-container-low hover:bg-surface-container border-2 border-dashed border-surface-container-high/80 hover:border-primary transition-all flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".png"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
          </div>
          <p className="font-headline-sm text-body-sm text-on-surface">Arrastra o haz clic para subir tu skin</p>
          <span className="font-mono-badge text-[10px] text-on-surface-variant mt-1">Archivo PNG de Minecraft</span>
        </div>
      )}

      {/* Skin Activa Actual */}
      <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center gap-space-sm border border-surface-container-high/60">
        <div className="relative w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden shrink-0 border border-surface-container-high/60">
          <img
            src={currentSkin.dataUrl}
            alt={currentSkin.name}
            className="w-full h-full object-contain [image-rendering:pixelated]"
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <span className="font-mono-badge text-mono-badge text-on-surface-variant uppercase tracking-wider">
            Skin Actual
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface truncate">
            {currentSkin.name.replace('_', ' ')}
          </span>
          <span className="font-mono-metric text-[10px] text-primary mt-0.5">
            Mapeada al molde 2D y 3D
          </span>
        </div>
      </div>
    </div>
  );
};
