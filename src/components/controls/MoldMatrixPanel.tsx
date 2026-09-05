import React from 'react';
import { Ruler } from 'lucide-react';

export const MoldMatrixPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Ruler className="text-[#4cd7f6] w-4 h-4" />
          <span className="text-xs font-semibold text-[#dfe2ef]">Matriz de Impresión</span>
        </div>
        <span className="font-mono text-[10px] text-[#bbcabf] bg-[#1c1f29] px-2 py-0.5 rounded border border-[#262a34]">
          Hoja 1 de 1
        </span>
      </div>

      {/* Format Specs Card */}
      <div className="p-3 bg-[#1c1f29] rounded-xl flex flex-col gap-1.5 border border-[#262a34] text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#86948a]">Tamaño de Molde:</span>
          <span className="font-mono font-semibold text-[#dfe2ef]">195 × 282 mm (A4 Custom)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#86948a]">Densidad de Salida:</span>
          <span className="font-mono font-semibold text-emerald-400">300 DPI (Escala 1:1)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#86948a]">Papel Recomendado:</span>
          <span className="text-[#dfe2ef]">Cartulina 200g - 240g Mate</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#86948a]">Pestañas de Pegado:</span>
          <span className="font-mono text-[#4cd7f6]">Pestañas Automáticas</span>
        </div>
      </div>

      {/* Toggles */}
      {/* <div className="flex flex-col gap-1.5 text-xs">
        <label className="flex items-center justify-between p-2 bg-[#1c1f29] rounded cursor-pointer hover:bg-[#262a34] border border-[#262a34] transition-colors">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="text-[#dfe2ef]">Guías de Pliegue (Líneas Discontinuas)</span>
          </span>
          <input
            type="checkbox"
            defaultChecked
            className="accent-emerald-500 h-4 w-4 rounded cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between p-2 bg-[#1c1f29] rounded cursor-pointer hover:bg-[#262a34] border border-[#262a34] transition-colors">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#dfe2ef]"></span>
            <span className="text-[#dfe2ef]">Líneas de Corte Exterior</span>
          </span>
          <input
            type="checkbox"
            defaultChecked
            className="accent-emerald-500 h-4 w-4 rounded cursor-pointer"
          />
        </label>
      </div> */}
    </div>
  );
};
