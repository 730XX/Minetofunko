import React from 'react';
import { FileText, Image, Download, Sparkles } from 'lucide-react';

interface Step4ExportProps {
  onExportPDF: () => void;
  onExportPNG: () => void;
}

export const Step4Export: React.FC<Step4ExportProps> = ({ onExportPDF, onExportPNG }) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-on-surface">Exportación Física & Render</span>
          <span className="text-xs text-on-surface-variant">Generación de archivos listos para imprimir y armar</span>
        </div>
        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded font-mono text-[10px] font-semibold">
          LISTO
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[11px] font-mono font-medium text-on-surface-variant uppercase tracking-wider">
          Formato de Salida
        </label>

        {/* Descargar Molde PDF */}
        <div className="p-3.5 rounded-lg bg-surface-container-lowest flex flex-col gap-2.5 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface">Plantilla de Corte PDF 300 DPI</span>
                <span className="text-[11px] text-on-surface-variant">
                  A3/A4 con marcas de corte, líneas de doblado y solapas
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 bg-surface-container-high text-primary font-mono text-[10px] font-semibold rounded">
              300 DPI
            </span>
          </div>
          <button
            type="button"
            onClick={onExportPDF}
            className="w-full py-2 px-3 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Molde PDF para Imprimir</span>
          </button>
        </div>

        {/* Exportar PNG */}
        <div className="p-3.5 rounded-lg bg-surface-container-lowest flex flex-col gap-2.5 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image className="w-6 h-6 text-secondary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface">Render Comercial HD PNG</span>
                <span className="text-[11px] text-on-surface-variant">
                  Vista frontal con ventana transparente de acetato
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 bg-surface-container-high text-secondary font-mono text-[10px] font-semibold rounded">
              HD PNG
            </span>
          </div>
          <button
            type="button"
            onClick={onExportPNG}
            className="w-full py-2 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>Exportar Imagen PNG de Vitrina</span>
          </button>
        </div>
      </div>

      {/* Especificaciones Técnicas */}
      <div className="bg-surface-container-high/50 p-3 rounded-lg flex flex-col gap-1.5 font-mono text-xs border border-outline-variant/30">
        <div className="flex justify-between text-on-surface-variant">
          <span>Tamaño Caja Armada:</span>
          <span className="text-on-surface font-semibold">115 × 90 × 160 mm</span>
        </div>
        <div className="flex justify-between text-on-surface-variant">
          <span>Ventana de Acetato:</span>
          <span className="text-on-surface font-semibold">82 × 128 mm (Troquel R4)</span>
        </div>
        <div className="flex justify-between text-on-surface-variant">
          <span>Gramaje Recomendado:</span>
          <span className="text-primary font-semibold">Cartoncillo 300g - 350g/m²</span>
        </div>
      </div>
    </div>
  );
};
