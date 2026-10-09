import React, { useEffect, useState } from 'react';
import { recipeDtoSchema, type RecipeDto } from '../shared/schemas.ts';
import { readJson } from './http.ts';
import { useLanguage } from './LanguageContext.tsx';
import { formatScaledAmount } from '../domain/units.ts';
import { Button, Chip, TraitChip } from './ui/index.ts';

interface RecipeDetailProps {
  recipeId: string;
  /** Recipe with an active Cook Mode session, if any. Its button then resumes instead of starting. */
  cookingRecipeId: string | null;
  onBack: () => void;
  onEdit: (id: string) => void;
  onStartCooking: (servings: number, system: UnitSystem) => void;
}

type UnitSystem = 'metric' | 'imperial';

export function RecipeDetail({ recipeId, cookingRecipeId, onBack, onEdit, onStartCooking }: RecipeDetailProps) {
  const { t, lang } = useLanguage();
  const [recipe, setRecipe] = useState<RecipeDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [targetServings, setTargetServings] = useState<number>(1);
  const [system, setSystem] = useState<UnitSystem>('metric');

  useEffect(() => {
    async function loadRecipe() {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/${recipeId}`);
        if (res.ok) {
          const data = await readJson(res, recipeDtoSchema);
          setRecipe(data);
          setTargetServings(data.servings);
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

  if (loading) return <div className="page-state">{t('Loading recipe details...', 'Lade Rezeptdetails...')}</div>;
  if (error || !recipe) return <div className="page-state page-state--error">{error || 'Error loading recipe'}</div>;

  const factor = targetServings / recipe.servings;
  const isOverridden = !!recipe.overrideTrait;
  const scalingWarning = factor > 2 || factor < 0.25;

  /** Scale, convert and format one ingredient amount for the current servings and unit system. */
  const formatAmount = (amount: number, unit: string, densityGPerMl: number | null | undefined) =>
    formatScaledAmount(amount, unit, densityGPerMl, factor, system, lang);

  return (
    <div className="detail">
      <section className={`detail-hero ${recipe.imageUrl ? '' : 'detail-hero--plain'}`}>
        {recipe.imageUrl && (
          <>
            <img className="detail-hero__media" src={recipe.imageUrl} alt="" />
            <div className="detail-hero__scrim" />
          </>
        )}
        <div className="detail-hero__actions">
          <Button variant="secondary" size="sm" onClick={onBack}>
            ← {t('Back to List', 'Zurück zur Übersicht')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => onStartCooking(targetServings, system)}>
            {cookingRecipeId === recipe.id ? t('Resume Cook Mode', 'Kochmodus fortsetzen') : t('Start Cook Mode', 'Kochmodus starten')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(recipe.id)}>
            {t('Edit Recipe', 'Rezept bearbeiten')}
          </Button>
        </div>
        <div className="detail-hero__content">
          <div className="detail-hero__meta">
            <TraitChip trait={recipe.effectiveTrait} />
            {isOverridden && (
              <span className="detail-hero__note">
                {t('Override', 'Überschrieben')} · {t('calculated:', 'berechnet:')} {recipe.calculatedTrait}
              </span>
            )}
          </div>
          <h1 className="detail-hero__title">{recipe.title}</h1>
          {recipe.description && <p className="detail-hero__desc">{recipe.description}</p>}
        </div>
      </section>

      <div className="detail-controls">
        <div className="detail-controls__group">
          <span>{t('Servings', 'Portionen')}</span>
          <div className="stepper">
            <Button variant="secondary" size="sm" aria-label={t('Fewer servings', 'Weniger Portionen')} onClick={() => setTargetServings(s => Math.max(1, s - 1))}>−</Button>
            <strong className="stepper__value">{targetServings}</strong>
            <Button variant="secondary" size="sm" aria-label={t('More servings', 'Mehr Portionen')} onClick={() => setTargetServings(s => s + 1)}>+</Button>
          </div>
        </div>
        <div className="segmented" role="group" aria-label={t('Unit system', 'Maßsystem')}>
          <button type="button" className="segmented__btn" aria-pressed={system === 'metric'} onClick={() => setSystem('metric')}>
            {t('Metric (g, ml)', 'Metrisch (g, ml)')}
          </button>
          <button type="button" className="segmented__btn" aria-pressed={system === 'imperial'} onClick={() => setSystem('imperial')}>
            {t('Imperial (tsp, oz)', 'Imperial (TL, oz)')}
          </button>
        </div>
      </div>

      {scalingWarning && (
        <div className="detail-controls">
          <div className="notice notice--warn" style={{ width: '100%' }}>
            ⚠️ {t('Scaling above 2x or below 0.25x may require recipe adjustments.', 'Skalierung über 2x oder unter 0.25x erfordert möglicherweise Rezeptanpassungen.')}
          </div>
        </div>
      )}

      <div className="detail-body">
        <aside className="detail-body__ingredients">
          <h2 className="detail-section-title">{t('Total Ingredients', 'Gesamte Zutaten')}</h2>
          {recipe.aggregatedIngredients && recipe.aggregatedIngredients.length > 0 ? (
            <ul className="ingredient-list">
              {recipe.aggregatedIngredients.map((item, idx) => {
                const name = lang === 'de' && item.ingredient ? item.ingredient.primaryNameDe : (item.ingredient?.primaryNameEn || item.canonicalIngredientId);
                const notes = item.preparationNotes.length > 0 ? ` (${item.preparationNotes.join(', ')})` : '';
                return (
                  <li key={idx}>
                    <span className="ingredient-list__amount">{formatAmount(item.totalAmount, item.unit, item.ingredient?.densityGPerMl)}</span>
                    <span>{name}{notes}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="field__hint">{t('No ingredients yet.', 'Noch keine Zutaten.')}</p>
          )}
        </aside>

        <section>
          <h2 className="detail-section-title">{t('Preparation Steps', 'Zubereitungsschritte')}</h2>
          {recipe.steps.length === 0 ? (
            <p className="field__hint">{t('No steps added yet.', 'Noch keine Schritte hinzugefügt.')}</p>
          ) : (
            recipe.steps.map((step, index) => (
              <article key={step.id || index} className="step">
                <div className="step__head">
                  <span className="step__number">{t('Step', 'Schritt')} {index + 1}</span>
                  {step.timerSec ? (
                    <Chip tone="meta">⏱ {step.timerSec}s · {Math.floor(step.timerSec / 60)}m {step.timerSec % 60}s</Chip>
                  ) : null}
                </div>
                <p className="step__text">{step.instruction}</p>
                {step.ingredients.length > 0 && (
                  <div className="step__ingredients">
                    {step.ingredients.map((ing, iIdx) => {
                      const ingName = lang === 'de' && ing.ingredient ? ing.ingredient.primaryNameDe : (ing.ingredient?.primaryNameEn || ing.canonicalIngredientId);
                      const amount = formatAmount(ing.amount, ing.unit, ing.ingredient?.densityGPerMl);
                      return (
                        <Chip key={iIdx} tone="meta" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 'var(--fs-sm)', padding: '0.3rem 0.7rem' }}>
                          <strong style={{ color: 'var(--text)' }}>{amount}</strong> {ingName}{ing.preparationNote ? ` (${ing.preparationNote})` : ''}
                        </Chip>
                      );
                    })}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
