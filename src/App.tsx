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

import { FUNKO_GROOVER_CONFIG, createDefaultOverlayParts } from './core/config/coordinates2d';
import type { PartTransformation } from './core/engine/types';
import { BoxWizardModal } from './components/box-wizard/BoxWizardModal';
import { PublishModal } from './components/community/PublishModal';
import { ExportSuccessPrompt } from './components/community/ExportSuccessPrompt';
import { CommunityGallery, type CommunityFigure } from './components/community/CommunityGallery';

export function App() {
  const [activeHubTab, setActiveHubTab] = useState<'editor' | 'community'>('editor');
  const [communityNavTab, setCommunityNavTab] = useState<'community' | 'my-projects'>('community');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('paperpop_view_mode') as ViewMode | null;
      if (saved && (saved === '2d' || saved === '3d' || saved === 'split')) {
        return saved;
      }
    } catch {
      // Ignorar fallo de almacenamiento local
    }
    return 'split';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('paperpop_view_mode', mode);
    } catch {
      // Ignorar fallo de almacenamiento local
    }
  };
  const [currentSkin, setCurrentSkin] = useState<SkinMetadata>({
    name: 'Default_Scala',
    sourceType: 'default',
    dataUrl: '/templates/molde.png',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [rendered2DCanvas, setRendered2DCanvas] = useState<HTMLCanvasElement | null>(null);
  const [skinCanvas, setSkinCanvas] = useState<HTMLCanvasElement | null>(null);
  const [parts, setParts] = useState<PartTransformation[]>(FUNKO_GROOVER_CONFIG.parts);
  const [overlayParts, setOverlayParts] = useState<PartTransformation[]>(() => createDefaultOverlayParts(FUNKO_GROOVER_CONFIG.parts));
  const [activeLayer, setActiveLayer] = useState<'base' | 'overlay'>('base');
  const [skinFormat, setSkinFormat] = useState<'legacy' | 'standard'>('standard');
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isBoxWizardOpen, setIsBoxWizardOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isExportSuccessOpen, setIsExportSuccessOpen] = useState<boolean>(false);
  const [showOverlay2D, setShowOverlay2D] = useState<boolean>(true);

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

      // Render 2D Mold completo (para el visor 2D y exportación)
      const result2D = renderFunko2D({
        skinImage: skinImg,
        templateImage: templateImg,
        parts,
        overlayParts,
        preScaledSkin: scaled,
        showOverlay: showOverlay2D,
      });
      setRendered2DCanvas(result2D);
    } catch (err) {
      console.error('Error al procesar la skin:', err);
    } finally {
      setIsLoading(false);
    }
  }, [showOverlay2D, parts, overlayParts]);

  // Actualizar molde 2D completo cuando cambian piezas base, de relieve o el toggle de visibilidad
  // Se aplica un debounce de 80ms para que durante el arrastre en 2D el movimiento
  // y la física 3D fluyan a 60 FPS sin saturar la CPU renderizando 48 piezas de canvas por frame
  useEffect(() => {
    if (!loadedImagesRef.current) return;

    const timer = setTimeout(() => {
      if (loadedImagesRef.current) {
        const result2D = renderFunko2D({
          skinImage: loadedImagesRef.current.skin,
          templateImage: loadedImagesRef.current.template,
          parts,
          overlayParts,
          preScaledSkin: preScaledSkinRef.current || undefined,
          showOverlay: showOverlay2D,
        });
        setRendered2DCanvas(result2D);
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [parts, overlayParts, showOverlay2D]);


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
      setTimeout(() => setIsExportSuccessOpen(true), 1200);
    }
  };

  const handleExportPNG = () => {
    if (rendered2DCanvas) {
      exportToPNG(rendered2DCanvas, `funko-${currentSkin.name}.png`);
      setTimeout(() => setIsExportSuccessOpen(true), 800);
    }
  };

  const handleRemixFigure = async (fig: CommunityFigure) => {
    setActiveHubTab('editor');
    if (fig.config) {
      if (fig.config.parts) setParts(fig.config.parts);
      if (fig.config.overlayParts) setOverlayParts(fig.config.overlayParts);
      if (fig.config.skinFormat) setSkinFormat(fig.config.skinFormat);
    }
    if (fig.skin_url) {
      setCurrentSkin({
        name: fig.title,
        sourceType: 'default',
        dataUrl: fig.skin_url,
      });
      await processSkin(fig.skin_url);
    } else {
      setCurrentSkin((prev) => ({
        ...prev,
        name: fig.title,
      }));
    }
  };

  const handleDownloadPdfFigure = async (fig: CommunityFigure) => {
    if (rendered2DCanvas && currentSkin.name === fig.title) {
      exportToPDF(rendered2DCanvas, `molde-${fig.title}.pdf`);
    } else if (fig.skin_url) {
      try {
        const [skinImg, templateImg] = await Promise.all([
          loadImage(fig.skin_url),
          loadImage('/templates/molde-groover.png'),
        ]);
        const normalized = normalizeSkinCanvas(skinImg, skinImg.width, skinImg.height);
        const scaled = scaleImageNearestNeighbor(normalized, 1920, 1080);
        const moldCanvas = renderFunko2D({
          skinImage: normalized,
          templateImage: templateImg,
          parts: fig.config?.parts || parts,
          overlayParts: fig.config?.overlayParts || overlayParts,
          preScaledSkin: scaled,
          showOverlay: showOverlay2D,
        });
        exportToPDF(moldCanvas, `molde-${fig.title}.pdf`);
      } catch (err) {
        console.error('Error al exportar molde de la figura:', err);
      }
    } else if (rendered2DCanvas) {
      exportToPDF(rendered2DCanvas, `molde-${fig.title}.pdf`);
    }
  };

  return (
    <div className="h-screen w-screen bg-background text-on-surface antialiased overflow-hidden flex flex-col font-sans">
      {/* Top Header unificado para toda la aplicación */}
      <Header
        activeHubTab={activeHubTab}
        onHubTabChange={setActiveHubTab}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onOpenBoxWizard={() => setIsBoxWizardOpen(true)}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        onOpenMyProjects={() => {
          setActiveHubTab('community');
          setCommunityNavTab('my-projects');
        }}
      />

      {/* Contenido según el tab activo: ambos se preservan en el DOM para evitar destruir el contexto WebGL */}
      <div
        className={`flex-1 w-full overflow-y-auto overflow-x-hidden ${
          activeHubTab === 'community' ? 'block view-fade-in' : 'hidden'
        }`}
      >
        <CommunityGallery
          hideHeader={true}
          initialNavTab={communityNavTab}
          onNavigateToEditor={() => setActiveHubTab('editor')}
          onOpenBoxWizard={() => setIsBoxWizardOpen(true)}
          onOpenPublish={() => setIsPublishModalOpen(true)}
          onRemix={handleRemixFigure}
          onDownloadPdf={handleDownloadPdfFigure}
        />
      </div>

      <div
        className={`flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden ${
          activeHubTab === 'editor' ? 'flex view-fade-in' : 'hidden'
        }`}
      >
          {/* Controls & Configuration Sidebar */}
          <aside className="w-full xl:w-[360px] shrink-0 bg-surface-container-low border-r border-surface-container-high/60 flex flex-col justify-between shadow-2xl z-20 h-full">
            <div className="p-space-md flex flex-col gap-space-lg overflow-y-auto flex-1 min-h-0">
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
          <main className="flex-1 flex flex-col bg-background relative overflow-hidden min-w-0 h-full">
            {/* Stage Canvas Area (Single View or Split View) */}
            <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
              {viewMode === 'split' ? (
                <div className="w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-surface-container-high/60">
                  {/* Left Half: 2D Mold */}
                  <div className="flex-1 h-full relative flex items-center justify-center min-w-0 bg-background">
                    <FunkoCanvas
                      canvasElement={rendered2DCanvas}
                      parts={parts}
                      onPartsChange={setParts}
                      onResetParts={() => setParts(FUNKO_GROOVER_CONFIG.parts)}
                      overlayParts={overlayParts}
                      onOverlayPartsChange={setOverlayParts}
                      onResetOverlayParts={() => setOverlayParts(createDefaultOverlayParts(FUNKO_GROOVER_CONFIG.parts))}
                      activeLayer={activeLayer}
                      onActiveLayerChange={setActiveLayer}
                      onPrint={handleExportPDF}
                      selectedPartId={selectedPartId}
                      onSelectPart={setSelectedPartId}
                      showOverlay={showOverlay2D}
                      onToggleOverlay={() => setShowOverlay2D((prev) => !prev)}
                    />
                  </div>
                  {/* Right Half: 3D Funko Studio */}
                  <div className="flex-1 h-full relative min-w-0 bg-surface-container-lowest">
                    <FunkoViewer3D
                      skinCanvas={skinCanvas}
                      rendered2DCanvas={rendered2DCanvas}
                      parts={parts}
                      skinFormat={skinFormat}
                      selectedPartId={selectedPartId}
                    />
                  </div>
                </div>
              ) : viewMode === '2d' ? (
                <div className="w-full h-full flex items-center justify-center bg-background">
                  <FunkoCanvas
                    canvasElement={rendered2DCanvas}
                    parts={parts}
                    onPartsChange={setParts}
                    onResetParts={() => setParts(FUNKO_GROOVER_CONFIG.parts)}
                    overlayParts={overlayParts}
                    onOverlayPartsChange={setOverlayParts}
                    onResetOverlayParts={() => setOverlayParts(createDefaultOverlayParts(FUNKO_GROOVER_CONFIG.parts))}
                    activeLayer={activeLayer}
                    onActiveLayerChange={setActiveLayer}
                    onPrint={handleExportPDF}
                    selectedPartId={selectedPartId}
                    onSelectPart={setSelectedPartId}
                    showOverlay={showOverlay2D}
                    onToggleOverlay={() => setShowOverlay2D((prev) => !prev)}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-surface-container-lowest">
                  <FunkoViewer3D
                    skinCanvas={skinCanvas}
                    rendered2DCanvas={rendered2DCanvas}
                    parts={parts}
                    skinFormat={skinFormat}
                    selectedPartId={selectedPartId}
                  />
                </div>
              )}
            </div>
          </main>
        </div>

      {/* Modal Wizard para Personalización de Caja Coleccionable */}
      <BoxWizardModal
        isOpen={isBoxWizardOpen}
        onClose={() => setIsBoxWizardOpen(false)}
        skinCanvas={skinCanvas}
        rendered2DCanvas={rendered2DCanvas}
        parts={parts}
        characterName={currentSkin.name}
      />

      {/* Prompt de éxito al exportar con invitación a compartir */}
      <ExportSuccessPrompt
        isOpen={isExportSuccessOpen}
        onClose={() => setIsExportSuccessOpen(false)}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        funkoName={currentSkin.name}
      />

      {/* Modal de Publicación en la Comunidad */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        skinCanvas={skinCanvas}
        rendered2DCanvas={rendered2DCanvas}
        parts={parts}
        overlayParts={overlayParts}
        skinFormat={skinFormat}
        skinName={currentSkin.name}
      />
    </div>
  );
}

export default App;


