// Slider.tsx — Reusable slider with label, value display, and optional number input
//
// ~40 lines. Used everywhere: steps, guidance, shift, temperature, etc.

import React from 'react';
import './Slider.css';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  showInput?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label, value, onChange, min, max, step, suffix = '', showInput = false,
}) => {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        {showInput ? (
          <input
            type="number"
            className="slider-input"
            value={value}
            onChange={e => onChange(parseFloat(e.target.value) || min)}
            min={min}
            max={max}
            step={step}
          />
        ) : (
          <span className="slider-value">{value}{suffix}</span>
        )}
      </div>
      <input
        type="range"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};
