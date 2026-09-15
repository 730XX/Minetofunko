import React, { useState, useEffect, useRef } from 'react';

interface RollingNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * RollingNumber: Animación de transición numérica estilo Twitter/X.
 * Si el número sube, el actual se desliza hacia arriba desvaneciéndose y el nuevo entra desde abajo.
 * Si el número baja, el actual se desliza hacia abajo y el nuevo entra desde arriba.
 * Totalmente acelerado por GPU (transform y opacity únicamente).
 */
export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  className = '',
  prefix = '',
  suffix = '',
  align = 'left',
}) => {
  const [currentVal, setCurrentVal] = useState(value);
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== currentVal) {
      setPrevVal(currentVal);
      setCurrentVal(value);
      setDirection(value > currentVal ? 'up' : 'down');
      setIsAnimating(true);

      if (animTimeoutRef.current) {
        clearTimeout(animTimeoutRef.current);
      }

      animTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setPrevVal(null);
      }, 350);
    }
  }, [value, currentVal]);

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) {
        clearTimeout(animTimeoutRef.current);
      }
    };
  }, []);

  // Si no está en transición, renderizamos el valor directo sin overhead
  if (!isAnimating || prevVal === null) {
    return (
      <span className={`inline-flex items-center tabular-nums ${className}`}>
        {prefix}{currentVal}{suffix}
      </span>
    );
  }

  const outClass = direction === 'up' ? 'animate-rolling-out-up' : 'animate-rolling-out-down';
  const inClass = direction === 'up' ? 'animate-rolling-in-up' : 'animate-rolling-in-down';

  const justifyClass =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <span
      className={`relative inline-flex items-center overflow-hidden tabular-nums ${className}`}
      style={{ verticalAlign: 'baseline', height: '1.25em' }}
    >
      {/* Spacer invisible para preservar el ancho natural exacto del número mayor */}
      <span className="invisible select-none opacity-0 pointer-events-none" aria-hidden="true">
        {prefix}{Math.max(currentVal, prevVal)}{suffix}
      </span>

      {/* Número saliente */}
      <span
        className={`absolute inset-0 flex items-center ${justifyClass} pointer-events-none ${outClass}`}
        aria-hidden="true"
      >
        {prefix}{prevVal}{suffix}
      </span>

      {/* Número entrante */}
      <span
        className={`absolute inset-0 flex items-center ${justifyClass} pointer-events-none ${inClass}`}
      >
        {prefix}{currentVal}{suffix}
      </span>
    </span>
  );
};
