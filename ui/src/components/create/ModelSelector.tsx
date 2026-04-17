// ModelSelector.tsx — Model selection dropdowns
//
// Shows available DiT and LM models from ace-server /props.

import React, { useEffect, useState } from 'react';
import { modelApi } from '../../services/api';
import type { AceModels } from '../../types';

interface ModelSelectorProps {
  ditModel: string;
  onDitModelChange: (v: string) => void;
  lmModel: string;
  onLmModelChange: (v: string) => void;
  adapter: string;
  onAdapterChange: (v: string) => void;
  adapterScale: number;
  onAdapterScaleChange: (v: number) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  ditModel, onDitModelChange, lmModel, onLmModelChange,
  adapter, onAdapterChange, adapterScale, onAdapterScaleChange,
}) => {
  const [models, setModels] = useState<AceModels | null>(null);

  useEffect(() => {
    modelApi.list()
      .then(setModels)
      .catch(() => {}); // Will show fallback
  }, []);

  const ditModels = models?.models?.dit || [];
  const lmModels = models?.models?.lm || [];
  const adapters = models?.adapters || [];

  return (
    <div className="create-section model-selector">
      {/* DiT Model */}
      <div>
        <label className="label">DiT Model</label>
        <select className="input select" value={ditModel}
          onChange={e => onDitModelChange(e.target.value)}>
          {ditModels.length === 0 && <option value="">Loading...</option>}
          {ditModels.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* LM Model */}
      <div>
        <label className="label">LM Model</label>
        <select className="input select" value={lmModel}
          onChange={e => onLmModelChange(e.target.value)}>
          {lmModels.length === 0 && <option value="">Loading...</option>}
          {lmModels.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Adapter */}
      {adapters.length > 0 && (
        <>
          <div>
            <label className="label">Adapter (LoRA)</label>
            <select className="input select" value={adapter}
              onChange={e => onAdapterChange(e.target.value)}>
              <option value="">None</option>
              {adapters.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {adapter && (
            <div>
              <label className="label">Adapter Scale</label>
              <input type="range" value={adapterScale}
                onChange={e => onAdapterScaleChange(parseFloat(e.target.value))}
                min={0} max={2} step={0.05} />
              <span className="slider-value" style={{ float: 'right' }}>{adapterScale.toFixed(2)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
