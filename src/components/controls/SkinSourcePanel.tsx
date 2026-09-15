import React, { useState, useRef } from 'react';
import type { SkinMetadata } from '../../types';
import { User, FileImage, Search, History, X, UploadCloud, ImageDown } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

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
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('craftpop_recent_skins', JSON.stringify(updated));
      } catch {
        // Ignore local storage error
      }
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, nameToRemove: string) => {
    e.stopPropagation(); // Evitar disparar la carga de la skin
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
    <div className="flex flex-col gap-4">
      {/* Selector de modo: Nickname vs Subir Archivo */}
      <div className="grid grid-cols-2 p-1 bg-[#121620] rounded-xl gap-1 border border-[#262a34]">
        <button
          onClick={() => setTab('username')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === 'username'
              ? 'bg-[#262a34] text-[#4edea3] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dfe2ef]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Buscar por User</span>
        </button>
        <button
          onClick={() => setTab('upload')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === 'upload'
              ? 'bg-[#262a34] text-[#4edea3] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dfe2ef]'
          }`}
        >
          <FileImage className="w-3.5 h-3.5" />
          <span>Subir PNG</span>
        </button>
      </div>

      {/* Vista: Buscar por Nickname */}
      {tab === 'username' ? (
        <div className="flex flex-col gap-3">
          <form onSubmit={(e) => handleFetch(e)} className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 text-[#86948a] w-4 h-4" />
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Nombre / UUID"
                className="w-full bg-[#0a0e17] text-[#dfe2ef] font-mono text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#262a34] focus:outline-none focus:border-[#4edea3] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !usernameInput.trim()}
              className="px-4 py-2.5 bg-[#4edea3] hover:bg-[#3ec48e] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <span>{isLoading ? '...' : 'Cargar'}</span>
              <ImageDown className={`w-3.5 h-3.5`} />
            </button>
          </form>

          {/* Búsquedas recientes con rostros */}
          {recentSearches.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-[#86948a] font-mono">
                <History className="w-3 h-3" />
                <span>Recientes:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {recentSearches.map((name) => (
                  <div
                    key={name}
                    onClick={() => handleFetch(undefined, name)}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#121620] hover:bg-[#262a34] border border-[#262a34] hover:border-[#4edea3]/40 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={`https://minotar.net/avatar/${encodeURIComponent(name)}/24`}
                        alt={name}
                        className="w-6 h-6 rounded [image-rendering:pixelated] shrink-0 border border-[#262a34]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-xs font-mono text-[#dfe2ef] group-hover:text-[#4edea3] truncate">
                        {name}
                      </span>
                    </div>
                    <Tooltip position="left" content={`Eliminar ${name} de recientes`}>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(e, name)}
                        className="p-1 rounded-md text-[#86948a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100 shrink-0 cursor-pointer ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Tooltip>
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
          className="group p-6 rounded-xl bg-[#121620] hover:bg-[#1a202d] border-2 border-dashed border-[#262a34] hover:border-[#4edea3] transition-all flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".png"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-[#4edea3]/10 text-[#4edea3] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#dfe2ef]">Arrastra o haz clic para subir tu skin</p>
          <span className="text-[10px] text-[#86948a] mt-1 font-mono">Archivo PNG de Minecraft</span>
        </div>
      )}

      {/* Skin Activa Actual */}
      <div className="p-3 bg-[#121620] rounded-xl flex items-center gap-3 border border-[#262a34]">
        <div className="relative w-12 h-12 rounded-lg bg-[#0a0e17] flex items-center justify-center overflow-hidden shrink-0 border border-[#262a34]">
          <img
            src={currentSkin.dataUrl}
            alt={currentSkin.name}
            className="w-full h-full object-contain [image-rendering:pixelated]"
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <span className="text-[10px] font-mono text-[#86948a] uppercase tracking-wider">
            Skin Actual
          </span>
          <span className="text-xs font-bold text-[#dfe2ef] truncate">
            {currentSkin.name.replace('_', ' ')}
          </span>
          <span className="text-[10px] font-mono text-[#4edea3] mt-0.5">
            Mapeada al molde 2D y 3D
          </span>
        </div>
      </div>
    </div>
  );
};
