import React from 'react';

export const MoldMatrixPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">straighten</span>
          <span className="font-headline-sm text-body-sm text-on-surface">Matriz de Impresión</span>
        </div>
        <span className="font-mono-badge text-mono-badge text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-surface-container-high/60">
          Hoja 1 de 1
        </span>
      </div>

      {/* Format Specs Card */}
      <div className="p-space-sm bg-surface-container rounded-xl flex flex-col gap-1.5 border border-surface-container-high/60 font-body-sm text-body-sm">
        <div className="flex items-center justify-between">
          <span className="text-outline">Tamaño de Molde:</span>
          <span className="font-mono-metric text-[11px] font-semibold text-on-surface">195 × 282 mm (A4 Custom)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-outline">Densidad de Salida:</span>
          <span className="font-mono-metric text-[11px] font-semibold text-primary">300 DPI (Escala 1:1)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-outline">Papel Recomendado:</span>
          <span className="text-on-surface text-[12px]">Cartulina 200g - 240g Mate</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-outline">Pestañas de Pegado:</span>
          <span className="font-mono-metric text-[11px] text-secondary font-semibold">Trapezoidales Automáticas</span>
        </div>
      </div>
    </div>
  );
};
