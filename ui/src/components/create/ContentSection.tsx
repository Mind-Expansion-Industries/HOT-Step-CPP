// ContentSection.tsx — Caption + Lyrics input area
//
// The core creative input: what do you want to generate?

import React from 'react';
import './CreatePanel.css';

interface ContentSectionProps {
  caption: string;
  onCaptionChange: (v: string) => void;
  lyrics: string;
  onLyricsChange: (v: string) => void;
  instrumental: boolean;
  onInstrumentalChange: (v: boolean) => void;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  caption, onCaptionChange, lyrics, onLyricsChange,
  instrumental, onInstrumentalChange,
}) => {
  return (
    <div className="create-section">
      {/* Caption / Style */}
      <div>
        <label className="label">Style Description</label>
        <textarea
          className="input textarea"
          placeholder="Dreamy indie folk, warm acoustic guitar, soft female vocals, intricate fingerpicking..."
          value={caption}
          onChange={e => onCaptionChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* Instrumental toggle */}
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={instrumental}
          onChange={e => onInstrumentalChange(e.target.checked)}
        />
        <span>Instrumental (no vocals)</span>
      </label>

      {/* Lyrics */}
      {!instrumental && (
        <div>
          <label className="label">Lyrics</label>
          <textarea
            className="input textarea lyrics-input"
            placeholder={`[Verse 1]\nWalking through the morning light\nEvery shadow fading bright\n\n[Chorus]\nWe're alive, we're alive tonight...`}
            value={lyrics}
            onChange={e => onLyricsChange(e.target.value)}
            rows={8}
          />
        </div>
      )}
    </div>
  );
};
