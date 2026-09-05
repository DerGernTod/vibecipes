import React, { useEffect, useState } from 'react';
import type { RecipeDto, IngredientDto, DietaryTrait, CreateRecipeStepInput } from '../../shared/types.ts';
import { calculateRecipeDietaryTrait } from '../../domain/dietary.ts';
import { getValidUnitsForIngredient, getDefaultUnitForIngredient } from './unitHelper.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function VariantA1_CleanCard() {
  const { t, lang } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [catalog, setCatalog] = useState<IngredientDto[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');

  // Form State
  const [title, setTitle] = useState('Fresh Avocado Guacamole');
  const [description, setDescription] = useState('Classic chunky guacamole with fresh lime and garlic.');
  const [servings, setServings] = useState(4);
  const [overrideTrait, setOverrideTrait] = useState<DietaryTrait | ''>('');
  const [steps, setSteps] = useState<CreateRecipeStepInput[]>([
    {
      instruction: 'Halve avocados, remove pits, and mash coarsely in a bowl.',
      timerSec: null,
      ingredients: [{ canonicalIngredientId: 'ing_avocado', amount: 3, unit: 'piece' }],
    },
    {
      instruction: 'Season with fine salt and fresh lime juice.',
      timerSec: null,
      ingredients: [
        { canonicalIngredientId: 'ing_salt', amount: 5, unit: 'g' },
        { canonicalIngredientId: 'ing_lime', amount: 1, unit: 'piece', preparationNote: 'juiced' },
      ],
    },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const [resR, resI] = await Promise.all([fetch('/api/recipes'), fetch('/api/ingredients')]);
        if (resR.ok) setRecipes(await resR.json());
        if (resI.ok) setCatalog(await resI.json());
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  // Compute live trait
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

  const handleIngredientSelect = (stepIdx: number, ingIdx: number, catId: string) => {
    const selectedCat = catalog.find((c) => c.id === catId);
    const validUnits = getValidUnitsForIngredient(selectedCat);
    const defaultUnit = validUnits[0];

    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx
          ? {
              ...s,
              ingredients: s.ingredients.map((ig, j) =>
                j === ingIdx ? { ...ig, canonicalIngredientId: catId, unit: defaultUnit } : ig
              ),
            }
          : s
      )
    );
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Banner Bar */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            PROTOTYPE A1 • CLEAN CARD FLOW
          </span>
          <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem' }}>Recipe Studio & Trait Engine</h2>
        </div>

        <button
          onClick={() => setActiveView(activeView === 'list' ? 'editor' : 'list')}
          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
        >
          {activeView === 'list' ? '+ Create New Recipe' : '← Back to Recipe Catalog'}
        </button>
      </div>

      {activeView === 'editor' ? (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Recipe Editor</h3>
              <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>Smart unit detection per ingredient (e.g. 3 piece Avocado vs 5g Salt).</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ background: effectiveTrait === 'VEGAN' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: effectiveTrait === 'VEGAN' ? '#34d399' : '#fbbf24', border: '1px solid currentColor', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {effectiveTrait} {overrideTrait ? '⚡' : ''}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Recipe Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', background: '#090d16', border: '1px solid #334155', color: '#fff', padding: '0.7rem', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Base Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', background: '#090d16', border: '1px solid #334155', color: '#fff', padding: '0.7rem', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Manual Trait Override</label>
                <select
                  value={overrideTrait}
                  onChange={(e) => setOverrideTrait(e.target.value as any)}
                  style={{ width: '100%', background: '#090d16', border: '1px solid #334155', color: '#fff', padding: '0.7rem', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                >
                  <option value="">Automatic ({calculatedTrait})</option>
                  <option value="VEGAN">VEGAN</option>
                  <option value="VEGETARIAN">VEGETARIAN</option>
                  <option value="OMNIVORE">OMNIVORE</option>
                </select>
              </div>
            </div>

            {/* Steps Section */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#a5b4fc' }}>Step-by-Step Instructions</h4>
                <button
                  onClick={() => setSteps((prev) => [...prev, { instruction: '', timerSec: null, ingredients: [] }])}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Step
                </button>
              </div>

              {steps.map((step, sIdx) => (
                <div key={sIdx} style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.9rem' }}>Step {sIdx + 1}</span>
                    {steps.length > 1 && (
                      <button
                        onClick={() => setSteps((prev) => prev.filter((_, i) => i !== sIdx))}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Remove Step
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={step.instruction}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSteps((prev) => prev.map((s, i) => (i === sIdx ? { ...s, instruction: val } : s)));
                    }}
                    placeholder="Enter step instruction..."
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: '0.75rem' }}
                  />

                  {/* Smart Step Ingredient Manager */}
                  <div style={{ background: '#1e293b', padding: '0.85rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>Smart Step Ingredients</span>
                      <button
                        onClick={() =>
                          setSteps((prev) =>
                            prev.map((s, i) =>
                              i === sIdx
                                ? {
                                    ...s,
                                    ingredients: [
                                      ...s.ingredients,
                                      { canonicalIngredientId: catalog[0]?.id || 'ing_avocado', amount: 1, unit: 'piece' },
                                    ],
                                  }
                                : s
                            )
                          )
                        }
                        style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        + Add Ingredient
                      </button>
                    </div>

                    {step.ingredients.map((ing, iIdx) => {
                      const currentCat = catalog.find((c) => c.id === ing.canonicalIngredientId);
                      const validUnits = getValidUnitsForIngredient(currentCat);

                      return (
                        <div key={iIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <select
                            value={ing.canonicalIngredientId}
                            onChange={(e) => handleIngredientSelect(sIdx, iIdx, e.target.value)}
                            style={{ flex: 2, background: '#090d16', border: '1px solid #334155', color: '#fff', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem' }}
                          >
                            {catalog.map((c) => (
                              <option key={c.id} value={c.id}>
                                {lang === 'de' ? c.primaryNameDe : c.primaryNameEn} ({c.defaultTrait})
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
                            style={{ width: '70px', background: '#090d16', border: '1px solid #334155', color: '#fff', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem' }}
                          />

                          {/* Context-aware Unit Selector */}
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
                            style={{ width: '90px', background: '#090d16', border: '1px solid #334155', color: '#34d399', fontWeight: 'bold', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem' }}
                          >
                            {validUnits.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() =>
                              setSteps((prev) =>
                                prev.map((s, i) => (i === sIdx ? { ...s, ingredients: s.ingredients.filter((_, j) => j !== iIdx) } : s))
                              )
                            }
                            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.35rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Recipe List Cards View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {recipes.map((r) => (
            <div key={r.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{r.title}</h3>
                <span style={{ background: r.effectiveTrait === 'VEGAN' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: r.effectiveTrait === 'VEGAN' ? '#34d399' : '#fbbf24', border: '1px solid currentColor', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {r.effectiveTrait}
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>{r.description || 'No description'}</p>

              <div style={{ background: '#090d16', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 'bold', marginBottom: '0.35rem' }}>AGGREGATED INGREDIENTS:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {r.aggregatedIngredients?.map((agg, idx) => (
                    <span key={idx} style={{ background: '#1e293b', color: '#cbd5e1', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                      {agg.totalAmount} {agg.unit} {agg.ingredient?.primaryNameEn}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
