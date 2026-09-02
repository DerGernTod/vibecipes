import React, { useEffect } from 'react';

export type PrototypeVariantKey = 'S1' | 'S2' | 'S3';

export interface VariantInfo {
  key: PrototypeVariantKey;
  name: string;
  description: string;
}

export const VARIANTS: VariantInfo[] = [
  {
    key: 'S1',
    name: 'Pill Filter Bar + Search',
    description: 'Header search input + category pills (Breakfast, Lunch, Dinner...) + full-size + card.',
  },
  {
    key: 'S2',
    name: 'Command Spotlight + Chips',
    description: 'Omnibox command search + interactive category drawer + full-size + card.',
  },
  {
    key: 'S3',
    name: 'Visual Category Facets',
    description: 'Icon category chips + trait filter toggles + full-size + card.',
  },
];

interface PrototypeSwitcherProps {
  currentVariant: PrototypeVariantKey;
  onSelectVariant: (key: PrototypeVariantKey) => void;
}

export function PrototypeSwitcher({ currentVariant, onSelectVariant }: PrototypeSwitcherProps) {
  const currentIndex = VARIANTS.findIndex((v) => v.key === currentVariant);
  const activeVariant = VARIANTS[currentIndex] || VARIANTS[0];

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + VARIANTS.length) % VARIANTS.length;
    onSelectVariant(VARIANTS[nextIdx].key);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % VARIANTS.length;
    onSelectVariant(VARIANTS[nextIdx].key);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#090d16',
        border: '1px solid #6366f1',
        borderRadius: '30px',
        padding: '0.4rem 0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.3)',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <button
        onClick={handlePrev}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#f8fafc',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
        }}
        title="Previous Variant (Left Arrow)"
      >
        ←
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            background: '#6366f1',
            color: '#fff',
            fontWeight: 'bold',
            padding: '0.15rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
          }}
        >
          SEARCH {activeVariant.key}
        </span>
        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{activeVariant.name}</span>
        <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'inline-block', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          — {activeVariant.description}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.2rem' }}>
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            onClick={() => onSelectVariant(v.key)}
            style={{
              background: v.key === currentVariant ? '#6366f1' : '#1e293b',
              color: v.key === currentVariant ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              padding: '0.2rem 0.45rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {v.key}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#f8fafc',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
        }}
        title="Next Variant (Right Arrow)"
      >
        →
      </button>
    </div>
  );
}
