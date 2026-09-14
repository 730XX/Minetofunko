import React, { useState } from 'react';
import type { BoxCustomizationConfig } from './types';
import { DEFAULT_BOX_CONFIG } from './types';
import { Step1Colors } from './steps/Step1Colors';
import { Step2Diorama } from './steps/Step2Diorama';
import { Step3Identity } from './steps/Step3Identity';
import { Step4Export } from './steps/Step4Export';
import { BoxPreview } from './BoxPreview';
import { Package, X, ArrowLeft, ArrowRight, Check } from 'lucide-react';

import type { PartTransformation } from '../../core/engine/types';

interface BoxWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  skinCanvas: HTMLCanvasElement | null;
  rendered2DCanvas?: HTMLCanvasElement | null;
  parts?: PartTransformation[];
  characterName?: string;
}

export const BoxWizardModal: React.FC<BoxWizardModalProps> = ({
  isOpen,
  onClose,
  skinCanvas,
  rendered2DCanvas,
  parts,
  characterName,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [config, setConfig] = useState<BoxCustomizationConfig>(() => ({
    ...DEFAULT_BOX_CONFIG,
    characterName: characterName || DEFAULT_BOX_CONFIG.characterName,
  }));

  if (!isOpen) return null;

  const handleConfigChange = (updates: Partial<BoxCustomizationConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Finalizar / Exportar
      handleExportPDF();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleExportPDF = () => {
    alert('Generando molde PDF de caja en alta resolución (300 DPI) con marcas de sangría y troquel...');
  };

  const handleExportPNG = () => {
    alert('Exportando render HD de vitrina en formato PNG...');
  };

  const steps = [
    { num: 1, label: 'Colores & Textura' },
    { num: 2, label: 'Diorama Interior' },
    { num: 3, label: 'Identidad & Logo' },
    { num: 4, label: 'Exportar & Troquel' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-surface-dim/80 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Contenedor del Modal */}
      <div className="w-full max-w-7xl h-[92vh] max-h-[880px] bg-surface-container-low rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-outline-variant/40">
        {/* Cabecera / Ribbon de Comando */}
        <header className="h-14 px-4 sm:px-6 bg-surface-container-lowest/80 flex items-center justify-between z-20 shrink-0 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
              <Package className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-on-surface tracking-tight">
                  BoxWizard Pro Studio
                </span>
                <span className="px-1.5 py-0.5 bg-primary-container text-on-primary-container font-mono text-[9px] font-semibold rounded uppercase">
                  v2.0
                </span>
              </div>
              <span className="text-xs text-on-surface-variant hidden sm:inline">
                Generador de Empaque & Troquel Coleccionable con Blíster
              </span>
            </div>
          </div>

          {/* Stepper Indicator Pills */}
          <div className="hidden md:flex items-center bg-surface-container-lowest p-1 rounded-full border border-outline-variant/30">
            {steps.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentStep === s.num
                    ? 'bg-surface-container-highest text-primary shadow-inner'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                    currentStep === s.num
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {s.num}
                </span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Espacio de Trabajo Dividido (2 Columnas) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Columna Izquierda: Panel de Control (Steps) */}
          <section className="w-full lg:w-[440px] shrink-0 bg-surface-container flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-outline-variant/30">
            {/* Contenido Dinámico del Paso */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {currentStep === 1 && (
                <Step1Colors config={config} onChange={handleConfigChange} />
              )}
              {currentStep === 2 && (
                <Step2Diorama config={config} onChange={handleConfigChange} />
              )}
              {currentStep === 3 && (
                <Step3Identity config={config} onChange={handleConfigChange} />
              )}
              {currentStep === 4 && (
                <Step4Export
                  onExportPDF={handleExportPDF}
                  onExportPNG={handleExportPNG}
                />
              )}
            </div>

            {/* Barra de Acciones Inferior (Anterior / Siguiente) */}
            <footer className="h-16 px-4 sm:px-6 bg-surface-container-lowest/90 flex items-center justify-between shrink-0 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                  currentStep === 1
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-surface-container-highest'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className={`px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all ${
                    currentStep === 4
                      ? 'bg-primary-container text-on-primary-container hover:opacity-90'
                      : 'bg-primary hover:bg-primary-container text-on-primary'
                  }`}
                >
                  <span>{currentStep === 4 ? 'Finalizar & Descargar' : 'Siguiente Paso'}</span>
                  {currentStep === 4 ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </footer>
          </section>

          {/* Columna Derecha: Vista Previa en Tiempo Real */}
          <BoxPreview
            config={config}
            skinCanvas={skinCanvas}
            rendered2DCanvas={rendered2DCanvas}
            parts={parts}
          />
        </div>
      </div>
    </div>
  );
};
