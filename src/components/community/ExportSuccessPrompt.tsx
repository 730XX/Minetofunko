import React from 'react';
import { Sparkles, Download, ArrowRight, X } from 'lucide-react';

interface ExportSuccessPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPublish: () => void;
  funkoName: string;
}

export const ExportSuccessPrompt: React.FC<ExportSuccessPromptProps> = ({
  isOpen,
  onClose,
  onOpenPublish,
  funkoName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#141824] border border-[#262b3b] rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg text-[#859589] hover:text-[#dfe2ef] hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Download className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-bold text-[#dfe2ef]">
            ¡Molde descargado con éxito!
          </h3>
          <p className="text-xs text-[#859589] leading-relaxed">
            Tu archivo para <strong className="text-[#dfe2ef]">"{funkoName}"</strong> ya se está guardando en tu equipo. ¿Te gustaría compartirlo en la galería comunitaria para que otros makers puedan descargarlo y calificarlo?
          </p>
        </div>

        <div className="flex items-center gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#262b3b] text-xs font-semibold text-[#859589] hover:text-[#dfe2ef] hover:bg-white/5 transition-colors cursor-pointer"
          >
            Ahora no
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenPublish();
            }}
            className="flex-1 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Compartir</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
