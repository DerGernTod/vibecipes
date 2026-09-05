import React, { useEffect, useState } from 'react';
import type { RecipeDto, IngredientDto, DietaryTrait, CreateRecipeStepInput } from '../../shared/types.ts';
import { calculateRecipeDietaryTrait } from '../../domain/dietary.ts';
import { getValidUnitsForIngredient } from './unitHelper.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function VariantA3_ZenStudio() {
  const { t, lang } = useLanguage();
  const [catalog, setCatalog] = useState<IngredientDto[]>([]);
  const [title, setTitle] = useState('Chunky Avocado Dip');
  const [description, setDescription] = useState('Minimalist fresh guacamole recipe with 3 simple steps.');
  const [servings, setServings] = useState(4);
  const [overrideTrait, setOverrideTrait] = useState<DietaryTrait | ''>('');
  const [steps, setSteps] = useState<CreateRecipeStepInput[]>([
    {
      instruction: 'Scoop avocado into bowl.',
      timerSec: null,
      ingredients: [{ canonicalIngredientId: 'ing_avocado', amount: 3, unit: 'piece' }],
    },
    {
      instruction: 'Season with salt and squeeze fresh lime.',
      timerSec: null,
      ingredients: [
        { canonicalIngredientId: 'ing_salt', amount: 5, unit: 'g' },
        { canonicalIngredientId: 'ing_lime', amount: 1, unit: 'piece' },
      ],
    },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ingredients');
        if (res.ok) setCatalog(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  // Live trait calculation
  const allIngredients = steps.flatMap((s) =>
    s.ingredients.map((i) => {
      const cat = catalog.find((c) => c.id === i.canonicalIngredientId);
      return { defaultTrait: cat ? cat.defaultTrait : ('UNVERIFIED' as DietaryTrait) };
    })
  );
  const calculatedTrait = calculateRecipeDietaryTrait(allIngredients);
  const effectiveTrait = calculateRecipeDietaryTrait(
    allIngredients,
    overrideTrait ? (overrideTrait as DietaryTrait) : null
  );

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            PROTOTYPE A3 • ZEN STUDIO MINIMALIST
          </span>
          <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem' }}>Low-Density Authoring Studio</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Dietary Trait:</span>
          <span style={{ background: effectiveTrait === 'VEGAN' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: effectiveTrait === 'VEGAN' ? '#34d399' : '#fbbf24', border: '1px solid currentColor', padding: '0.25rem 0.65rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.82rem' }}>
            {effectiveTrait} {overrideTrait ? '⚡' : ''}
          </span>
        </div>
      </div>

      {/* Split Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Pane: Minimal Controls Desk */}
        <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#c084fc', fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ✏️ Recipe Authoring Inputs
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Override Trait</label>
                <select
                  value={overrideTrait}
                  onChange={(e) => setOverrideTrait(e.target.value as any)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                >
                  <option value="">Auto ({calculatedTrait})</option>
                  <option value="VEGAN">VEGAN</option>
                  <option value="VEGETARIAN">VEGETARIAN</option>
                  <option value="OMNIVORE">OMNIVORE</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Steps ({steps.length})</span>
                <button
                  onClick={() => setSteps((prev) => [...prev, { instruction: '', timerSec: null, ingredients: [] }])}
                  style={{ background: '#1e293b', color: '#c084fc', border: '1px solid #334155', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  + Add Step
                </button>
              </div>

              {steps.map((st, sIdx) => (
                <div key={sIdx} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 'bold', marginBottom: '0.25rem' }}>STEP {sIdx + 1}</div>
                  <input
                    type="text"
                    value={st.instruction}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSteps((prev) => prev.map((s, i) => (i === sIdx ? { ...s, instruction: val } : s)));
                    }}
                    placeholder="Step instruction..."
                    style={{ width: '100%', background: '#090d16', border: '1px solid #334155', color: '#fff', padding: '0.45rem', borderRadius: '4px', fontSize: '0.85rem', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                  />

                  {/* Step ingredients */}
                  <div>
                    {st.ingredients.map((ing, iIdx) => {
                      const cat = catalog.find((c) => c.id === ing.canonicalIngredientId);
                      const validUnits = getValidUnitsForIngredient(cat);
                      return (
                        <div key={iIdx} style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                          <select
                            value={ing.canonicalIngredientId}
                            onChange={(e) => {
                              const val = e.target.value;
                              const selectedCat = catalog.find((c) => c.id === val);
                              const vUnits = getValidUnitsForIngredient(selectedCat);
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === sIdx
                                    ? {
                                        ...s,
                                        ingredients: s.ingredients.map((ig, j) => (j === iIdx ? { ...ig, canonicalIngredientId: val, unit: vUnits[0] } : ig)),
                                      }
                                    : s
                                )
                              );
                            }}
                            style={{ flex: 2, background: '#090d16', border: '1px solid #334155', color: '#fff', fontSize: '0.78rem', borderRadius: '4px', padding: '0.25rem' }}
                          >
                            {catalog.map((c) => (
                              <option key={c.id} value={c.id}>
                                {lang === 'de' ? c.primaryNameDe : c.primaryNameEn}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            value={ing.amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === sIdx
                                    ? {
                                        ...s,
                                        ingredients: s.ingredients.map((ig, j) => (j === iIdx ? { ...ig, amount: val } : ig)),
                                      }
                                    : s
                                )
                              );
                            }}
                            style={{ width: '50px', background: '#090d16', border: '1px solid #334155', color: '#fff', fontSize: '0.78rem', borderRadius: '4px', padding: '0.25rem' }}
                          />

                          <select
                            value={ing.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === sIdx
                                    ? {
                                        ...s,
                                        ingredients: s.ingredients.map((ig, j) => (j === iIdx ? { ...ig, unit: val } : ig)),
                                      }
                                    : s
                                )
                              );
                            }}
                            style={{ width: '70px', background: '#090d16', border: '1px solid #334155', color: '#34d399', fontSize: '0.78rem', fontWeight: 'bold', borderRadius: '4px', padding: '0.25rem' }}
                          >
                            {validUnits.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Live Document Sheet Preview */}
        <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#34d399', fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            📄 Live Clean Document Preview
          </h4>

          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{title || 'Untitled Recipe'}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>{description}</p>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Total Aggregated Ingredients ({servings} Servings)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {steps
                  .flatMap((s) => s.ingredients)
                  .map((ing, idx) => {
                    const cat = catalog.find((c) => c.id === ing.canonicalIngredientId);
                    return (
                      <span key={idx} style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                        <strong style={{ color: '#34d399' }}>{ing.amount} {ing.unit}</strong> {cat ? cat.primaryNameEn : ing.canonicalIngredientId}
                      </span>
                    );
                  })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Procedural Steps
              </div>
              {steps.map((st, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', borderLeft: '2px solid #818cf8', paddingLeft: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>STEP {idx + 1}</div>
                  <div style={{ fontSize: '0.95rem', color: '#e2e8f0', margin: '0.2rem 0' }}>{st.instruction || 'Step instruction...'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
