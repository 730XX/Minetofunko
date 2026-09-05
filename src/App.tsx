import { useState, useEffect, useCallback, useRef } from 'react';
import type { ViewMode, SkinMetadata } from './types';
import { Header } from './components/layout/Header';
import { SkinSourcePanel } from './components/controls/SkinSourcePanel';
import { MoldMatrixPanel } from './components/controls/MoldMatrixPanel';
import { ExportBar } from './components/controls/ExportBar';
import { FunkoCanvas } from './components/preview-2d/FunkoCanvas';
import { FunkoViewer3D } from './components/preview-3d/FunkoViewer3D';
import { renderFunko2D } from './core/engine/funko2dRenderer';
import { fetchSkinByUsername, loadImage } from './services/skinFetcher';
import { exportToPDF, exportToPNG } from './services/pdfExporter';
import { scaleImageNearestNeighbor, normalizeSkinCanvas } from './core/transforms/imageUtils';

import { FUNKO_GROOVER_CONFIG } from './core/config/coordinates2d';
import type { PartTransformation } from './core/engine/types';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('paperpop_view_mode') as ViewMode | null;
      if (saved && (saved === '2d' || saved === '3d' || saved === 'split')) {
        return saved;
      }
    } catch {
      // Ignore localStorage read error
    }
    return '2d';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('paperpop_view_mode', mode);
    } catch {
      // Ignore localStorage write error
    }
  };
  const [currentSkin, setCurrentSkin] = useState<SkinMetadata>({
    name: 'Default_Scala',
    sourceType: 'default',
    dataUrl: '/templates/default-skin.png',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [rendered2DCanvas, setRendered2DCanvas] = useState<HTMLCanvasElement | null>(null);
  const [skinCanvas, setSkinCanvas] = useState<HTMLCanvasElement | null>(null);
  const [parts, setParts] = useState<PartTransformation[]>(FUNKO_GROOVER_CONFIG.parts);
  const [skinFormat, setSkinFormat] = useState<'legacy' | 'standard'>('standard');

  // Cache de imágenes cargadas para re-renderizado instantáneo
  const loadedImagesRef = useRef<{ skin: HTMLImageElement | HTMLCanvasElement; template: HTMLImageElement } | null>(null);
  const preScaledSkinRef = useRef<HTMLCanvasElement | null>(null);

  // Procesa la skin inicial o cuando cambia la fuente (solo cuando cambia la URL de la skin)
  const processSkin = useCallback(async (skinSrc: string) => {
    try {
      setIsLoading(true);
      const [rawSkinImg, templateImg] = await Promise.all([
        loadImage(skinSrc),
        loadImage('/templates/molde-groover.png'),
      ]);

      // Detectar automáticamente y normalizar si es una skin legacy de 64x32
      const isLegacy = rawSkinImg.height * 2 === rawSkinImg.width;
      setSkinFormat(isLegacy ? 'legacy' : 'standard');

      const skinImg = normalizeSkinCanvas(rawSkinImg, rawSkinImg.width, rawSkinImg.height);
      loadedImagesRef.current = { skin: skinImg, template: templateImg };

      // Pre-escalar la skin una sola vez a 1920x1080 (evita re-escalarla en cada frame de drag)
      const scaled = scaleImageNearestNeighbor(skinImg, 1920, 1080);
      preScaledSkinRef.current = scaled;
      setSkinCanvas(scaled);

      // 1. Render 2D Mold
      const result2D = renderFunko2D({
        skinImage: skinImg,
        templateImage: templateImg,
        parts,
        preScaledSkin: scaled,
      });
      setRendered2DCanvas(result2D);
    } catch (err) {
      console.error('Error al procesar la skin:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Actualizar molde 2D cuando cambian las piezas sin recargar imágenes ni reiniciar loading
  useEffect(() => {
    if (loadedImagesRef.current) {
      const result2D = renderFunko2D({
        skinImage: loadedImagesRef.current.skin,
        templateImage: loadedImagesRef.current.template,
        parts,
        preScaledSkin: preScaledSkinRef.current || undefined,
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
      <Header viewMode={viewMode} onViewModeChange={handleViewModeChange} />

      {/* Main Container without redundant left NavSidebar */}
      <div className="flex flex-1 pt-11 w-full h-[calc(100vh-2.75rem)] overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 flex flex-col xl:flex-row h-full overflow-hidden w-full">
          {/* Controls & Configuration Sidebar */}
          <aside className="w-full xl:w-[360px] shrink-0 bg-[#181b25] border-r border-[#262a34] flex flex-col justify-between shadow-2xl z-20 h-full">
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
           

            {/* Stage Canvas Area (Single View or Split View) */}
            <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
              {viewMode === 'split' ? (
                <div className="w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[#262a34]">
                  {/* Left Half: 2D Mold */}
                  <div className="flex-1 h-full relative flex items-center justify-center min-w-0 bg-[#0f131c]">
                    <FunkoCanvas
                      canvasElement={rendered2DCanvas}
                      parts={parts}
                      onPartsChange={setParts}
                      onResetParts={() => setParts(FUNKO_GROOVER_CONFIG.parts)}
                      onPrint={handleExportPDF}
                    />
                  </div>
                  {/* Right Half: 3D Funko Studio */}
                  <div className="flex-1 h-full relative min-w-0 bg-[#0a0e17]">
                    <FunkoViewer3D
                      skinCanvas={skinCanvas}
                      rendered2DCanvas={rendered2DCanvas}
                      parts={parts}
                      skinFormat={skinFormat}
                    />
                  </div>
                </div>
              ) : viewMode === '2d' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <FunkoCanvas
                    canvasElement={rendered2DCanvas}
                    parts={parts}
                    onPartsChange={setParts}
                    onResetParts={() => setParts(FUNKO_GROOVER_CONFIG.parts)}
                    onPrint={handleExportPDF}
                  />
                </div>
              ) : (
                <div className="w-full h-full">
                  <FunkoViewer3D
                    skinCanvas={skinCanvas}
                    rendered2DCanvas={rendered2DCanvas}
                    parts={parts}
                    skinFormat={skinFormat}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;


