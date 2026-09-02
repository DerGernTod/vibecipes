import React, { useEffect, useState } from 'react';
import type { RecipeDto, IngredientDto, DietaryTrait } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function VariantB_Cookbook() {
  const { t, lang } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [catalog, setCatalog] = useState<IngredientDto[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDto | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const [resR, resI] = await Promise.all([fetch('/api/recipes'), fetch('/api/ingredients')]);
        if (resR.ok) {
          const list: RecipeDto[] = await resR.json();
          setRecipes(list);
          if (list.length > 0) setSelectedRecipe(list[0]);
        }
        if (resI.ok) setCatalog(await resI.json());
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const toggleCheck = (key: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalAggregated = selectedRecipe?.aggregatedIngredients || [];
  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;
  const progressPct = totalAggregated.length > 0 ? Math.round((checkedCount / totalAggregated.length) * 100) : 0;

  return (
    <div style={{ background: '#120f0d', color: '#fef3c7', minHeight: 'calc(100vh - 120px)', borderRadius: '12px', padding: '1.75rem', border: '1px solid #78350f', fontFamily: 'Georgia, serif' }}>
      {/* Magazine Hero Top Banner */}
      <div style={{ borderBottom: '2px solid #b45309', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'system-ui', fontSize: '0.75rem', letterSpacing: '0.15em', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 'bold' }}>
            EDITORIAL MAGAZINE EDITION
          </span>
          <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '2rem', color: '#fef3c7', fontWeight: 'normal' }}>
            The Gourmet Vibecipe Collection
          </h1>
        </div>
        <button
          onClick={() => alert('Drawer Quick-Add Editor Launched!')}
          style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '25px', fontFamily: 'system-ui', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)' }}
        >
          + Draft New Recipe
        </button>
      </div>

      {/* Main Magazine Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        {/* Left Column: Editorial Index Cards */}
        <div style={{ borderRight: '1px solid #451a03', paddingRight: '1.25rem' }}>
          <h3 style={{ fontFamily: 'system-ui', fontSize: '0.85rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            TABLE OF CONTENTS ({recipes.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recipes.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedRecipe(r);
                  setCheckedIngredients({});
                }}
                style={{
                  background: selectedRecipe?.id === r.id ? '#451a03' : '#1c1917',
                  border: '1px solid #78350f',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#fef3c7' }}>{r.title}</h4>
                  <span style={{ fontFamily: 'system-ui', fontSize: '0.65rem', background: '#d97706', color: '#000', fontWeight: 'bold', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    {r.effectiveTrait}
                  </span>
                </div>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#d97706', fontFamily: 'system-ui' }}>
                  🍽️ {r.servings} Servings • {r.steps.length} Steps
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Hero Recipe Article Display */}
        {selectedRecipe ? (
          <div>
            {/* Recipe Hero Card Header */}
            <div style={{ background: 'linear-gradient(180deg, #291507 0%, #1c1917 100%)', border: '1px solid #92400e', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontFamily: 'system-ui', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                    DIETARY PROFILE: {selectedRecipe.effectiveTrait} {selectedRecipe.overrideTrait ? '⚡ (OVERRIDDEN)' : ''}
                  </span>
                  <h1 style={{ margin: '0.75rem 0 0.5rem 0', fontSize: '2.2rem', color: '#fffdf5' }}>{selectedRecipe.title}</h1>
                  <p style={{ margin: 0, fontSize: '1.05rem', color: '#fde68a', fontStyle: 'italic', lineHeight: '1.5' }}>
                    "{selectedRecipe.description || 'A hand-crafted gourmet recipe.'}"
                  </p>
                </div>
                <div style={{ fontFamily: 'system-ui', textAlign: 'right', background: 'rgba(0,0,0,0.4)', padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #78350f' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>{selectedRecipe.servings} PORTIONS</div>
                  <div style={{ fontSize: '0.75rem', color: '#d97706' }}>Base Servings</div>
                </div>
              </div>
            </div>

            {/* Interactive Shopping Checklist Box */}
            <div style={{ background: '#1c1917', border: '1px solid #b45309', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontFamily: 'system-ui', color: '#f59e0b', fontSize: '1.1rem' }}>
                  🛒 Interactive Pantry & Prep Checklist
                </h3>
                <span style={{ fontFamily: 'system-ui', fontSize: '0.85rem', color: '#fef3c7', fontWeight: 'bold' }}>
                  {checkedCount} of {totalAggregated.length} collected ({progressPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: '#451a03', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #10b981)', transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontFamily: 'system-ui' }}>
                {totalAggregated.map((agg, idx) => {
                  const key = `${agg.canonicalIngredientId}_${agg.unit}`;
                  const isChecked = !!checkedIngredients[key];
                  const ingName = lang === 'de' && agg.ingredient ? agg.ingredient.primaryNameDe : (agg.ingredient?.primaryNameEn || agg.canonicalIngredientId);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: isChecked ? '#291507' : '#0c0a09',
                        border: isChecked ? '1px solid #10b981' : '1px solid #451a03',
                        padding: '0.6rem 0.9rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        color: isChecked ? '#9ca3af' : '#fef3c7',
                      }}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ cursor: 'pointer' }} />
                      <span>
                        <strong>{agg.totalAmount} {agg.unit}</strong> {ingName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preparation Steps Articles */}
            <h3 style={{ fontFamily: 'system-ui', color: '#f59e0b', fontSize: '1.1rem', marginBottom: '1rem' }}>
              📖 Step-by-Step Culinary Walkthrough
            </h3>

            {selectedRecipe.steps.map((step, idx) => (
              <div key={idx} style={{ background: '#1c1917', border: '1px solid #451a03', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontFamily: 'system-ui' }}>
                  <span style={{ background: '#b45309', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    STEP {idx + 1}
                  </span>
                  {step.timerSec && (
                    <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      ⏱️ {step.timerSec}s
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '1.05rem', lineHeight: '1.6', margin: '0.5rem 0' }}>{step.instruction}</p>

                {step.ingredients.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem', fontFamily: 'system-ui' }}>
                    {step.ingredients.map((ing, iIdx) => {
                      const name = lang === 'de' && ing.ingredient ? ing.ingredient.primaryNameDe : (ing.ingredient?.primaryNameEn || ing.canonicalIngredientId);
                      return (
                        <span key={iIdx} style={{ background: '#451a03', color: '#fde68a', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                          • {ing.amount} {ing.unit} {name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#d97706' }}>Select a recipe from the table of contents.</p>
        )}
      </div>
    </div>
  );
}
