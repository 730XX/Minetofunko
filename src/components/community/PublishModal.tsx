import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Globe, Lock, CheckCircle2, Tag, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { publishFunkoToCommunity } from '../../services/communityService';
import type { PartTransformation } from '../../core/engine/types';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  skinCanvas: HTMLCanvasElement | null;
  rendered2DCanvas: HTMLCanvasElement | null;
  parts: PartTransformation[];
  overlayParts: PartTransformation[];
  skinFormat: 'legacy' | 'standard';
  skinName: string;
}

const PRESET_TAGS = ['minecraft', 'gaming', 'anime', 'streamer', 'superhero', 'custom'];

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  skinCanvas,
  rendered2DCanvas,
  parts,
  overlayParts,
  skinFormat,
  skinName,
}) => {
  const { user, signInWithGoogle } = useAuth();

  const [title, setTitle] = useState(skinName || 'Mi Funko Pop');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(['minecraft']);
  const [customTag, setCustomTag] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedData, setPublishedData] = useState<{ id: string } | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // Generar thumbnail optimizado para el feed de la comunidad
  useEffect(() => {
    if (!isOpen) {
      setPublishedData(null);
      setErrorMessage(null);
      return;
    }

    setTitle(skinName || 'Mi Funko Pop');

    // Capturar instantáneamente la imagen estática del Funko 3D ya renderizado
    const canvas3D = (document.getElementById('funko-3d-canvas') ||
      document.querySelector('canvas[data-engine="three.js"]')) as HTMLCanvasElement | null;
    const sourceCanvas = canvas3D || rendered2DCanvas || skinCanvas;

    if (sourceCanvas) {
      const thumb = document.createElement('canvas');
      thumb.width = 512;
      thumb.height = 512;
      const ctx = thumb.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        // Fondo estilizado para la tarjeta
        const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 280);
        grad.addColorStop(0, '#1c2230');
        grad.addColorStop(1, '#0e1118');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        // Centrar la imagen en el thumbnail
        const hRatio = 420 / sourceCanvas.height;
        const wRatio = 420 / sourceCanvas.width;
        const ratio = Math.min(hRatio, wRatio);
        const centerShiftX = (512 - sourceCanvas.width * ratio) / 2;
        const centerShiftY = (512 - sourceCanvas.height * ratio) / 2;
        ctx.drawImage(
          sourceCanvas,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
          centerShiftX,
          centerShiftY,
          sourceCanvas.width * ratio,
          sourceCanvas.height * ratio
        );
      }
      previewCanvasRef.current = thumb;
      setPreviewDataUrl(thumb.toDataURL('image/webp', 0.9));
    }
  }, [isOpen, rendered2DCanvas, skinCanvas, skinName]);

  const handleToggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    const clean = customTag.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
      setCustomTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skinCanvas || !previewCanvasRef.current) {
      setErrorMessage('No se encontró una skin válida para publicar.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Por favor añade un título a tu Funko.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await publishFunkoToCommunity({
        title,
        description,
        tags,
        skinCanvas,
        previewCanvas: previewCanvasRef.current,
        parts,
        overlayParts,
        skinFormat,
        skinName,
        isPublic,
      });

      setPublishedData(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error al publicar el Funko en la comunidad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#141824] border border-[#262b3b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262b3b] flex items-center justify-between bg-[#181d2c]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#dfe2ef]">Publicar en la Comunidad</h2>
              <p className="text-xs text-[#859589]">Comparte tu muñeco papercraft para que otros creadores puedan armarlo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#859589] hover:text-[#dfe2ef] hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {publishedData ? (
          /* Pantalla de Éxito */
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#dfe2ef]">¡Funko Publicado con Éxito!</h3>
            <p className="text-sm text-[#859589] max-w-md">
              Tu diseño <strong className="text-[#dfe2ef]">"{title}"</strong> ya está disponible en la galería de la comunidad para que otros usuarios puedan verlo, calificarlo y descargarlo.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <span>Cerrar y seguir diseñando</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de 2 Columnas */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
            {/* Columna Izquierda: Preview Visual */}
            <div className="w-full md:w-5/12 flex flex-col gap-3 shrink-0">
              <div className="relative aspect-square w-full rounded-xl bg-[#0f121a] border border-[#262b3b] overflow-hidden flex items-center justify-center shadow-inner">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Preview del Funko"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-[#859589] flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Generando captura...</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-primary border border-primary/30">
                  Preview 3D
                </span>
              </div>

              {/* Badges de recursos adjuntos */}
              <div className="bg-[#181d2c]/60 border border-[#262b3b] rounded-xl p-3 flex flex-col gap-2 text-xs text-[#859589]">
                <span className="font-semibold text-[#dfe2ef] text-[11px] uppercase tracking-wider">
                  Contenido incluido
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Skin de Minecraft ({skinFormat === 'legacy' ? '64x32' : '64x64'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Molde 2D + Relieve 3D calibrado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Caja coleccionable adaptable</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Metadatos y Formulario */}
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                {/* Check si no está logueado */}
                {!user && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
                    <span>Para que el Funko lleve tu autoría, necesitas iniciar sesión.</span>
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="px-3 py-1.5 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors shrink-0 shadow-sm"
                    >
                      Acceder con Google
                    </button>
                  </div>
                )}

                {/* Título */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#dfe2ef] flex items-center justify-between">
                    <span>Título del Funko *</span>
                    <span className="text-[10px] text-[#859589]">{title.length}/60</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Steve Armadura de Diamante"
                    className="px-3.5 py-2 bg-[#0f121a] border border-[#262b3b] focus:border-primary rounded-xl text-xs text-[#dfe2ef] placeholder-[#5d6878] outline-none transition-colors"
                  />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#dfe2ef]">Descripción (Opcional)</label>
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe los detalles, creador original de la skin, etc."
                    className="px-3.5 py-2 bg-[#0f121a] border border-[#262b3b] focus:border-primary rounded-xl text-xs text-[#dfe2ef] placeholder-[#5d6878] outline-none transition-colors resize-none"
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#dfe2ef] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span>Etiquetas / Tags</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag) => {
                      const isSelected = tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                              : 'bg-[#181d2c] text-[#859589] border border-[#262b3b] hover:text-[#dfe2ef]'
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom tag input */}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={handleAddCustomTag}
                      placeholder="Añadir otro tag y pulsar Enter..."
                      className="flex-1 px-3 py-1.5 bg-[#0f121a] border border-[#262b3b] focus:border-primary rounded-lg text-xs text-[#dfe2ef] placeholder-[#5d6878] outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-3 py-1.5 rounded-lg bg-[#181d2c] hover:bg-[#22283a] text-xs text-[#dfe2ef] border border-[#262b3b] transition-colors"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Visibilidad */}
                <div className="flex items-center justify-between p-3 bg-[#181d2c]/40 border border-[#262b3b] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    {isPublic ? (
                      <Globe className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-400" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#dfe2ef]">
                        {isPublic ? 'Público en la Galería' : 'Oculto (Solo con enlace)'}
                      </span>
                      <span className="text-[11px] text-[#859589]">
                        {isPublic
                          ? 'Visible para todos los usuarios en el feed de la comunidad'
                          : 'Solo podrán acceder quienes tengan el enlace directo'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic((prev) => !prev)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                      isPublic ? 'bg-primary' : 'bg-[#262b3b]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262b3b]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#859589] hover:text-[#dfe2ef] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !user}
                  className="px-5 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Subiendo a la comunidad...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Publicar Funko</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
