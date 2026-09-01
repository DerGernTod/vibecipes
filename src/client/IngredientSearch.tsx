import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { IngredientDto, DietaryTrait } from '../shared/types.ts';
import { useLanguage } from './LanguageContext.tsx';

const client = hc<AppType>('/');

interface IngredientSearchProps {
  onSelect?: (ingredient: IngredientDto) => void;
}

const TRAIT_BADGE_CLASSES: Record<string, string> = {
  VEGAN: 'trait-badge trait-vegan',
  VEGETARIAN: 'trait-badge trait-vegetarian',
  OMNIVORE: 'trait-badge trait-omnivore',
};

export function IngredientSearch({ onSelect }: IngredientSearchProps) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [catalogMap, setCatalogMap] = useState<Record<string, IngredientDto>>({});
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientDto | null>(null);
  const [loading, setLoading] = useState(false);

  // Load full catalog once on mount to build complete parent lookup map
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await client.api.ingredients.$get();
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, IngredientDto> = {};
          data.forEach((item) => {
            map[item.id] = item;
          });
          setCatalogMap(map);
        }
      } catch (err) {
        console.error('Error fetching full catalog map:', err);
      }
    }
    loadCatalog();
  }, []);

  // Search when query changes
  useEffect(() => {
    let active = true;
    async function fetchIngredients() {
      setLoading(true);
      try {
        const res = await client.api.ingredients.$get({
          query: query.trim() ? { q: query.trim() } : {},
        });
        if (res.ok && active) {
          const data = await res.json();
          setIngredients(data);
        }
      } catch (err) {
        console.error('Error searching ingredients:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timeout = setTimeout(fetchIngredients, 150);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const handleSelect = (ing: IngredientDto) => {
    setSelectedIngredient(ing);
    if (onSelect) {
      onSelect(ing);
    }
  };

  const getPrimaryName = (ing: IngredientDto) => {
    return lang === 'de' ? ing.primaryNameDe : ing.primaryNameEn;
  };

  const getSecondaryName = (ing: IngredientDto) => {
    return lang === 'de' ? ing.primaryNameEn : ing.primaryNameDe;
  };

  return (
    <div className="ingredient-search-wrapper">
      <div className="search-box-container">
        <div className="search-input-field">
          <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder={t(
              "Search catalog by name or alias (e.g. Oat, Hafer, Butter, Panko)...",
              "Katalog nach Name oder Alias durchsuchen (z.B. Hafer, Butter, Panko)..."
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')} title={t("Clear search", "Suche zurücksetzen")}>
              ✕
            </button>
          )}
        </div>
        <div className="search-count-label">
          {loading ? t("Searching...", "Suche läuft...") : `${ingredients.length} ${t("catalog items", "Einträge")}`}
        </div>
      </div>

      {selectedIngredient && (
        <div className="selected-ingredient-banner">
          <div className="selected-info">
            <strong>{t("Selected Ingredient:", "Ausgewählte Zutat:")}</strong> {getPrimaryName(selectedIngredient)}
            <span className="ingredient-secondary-name"> ({getSecondaryName(selectedIngredient)})</span>
            <span className={TRAIT_BADGE_CLASSES[selectedIngredient.defaultTrait] || 'trait-badge'} style={{ marginLeft: '0.5rem' }}>
              {selectedIngredient.defaultTrait}
            </span>
          </div>
          <button className="btn-secondary-sm" onClick={() => setSelectedIngredient(null)}>
            {t("Clear Selection", "Auswahl aufheben")}
          </button>
        </div>
      )}

      <div className="ingredient-grid">
        {ingredients.length === 0 && !loading ? (
          <div className="no-results">
            {t(
              `No matching canonical ingredients found for "${query}". Try searching for "Milk", "Hafer", "Sugar", or "Butter".`,
              `Keine passenden kanonischen Zutaten für "${query}" gefunden. Versuchen Sie es mit "Milch", "Hafer", "Zucker" oder "Butter".`
            )}
          </div>
        ) : (
          ingredients.map((ing) => {
            const parent = ing.parentGroupId ? catalogMap[ing.parentGroupId] : null;
            const isSelected = selectedIngredient?.id === ing.id;
            const primaryName = getPrimaryName(ing);
            const secondaryName = getSecondaryName(ing);
            const parentName = parent ? getPrimaryName(parent) : ing.parentGroupId;

            return (
              <div
                key={ing.id}
                className={`ingredient-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(ing)}
              >
                <div className="card-top">
                  <div className="ingredient-title-area">
                    <h3 className="ingredient-title">
                      {primaryName} <span className="ingredient-de-title">({secondaryName})</span>
                    </h3>
                  </div>
                  <span className={TRAIT_BADGE_CLASSES[ing.defaultTrait] || 'trait-badge'}>{ing.defaultTrait}</span>
                </div>

                <div className="card-details">
                  {ing.densityGPerMl !== null && (
                    <div className="detail-chip">
                      <span className="chip-label">{t("Density:", "Dichte:")}</span> {ing.densityGPerMl} g/ml
                    </div>
                  )}
                  {ing.parentGroupId && (
                    <div className="detail-chip parent-chip">
                      <span className="chip-label">{t("Parent Group:", "Übergeordnet:")}</span> {parentName}
                    </div>
                  )}
                </div>

                <div className="aliases-footer">
                  <span className="aliases-title">{t("Aliases:", "Aliase:")}</span> {ing.aliases.join(', ')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
