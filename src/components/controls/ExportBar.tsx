import React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';

interface ExportBarProps {
  onExportPDF: () => void;
  onExportPNG: () => void;
  disabled?: boolean;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  onExportPDF,
  onExportPNG,
  disabled = false,
}) => {
  return (
    <div className="p-4 bg-[#0a0e17] border-t border-[#262a34] flex flex-col gap-2">
      <button
        onClick={onExportPDF}
        disabled={disabled}
        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center justify-between shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Descargar Molde PDF</span>
        </div>
        <span className="font-mono text-[9px] bg-black/20 text-black px-1.5 py-0.5 rounded uppercase font-semibold">
          195 × 282 mm
        </span>
      </button>

      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={onExportPNG}
          disabled={disabled}
          className="py-2 px-3 bg-[#1c1f29] hover:bg-[#262a34] text-[#dfe2ef] rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-[#262a34] disabled:opacity-50 cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Descargar Imagen PNG</span>
        </button>
      </div>
    </div>
  );
};
