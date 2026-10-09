import React, { useState } from 'react';
import type { DietaryTrait } from '../../shared/schemas.ts';
import { useLanguage } from '../LanguageContext.tsx';
import { TraitChip } from './Chip.tsx';

interface RecipeCardProps {
  title: string;
  imageUrl?: string | null;
  servings?: number;
  trait?: DietaryTrait;
  onClick?: () => void;
}

/** Recipe tile for rows and grids. Falls back to a typographic placeholder when there is no usable image. */
export function RecipeCard({ title, imageUrl, servings, trait, onClick }: RecipeCardProps) {
  const { t } = useLanguage();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="recipe-card"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKey}
    >
      <div className="recipe-card__media">
        {showImage ? (
          <img src={imageUrl ?? undefined} alt="" loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <div className="recipe-card__placeholder" aria-hidden="true">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        {trait && <TraitChip trait={trait} className="recipe-card__chip" />}
      </div>
      <div className="recipe-card__body">
        <h3 className="recipe-card__title">{title}</h3>
        {servings !== undefined && (
          <p className="recipe-card__meta">
            {servings} {t('servings', 'Portionen')}
          </p>
        )}
      </div>
    </div>
  );
}
