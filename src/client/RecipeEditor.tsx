import React, { useEffect, useState } from 'react';
import {
  recipeDtoSchema,
  ingredientListSchema,
  type IngredientDto,
  type DietaryTrait,
  type CreateRecipeRequest,
  type CreateRecipeStepInput,
  type CreateRecipeStepIngredientInput,
  type ImportedRecipe,
} from '../shared/schemas.ts';
import { readErrorMessage, readJson } from './http.ts';
import { calculateRecipeDietaryTrait } from '../domain/dietary.ts';
import { useLanguage } from './LanguageContext.tsx';
import { UrlImportModal, type ImportOrigin } from './UrlImportModal.tsx';
import { PhotoImportModal, type PhotoImportDraft } from './PhotoImportModal.tsx';
import { ImportReportForm } from './ImportReportForm.tsx';
import { Button, Field, Input, Panel } from './ui/index.ts';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPhotoImport, setShowPhotoImport] = useState(false);
  // The last import, kept with the extracted recipe as the server returned it (edits do not change it).
  const [importOrigin, setImportOrigin] = useState<(ImportOrigin & { attempt: number; recipe: ImportedRecipe }) | null>(null);

  const handleImport = (data: ImportedRecipe, origin: ImportOrigin) => {
    setImportOrigin((prev) => ({ ...origin, attempt: (prev?.attempt ?? 0) + 1, recipe: data }));
    setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.servings) setServings(data.servings);

    if (data.ingredients && data.ingredients.length > 0) {
      setSteps([{
        instruction: '',
        timerSec: null,
        ingredients: data.ingredients.map((ing) => ({
          canonicalIngredientId: ing.canonicalIngredientId,
          amount: ing.amount,
          unit: ing.unit,
          preparationNote: ing.preparationNote || ''
        }))
      }]);
    }
  };

  // Replaces the form with a photo draft. Its steps have no ingredient links yet; those are added in the step picker.
  const handlePhotoImport = (draft: PhotoImportDraft) => {
    setShowPhotoImport(false);
    setImportOrigin(null);
    if (draft.title) setTitle(draft.title);
    if (draft.steps.length > 0) {
      setSteps(draft.steps.map((s) => ({ instruction: s.instruction, timerSec: null, imageUrl: s.imageUrl, ingredients: [] })));
    }
  };

  // Fetch full ingredients catalog for step ingredient picker
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/ingredients');
        if (res.ok) {
          const data = await readJson(res, ingredientListSchema);
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
          const data = await readJson(res, recipeDtoSchema);
          setTitle(data.title);
          setDescription(data.description || '');
          setServings(data.servings);
          setOverrideTrait(data.overrideTrait || '');
          if (data.steps.length > 0) {
            setSteps(
              data.steps.map((s) => ({
                instruction: s.instruction,
                timerSec: s.timerSec,
                imageUrl: s.imageUrl ?? null,
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
      overrideTrait || null
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

  const handleStepImageChange = (stepIdx: number, imageUrl: string | null) => {
    setSteps((prev) => prev.map((s, idx) => (idx === stepIdx ? { ...s, imageUrl } : s)));
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

  const handleIngredientChange = <K extends keyof CreateRecipeStepIngredientInput>(
    stepIdx: number,
    ingIdx: number,
    field: K,
    value: CreateRecipeStepIngredientInput[K]
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
      overrideTrait: overrideTrait || null,
      steps: steps.map((s) => ({
        instruction: s.instruction.trim(),
        timerSec: s.timerSec,
        imageUrl: s.imageUrl ?? null,
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
        const data = await readJson(res, recipeDtoSchema);
        onSaveSuccess(data.id);
      } else {
        setError(await readErrorMessage(res, t('Failed to save recipe', 'Rezept konnte nicht gespeichert werden')));
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
    <>
      <div className="editor-header">
        <h2>{recipeId ? t('Edit Recipe', 'Rezept bearbeiten') : t('Create New Recipe', 'Neues Rezept erstellen')}</h2>
        {!recipeId && (
          <div className="editor-header__actions">
            <Button size="sm" onClick={() => setShowImportModal(true)}>
              🔗 {t('Import from URL', 'Von URL importieren')}
            </Button>
            <Button size="sm" onClick={() => setShowPhotoImport(true)}>
              📷 {t('Import from Photo', 'Aus Foto importieren')}
            </Button>
          </div>
        )}
      </div>
      {!recipeId && importOrigin && (
        <div className="import-check">
          <p className="import-check__hint">
            {`${t('Imported from', 'Importiert von')} ${importOrigin.url}. ${t('Check the fields below against the page. If the extraction is wrong, report it here.', 'Prüfe die Felder unten mit der Seite. Ist die Extraktion falsch, melde sie hier.')}`}
          </p>
          <ImportReportForm
            key={importOrigin.attempt}
            report={{ url: importOrigin.url, httpStatus: importOrigin.httpStatus, importResult: importOrigin.recipe }}
          />
        </div>
      )}

      <UrlImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      {showPhotoImport && (
        <PhotoImportModal onClose={() => setShowPhotoImport(false)} onApply={handlePhotoImport} />
      )}

      {error && <div className="alert alert--error">{error}</div>}

      <form className="editor-form" onSubmit={handleSave}>
        <Field label={t('Recipe Title *', 'Rezepttitel *')} htmlFor="ed-title">
          <Input
            id="ed-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('e.g. Fluffy Vegan Pancakes', 'z.B. Vegane Pfannkuchen')}
            required
          />
        </Field>

        <Field label={t('Description / Summary', 'Beschreibung / Zusammenfassung')} htmlFor="ed-description">
          <textarea
            id="ed-description"
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Brief notes about this recipe...', 'Kurze Beschreibung des Rezepts...')}
          />
        </Field>

        <div className="field-row">
          <Field label={t('Base Servings', 'Basisportionen')} htmlFor="ed-servings">
            <Input
              id="ed-servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
            />
          </Field>

          <Field label={t('Dietary Trait Override', 'Ernährungseigenschaft überschreiben')} htmlFor="ed-override">
            <select
              id="ed-override"
              className="input"
              value={overrideTrait}
              onChange={(e) => setOverrideTrait(e.target.value as DietaryTrait | '')}
            >
              <option value="">{t('Automatic (Inferred)', 'Automatisch (Berechnet)')}</option>
              <option value="VEGAN">VEGAN</option>
              <option value="VEGETARIAN">VEGETARIAN</option>
              <option value="OMNIVORE">OMNIVORE</option>
            </select>
          </Field>
        </div>

        {/* Live Dietary Trait Preview Banner */}
        <div className="live-trait">
          <div>
            <strong>{t('Live Dietary Trait:', 'Live Ernährungs-Status:')}</strong>{' '}
            <span className={`trait-badge ${traitBadgeClass}`}>
              {liveEffective} {overrideTrait ? '⚡' : ''}
            </span>
          </div>
          <span className="live-trait__note">
            {overrideTrait
              ? t(`Inferred trait is ${liveCalculated} (Overridden to ${overrideTrait})`, `Berechnet: ${liveCalculated} (Überschrieben auf ${overrideTrait})`)
              : t(`Inferred automatically from ingredient traits`, `Automatisch aus Zutaten-Eigenschaften berechnet`)}
          </span>
        </div>

        {/* Step Manager */}
        <div className="editor-header">
          <h3>📋 {t('Step-by-Step Instructions', 'Schritt-für-Schritt Anleitung')}</h3>
          <Button size="sm" onClick={handleAddStep}>
            + {t('Add Step', 'Schritt hinzufügen')}
          </Button>
        </div>

        {steps.map((step, sIdx) => (
          <Panel key={sIdx} tone="raised" padding="md" className="editor-step">
            <div className="editor-header">
              <strong className="editor-step__number">
                {t('Step', 'Schritt')} {sIdx + 1}
              </strong>
              {steps.length > 1 && (
                <Button variant="danger" size="sm" onClick={() => handleRemoveStep(sIdx)}>
                  ✕ {t('Remove Step', 'Schritt entfernen')}
                </Button>
              )}
            </div>

            {step.imageUrl && (
              <div className="editor-step__image">
                <img src={step.imageUrl} alt={t('Step photo', 'Schrittfoto')} />
                <Button size="sm" onClick={() => handleStepImageChange(sIdx, null)}>
                  {t('Remove photo', 'Foto entfernen')}
                </Button>
              </div>
            )}

            <Field label={t('Instruction', 'Anweisung')} htmlFor={`ed-step-${sIdx}-instruction`}>
              <textarea
                id={`ed-step-${sIdx}-instruction`}
                className="input"
                rows={2}
                value={step.instruction}
                onChange={(e) => handleStepInstructionChange(sIdx, e.target.value)}
                placeholder={t('e.g. Sift flour and whisk in oat milk until smooth...', 'z.B. Mehl sieben und Hafermilch einrühren...')}
              />
            </Field>

            <div className="field-row">
              <Field label={t('Timer (Seconds)', 'Timer (Sekunden)')} htmlFor={`ed-step-${sIdx}-timer`}>
                <Input
                  id={`ed-step-${sIdx}-timer`}
                  type="number"
                  className="editor-step__timer"
                  placeholder="e.g. 180"
                  value={step.timerSec ?? ''}
                  onChange={(e) => handleStepTimerChange(sIdx, e.target.value)}
                />
              </Field>
            </div>

            {/* Step Ingredients */}
            <Panel tone="inset" padding="sm" className="editor-step__ingredients">
              <div className="editor-header">
                <span className="editor-step__ingredients-title">
                  🥗 {t('Ingredients for this step', 'Zutaten für diesen Schritt')}
                </span>
                <Button size="sm" onClick={() => handleAddIngredient(sIdx)}>
                  + {t('Add Ingredient', 'Zutat hinzufügen')}
                </Button>
              </div>

              {step.ingredients.length === 0 ? (
                <p className="editor-step__empty">
                  {t('No ingredients added to this step.', 'Keine Zutaten für diesen Schritt.')}
                </p>
              ) : (
                step.ingredients.map((ing, iIdx) => (
                  <div key={iIdx} className="ingredient-row">
                    <select
                      className="input ingredient-row__ingredient"
                      aria-label={t('Ingredient', 'Zutat')}
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
                      aria-label={t('Amount', 'Menge')}
                      className="input ingredient-row__amount"
                      value={ing.amount}
                      onChange={(e) => handleIngredientChange(sIdx, iIdx, 'amount', parseFloat(e.target.value) || 0)}
                    />

                    <select
                      className="input ingredient-row__unit"
                      aria-label={t('Unit', 'Einheit')}
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
                      className="input ingredient-row__note"
                      aria-label={t('Preparation note', 'Zubereitungshinweis')}
                      placeholder={t('Note (e.g. melted)', 'Hinweis (z.B. geschmolzen)')}
                      value={ing.preparationNote || ''}
                      onChange={(e) => handleIngredientChange(sIdx, iIdx, 'preparationNote', e.target.value)}
                    />

                    <Button variant="danger" size="sm" aria-label={t('Remove ingredient', 'Zutat entfernen')} onClick={() => handleRemoveIngredient(sIdx, iIdx)}>
                      ✕
                    </Button>
                  </div>
                ))
              )}
            </Panel>
          </Panel>
        ))}

        <div className="editor-actions">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? t('Saving...', 'Speichere...') : t('Save Recipe', 'Rezept speichern')}
          </Button>
          <Button onClick={onCancel} disabled={saving}>
            {t('Cancel', 'Abbrechen')}
          </Button>
        </div>
      </form>
    </>
  );
}
