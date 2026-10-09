import React from 'react';
import type { DietaryTrait } from '../../shared/schemas.ts';
import { useLanguage } from '../LanguageContext.tsx';

export type ChipTone = 'vegan' | 'vegetarian' | 'omnivore' | 'unverified' | 'parent' | 'meta';

interface ChipProps {
  tone?: ChipTone;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Chip({ tone = 'meta', className, style, children }: ChipProps) {
  return <span className={`chip chip--${tone} ${className ?? ''}`.trim()} style={style}>{children}</span>;
}

const TRAIT_TONE: Record<DietaryTrait, ChipTone> = {
  VEGAN: 'vegan',
  VEGETARIAN: 'vegetarian',
  OMNIVORE: 'omnivore',
  UNVERIFIED: 'unverified',
};

/** Dietary trait badge. Labels follow the active language. */
export function TraitChip({ trait, className, style }: { trait: DietaryTrait; className?: string; style?: React.CSSProperties }) {
  const { t } = useLanguage();
  const label: Record<DietaryTrait, string> = {
    VEGAN: t('Vegan', 'Vegan'),
    VEGETARIAN: t('Vegetarian', 'Vegetarisch'),
    OMNIVORE: t('Omnivore', 'Allesesser'),
    UNVERIFIED: t('Unverified', 'Ungeprüft'),
  };
  return (
    <Chip tone={TRAIT_TONE[trait]} className={className} style={style}>
      {label[trait]}
    </Chip>
  );
}
