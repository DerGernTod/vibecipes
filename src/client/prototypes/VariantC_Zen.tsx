import React, { useEffect, useState } from 'react';
import type { RecipeDto, IngredientDto } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function VariantC_Zen() {
  const { t, lang } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [catalog, setCatalog] = useState<IngredientDto[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDto | null>(null);

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

  return (
    <div style={{ background: '#09090b', color: '#f4f4f5', minHeight: 'calc(100vh - 120px)', borderRadius: '12px', padding: '2rem', border: '1px solid #27272a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Zen Header & Command Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #27272a', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ background: '#10b981', color: '#000', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
            ZEN KITCHEN
          </span>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Minimalist Timeline & Focus Engine
          </h1>
        </div>

        {/* Command Shortcuts */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => alert('Zen Quick Add')}
            style={{ background: '#18181b', border: '1px solid #3f3f46', color: '#a1a1aa', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            <kbd style={{ background: '#27272a', padding: '0.1rem 0.3rem', borderRadius: '3px', color: '#fff', fontSize: '0.75rem' }}>N</kbd> New Recipe
          </button>
          <button
            onClick={() => alert('Zen Cook Mode')}
            style={{ background: '#10b981', color: '#09090b', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <kbd style={{ background: '#047857', color: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.75rem' }}>C</kbd> Start Focus Mode
          </button>
        </div>
      </div>

      {/* Selector Ribbon */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid #18181b' }}>
        {recipes.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRecipe(r)}
            style={{
              background: selectedRecipe?.id === r.id ? '#27272a' : '#18181b',
              border: selectedRecipe?.id === r.id ? '1px solid #10b981' : '1px solid #27272a',
              color: selectedRecipe?.id === r.id ? '#ffffff' : '#71717a',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.88rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{r.title}</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: r.effectiveTrait === 'VEGAN' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: r.effectiveTrait === 'VEGAN' ? '#34d399' : '#a1a1aa' }}>
              {r.effectiveTrait}
            </span>
          </button>
        ))}
      </div>

      {/* Main Focus Body */}
      {selectedRecipe ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header Card */}
          <div style={{ marginBottom: '2.5rem', borderLeft: '2px solid #10b981', paddingLeft: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {selectedRecipe.effectiveTrait} {selectedRecipe.overrideTrait ? '⚡ OVERRIDDEN' : 'INFERRED'}
              </span>
              <span style={{ color: '#52525b' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{selectedRecipe.servings} Servings</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0', fontWeight: 600, letterSpacing: '-0.03em' }}>{selectedRecipe.title}</h1>
            <p style={{ color: '#a1a1aa', fontSize: '1rem', margin: 0, lineHeight: '1.5' }}>{selectedRecipe.description}</p>
          </div>

          {/* Aggregated Quick Bar */}
          {selectedRecipe.aggregatedIngredients && selectedRecipe.aggregatedIngredients.length > 0 && (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                AGGREGATED INGREDIENTS MATRIX ({selectedRecipe.aggregatedIngredients.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedRecipe.aggregatedIngredients.map((agg, idx) => {
                  const name = lang === 'de' && agg.ingredient ? agg.ingredient.primaryNameDe : (agg.ingredient?.primaryNameEn || agg.canonicalIngredientId);
                  return (
                    <span key={idx} style={{ background: '#09090b', border: '1px solid #27272a', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#e4e4e7' }}>
                      <strong style={{ color: '#10b981' }}>{agg.totalAmount} {agg.unit}</strong> {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline Nodes */}
          <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px dashed #27272a' }}>
            {selectedRecipe.steps.map((step, idx) => (
              <div key={idx} style={{ position: 'relative', marginBottom: '2.5rem' }}>
                {/* Node Bullet */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-2.5rem',
                    top: '0',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '4px solid #09090b',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em' }}>
                    NODE 0{idx + 1}
                  </span>
                  {step.timerSec && (
                    <span style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                      ⏱️ {step.timerSec}s
                    </span>
                  )}
                </div>

                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '1.25rem' }}>
                  <p style={{ fontSize: '1.05rem', lineHeight: '1.6', margin: '0 0 1rem 0', color: '#f4f4f5' }}>{step.instruction}</p>

                  {/* Inline Ingredient Badges */}
                  {step.ingredients.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid #27272a', paddingTop: '0.75rem' }}>
                      {step.ingredients.map((ing, iIdx) => {
                        const name = lang === 'de' && ing.ingredient ? ing.ingredient.primaryNameDe : (ing.ingredient?.primaryNameEn || ing.canonicalIngredientId);
                        return (
                          <span key={iIdx} style={{ background: '#09090b', border: '1px solid #3f3f46', color: '#34d399', padding: '0.25rem 0.6rem', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {ing.amount} {ing.unit} {name} {ing.preparationNote ? `(${ing.preparationNote})` : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ color: '#71717a' }}>No recipe selected.</p>
      )}
    </div>
  );
}
