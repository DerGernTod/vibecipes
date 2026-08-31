import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { IngredientDto, DietaryTrait } from '../shared/types.ts';

const client = hc<AppType>('/');

interface IngredientSearchProps {
  onSelect?: (ingredient: IngredientDto) => void;
}

export function IngredientSearch({ onSelect }: IngredientSearchProps) {
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [allIngredientsMap, setAllIngredientsMap] = useState<Record<string, IngredientDto>>({});

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
          // Build lookup map for parent group names
          const map: Record<string, IngredientDto> = {};
          data.forEach((item) => {
            map[item.id] = item;
          });
          setAllIngredientsMap((prev) => ({ ...prev, ...map }));
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

  const getTraitBadgeClass = (trait: DietaryTrait) => {
    switch (trait) {
      case 'VEGAN':
        return 'trait-badge trait-vegan';
      case 'VEGETARIAN':
        return 'trait-badge trait-vegetarian';
      case 'OMNIVORE':
        return 'trait-badge trait-omnivore';
      default:
        return 'trait-badge';
    }
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
            placeholder="Search catalog by EN/DE name or alias (e.g. Hafer, Butter, Panko)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')} title="Clear search">
              ✕
            </button>
          )}
        </div>
        <div className="search-count-label">
          {loading ? 'Searching...' : `${ingredients.length} catalog items`}
        </div>
      </div>

      {selectedIngredient && (
        <div className="selected-ingredient-banner">
          <div className="selected-info">
            <strong>Selected Ingredient:</strong> {selectedIngredient.primaryNameEn} ({selectedIngredient.primaryNameDe})
            <span className={getTraitBadgeClass(selectedIngredient.defaultTrait)} style={{ marginLeft: '0.5rem' }}>
              {selectedIngredient.defaultTrait}
            </span>
          </div>
          <button className="btn-secondary-sm" onClick={() => setSelectedIngredient(null)}>
            Clear Selection
          </button>
        </div>
      )}

      <div className="ingredient-grid">
        {ingredients.length === 0 && !loading ? (
          <div className="no-results">
            No matching canonical ingredients found for &quot;{query}&quot;. Try searching for &quot;Milk&quot;, &quot;Hafer&quot;, &quot;Zucker&quot;, or &quot;Butter&quot;.
          </div>
        ) : (
          ingredients.map((ing) => {
            const parent = ing.parentGroupId ? allIngredientsMap[ing.parentGroupId] : null;
            const isSelected = selectedIngredient?.id === ing.id;
            return (
              <div
                key={ing.id}
                className={`ingredient-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(ing)}
              >
                <div className="card-top">
                  <div className="ingredient-title-area">
                    <h3 className="ingredient-title">
                      {ing.primaryNameEn} <span className="ingredient-de-title">/ {ing.primaryNameDe}</span>
                    </h3>
                  </div>
                  <span className={getTraitBadgeClass(ing.defaultTrait)}>{ing.defaultTrait}</span>
                </div>

                <div className="card-details">
                  {ing.densityGPerMl !== null && (
                    <div className="detail-chip">
                      <span className="chip-label">Density:</span> {ing.densityGPerMl} g/ml
                    </div>
                  )}
                  {ing.parentGroupId && (
                    <div className="detail-chip parent-chip">
                      <span className="chip-label">Parent Group:</span> {parent ? parent.primaryNameEn : ing.parentGroupId}
                    </div>
                  )}
                </div>

                <div className="aliases-footer">
                  <span className="aliases-title">Aliases:</span> {ing.aliases.join(', ')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
