import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchCommunityFunkos, incrementFunkoDownload, incrementFunkoView, registerFunkoRemix } from '../../services/communityService';
import { useCommunityRealtime, mapDbItemToFigure } from '../../hooks/useCommunityRealtime';
import type { PartTransformation } from '../../core/engine/types';
import { CommunityCard } from './CommunityCard';
import { CommunityDrawer } from './CommunityDrawer';
import { CommunitySpotlight } from './CommunitySpotlight';
import { CommunityFilters, type SortTab, type ViewDensity } from './CommunityFilters';
import {
  Boxes,
  Box,
  Globe,
  FolderKanban,
  Package,
  UploadCloud,
  SearchX,
  CheckCircle2,
  ArrowUp,
  Sparkles,
} from 'lucide-react';

export interface CommunityFigure {
  id: string;
  title: string;
  author: string;
  authorLevel?: string;
  authorInitials?: string;
  avatar_url?: string;
  image: string;
  alt?: string;
  tag: string;
  badge2?: string;
  rating: number;
  reviews: number;
  downloads: number;
  remixes: number;
  specLabel?: string;
  skin_url?: string;
  config?: {
    parts?: PartTransformation[];
    overlayParts?: PartTransformation[];
    skinFormat?: 'legacy' | 'standard';
    skinName?: string;
  };
  description?: string;
  edition?: string;
  palette?: string[];
  created_at?: string;
}

