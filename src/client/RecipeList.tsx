import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../shared/types.ts';
import { useLanguage } from './LanguageContext.tsx';

interface RecipeListProps {
  onSelectRecipe: (id: string) => void;
  onEditRecipe: (id: string) => void;
  onCreateRecipe: () => void;
}

export function RecipeList({ onSelectRecipe, onEditRecipe, onCreateRecipe }: RecipeListProps) {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) {
        const data: RecipeDto[] = await res.json();
        setRecipes(data);
      } else {
        setError(t('Failed to load recipes', 'Rezepte konnten nicht geladen werden'));
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(t(`Delete recipe "${title}"?`, `Rezept "${title}" löschen?`))) {
      return;
    }
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(t('Failed to delete recipe', 'Rezept konnte nicht gelöscht werden'));
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const renderTraitBadge = (recipe: RecipeDto) => {
    const trait = recipe.effectiveTrait;
    const isOverridden = !!recipe.overrideTrait;
    let traitClass = 'trait-unverified';
    if (trait === 'VEGAN') traitClass = 'trait-vegan';
    if (trait === 'VEGETARIAN') traitClass = 'trait-vegetarian';
    if (trait === 'OMNIVORE') traitClass = 'trait-omnivore';

    return (
      <span className={`trait-badge ${traitClass}`} title={isOverridden ? t('Manually overridden', 'Manuell überschrieben') : ''}>
        {trait} {isOverridden ? '⚡' : ''}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{t('Recipes Catalog', 'Rezeptkatalog')}</h2>
        <button className="btn-primary" onClick={onCreateRecipe}>
          + {t('Create Recipe', 'Rezept erstellen')}
        </button>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>{t('Loading recipes...', 'Lade Rezepte...')}</p>}
      {error && <div style={{ color: '#ef4444' }}>{error}</div>}

      {!loading && !error && recipes.length === 0 && (
        <div className="no-results">
          <p>{t('No recipes created yet. Click "+ Create Recipe" to add your first recipe!', 'Noch keine Rezepte erstellt. Klicken Sie auf "+ Rezept erstellen"!')}</p>
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => onSelectRecipe(recipe.id)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div className="recipe-card-header">
                  <h3 className="recipe-title">{recipe.title}</h3>
                  {renderTraitBadge(recipe)}
                </div>
                {recipe.description && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0.5rem 0' }}>
                    {recipe.description}
                  </p>
                )}
                <div className="recipe-card-meta">
                  <span>🍽️ {recipe.servings} {t('servings', 'Portionen')}</span>
                  <span>📝 {recipe.steps.length} {t('steps', 'Schritte')}</span>
                </div>
              </div>

              <div className="recipe-card-actions">
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRecipe(recipe.id);
                  }}
                >
                  {t('View', 'Anzeigen')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRecipe(recipe.id);
                  }}
                >
                  {t('Edit', 'Bearbeiten')}
                </button>
                <button
                  className="btn-danger"
                  onClick={(e) => handleDelete(e, recipe.id, recipe.title)}
                  style={{ marginLeft: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                >
                  {t('Delete', 'Löschen')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
