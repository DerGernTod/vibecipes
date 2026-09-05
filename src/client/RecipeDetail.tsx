import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../shared/types.ts';
import { useLanguage } from './LanguageContext.tsx';

interface RecipeDetailProps {
  recipeId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export function RecipeDetail({ recipeId, onBack, onEdit }: RecipeDetailProps) {
  const { t, lang } = useLanguage();
  const [recipe, setRecipe] = useState<RecipeDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipe() {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/${recipeId}`);
        if (res.ok) {
          const data: RecipeDto = await res.json();
          setRecipe(data);
        } else {
          setError(t('Recipe not found', 'Rezept nicht gefunden'));
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [recipeId]);

  if (loading) return <p style={{ color: 'var(--muted)' }}>{t('Loading recipe details...', 'Lade Rezeptdetails...')}</p>;
  if (error || !recipe) return <div style={{ color: '#ef4444' }}>{error || 'Error loading recipe'}</div>;

  const renderTraitBadge = () => {
    const trait = recipe.effectiveTrait;
    const isOverridden = !!recipe.overrideTrait;
    let traitClass = 'trait-unverified';
    if (trait === 'VEGAN') traitClass = 'trait-vegan';
    if (trait === 'VEGETARIAN') traitClass = 'trait-vegetarian';
    if (trait === 'OMNIVORE') traitClass = 'trait-omnivore';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
        <span className={`trait-badge ${traitClass}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.65rem' }}>
          {trait} {isOverridden ? '⚡' : ''}
        </span>
        {isOverridden && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            ({t('Calculated:', 'Berechnet:')} {recipe.calculatedTrait})
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className="btn-secondary" onClick={onBack}>
          ← {t('Back to List', 'Zurück zur Übersicht')}
        </button>
        <button className="btn-primary" onClick={() => onEdit(recipe.id)}>
          ✏️ {t('Edit Recipe', 'Rezept bearbeiten')}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {recipe.imageUrl && (
          <div style={{ width: '100%', height: '260px', overflow: 'hidden', position: 'relative' }}>
            <img src={recipe.imageUrl} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, var(--card), transparent)' }} />
          </div>
        )}

        <div style={{ padding: '1.5rem' }}>
          <div className="recipe-detail-header">
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0' }}>{recipe.title}</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                🍽️ {t('Base Servings:', 'Basisportionen:')} <strong>{recipe.servings}</strong>
              </p>
            </div>
            {renderTraitBadge()}
          </div>

        {recipe.description && (
          <p style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            {recipe.description}
          </p>
        )}

        {/* Aggregated Total Ingredients Overview */}
        {recipe.aggregatedIngredients && recipe.aggregatedIngredients.length > 0 && (
          <div className="aggregated-box">
            <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
              📦 {t('Total Ingredients Required', 'Gesamte benötigte Zutaten')}
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {recipe.aggregatedIngredients.map((item, idx) => {
                const name = lang === 'de' && item.ingredient ? item.ingredient.primaryNameDe : (item.ingredient?.primaryNameEn || item.canonicalIngredientId);
                const notesStr = item.preparationNotes.length > 0 ? ` (${item.preparationNotes.join(', ')})` : '';
                return (
                  <li key={idx}>
                    <strong>{item.totalAmount} {item.unit}</strong> {name}{notesStr}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Ordered Recipe Steps */}
        <h3>📋 {t('Preparation Steps', 'Zubereitungsschritte')}</h3>
        {recipe.steps.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>{t('No steps added yet.', 'Noch keine Schritte hinzugefügt.')}</p>
        ) : (
          recipe.steps.map((step, index) => (
            <div key={step.id || index} className="step-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="step-number">
                  {t('Step', 'Schritt')} {index + 1}
                </div>
                {step.timerSec && (
                  <div className="timer-badge">
                    ⏱️ {step.timerSec}s ({Math.floor(step.timerSec / 60)}m {step.timerSec % 60}s)
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.98rem', margin: '0.5rem 0 0.75rem 0', lineHeight: '1.4' }}>
                {step.instruction}
              </p>

              {step.ingredients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {step.ingredients.map((ing, iIdx) => {
                    const ingName = lang === 'de' && ing.ingredient ? ing.ingredient.primaryNameDe : (ing.ingredient?.primaryNameEn || ing.canonicalIngredientId);
                    return (
                      <span key={iIdx} className="detail-chip parent-chip">
                        {ing.amount} {ing.unit} {ingName} {ing.preparationNote ? `(${ing.preparationNote})` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
