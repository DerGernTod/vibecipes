import React, { useEffect, useState } from 'react';
import type {
  RecipeDto,
  IngredientDto,
  DietaryTrait,
  CreateRecipeRequest,
  CreateRecipeStepInput,
  CreateRecipeStepIngredientInput,
} from '../shared/types.ts';
import { calculateRecipeDietaryTrait } from '../domain/dietary.ts';
import { useLanguage } from './LanguageContext.tsx';

interface RecipeEditorProps {
  recipeId?: string | null;
  onSaveSuccess: (id: string) => void;
  onCancel: () => void;
}

export function RecipeEditor({ recipeId, onSaveSuccess, onCancel }: RecipeEditorProps) {
  const { t, lang } = useLanguage();
  const [catalog, setCatalog] = useState<IngredientDto[]>([]);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [servings, setServings] = useState<number>(4);
  const [overrideTrait, setOverrideTrait] = useState<DietaryTrait | ''>('');
  const [steps, setSteps] = useState<CreateRecipeStepInput[]>([
    { instruction: '', timerSec: null, ingredients: [] },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full ingredients catalog for step ingredient picker
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/ingredients');
        if (res.ok) {
          const data: IngredientDto[] = await res.json();
          setCatalog(data);
        }
      } catch (err) {
        console.error('Failed to load ingredient catalog', err);
      }
    }
    loadCatalog();
  }, []);

  // Fetch existing recipe if editing
  useEffect(() => {
    if (!recipeId) return;
    async function loadRecipe() {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/${recipeId}`);
        if (res.ok) {
          const data: RecipeDto = await res.json();
          setTitle(data.title);
          setDescription(data.description || '');
          setServings(data.servings);
          setOverrideTrait(data.overrideTrait || '');
          if (data.steps.length > 0) {
            setSteps(
              data.steps.map((s) => ({
                instruction: s.instruction,
                timerSec: s.timerSec,
                ingredients: s.ingredients.map((i) => ({
                  canonicalIngredientId: i.canonicalIngredientId,
                  amount: i.amount,
                  unit: i.unit,
                  preparationNote: i.preparationNote || '',
                })),
              }))
            );
          }
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

  // Live client-side calculation of dietary trait
  const computeLiveTrait = () => {
    const allIngredients: Array<{ defaultTrait: DietaryTrait }> = [];
    for (const step of steps) {
      for (const ing of step.ingredients) {
        const item = catalog.find((c) => c.id === ing.canonicalIngredientId);
        const trait = item ? item.defaultTrait : 'UNVERIFIED';
        allIngredients.push({ defaultTrait: trait });
      }
    }
    const calculated = calculateRecipeDietaryTrait(allIngredients);
    const effective = calculateRecipeDietaryTrait(
      allIngredients,
      overrideTrait ? (overrideTrait as DietaryTrait) : null
    );
    return { calculated, effective };
  };

  const { calculated: liveCalculated, effective: liveEffective } = computeLiveTrait();

  // Handlers for steps
  const handleAddStep = () => {
    setSteps((prev) => [...prev, { instruction: '', timerSec: null, ingredients: [] }]);
  };

  const handleRemoveStep = (stepIdx: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== stepIdx));
  };

  const handleStepInstructionChange = (stepIdx: number, val: string) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === stepIdx ? { ...s, instruction: val } : s))
    );
  };

  const handleStepTimerChange = (stepIdx: number, val: string) => {
    const num = val === '' ? null : parseInt(val, 10);
    setSteps((prev) =>
      prev.map((s, idx) => (idx === stepIdx ? { ...s, timerSec: isNaN(num!) ? null : num } : s))
    );
  };

  // Handlers for step ingredients
  const handleAddIngredient = (stepIdx: number) => {
    const defaultIngId = catalog.length > 0 ? catalog[0].id : '';
    setSteps((prev) =>
      prev.map((s, idx) => {
        if (idx !== stepIdx) return s;
        return {
          ...s,
          ingredients: [
            ...s.ingredients,
            { canonicalIngredientId: defaultIngId, amount: 100, unit: 'g', preparationNote: '' },
          ],
        };
      })
    );
  };

  const handleRemoveIngredient = (stepIdx: number, ingIdx: number) => {
    setSteps((prev) =>
      prev.map((s, idx) => {
        if (idx !== stepIdx) return s;
        return {
          ...s,
          ingredients: s.ingredients.filter((_, i) => i !== ingIdx),
        };
      })
    );
  };

  const handleIngredientChange = (
    stepIdx: number,
    ingIdx: number,
    field: keyof CreateRecipeStepIngredientInput,
    value: any
  ) => {
    setSteps((prev) =>
      prev.map((s, sIdx) => {
        if (sIdx !== stepIdx) return s;
        return {
          ...s,
          ingredients: s.ingredients.map((ing, iIdx) => {
            if (iIdx !== ingIdx) return ing;
            return { ...ing, [field]: value };
          }),
        };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('Please enter a recipe title', 'Bitte geben Sie einen Rezepttitel ein'));
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CreateRecipeRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      servings: Number(servings) || 4,
      overrideTrait: overrideTrait ? (overrideTrait as DietaryTrait) : null,
      steps: steps.map((s) => ({
        instruction: s.instruction.trim(),
        timerSec: s.timerSec,
        ingredients: s.ingredients.map((i) => ({
          canonicalIngredientId: i.canonicalIngredientId,
          amount: Number(i.amount) || 0,
          unit: i.unit,
          preparationNote: i.preparationNote ? i.preparationNote.trim() : undefined,
        })),
      })),
    };

    try {
      const url = recipeId ? `/api/recipes/${recipeId}` : '/api/recipes';
      const method = recipeId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: RecipeDto = await res.json();
        onSaveSuccess(data.id);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || t('Failed to save recipe', 'Rezept konnte nicht gespeichert werden'));
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)' }}>{t('Loading editor...', 'Lade Editor...')}</p>;

  let traitBadgeClass = 'trait-unverified';
  if (liveEffective === 'VEGAN') traitBadgeClass = 'trait-vegan';
  if (liveEffective === 'VEGETARIAN') traitBadgeClass = 'trait-vegetarian';
  if (liveEffective === 'OMNIVORE') traitBadgeClass = 'trait-omnivore';

  return (
    <div className="card">
      <h2>{recipeId ? t('Edit Recipe', 'Rezept bearbeiten') : t('Create New Recipe', 'Neues Rezept erstellen')}</h2>

      {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label>{t('Recipe Title *', 'Rezepttitel *')}</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('e.g. Fluffy Vegan Pancakes', 'z.B. Vegane Pfannkuchen')}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('Description / Summary', 'Beschreibung / Zusammenfassung')}</label>
          <textarea
            className="form-control"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Brief notes about this recipe...', 'Kurze Beschreibung des Rezepts...')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('Base Servings', 'Basisportionen')}</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="form-group">
            <label>{t('Dietary Trait Override', 'Ernährungseigenschaft überschreiben')}</label>
            <select
              className="form-control"
              value={overrideTrait}
              onChange={(e) => setOverrideTrait(e.target.value as any)}
            >
              <option value="">{t('Automatic (Inferred)', 'Automatisch (Berechnet)')}</option>
              <option value="VEGAN">VEGAN</option>
              <option value="VEGETARIAN">VEGETARIAN</option>
              <option value="OMNIVORE">OMNIVORE</option>
            </select>
          </div>
        </div>

        {/* Live Dietary Trait Preview Banner */}
        <div className="selected-ingredient-banner" style={{ marginBottom: '1.5rem' }}>
          <div>
            <strong>{t('Live Dietary Trait:', 'Live Ernährungs-Status:')}</strong>{' '}
            <span className={`trait-badge ${traitBadgeClass}`} style={{ marginLeft: '0.5rem' }}>
              {liveEffective} {overrideTrait ? '⚡' : ''}
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {overrideTrait
              ? t(`Inferred trait is ${liveCalculated} (Overridden to ${overrideTrait})`, `Berechnet: ${liveCalculated} (Überschrieben auf ${overrideTrait})`)
              : t(`Inferred automatically from ingredient traits`, `Automatisch aus Zutaten-Eigenschaften berechnet`)}
          </span>
        </div>

        {/* Step Manager */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>📋 {t('Step-by-Step Instructions', 'Schritt-für-Schritt Anleitung')}</h3>
          <button type="button" className="btn-secondary" onClick={handleAddStep}>
            + {t('Add Step', 'Schritt hinzufügen')}
          </button>
        </div>

        {steps.map((step, sIdx) => (
          <div key={sIdx} className="step-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--primary)' }}>
                {t('Step', 'Schritt')} {sIdx + 1}
              </strong>
              {steps.length > 1 && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleRemoveStep(sIdx)}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
                >
                  ✕ {t('Remove Step', 'Schritt entfernen')}
                </button>
              )}
            </div>

            <div className="form-group">
              <label>{t('Instruction', 'Anweisung')}</label>
              <textarea
                className="form-control"
                rows={2}
                value={step.instruction}
                onChange={(e) => handleStepInstructionChange(sIdx, e.target.value)}
                placeholder={t('e.g. Sift flour and whisk in oat milk until smooth...', 'z.B. Mehl sieben und Hafermilch einrühren...')}
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ maxWidth: '200px' }}>
                <label>{t('Timer (Seconds)', 'Timer (Sekunden)')}</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 180"
                  value={step.timerSec ?? ''}
                  onChange={(e) => handleStepTimerChange(sIdx, e.target.value)}
                />
              </div>
            </div>

            {/* Step Ingredients */}
            <div style={{ marginTop: '1rem', background: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>
                  🥗 {t('Ingredients for this step', 'Zutaten für diesen Schritt')}
                </span>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => handleAddIngredient(sIdx)}
                >
                  + {t('Add Ingredient', 'Zutat hinzufügen')}
                </button>
              </div>

              {step.ingredients.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
                  {t('No ingredients added to this step.', 'Keine Zutaten für diesen Schritt.')}
                </p>
              ) : (
                step.ingredients.map((ing, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <select
                      className="form-control"
                      style={{ flex: 2, minWidth: '180px' }}
                      value={ing.canonicalIngredientId}
                      onChange={(e) => handleIngredientChange(sIdx, iIdx, 'canonicalIngredientId', e.target.value)}
                    >
                      {catalog.map((catItem) => (
                        <option key={catItem.id} value={catItem.id}>
                          {lang === 'de' ? catItem.primaryNameDe : catItem.primaryNameEn} ({catItem.defaultTrait})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      style={{ width: '80px' }}
                      value={ing.amount}
                      onChange={(e) => handleIngredientChange(sIdx, iIdx, 'amount', parseFloat(e.target.value) || 0)}
                    />

                    <select
                      className="form-control"
                      style={{ width: '80px' }}
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(sIdx, iIdx, 'unit', e.target.value)}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                    </select>

                    <input
                      type="text"
                      className="form-control"
                      style={{ flex: 1, minWidth: '120px' }}
                      placeholder={t('Note (e.g. melted)', 'Hinweis (z.B. geschmolzen)')}
                      value={ing.preparationNote || ''}
                      onChange={(e) => handleIngredientChange(sIdx, iIdx, 'preparationNote', e.target.value)}
                    />

                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleRemoveIngredient(sIdx, iIdx)}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('Saving...', 'Speichere...') : t('Save Recipe', 'Rezept speichern')}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            {t('Cancel', 'Abbrechen')}
          </button>
        </div>
      </form>
    </div>
  );
}
