import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function WallSearchS1_PillBar() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTrait, setSelectedTrait] = useState<string>('All');

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Salads', 'Desserts', 'Quick & Easy'];
  const traits = ['All', 'VEGAN', 'VEGETARIAN', 'OMNIVORE'];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/recipes');
        if (res.ok) setRecipes(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const filteredRecipes = recipes.filter((r) => {
    // Trait filter
    if (selectedTrait !== 'All' && r.effectiveTrait !== selectedTrait) {
      return false;
    }
    // Category simulated filter
    if (selectedCategory !== 'All') {
      const catLow = selectedCategory.toLowerCase();
      const titleLow = r.title.toLowerCase();
      const descLow = (r.description || '').toLowerCase();
      if (catLow === 'breakfast' && !titleLow.includes('pancake') && !titleLow.includes('toast') && !descLow.includes('morning')) return false;
      if (catLow === 'lunch' && !titleLow.includes('salad') && !titleLow.includes('toast') && !titleLow.includes('avocado')) return false;
      if (catLow === 'dinner' && !titleLow.includes('risotto') && !titleLow.includes('pizza') && !titleLow.includes('ramen')) return false;
      if (catLow === 'salads' && !titleLow.includes('salad')) return false;
    }
    // Search query filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchIng = r.aggregatedIngredients?.some(
        (i) => i.canonicalIngredientId.toLowerCase().includes(q) || (i.ingredient?.primaryNameEn || '').toLowerCase().includes(q)
      );
      return matchTitle || matchDesc || matchIng;
    }
    return true;
  });

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Search Header Bar */}
      <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by title, description, or ingredients (e.g. Avocado, Flour, Garlic)..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.8rem',
                background: '#161f36',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories & Dietary Trait Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, alignSelf: 'center', marginRight: '0.25rem' }}>Categories:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? '#6366f1' : '#1e293b',
                  color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, alignSelf: 'center', marginRight: '0.25rem' }}>Dietary:</span>
            {traits.map((tr) => (
              <button
                key={tr}
                onClick={() => setSelectedTrait(tr)}
                style={{
                  background: selectedTrait === tr ? (tr === 'VEGAN' ? '#10b981' : tr === 'VEGETARIAN' ? '#3b82f6' : tr === 'OMNIVORE' ? '#f59e0b' : '#6366f1') : '#1e293b',
                  color: selectedTrait === tr ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry Recipe Wall with Full-Size + Card */}
      <div style={{ columnCount: 3, columnGap: '1.25rem' }}>
        {/* Full-Sized + Creation Wall Card (Matching height and dimensions of recipe cards) */}
        <div
          onClick={() => alert('Create New Recipe Clicked!')}
          style={{
            breakInside: 'avoid',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.12) 100%)',
            border: '2px dashed #6366f1',
            borderRadius: '20px',
            minHeight: '340px', // FULL SIZE MATCHING REGULAR CARDS
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '2rem',
            boxSizing: 'border-box',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(99, 102, 241, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#6366f1',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.2rem',
              fontWeight: 300,
              marginBottom: '1.25rem',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.5)',
            }}
          >
            +
          </div>
          <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', color: '#fff', fontWeight: 600 }}>Create New Recipe</h3>
          <p style={{ margin: 0, color: '#a5b4fc', fontSize: '0.88rem', lineHeight: '1.4', maxWidth: '200px' }}>
            Click to author a fresh recipe with step ingredients
          </p>
        </div>

        {/* Filtered Recipe Cards */}
        {filteredRecipes.map((r, idx) => {
          const heights = ['240px', '300px', '220px', '280px', '340px'];
          const imgHeight = heights[idx % heights.length];

          return (
            <div
              key={r.id}
              onClick={() => alert(`Selected Recipe: ${r.title}`)}
              style={{
                breakInside: 'avoid',
                marginBottom: '1.25rem',
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '20px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: imgHeight, overflow: 'hidden' }}>
                <img
                  src={r.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'}
                  alt={r.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '0.85rem', right: '0.85rem' }}>
                  <span
                    style={{
                      background: 'rgba(9, 13, 22, 0.75)',
                      backdropFilter: 'blur(8px)',
                      color: r.effectiveTrait === 'VEGAN' ? '#34d399' : '#fbbf24',
                      border: '1px solid currentColor',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {r.effectiveTrait}
                  </span>
                </div>
              </div>

              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 600, lineHeight: '1.3' }}>{r.title}</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>{r.description}</p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.85rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>🍽️ {r.servings} Servings</span>
                  <span>📝 {r.steps.length} Steps</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
