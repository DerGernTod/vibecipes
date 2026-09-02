import React, { useEffect, useState } from 'react';
import type { RecipeDto, IngredientDto, DietaryTrait, CreateRecipeStepInput } from '../../shared/types.ts';
import { calculateRecipeDietaryTrait } from '../../domain/dietary.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function VariantA_Studio() {
  const { t, lang } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [catalog, setCatalog] = useState<IngredientDto[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDto | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [cookModeStepIndex, setCookModeStepIndex] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState('Classic Guacamole & Chips');
  const [description, setDescription] = useState('Fresh avocado dip with lime juice, garlic, and fresh cilantro.');
  const [servings, setServings] = useState(4);
  const [overrideTrait, setOverrideTrait] = useState<DietaryTrait | ''>('');
  const [steps, setSteps] = useState<CreateRecipeStepInput[]>([
    {
      instruction: 'Halve avocados, remove pit, and scoop flesh into a large bowl.',
      timerSec: 120,
      ingredients: [{ canonicalIngredientId: 'ing_avocado', amount: 3, unit: 'piece', preparationNote: 'ripe' }],
    },
    {
      instruction: 'Add lime juice, sea salt, and minced garlic; mash with a fork to desired texture.',
      timerSec: 180,
      ingredients: [
        { canonicalIngredientId: 'ing_lime', amount: 1, unit: 'piece', preparationNote: 'juiced' },
        { canonicalIngredientId: 'ing_garlic', amount: 2, unit: 'piece', preparationNote: 'minced' },
        { canonicalIngredientId: 'ing_salt', amount: 5, unit: 'g' },
      ],
    },
    {
      instruction: 'Fold in chopped cilantro and diced tomatoes. Serve with crispy tortilla chips.',
      timerSec: 60,
      ingredients: [
        { canonicalIngredientId: 'ing_cilantro', amount: 20, unit: 'g', preparationNote: 'finely chopped' },
        { canonicalIngredientId: 'ing_tomato', amount: 2, unit: 'piece', preparationNote: 'diced' },
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

  // Compute live dietary trait
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
    <div style={{ background: '#070a11', color: '#f8fafc', minHeight: 'calc(100vh - 120px)', borderRadius: '12px', padding: '1.5rem', border: '1px solid #1e293b' }}>
      {/* Top Studio Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            CULINARY STUDIO
          </span>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Recipe Authoring Canvas</h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Dietary Trait:</span>
            <span
              style={{
                fontWeight: 'bold',
                color: effectiveTrait === 'VEGAN' ? '#34d399' : effectiveTrait === 'VEGETARIAN' ? '#60a5fa' : '#fbbf24',
              }}
            >
              {effectiveTrait} {overrideTrait ? '⚡' : ''}
            </span>
          </div>

          <button
            onClick={() => setCookModeStepIndex(0)}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            ▶ Start Cook Mode
          </button>
        </div>
      </div>

      {/* Split Pane Studio Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Pane: Editor Control Desk */}
        <div style={{ background: '#0d1322', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#818cf8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚙️ Step & Ingredient Editor
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Recipe Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', background: '#161f36', border: '1px solid #334155', color: '#fff', padding: '0.6rem', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', background: '#161f36', border: '1px solid #334155', color: '#fff', padding: '0.6rem', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Manual Trait Override</label>
                <select
                  value={overrideTrait}
                  onChange={(e) => setOverrideTrait(e.target.value as any)}
                  style={{ width: '100%', background: '#161f36', border: '1px solid #334155', color: '#fff', padding: '0.6rem', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="">Auto ({calculatedTrait})</option>
                  <option value="VEGAN">VEGAN</option>
                  <option value="VEGETARIAN">VEGETARIAN</option>
                  <option value="OMNIVORE">OMNIVORE</option>
                </select>
              </div>
            </div>

            {/* Steps & Ingredients Desk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.5rem 0' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Procedural Steps ({steps.length})</span>
                <button
                  onClick={() => setSteps((prev) => [...prev, { instruction: '', timerSec: null, ingredients: [] }])}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  + Add Step
                </button>
              </div>

              {steps.map((step, sIdx) => (
                <div key={sIdx} style={{ background: '#161f36', border: '1px solid #2d3748', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '0.85rem' }}>Step {sIdx + 1}</span>
                    <button
                      onClick={() => setSteps((prev) => prev.filter((_, i) => i !== sIdx))}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={step.instruction}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSteps((prev) => prev.map((s, i) => (i === sIdx ? { ...s, instruction: val } : s)));
                    }}
                    style={{ width: '100%', background: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '0.5rem', borderRadius: '6px', boxSizing: 'border-box', fontSize: '0.85rem', marginBottom: '0.5rem' }}
                  />

                  {/* Step Ingredients List */}
                  <div style={{ background: '#0d1322', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ingredients</span>
                      <button
                        onClick={() =>
                          setSteps((prev) =>
                            prev.map((s, i) =>
                              i === sIdx
                                ? {
                                    ...s,
                                    ingredients: [
                                      ...s.ingredients,
                                      { canonicalIngredientId: catalog[0]?.id || 'ing_flour', amount: 100, unit: 'g' },
                                    ],
                                  }
                                : s
                            )
                          )
                        }
                        style={{ background: '#1e293b', color: '#a5b4fc', border: 'none', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        + Ingredient
                      </button>
                    </div>

                    {step.ingredients.map((ing, iIdx) => (
                      <div key={iIdx} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                        <select
                          value={ing.canonicalIngredientId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSteps((prev) =>
                              prev.map((s, i) =>
                                i === sIdx
                                  ? {
                                      ...s,
                                      ingredients: s.ingredients.map((ig, j) => (j === iIdx ? { ...ig, canonicalIngredientId: val } : ig)),
                                    }
                                  : s
                              )
                            );
                          }}
                          style={{ flex: 2, background: '#161f36', border: '1px solid #334155', color: '#fff', fontSize: '0.78rem', borderRadius: '4px', padding: '0.25rem' }}
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
                          style={{ width: '50px', background: '#161f36', border: '1px solid #334155', color: '#fff', fontSize: '0.78rem', borderRadius: '4px', padding: '0.25rem' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Live Render Studio Canvas */}
        <div style={{ background: '#0d1322', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#34d399', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🖥️ Live Output Canvas Preview
          </h3>

          <div style={{ background: '#161f36', border: '1px dashed #3b82f6', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 0.4rem 0', color: '#f8fafc' }}>{title || 'Untitled Recipe'}</h2>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>{description}</p>
              </div>
              <span
                style={{
                  background: effectiveTrait === 'VEGAN' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: effectiveTrait === 'VEGAN' ? '#34d399' : '#fbbf24',
                  border: '1px solid currentColor',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                }}
              >
                {effectiveTrait}
              </span>
            </div>

            <div style={{ marginTop: '1.25rem', background: '#0d1322', borderRadius: '8px', padding: '1rem', border: '1px solid #1e293b' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#818cf8', fontSize: '0.9rem' }}>📦 Aggregated Total Ingredients</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {steps
                  .flatMap((s) => s.ingredients)
                  .map((ing, idx) => {
                    const cat = catalog.find((c) => c.id === ing.canonicalIngredientId);
                    const name = cat ? (lang === 'de' ? cat.primaryNameDe : cat.primaryNameEn) : ing.canonicalIngredientId;
                    return (
                      <span key={idx} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <strong>{ing.amount} {ing.unit}</strong> {name}
                      </span>
                    );
                  })}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#f8fafc', fontSize: '0.9rem' }}>📋 Step-by-Step Canvas Rendering</h4>
              {steps.map((st, idx) => (
                <div key={idx} style={{ background: '#0d1322', borderLeft: '3px solid #6366f1', padding: '0.75rem 1rem', borderRadius: '0 6px 6px 0', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#a5b4fc', fontSize: '0.82rem', marginBottom: '0.25rem' }}>STEP {idx + 1}</div>
                  <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{st.instruction || 'No instruction entered yet.'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cook Mode Modal */}
      {cookModeStepIndex !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#0f172a', border: '2px solid #6366f1', borderRadius: '16px', maxWidth: '650px', width: '100%', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ background: '#6366f1', color: '#fff', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                COOK MODE — STEP {cookModeStepIndex + 1} OF {steps.length}
              </span>
              <button onClick={() => setCookModeStepIndex(null)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>
              {steps[cookModeStepIndex]?.instruction}
            </h1>

            {steps[cookModeStepIndex]?.ingredients.length > 0 && (
              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#a5b4fc', fontSize: '0.85rem' }}>NEEDED FOR THIS STEP:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {steps[cookModeStepIndex].ingredients.map((ing, iIdx) => {
                    const cat = catalog.find((c) => c.id === ing.canonicalIngredientId);
                    return (
                      <span key={iIdx} style={{ background: '#0f172a', border: '1px solid #3b82f6', color: '#60a5fa', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold' }}>
                        {ing.amount} {ing.unit} {cat ? (lang === 'de' ? cat.primaryNameDe : cat.primaryNameEn) : ing.canonicalIngredientId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button
                disabled={cookModeStepIndex === 0}
                onClick={() => setCookModeStepIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                style={{ background: cookModeStepIndex === 0 ? '#334155' : '#475569', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: cookModeStepIndex === 0 ? 'not-allowed' : 'pointer' }}
              >
                ← Previous Step
              </button>
              <button
                onClick={() => {
                  if (cookModeStepIndex < steps.length - 1) {
                    setCookModeStepIndex((prev) => (prev !== null ? prev + 1 : prev));
                  } else {
                    setCookModeStepIndex(null);
                    alert('🎉 Recipe completed! Bon appétit!');
                  }
                }}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {cookModeStepIndex === steps.length - 1 ? 'Finish Cooking 🎉' : 'Next Step →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
