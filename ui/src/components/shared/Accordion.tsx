// Accordion.tsx — Collapsible section with header + content
//
// ~30 lines. Used for: Generation Settings, LM Settings, etc.

import React, { useState } from 'react';
import './Accordion.css';

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  title, defaultOpen = false, badge, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`accordion ${open ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpen(!open)}>
        <span className="accordion-title">{title}</span>
        <div className="flex items-center gap-2">
          {badge && <span className="badge">{badge}</span>}
          <span className={`accordion-chevron ${open ? 'open' : ''}`}>▾</span>
        </div>
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </div>
  );
};
