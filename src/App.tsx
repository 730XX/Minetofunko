import { useState, useEffect, useCallback, useRef } from 'react';
import type { ViewMode, SkinMetadata } from './types';
import { Header } from './components/layout/Header';
import { NavSidebar } from './components/layout/NavSidebar';
import { SkinSourcePanel } from './components/controls/SkinSourcePanel';
import { MoldMatrixPanel } from './components/controls/MoldMatrixPanel';
import { ExportBar } from './components/controls/ExportBar';
import { FunkoCanvas } from './components/preview-2d/FunkoCanvas';
import { FunkoViewer3D } from './components/preview-3d/FunkoViewer3D';
import { renderFunko2D } from './core/engine/funko2dRenderer';
import { fetchSkinByUsername, loadImage } from './services/skinFetcher';
import { exportToPDF, exportToPNG } from './services/pdfExporter';
import { scaleImageNearestNeighbor } from './core/transforms/imageUtils';

import { FUNKO_GROOVER_CONFIG } from './core/config/coordinates2d';
import type { PartTransformation } from './core/engine/types';
import { RefreshCw, Copy, Check } from 'lucide-react';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [currentSkin, setCurrentSkin] = useState<SkinMetadata>({
    name: 'Default_Scala',
    sourceType: 'default',
    dataUrl: '/templates/default-skin.png',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [rendered2DCanvas, setRendered2DCanvas] = useState<HTMLCanvasElement | null>(null);
  const [skinCanvas, setSkinCanvas] = useState<HTMLCanvasElement | null>(null);
  const [parts, setParts] = useState<PartTransformation[]>(FUNKO_GROOVER_CONFIG.parts);
  const [copiedCode, setCopiedCode] = useState(false);

  // Cache de imágenes cargadas para re-renderizado instantáneo
  const loadedImagesRef = useRef<{ skin: HTMLImageElement; template: HTMLImageElement } | null>(null);

  // Procesa la skin inicial o cuando cambia la fuente
  const processSkin = useCallback(async (skinSrc: string) => {
    try {
      setIsLoading(true);
      const [skinImg, templateImg] = await Promise.all([
        loadImage(skinSrc),
        loadImage('/templates/molde-groover.png'),
      ]);
      loadedImagesRef.current = { skin: skinImg, template: templateImg };

      // 1. Render 2D Mold
      const result2D = renderFunko2D({
        skinImage: skinImg,
        templateImage: templateImg,
        parts,
      });
      setRendered2DCanvas(result2D);

      // 2. Prepare Skin Canvas for 3D Viewer
      const scaled = scaleImageNearestNeighbor(skinImg, 1920, 1080);
      setSkinCanvas(scaled);
    } catch (err) {
      console.error('Error al procesar la skin:', err);
    } finally {
      setIsLoading(false);
    }
  }, [parts]);

  // Actualizar molde 2D cuando cambian las piezas sin recargar imágenes ni desmontar componentes
  useEffect(() => {
    if (loadedImagesRef.current) {
      const result2D = renderFunko2D({
        skinImage: loadedImagesRef.current.skin,
        templateImage: loadedImagesRef.current.template,
        parts,
      });
      setRendered2DCanvas(result2D);
    }
  }, [parts]);

  // Cargar cuando cambia la skin inicial
  useEffect(() => {
    if (currentSkin.dataUrl) {
      processSkin(currentSkin.dataUrl);
    }
  }, [currentSkin.dataUrl, processSkin]);


  // Manejar búsqueda por Nickname
  const handleFetchUsername = async (username: string) => {
    try {
      setIsLoading(true);
      const skinUrl = await fetchSkinByUsername(username);
      setCurrentSkin({
        name: username,
        sourceType: 'username',
        dataUrl: skinUrl,
      });
      await processSkin(skinUrl);
    } catch (err) {
      alert(`No se pudo cargar la skin del jugador "${username}". Verifica que el nombre exista.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar subida de archivo local
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCurrentSkin({
          name: file.name.replace(/\.[^/.]+$/, ''),
          sourceType: 'upload',
          dataUrl,
        });
        await processSkin(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Presets
  const presets = [
    { name: 'Alex_Adventurer', url: 'https://minotar.net/skin/Alex' },
    { name: 'Steve_Classic', url: 'https://minotar.net/skin/MHF_Steve' },
    { name: 'Default_Scala', url: '/templates/default-skin.png' },
  ];

  const handleSelectPreset = async (preset: { name: string; url: string }) => {
    setCurrentSkin({
      name: preset.name,
      sourceType: 'username',
      dataUrl: preset.url,
    });
    await processSkin(preset.url);
  };

  // Exportaciones
  const handleExportPDF = () => {
    if (rendered2DCanvas) {
      exportToPDF(rendered2DCanvas, `funko-${currentSkin.name}.pdf`);
    }
  };

  const handleExportPNG = () => {
    if (rendered2DCanvas) {
      exportToPNG(rendered2DCanvas, `funko-${currentSkin.name}.png`);
    }
  };

  return (

    <div className="h-screen w-screen bg-[#0f131c] text-[#dfe2ef] antialiased overflow-hidden flex flex-col">
      {/* Top Header */}
      <Header viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Main Container */}
      <div className="flex flex-1 pt-11 w-full h-[calc(100vh-2.75rem)] overflow-hidden">
        {/* Left Navigation Bar */}
        <NavSidebar viewMode={viewMode} onViewModeChange={setViewMode} />

        {/* Content Area */}
        <div className="flex-1 flex flex-col xl:flex-row md:pl-56 h-full overflow-hidden">
          {/* Controls & Configuration Sidebar */}
          <aside className="w-full xl:w-[380px] shrink-0 bg-[#181b25] border-r border-[#262a34] flex flex-col justify-between shadow-2xl z-20 h-full">
            <div className="p-4 flex flex-col gap-5 overflow-y-auto flex-1 min-h-0">
              <SkinSourcePanel
                currentSkin={currentSkin}
                isLoading={isLoading}
                onFetchUsername={handleFetchUsername}
                onUploadFile={handleUploadFile}
              />
              <MoldMatrixPanel />
            </div>

            {/* Pinned Export Bar */}
            <div className="shrink-0">
              <ExportBar
                onExportPDF={handleExportPDF}
                onExportPNG={handleExportPNG}
                disabled={!rendered2DCanvas || isLoading}
              />
            </div>
          </aside>

          {/* Main Viewport Stage */}
          <main className="flex-1 flex flex-col bg-[#0f131c] relative overflow-hidden min-w-0 h-full">
            {/* Upper Stage Control Header Bar */}
            <div className="h-12 px-5 bg-[#1c1f29]/80 backdrop-blur-md border-b border-[#262a34] flex items-center justify-between shrink-0 z-30">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#0a0e17] p-1 rounded-full border border-[#262a34]">
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      viewMode === '2d'
                        ? 'bg-[#262a34] text-[#4edea3]'
                        : 'text-[#bbcabf] hover:text-[#dfe2ef]'
                    }`}
                  >
                    <span>2D Print Mold</span>
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      viewMode === '3d'
                        ? 'bg-[#262a34] text-[#4edea3]'
                        : 'text-[#bbcabf] hover:text-[#dfe2ef]'
                    }`}
                  >
                    <span>3D Funko Preview</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons for 2D Mold */}
              {viewMode === '2d' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setParts(FUNKO_GROOVER_CONFIG.parts)}
                    title="Restablecer todas las piezas al estado de fábrica original"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#262a34] hover:bg-rose-500/20 text-[#bbcabf] hover:text-rose-400 font-mono text-[11px] border border-[#3c4a42] hover:border-rose-500/40 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restablecer Fábrica</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(parts, null, 2));
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    title="Copiar configuración de coordenadas modificadas"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1c1f29] hover:bg-[#262a34] text-[#4edea3] font-mono text-[11px] border border-[#262a34] hover:border-[#4edea3]/40 transition-colors cursor-pointer shadow-sm"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Exportar JSON'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stage Canvas Area */}
            <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex items-center justify-center">
              {viewMode === '2d' ? (
                <FunkoCanvas
                  canvasElement={rendered2DCanvas}
                  parts={parts}
                  onPartsChange={setParts}
                  onResetParts={() => setParts(FUNKO_GROOVER_CONFIG.parts)}
                  onPrint={handleExportPDF}
                />
              ) : (
                <FunkoViewer3D
                  skinCanvas={skinCanvas}
                  rendered2DCanvas={rendered2DCanvas}
                  parts={parts}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;