interface CommunityGalleryProps {
  onNavigateToEditor: () => void;
  onOpenBoxWizard: () => void;
  onOpenPublish: () => void;
  onRemix: (figure: CommunityFigure) => void;
  onDownloadPdf: (figure: CommunityFigure) => void;
  hideHeader?: boolean;
  initialNavTab?: 'community' | 'my-projects';
  onNavTabChange?: (tab: 'community' | 'my-projects') => void;
}

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  onNavigateToEditor,
  onOpenBoxWizard,
  onOpenPublish,
  onRemix,
  onDownloadPdf,
  hideHeader = false,
  initialNavTab = 'community',
  onNavTabChange,
}) => {
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  // Estados de interfaz
  const [searchTerm, setSearchTerm] = useState('');
  const [sortTab, setSortTab] = useState<SortTab>('trending');
  const [activeTag, setActiveTag] = useState('all');
  const [viewDensity, setViewDensity] = useState<ViewDensity>('large');
  const [activeNavTab, setActiveNavTab] = useState<'community' | 'my-projects'>(initialNavTab);

  useEffect(() => {
    setActiveNavTab(initialNavTab);
  }, [initialNavTab]);

  // Supabase items
  const [dbFunkos, setDbFunkos] = useState<CommunityFigure[]>([]);
  const [newFunkosQueue, setNewFunkosQueue] = useState<CommunityFigure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleApplyNewFunkos = () => {
    setDbFunkos((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const toAdd = newFunkosQueue.filter((f) => !existingIds.has(f.id));
      return [...toAdd, ...prev];
    });
    setNewFunkosQueue([]);

    // Scroll suave hacia arriba
    const scrollContainer = document.querySelector('.overflow-y-auto') || window;
    if ('scrollTo' in scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Drawer de inspección
  const [drawerFigure, setDrawerFigure] = useState<CommunityFigure | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Like / Favoritos locales
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('paperpop_liked_funkos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Toast notification
  const [toast, setToast] = useState<{ visible: boolean; title: string; desc: string }>({
    visible: false,
    title: '',
    desc: '',
  });

  const showToast = (title: string, desc: string) => {
    setToast({ visible: true, title, desc });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Cargar figuras publicadas REALES desde Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadFunkos() {
      setIsLoading(true);
      try {
        const queryOpts: { sortBy: 'trending' | 'top' | 'downloads' | 'newest'; authorId?: string } = { sortBy: sortTab };
        if (activeNavTab === 'my-projects' && user) {
          queryOpts.authorId = user.id;
        }
        const data = await fetchCommunityFunkos(queryOpts);
        if (!isMounted) return;

        if (data && data.length > 0) {
          const mapped: CommunityFigure[] = data.map(mapDbItemToFigure);
          setDbFunkos(mapped);
        } else {
          setDbFunkos([]);
        }
      } catch (err) {
        console.warn('Error fetching community items:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadFunkos();
    return () => {
      isMounted = false;
    };
  }, [sortTab, activeNavTab, user]);

  // Suscripción Realtime a través del Custom Hook dedicado (Single Responsibility Principle)
  useCommunityRealtime({
    onUpdate: (updated) => {
      setDbFunkos((prev) =>
        prev.map((f) => {
          if (f.id === updated.id) {
            return {
              ...f,
              downloads: Number(updated.downloads_count) ?? f.downloads,
              remixes: Number(updated.remix_count) ?? f.remixes,
              rating: Number(updated.rating_avg) ?? f.rating,
              reviews: Number(updated.rating_count) ?? f.reviews,
              title: updated.title ?? f.title,
            };
          }
          return f;
        })
      );

      setDrawerFigure((prev) => {
        if (prev && prev.id === updated.id) {
          return {
            ...prev,
            downloads: Number(updated.downloads_count) ?? prev.downloads,
            remixes: Number(updated.remix_count) ?? prev.remixes,
            rating: Number(updated.rating_avg) ?? prev.rating,
            reviews: Number(updated.rating_count) ?? prev.reviews,
            title: updated.title ?? prev.title,
          };
        }
        return prev;
      });
    },
    onDelete: (deletedId) => {
      setDbFunkos((prev) => prev.filter((f) => f.id !== deletedId));
      setNewFunkosQueue((prev) => prev.filter((f) => f.id !== deletedId));
      setDrawerFigure((prev) => (prev?.id === deletedId ? null : prev));
    },
    onInsert: (newFig) => {
      const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement | null;
      const currentScroll = scrollContainer ? scrollContainer.scrollTop : window.scrollY;

      if (currentScroll < 120) {
        // Usuario arriba: inserción directa suave
        setDbFunkos((prev) => {
          if (prev.some((f) => f.id === newFig.id)) return prev;
          return [newFig, ...prev];
        });
      } else {
        // Usuario leyendo abajo: se encola en la pastilla flotante estilo Twitter
        setNewFunkosQueue((prev) => {
          if (prev.some((f) => f.id === newFig.id)) return prev;
          return [newFig, ...prev];
        });
      }
    },
  });

  // Figura destacada: la primera de la lista ordenada o con más descargas
  const featuredSpotlight = useMemo(() => {
    if (dbFunkos.length === 0) return null;
    // Seleccionar la de mayor downloads o la primera
    const sorted = [...dbFunkos].sort((a, b) => (b.downloads + b.remixes) - (a.downloads + a.remixes));
    return sorted[0];
  }, [dbFunkos]);

  // Métricas reales calculadas desde la base de datos
  const totalDesigns = dbFunkos.length;
  const totalDownloads = useMemo(() => {
    return dbFunkos.reduce((acc, f) => acc + (f.downloads || 0), 0);
  }, [dbFunkos]);
  const activeCreators = useMemo(() => {
    return new Set(dbFunkos.map((f) => f.author)).size;
  }, [dbFunkos]);

  // Lista dinámica de tags extraída de los funkos de la BD
  const tagsList = useMemo(() => {
    const set = new Set<string>();
    dbFunkos.forEach((f) => {
      if (f.tag) {
        const clean = f.tag.replace('#', '').trim();
        if (clean) set.add(clean);
      }
    });
    const dynamic = Array.from(set).map((t) => ({
      label: `#${t.charAt(0).toUpperCase() + t.slice(1)}`,
      key: t.toLowerCase(),
    }));
    return [{ label: '#Todos', key: 'all' }, ...dynamic];
  }, [dbFunkos]);

  // Filtrado por búsqueda y tag
  const filteredFigures = useMemo(() => {
    return dbFunkos.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag =
        activeTag === 'all' ||
        item.tag.toLowerCase().includes(activeTag.toLowerCase().replace('#', ''));

      return matchesSearch && matchesTag;
    });
  }, [dbFunkos, searchTerm, activeTag]);

  // Toggle Like
  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Favorito Removido', 'Se quitó la figura de tus guardados.');
      } else {
        next.add(id);
        showToast('Guardado en Favoritos', 'Añadido a tus colecciones personales.');
      }
      try {
        localStorage.setItem('paperpop_liked_funkos', JSON.stringify(Array.from(next)));
      } catch {
        // Ignore local storage error
      }
      return next;
    });
  };

  // Abrir Drawer de Inspección
  const openDrawer = (figure: CommunityFigure) => {
    setDrawerFigure(figure);
    setIsDrawerOpen(true);
    if (figure.id) {
      incrementFunkoView(figure.id);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Ejecutar Remix con actualización optimista
  const handleRemixClick = (figure: CommunityFigure) => {
    if (figure.id) {
      incrementFunkoRemixOptimistic(figure.id);
      registerFunkoRemix(figure.id);
    }
    showToast('¡Configuración Clonada!', `Transfiriendo ${figure.title} al Taller 3D...`);
    setTimeout(() => {
      onRemix(figure);
    }, 450);
  };

  // Ejecutar Descarga de Molde con actualización optimista
  const handleDownloadPdfClick = (figure: CommunityFigure) => {
    if (figure.id) {
      incrementFunkoDownloadOptimistic(figure.id);
      incrementFunkoDownload(figure.id);
    }
    showToast('Generando Molde PDF', `Compilando vectores A4 a 300 DPI de ${figure.title}...`);
    onDownloadPdf(figure);
  };

  const incrementFunkoDownloadOptimistic = (id: string) => {
    setDbFunkos((prev) =>
      prev.map((f) => (f.id === id ? { ...f, downloads: f.downloads + 1 } : f))
    );
    setDrawerFigure((prev) => (prev && prev.id === id ? { ...prev, downloads: prev.downloads + 1 } : prev));
  };

  const incrementFunkoRemixOptimistic = (id: string) => {
    setDbFunkos((prev) =>
      prev.map((f) => (f.id === id ? { ...f, remixes: f.remixes + 1 } : f))
    );
    setDrawerFigure((prev) => (prev && prev.id === id ? { ...prev, remixes: prev.remixes + 1 } : prev));
  };

  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Sub-Header / Community Header Strip (solo si no se usa el Header global) */}
      {!hideHeader && (
        <header className="w-full bg-surface-container-lowest px-space-xl py-space-sm flex flex-wrap items-center justify-between gap-space-md shadow-sm border-b border-surface-container-high/40 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs cursor-pointer" onClick={onNavigateToEditor}>
              <Boxes className="w-5 h-5 text-primary" />
              <span className="font-headline-sm text-headline-sm text-on-surface">Minetofunko</span>
              <span className="text-on-surface-variant font-mono-metric text-mono-metric">/</span>
              <span className="font-headline-sm text-headline-sm text-primary">Skin Vault Hub</span>
            </div>
          </div>

          {/* Hub Central Tabs Navigation */}
          <nav className="flex items-center gap-space-xs bg-surface-container-low p-space-2xs rounded-full border border-surface-container-high/60">
            <button
              onClick={onNavigateToEditor}
              className="px-space-md py-space-xs rounded-full font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-space-xs cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 shrink-0" />
              <span>Taller 3D & Molde</span>
            </button>
            <button
              onClick={() => {
                setActiveNavTab('community');
                onNavTabChange?.('community');
              }}
              className={`px-space-md py-space-xs rounded-full font-headline-sm text-headline-sm flex items-center gap-space-xs transition-all cursor-pointer ${
                activeNavTab === 'community'
                  ? 'bg-surface-container-highest text-primary shadow-inner'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Galería de la Comunidad</span>
             
            </button>
            <button
              onClick={() => {
                setActiveNavTab('my-projects');
                onNavTabChange?.('my-projects');
                showToast('Filtrando Proyectos', 'Mostrando figuras creadas por vos.');
              }}
              className={`px-space-md py-space-xs rounded-full font-body-sm text-body-sm flex items-center gap-space-xs transition-colors cursor-pointer ${
                activeNavTab === 'my-projects'
                  ? 'bg-surface-container-highest text-primary shadow-inner font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 shrink-0" />
              <span>Mis Proyectos</span>
            </button>
            <button
              onClick={onOpenBoxWizard}
              className="px-space-md py-space-xs rounded-full font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-space-xs cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Cajas Coleccionista</span>
            </button>
          </nav>

          {/* Actions & Creator Auth */}
          <div className="flex items-center gap-space-sm">
            <button
              onClick={onOpenPublish}
              className="px-space-md py-space-xs bg-primary text-on-primary font-headline-sm text-headline-sm rounded hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-md cursor-pointer hover:shadow-primary/20"
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>Publicar mi Funko</span>
            </button>
            <div className="h-6 w-px bg-surface-container-highest"></div>
            <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-space-2xs rounded-full border border-surface-container-high/40">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover border border-primary/40"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-mono-badge text-mono-badge font-bold">
                  {user?.email ? user.email.substring(0, 2).toUpperCase() : 'AK'}
                </div>
              )}
              <span className="font-body-sm text-body-sm text-on-surface">
                {user?.user_metadata?.full_name || (user?.email ? `@${user.email.split('@')[0]}` : '@AlexKraft')}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto flex flex-col">
        {/* Hero Section & Featured Spotlight */}
        <CommunitySpotlight
          featuredSpotlight={featuredSpotlight}
          isLoading={isLoading}
          totalDesigns={totalDesigns}
          totalDownloads={totalDownloads}
          activeCreators={activeCreators}
          onOpenPublish={onOpenPublish}
          onRemix={handleRemixClick}
          onDownloadPdf={handleDownloadPdfClick}
          onSelectSpotlight={openDrawer}
        />

        {/* Search, Filter Tabs & Controls Bar */}
        <CommunityFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortTab={sortTab}
          onSortTabChange={(tab) => {
            setSortTab(tab);
            const messages: Record<SortTab, string> = {
              trending: 'En Tendencia',
              top: 'Mejor Valorados',
              downloads: 'Más Descargados',
              newest: 'Nuevos',
            };
            showToast('Filtro Actualizado', `Ordenando comunidad por: ${messages[tab]}`);
          }}
          viewDensity={viewDensity}
          onViewDensityChange={setViewDensity}
          tagsList={tagsList}
          activeTag={activeTag}
          onTagChange={(tag) => {
            startTransition(() => {
              setActiveTag(tag);
            });
          }}
        />

        {/* Main Figures Grid */}
        <div className="px-space-xl py-space-lg flex-1 relative">
          {/* Pastilla flotante estilo Twitter cuando caen nuevos Funkos */}
          {newFunkosQueue.length > 0 && (
            <div className="sticky top-4 z-30 flex justify-center pointer-events-none mb-6 animate-in fade-in slide-in-from-top-3 duration-200">
              <button
                onClick={handleApplyNewFunkos}
                className="pointer-events-auto px-4 py-2 bg-primary text-on-primary font-headline-sm text-xs rounded-full shadow-2xl hover:bg-primary-container flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-primary/40 backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                <span>
                  {newFunkosQueue.length === 1
                    ? '1 nuevo Funko publicado — Clic para ver'
                    : `${newFunkosQueue.length} nuevos Funkos publicados — Clic para ver`}
                </span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Cargando funkos...
              </span>
            </div>
          ) : filteredFigures.length === 0 ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-3 bg-surface-container-lowest rounded-xl border border-surface-container-high/40">
              <SearchX className="w-12 h-12 text-on-surface-variant" />
              <h3 className="font-headline-md text-headline-md text-on-surface">No se encontraron figuras</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                {activeNavTab === 'my-projects'
                  ? 'Todavía no has publicado ninguna figura con tu cuenta. ¡Compartí la primera!'
                  : 'Prueba buscando con otros términos o seleccionando el tag "#Todos".'}
              </p>
              {searchTerm || activeTag !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveTag('all');
                  }}
                  className="mt-2 px-space-md py-space-xs bg-surface-container-highest text-primary rounded text-xs font-semibold cursor-pointer"
                >
                  Limpiar Filtros
                </button>
              ) : (
                <button
                  onClick={onOpenPublish}
                  className="mt-2 px-space-md py-space-xs bg-primary text-on-primary rounded text-xs font-semibold cursor-pointer"
                >
                  Publicar mi Funko
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewDensity === 'compact'
                  ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-space-md'
                  : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-space-lg'
              }
            >
              {filteredFigures.map((fig) => (
                <CommunityCard
                  key={fig.id}
                  figure={fig}
                  isLiked={likedIds.has(fig.id)}
                  onToggleLike={toggleLike}
                  onSelect={openDrawer}
                  onRemix={handleRemixClick}
                  onDownloadPdf={handleDownloadPdfClick}
                />
              ))}
            </div>
          )}

          {/* Pagination & Bottom Controls (Valores Reales) */}
          <div className="mt-space-2xl pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md border-t border-surface-container-high/40">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Mostrando <span className="text-on-surface font-mono-metric">{filteredFigures.length}</span> de{' '}
              <span className="text-on-surface font-mono-metric">{dbFunkos.length}</span> figuras en la base de datos
            </span>
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-md py-space-xs bg-surface-container text-on-surface-variant hover:text-on-surface rounded font-body-sm text-body-sm transition-colors disabled:opacity-40 cursor-pointer"
                disabled
              >
                Anterior
              </button>
              <button className="w-8 h-8 rounded bg-primary text-on-primary font-mono-metric text-mono-metric flex items-center justify-center font-bold">
                1
              </button>
              <button
                className="px-space-md py-space-xs bg-surface-container text-on-surface-variant rounded font-body-sm text-body-sm transition-colors disabled:opacity-40 cursor-pointer"
                disabled
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Slide-over Drawer */}
      <CommunityDrawer
        figure={drawerFigure}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onRemix={handleRemixClick}
        onDownloadPdf={handleDownloadPdfClick}
      />

      {/* Toast Notification Container */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className={`fixed bottom-6 right-6 z-[10000] bg-[#161a26] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#2b3347] transition-all duration-300 pointer-events-none ${
              toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-gray-100">{toast.title}</span>
              <span className="text-[11px] text-gray-400">{toast.desc}</span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
