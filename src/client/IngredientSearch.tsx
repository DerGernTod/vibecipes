import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import { ingredientListSchema, type IngredientDto } from '../shared/schemas.ts';
import { readJson } from './http.ts';
import { useLanguage } from './LanguageContext.tsx';
import { Chip, TraitChip } from './ui/index.ts';

const client = hc<AppType>('/');

interface IngredientSearchProps {
  onSelect?: (ingredient: IngredientDto) => void;
}

/** Ingredient taxonomy browser. Optional `onSelect` turns cards into picker buttons. */
export function IngredientSearch({ onSelect }: IngredientSearchProps) {
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the full taxonomy once and filter locally (small dataset).
  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        const res = await client.api.ingredients.$get();
        if (res.ok && active) {
          const data = await readJson(res, ingredientListSchema);
          setIngredients(data);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCatalog();
    return () => { active = false; };
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = ingredients.filter(ing => {
    if (!query) return true;
    return (
      ing.primaryNameEn.toLowerCase().includes(query) ||
      ing.primaryNameDe.toLowerCase().includes(query) ||
      ing.aliases.some(a => a.toLowerCase().includes(query))
    );
  });

  if (loading) return <div className="page-state">{t('Loading Taxonomy...', 'Lade Taxonomie...')}</div>;

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-head__title">{t('Taxonomy Library', 'Taxonomie Bibliothek')}</h1>
        <div className="search-field">
          <span className="search-field__icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="input input--pill"
            placeholder={t('Search ingredients...', 'Zutaten durchsuchen...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('Search ingredients', 'Zutaten durchsuchen')}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="ingredient-grid">
          {filtered.map(ing => {
            const name = lang === 'de' ? ing.primaryNameDe : ing.primaryNameEn;
            const body = (
              <>
                <div className="ingredient-card__media">
                  {ing.imageUrl && <img src={ing.imageUrl} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />}
                  <TraitChip trait={ing.defaultTrait} className="ingredient-card__chip" />
                </div>
                <div className="ingredient-card__body">
                  <h3 className="ingredient-card__name">{name}</h3>
                  <div className="ingredient-card__meta">
                    <span>ID: {ing.id.split('_')[1]}</span>
                    {ing.parentGroupId && <Chip tone="parent">{t('Parent', 'Oberbegriff')}: {ing.parentGroupId}</Chip>}
                  </div>
                </div>
              </>
            );

            return onSelect ? (
              <button
                key={ing.id}
                type="button"
                className="ingredient-card ingredient-card--action"
                onClick={() => onSelect(ing)}
              >
                {body}
              </button>
            ) : (
              <div key={ing.id} className="ingredient-card">
                {body}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="home-empty">{t('No ingredients found.', 'Keine Zutaten gefunden.')}</div>
      )}
    </div>
  );
}
