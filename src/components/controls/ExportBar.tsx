import React from 'react';

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
    <div className="p-space-md bg-surface-container-lowest border-t border-surface-container-high/60 flex flex-col gap-space-xs">
      <button
        onClick={onExportPDF}
        disabled={disabled}
        className="w-full py-2.5 px-space-md bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm rounded-lg flex items-center justify-between shadow-md hover:shadow-primary/20 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          <span>Descargar Molde PDF</span>
        </div>
        <span className="font-mono-badge text-[9px] bg-black/20 text-on-primary px-1.5 py-0.5 rounded uppercase font-bold">
          300 DPI A4
        </span>
      </button>

      <div className="grid grid-cols-1">
        <button
          onClick={onExportPNG}
          disabled={disabled}
          className="py-2 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm flex items-center justify-center gap-1.5 transition-colors border border-surface-container-high/60 disabled:opacity-40 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">image</span>
          <span>Descargar Imagen PNG</span>
        </button>
      </div>
    </div>
  );
};
