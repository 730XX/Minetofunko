import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchCommunityFunkos, incrementFunkoDownload, incrementFunkoView, registerFunkoRemix } from '../../services/communityService';
import type { PartTransformation } from '../../core/engine/types';
import { Tooltip } from '../common/Tooltip';
import { RollingNumber } from '../common/RollingNumber';
import {
  Boxes,
  Box,
  Globe,
  FolderKanban,
  Package,
  UploadCloud,
  Star,
  Download,
  Zap,
  FileDown,
  SlidersHorizontal,
  Grid,
  PlusCircle,
  Search,
  X,
  TrendingUp,
  Award,
  Clock,
  LayoutGrid,
  Grid3X3,
  SearchX,
  Heart,
  RefreshCw,
  Layers,
  MoreVertical,
  Database,
  CheckCircle2,
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
  const [sortTab, setSortTab] = useState<'trending' | 'top' | 'downloads' | 'newest'>('trending');
  const [activeTag, setActiveTag] = useState('all');
  const [viewDensity, setViewDensity] = useState<'large' | 'compact'>('large');
  const [activeNavTab, setActiveNavTab] = useState<'community' | 'my-projects'>(initialNavTab);

  useEffect(() => {
    setActiveNavTab(initialNavTab);
  }, [initialNavTab]);

  // Supabase items
  const [dbFunkos, setDbFunkos] = useState<CommunityFigure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          const mapped: CommunityFigure[] = data.map((item: any) => {
            const authorProfile = item.profiles;
            const authorName = authorProfile?.username || authorProfile?.display_name || 'Creador Anónimo';
            const initials = authorName.substring(0, 2).toUpperCase();
            const skinFormat = item.config?.skinFormat || 'standard';
            return {
              id: item.id,
              title: item.title,
              author: `@${authorName}`,
              authorInitials: initials,
              avatar_url: authorProfile?.avatar_url,
              image: item.preview_thumbnail_url || item.skin_url,
              alt: item.title,
              tag: item.tags?.[0] ? `#${item.tags[0]}` : '#Comunidad',
              badge2: 'Molde A4 Listo',
              rating: Number(item.rating_avg) || 5.0,
              reviews: Number(item.rating_count) || 1,
              downloads: Number(item.downloads_count) || 0,
              remixes: Number(item.remix_count) || 0,
              specLabel: skinFormat === 'legacy' ? '64x32 Legacy' : '64x64 HD',
              skin_url: item.skin_url,
              config: item.config,
              description: item.description || 'Figura Funko Pop personalizada creada y compartida en Minetofunko.',
              edition: 'Edición Comunidad',
              palette: ['#0f172a', '#10b981', '#4cd7f6', '#ffb95f'],
              created_at: item.created_at,
            };
          });
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
        <div className="px-space-xl pt-space-xl pb-space-lg flex flex-col gap-space-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
            <div className="max-w-2xl flex flex-col gap-space-xs">
              <div className="inline-flex items-center gap-space-xs text-primary font-mono-badge text-mono-badge uppercase tracking-wider">
                Directorio Abierto de Papercraft Voxel
              </div>
              <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight">
                Galería de Creadores Papercraft
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Descubre, califica y remixa figuras Funko Pop de Minecraft creadas por la comunidad. Listas para imprimir en escala 1:1 o editar en 1 clic.
              </p>
            </div>

            {/* Glassmorphic Community Metrics (100% reales de la BD) */}
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="bg-surface-container-low/80 backdrop-blur-md px-space-lg py-space-sm rounded-xl flex flex-col shadow-sm border border-surface-container-high/40">
                <span className="font-mono-metric text-headline-md text-primary">
                  <RollingNumber value={totalDesigns} />
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Diseños Compartidos</span>
              </div>
              <div className="bg-surface-container-low/80 backdrop-blur-md px-space-lg py-space-sm rounded-xl flex flex-col shadow-sm border border-surface-container-high/40">
                <span className="font-mono-metric text-headline-md text-secondary">
                  <RollingNumber value={totalDownloads} />
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Moldes Impresos</span>
              </div>
              <div className="bg-surface-container-low/80 backdrop-blur-md px-space-lg py-space-sm rounded-xl flex flex-col shadow-sm border border-surface-container-high/40">
                <span className="font-mono-metric text-headline-md text-tertiary">
                  <RollingNumber value={activeCreators} />
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Creadores Activos</span>
              </div>
            </div>
          </div>

          {/* Featured Spotlight: Figura Destacada de la Base de Datos */}
          {featuredSpotlight ? (
            <div className="w-full bg-gradient-to-r from-surface-container-lowest via-surface-container to-surface-container-low rounded-xl p-space-xl relative overflow-hidden shadow-xl border border-surface-container-high/50">
              {/* Glow Decor */}
              <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute right-1/3 bottom-0 w-64 h-64 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-space-xl relative z-10">
                {/* Left details */}
                <div className="flex flex-col gap-space-md max-w-xl">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="px-space-xs py-space-2xs bg-primary text-on-primary font-mono-badge text-mono-badge rounded uppercase flex items-center gap-1 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> FIGURA DESTACADA
                    </span>
                    <span className="px-space-xs py-space-2xs bg-surface-container-highest text-secondary font-mono-badge text-mono-badge rounded uppercase">
                      {featuredSpotlight.tag}
                    </span>
                    <span className="px-space-xs py-space-2xs bg-surface-container-highest text-on-surface-variant font-mono-badge text-mono-badge rounded">
                      300 DPI Molde Vectorial
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">
                      {featuredSpotlight.title}
                    </h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">
                      {featuredSpotlight.description}
                    </p>
                  </div>

                  {/* Creator & Stats Meta */}
                  <div className="flex items-center gap-space-lg flex-wrap">
                    <div className="flex items-center gap-space-xs">
                      {featuredSpotlight.avatar_url ? (
                        <img
                          src={featuredSpotlight.avatar_url}
                          alt="Author"
                          className="w-8 h-8 rounded-full object-cover border border-primary/40"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-mono-metric text-mono-metric font-bold">
                          {featuredSpotlight.authorInitials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-on-surface">
                          {featuredSpotlight.author.replace('@', '')}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {featuredSpotlight.author}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-space-2xs rounded">
                      <Star className="w-4 h-4 text-tertiary fill-tertiary" />
                      <span className="font-mono-metric text-mono-metric text-on-surface">
                        {featuredSpotlight.rating.toFixed(1)}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        ({featuredSpotlight.reviews} reseñas)
                      </span>
                    </div>

                    <div className="flex items-center gap-space-xs text-on-surface-variant font-mono-metric text-mono-metric">
                      <Download className="w-4 h-4" />
                      <span><RollingNumber value={featuredSpotlight.downloads} /> descargas</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-space-md pt-space-xs flex-wrap">
                    <button
                      onClick={() => handleRemixClick(featuredSpotlight)}
                      className="px-space-xl py-space-sm bg-primary text-on-primary font-headline-sm text-headline-sm rounded hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-md cursor-pointer hover:scale-[1.02]"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Remix en Taller</span>
                    </button>
                    <button
                      onClick={() => handleDownloadPdfClick(featuredSpotlight)}
                      className="px-space-lg py-space-sm bg-surface-container-high text-on-surface font-body-lg text-body-lg rounded hover:bg-surface-container-highest transition-all flex items-center gap-space-xs cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Descargar PDF Mold (A4)</span>
                    </button>
                    <button
                      onClick={() => openDrawer(featuredSpotlight)}
                      className="px-space-md py-space-sm bg-surface-container-highest text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm rounded flex items-center gap-space-xs transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Inspeccionar Rig</span>
                    </button>
                  </div>
                </div>

                {/* Right 3D Visual Mockup Canvas */}
                <div
                  onClick={() => openDrawer(featuredSpotlight)}
                  className="relative w-full lg:w-96 h-64 lg:h-72 rounded-xl bg-surface-container-lowest flex items-center justify-center overflow-hidden shadow-inner group cursor-pointer border border-surface-container-high/40"
                >
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <div className="absolute bottom-6 w-48 h-12 bg-primary/20 rounded-full blur-xl"></div>
                  <div className="absolute bottom-4 w-40 h-4 bg-surface-container-highest rounded-full shadow-lg"></div>

                  <img
                    src={featuredSpotlight.image}
                    alt={featuredSpotlight.alt}
                    className="relative z-10 max-h-56 object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-space-xs bg-surface-container-highest/90 px-space-xs py-1 rounded backdrop-blur">
                    <div className="w-5 h-5 bg-surface-variant rounded overflow-hidden flex items-center justify-center">
                      <Grid className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-mono-badge text-mono-badge text-on-surface">
                      {featuredSpotlight.specLabel}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-20 px-space-xs py-1 bg-surface-container-high/90 backdrop-blur rounded font-mono-badge text-mono-badge text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    PAPERCRAFT READY
                  </div>
                </div>
              </div>
            </div>
          ) : !isLoading ? (
            <div className="w-full bg-surface-container-lowest rounded-xl p-space-xl border border-dashed border-surface-container-high flex flex-col items-center justify-center text-center gap-3">
              <PlusCircle className="w-12 h-12 text-primary" />
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                ¡Sé el primero en publicar un Funko en la comunidad!
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
                Personalizá tu personaje en el Taller 3D y hacé clic en &ldquo;Publicar mi Funko&rdquo; para que otros usuarios puedan verlo y descargarlo.
              </p>
              <button
                onClick={onOpenPublish}
                className="mt-2 px-space-xl py-space-sm bg-primary text-on-primary font-headline-sm text-headline-sm rounded hover:bg-primary-container transition-all cursor-pointer shadow-md"
              >
                Publicar Ahora
              </button>
            </div>
          ) : null}
        </div>

        {/* Search, Filter Tabs & Controls Bar */}
        <div className="px-space-xl flex flex-col gap-space-md">
          {/* Top Row: Search input + Sorting Tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-space-md">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar figuras, mobs, skins..."
                className="w-full pl-9 pr-4 py-space-xs bg-surface-container-lowest border border-surface-container-high focus:border-primary focus:outline-none rounded text-on-surface font-body-sm text-body-sm transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Ordering Segments */}
            <div className="flex items-center gap-space-xs bg-surface-container-lowest p-space-2xs rounded border border-surface-container-high/60 overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  setSortTab('trending');
                  showToast('Filtro Actualizado', 'Ordenando comunidad por: En Tendencia');
                }}
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
                onClick={() => {
                  setSortTab('top');
                  showToast('Filtro Actualizado', 'Ordenando comunidad por: Mejor Valorados');
                }}
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
                onClick={() => {
                  setSortTab('downloads');
                  showToast('Filtro Actualizado', 'Ordenando comunidad por: Más Descargados');
                }}
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
                onClick={() => {
                  setSortTab('newest');
                  showToast('Filtro Actualizado', 'Ordenando comunidad por: Nuevos');
                }}
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
                  onClick={() => setViewDensity('large')}
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
                  onClick={() => setViewDensity('compact')}
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

          {/* Bottom Row: Tag Pills Filter (Dinámico de la BD) */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs scrollbar-none">
            {tagsList.map((tagItem) => {
              const isSelected = activeTag === tagItem.key;
              return (
                <button
                  key={tagItem.key}
                  onClick={() => {
                    startTransition(() => {
                      setActiveTag(tagItem.key);
                    });
                  }}
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

        {/* Main Figures Grid */}
        <div className="px-space-xl py-space-lg flex-1">
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
              {filteredFigures.map((fig) => {
                const isLiked = likedIds.has(fig.id);
                return (
                  <div
                    key={fig.id}
                    className="figure-card bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-all duration-300 group relative border border-surface-container-high/30 hover:border-surface-container-high"
                  >
                    {/* 3D Preview Frame */}
                    <div
                      onClick={() => openDrawer(fig)}
                      className="relative w-full h-56 bg-surface-container-low flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent z-10"></div>
                      <div className="absolute bottom-3 w-28 h-2 bg-primary/30 rounded-full blur-sm"></div>

                      <img
                        src={fig.image}
                        alt={fig.alt || fig.title}
                        className="relative z-0 max-h-52 object-contain scale-125 group-hover:scale-130 transition-transform duration-200"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
                        <span className="px-space-xs py-0.5 bg-surface-container-highest/90 text-primary font-mono-badge text-mono-badge rounded uppercase">
                          {fig.tag}
                        </span>
                        <span className="px-space-xs py-0.5 bg-primary/20 text-primary font-mono-badge text-mono-badge rounded">
                          {fig.badge2 || 'Molde A4 Listo'}
                        </span>
                      </div>

                      {/* Like Button */}
                      <div className="absolute top-2 right-2 z-20">
                        <Tooltip position="left" content={isLiked ? "Guardado en favoritos" : "Guardar en favoritos"}>
                          <button
                            onClick={(e) => toggleLike(e, fig.id)}
                            className="w-7 h-7 rounded-full bg-surface-container-highest/80 hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                isLiked ? 'text-error fill-error' : 'text-on-surface-variant hover:text-error'
                              }`}
                            />
                          </button>
                        </Tooltip>
                      </div>

                      {/* Skin Preview mini-badge */}
                      <div className="absolute bottom-2 left-2 z-20">
                        <Tooltip position="right" content="Formato de textura de Skin">
                          <div className="flex items-center gap-1 bg-surface-container-highest/90 px-1.5 py-0.5 rounded backdrop-blur">
                            <div className="w-3.5 h-3.5 bg-secondary-container rounded-xs"></div>
                            <span className="font-mono-badge text-[9px] text-on-surface">{fig.specLabel}</span>
                          </div>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Info & Metadata */}
                    <div className="p-space-md flex flex-col gap-space-sm flex-1 justify-between">
                      <div className="flex flex-col gap-space-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-space-xs">
                            {fig.avatar_url ? (
                              <img
                                src={fig.avatar_url}
                                alt="Author"
                                className="w-5 h-5 rounded-full object-cover border border-surface-container-high"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center font-mono-badge text-mono-badge text-secondary font-bold">
                                {fig.authorInitials || 'AK'}
                              </div>
                            )}
                            <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[120px]">
                              {fig.author}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-tertiary">
                            <Star className="w-3.5 h-3.5 fill-tertiary text-tertiary" />
                            <span className="font-mono-metric text-mono-metric text-on-surface">
                              {fig.rating.toFixed(1)}
                            </span>
                            <span className="font-mono-metric text-[10px] text-on-surface-variant">
                              ({fig.reviews})
                            </span>
                          </div>
                        </div>

                        <Tooltip position="top" content={fig.title} wrapperClassName="w-full block text-left">
                          <h3
                            onClick={() => openDrawer(fig)}
                            className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer truncate text-left block w-full"
                          >
                            {fig.title}
                          </h3>
                        </Tooltip>

                        <div className="flex items-center gap-space-md text-on-surface-variant font-mono-metric text-[11px] pt-1">
                          <span className="flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" />
                            <RollingNumber value={fig.downloads} />
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5" />
                            <RollingNumber value={fig.remixes} />
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <Layers className="w-3.5 h-3.5" />{' '}
                            {fig.specLabel || 'Molde 1:1'}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-space-xs pt-space-xs">
                        <button
                          onClick={() => handleRemixClick(fig)}
                          className="flex-1 py-space-xs bg-primary text-on-primary font-headline-sm text-body-sm rounded hover:bg-primary-container transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Remix en Taller</span>
                        </button>
                        <Tooltip position="top" content="Descargar Molde PDF (300 DPI)">
                          <button
                            onClick={() => handleDownloadPdfClick(fig)}
                            className="p-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface rounded transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip position="top" content="Inspeccionar Rig 3D y despiece">
                          <button
                            onClick={() => openDrawer(fig)}
                            className="p-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Interactive Slide-over Drawer & Toast Notifications via Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop */}
            {isDrawerOpen && (
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[9998] transition-opacity animate-in fade-in duration-200"
                onClick={closeDrawer}
              />
            )}

            {/* Slide-over Drawer */}
            <div
              className={`fixed inset-y-0 right-0 w-full sm:w-[28rem] h-full bg-[#11141d] shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col justify-between border-l border-[#232838] ${
                isDrawerOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
              }`}
            >
              {/* Header Drawer */}
              <div className="p-4 bg-[#161a26] flex items-center justify-between border-b border-[#232838] shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-gray-100">Inspección de Esquema</span>
                </div>
                <button
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-lg bg-[#1e2332] hover:bg-[#282f44] text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Specs Body */}
              <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
                {/* Title & Creator profile */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold rounded uppercase border border-emerald-500/20">
                      Supabase Sync
                    </span>
                    <span className="text-gray-400 font-mono text-[11px]">
                      ID: {drawerFigure?.id ? drawerFigure.id.slice(0, 8) : 'sync'}
                    </span>
                  </div>
                  <h2 className="font-bold text-lg text-white mt-1">
                    {drawerFigure?.title || 'Funko Personalizado'}
                  </h2>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <span>Creado por</span>
                    <span className="text-emerald-400 font-medium">{drawerFigure?.author || '@usuario'}</span>
                    <span>• Licencia CC-BY 4.0</span>
                  </div>
                  {drawerFigure?.description && (
                    <p className="text-gray-400 text-xs leading-relaxed mt-2 bg-[#161a26] p-2.5 rounded-lg border border-[#232838]">
                      {drawerFigure.description}
                    </p>
                  )}
                </div>

                {/* Visual Preview */}
                {drawerFigure?.image && (
                  <div className="w-full h-52 bg-gradient-to-b from-[#181d28] via-[#11141d] to-[#0a0c12] rounded-xl flex items-center justify-center overflow-hidden relative border border-[#232838] shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.18),transparent_70%)] pointer-events-none" />
                    {/* Podium glow */}
                    <div className="absolute bottom-3 w-40 h-6 rounded-[100%] border border-emerald-400/30 bg-emerald-500/15 blur-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] pointer-events-none" />
                    <img
                      src={drawerFigure.image}
                      alt={drawerFigure.title}
                      className="w-full h-full object-contain scale-[1.32] drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]"
                    />
                  </div>
                )}

                {/* Live 3D Calibrations JSON Dump Display */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-300">Parámetros Rig 3D</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">CALIBRACIÓN 1:1</span>
                  </div>
                  <div className="bg-[#161a26] p-3.5 rounded-xl font-mono text-[11px] text-gray-400 flex flex-col gap-2 border border-[#232838]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Escala Cabeza Chibi:</span>
                      <span className="text-emerald-400 font-semibold">1.62x (Deformado Funko)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Proporción Ojos:</span>
                      <span className="text-gray-200 font-semibold">Bevel 2px / 2x2 px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Formato de Brazo:</span>
                      <span className="text-gray-200 font-semibold">
                        {drawerFigure?.config?.skinFormat === 'legacy' ? 'Classic 4px (Steve)' : 'Slim (Alex 3px)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mesh Overlay 2nd Layer:</span>
                      <span className="text-cyan-400 font-semibold">
                        {drawerFigure?.config?.overlayParts && drawerFigure.config.overlayParts.length > 0
                          ? 'Habilitada (Offset +0.4mm)'
                          : 'Deshabilitada'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Textura Base:</span>
                      <span className="text-gray-200 font-semibold">
                        {drawerFigure?.config?.skinFormat === 'legacy' ? '64x32 Legacy RGBA' : '64x64 HD RGBA'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pestañas de Pegado:</span>
                      <span className="text-emerald-400 font-semibold">Trapezoidal 45° Auto-cut</span>
                    </div>
                  </div>
                </div>

                {/* Color Palette Scheme for Box */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-xs text-gray-300">Paleta Caja Coleccionista</span>
                  <div className="flex items-center gap-2">
                    {(drawerFigure?.palette || ['#0f172a', '#10b981', '#4cd7f6', '#ffb95f']).map((hex, i) => (
                      <div
                        key={i}
                        style={{ backgroundColor: hex }}
                        className="h-8 flex-1 rounded-lg flex items-center justify-center text-[10px] font-mono text-white font-bold drop-shadow-sm border border-black/30"
                      >
                        {hex}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Version Changelog / History */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-xs text-gray-300">Historial de Revisiones</span>
                  <div className="p-3 bg-[#161a26] rounded-xl flex flex-col gap-1 border border-[#232838]">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-emerald-400 font-bold">
                        Publicación Inicial
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">
                        {drawerFigure?.created_at
                          ? new Date(drawerFigure.created_at).toLocaleDateString()
                          : 'Reciente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Publicado en la galería pública de Minetofunko listo para descargar y ensamblar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer CTAs */}
              <div className="p-4 bg-[#161a26] flex flex-col gap-2 border-t border-[#232838] shrink-0">
                <button
                  onClick={() => {
                    if (drawerFigure) {
                      closeDrawer();
                      handleRemixClick(drawerFigure);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Clonar Configuración en Editor</span>
                </button>
                <button
                  onClick={() => {
                    if (drawerFigure) {
                      handleDownloadPdfClick(drawerFigure);
                    }
                  }}
                  className="w-full py-2 px-4 bg-[#1e2332] hover:bg-[#282f44] border border-[#2b3447] text-gray-200 hover:text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  <span>Descargar Molde PDF Vectorial</span>
                </button>
              </div>
            </div>

            {/* Toast Notification Container */}
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
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
