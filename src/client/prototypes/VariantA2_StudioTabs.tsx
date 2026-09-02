import React, { useEffect, useState } from 'react';
import type { RecipeDto, IngredientDto, DietaryTrait } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function VariantA2_StudioTabs() {
  const { t, lang } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [catalog, setCatalog] = useState<IngredientDto[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDto | null>(null);
  const [subTab, setSubTab] = useState<'overview' | 'steps' | 'matrix'>('overview');

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
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            PROTOTYPE A2 • STUDIO TABS WORKSPACE
          </span>
          <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem' }}>Tabbed Recipe Explorer</h2>
        </div>

        {selectedRecipe && (
          <span style={{ background: selectedRecipe.effectiveTrait === 'VEGAN' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: selectedRecipe.effectiveTrait === 'VEGAN' ? '#34d399' : '#fbbf24', border: '1px solid currentColor', padding: '0.35rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.88rem' }}>
            {selectedRecipe.effectiveTrait} {selectedRecipe.overrideTrait ? '⚡ (OVERRIDDEN)' : ''}
          </span>
        )}
      </div>

      {/* Recipe Selector Dropdown */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {recipes.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRecipe(r)}
            style={{
              background: selectedRecipe?.id === r.id ? '#6366f1' : '#1e293b',
              color: selectedRecipe?.id === r.id ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {r.title}
          </button>
        ))}
      </div>

      {selectedRecipe ? (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem' }}>
          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setSubTab('overview')}
              style={{ background: 'transparent', border: 'none', color: subTab === 'overview' ? '#818cf8' : '#94a3b8', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', borderBottom: subTab === 'overview' ? '2px solid #818cf8' : 'none', paddingBottom: '0.4rem' }}
            >
              📊 Overview & Aggregated Totals
            </button>
            <button
              onClick={() => setSubTab('steps')}
              style={{ background: 'transparent', border: 'none', color: subTab === 'steps' ? '#818cf8' : '#94a3b8', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', borderBottom: subTab === 'steps' ? '2px solid #818cf8' : 'none', paddingBottom: '0.4rem' }}
            >
              📋 Step-by-Step Instructions ({selectedRecipe.steps.length})
            </button>
            <button
              onClick={() => setSubTab('matrix')}
              style={{ background: 'transparent', border: 'none', color: subTab === 'matrix' ? '#818cf8' : '#94a3b8', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', borderBottom: subTab === 'matrix' ? '2px solid #818cf8' : 'none', paddingBottom: '0.4rem' }}
            >
              🥦 Canonical Unit Matrix
            </button>
          </div>

          {/* Sub Tab 1: Overview */}
          {subTab === 'overview' && (
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedRecipe.title}</h2>
              <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>{selectedRecipe.description || 'No description provided.'}</p>

              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#a5b4fc' }}>📦 Total Aggregated Ingredient Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Ingredient</th>
                      <th style={{ padding: '0.5rem' }}>Total Amount</th>
                      <th style={{ padding: '0.5rem' }}>Unit Kind</th>
                      <th style={{ padding: '0.5rem' }}>Dietary Trait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecipe.aggregatedIngredients?.map((agg, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{agg.ingredient?.primaryNameEn || agg.canonicalIngredientId}</td>
                        <td style={{ padding: '0.6rem 0.5rem', color: '#34d399', fontWeight: 'bold' }}>
                          {agg.totalAmount} {agg.unit}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', color: '#94a3b8' }}>
                          {agg.unit === 'piece' ? 'Count / Discrete Item' : 'Mass / Volumetric'}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', background: agg.ingredient?.defaultTrait === 'VEGAN' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: agg.ingredient?.defaultTrait === 'VEGAN' ? '#34d399' : '#fbbf24', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            {agg.ingredient?.defaultTrait || 'VEGAN'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab 2: Step-by-Step Instructions */}
          {subTab === 'steps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedRecipe.steps.map((st, idx) => (
                <div key={idx} style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#818cf8', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    STEP {idx + 1}
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.5' }}>{st.instruction}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {st.ingredients.map((ing, iIdx) => (
                      <span key={iIdx} style={{ background: '#1e293b', border: '1px solid #334155', color: '#60a5fa', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                        {ing.amount} {ing.unit} {ing.ingredient?.primaryNameEn || ing.canonicalIngredientId}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub Tab 3: Canonical Unit Matrix */}
          {subTab === 'matrix' && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: '#a5b4fc' }}>Density & Unit Rules for Ingredients</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Shows how unit kinds are constrained: Count items (e.g. Avocado, Lime) restrict to `piece`, while liquids and powders support metric mass/volume.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {catalog.slice(0, 8).map((cat) => {
                  const isCount = cat.densityGPerMl === null;
                  return (
                    <div key={cat.id} style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{cat.primaryNameEn}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0' }}>{cat.primaryNameDe}</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        <span style={{ color: '#818cf8', fontWeight: 600 }}>Allowed Units: </span>
                        <code style={{ background: '#1e293b', padding: '0.1rem 0.3rem', borderRadius: '3px', color: '#34d399' }}>
                          {isCount ? 'piece' : 'g, ml, tbsp, tsp'}
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
