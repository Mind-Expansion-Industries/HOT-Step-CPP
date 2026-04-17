// MetadataSection.tsx — BPM, Key, Time Signature, Duration, Language
//
// Musical metadata controls. Compact grid layout.

import React from 'react';
import { Slider } from '../shared/Slider';

const KEY_SIGNATURES = [
  '', 'C major', 'C minor', 'C# major', 'C# minor',
  'D major', 'D minor', 'D# major', 'D# minor',
  'E major', 'E minor', 'F major', 'F minor',
  'F# major', 'F# minor', 'G major', 'G minor',
  'G# major', 'G# minor', 'A major', 'A minor',
  'A# major', 'A# minor', 'B major', 'B minor',
];

const TIME_SIGNATURES = ['', '4/4', '3/4', '6/8', '2/4', '5/4', '7/8'];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
];

interface MetadataSectionProps {
  bpm: number;
  onBpmChange: (v: number) => void;
  keyScale: string;
  onKeyScaleChange: (v: string) => void;
  timeSignature: string;
  onTimeSignatureChange: (v: string) => void;
  duration: number;
  onDurationChange: (v: number) => void;
  vocalLanguage: string;
  onVocalLanguageChange: (v: string) => void;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  bpm, onBpmChange, keyScale, onKeyScaleChange,
  timeSignature, onTimeSignatureChange,
  duration, onDurationChange,
  vocalLanguage, onVocalLanguageChange,
}) => {
  return (
    <div className="create-section">
      <div className="metadata-grid">
        {/* BPM */}
        <div>
          <Slider label="BPM" value={bpm} onChange={onBpmChange}
            min={0} max={240} step={1} showInput suffix="" />
          <span className="metadata-hint">{bpm === 0 ? 'Auto' : ''}</span>
        </div>

        {/* Duration */}
        <div>
          <Slider label="Duration" value={duration} onChange={onDurationChange}
            min={-1} max={240} step={1} suffix="s" showInput />
          <span className="metadata-hint">{duration <= 0 ? 'Auto' : ''}</span>
        </div>

        {/* Key */}
        <div>
          <label className="label">Key</label>
          <select className="input select" value={keyScale}
            onChange={e => onKeyScaleChange(e.target.value)}>
            {KEY_SIGNATURES.map(k => (
              <option key={k} value={k}>{k || 'Auto'}</option>
            ))}
          </select>
        </div>

        {/* Time Signature */}
        <div>
          <label className="label">Time Sig</label>
          <select className="input select" value={timeSignature}
            onChange={e => onTimeSignatureChange(e.target.value)}>
            {TIME_SIGNATURES.map(t => (
              <option key={t} value={t}>{t || 'Auto'}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="label">Vocal Language</label>
          <select className="input select" value={vocalLanguage}
            onChange={e => onVocalLanguageChange(e.target.value)}>
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
