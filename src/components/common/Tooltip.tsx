import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  wrapperClassName?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 180,
  className = '',
  wrapperClassName,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showTooltip = () => {
    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Posiciones y flechas (carets)
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-surface-container-high border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-container-high border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-surface-container-high border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-surface-container-high border-y-transparent border-l-transparent border-4',
  }[position];

  const transformAnimation = {
    top: isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-1 opacity-0 scale-95',
    bottom: isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-1 opacity-0 scale-95',
    left: isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-1 opacity-0 scale-95',
    right: isVisible ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-1 opacity-0 scale-95',
  }[position];

  return (
    <div
      className={wrapperClassName || 'relative inline-flex items-center justify-center'}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      <div
        role="tooltip"
        className={`absolute pointer-events-none z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-surface-container-high/95 backdrop-blur-md border border-surface-container-highest/60 text-on-surface shadow-2xl transition-all duration-200 ease-out font-sans ${positionClasses} ${transformAnimation} ${className}`}
        style={{ pointerEvents: 'none' }}
      >
        <div className="relative text-[11px] font-medium leading-tight flex items-center gap-1.5 text-on-surface/90">
          {content}
        </div>
        {/* Flechita / Caret */}
        <div className={`absolute w-0 h-0 pointer-events-none ${arrowClasses}`} />
      </div>
    </div>
  );
};
