import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function WallSearchS3_CategoryChips() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [selectedFacet, setSelectedFacet] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const facets = [
    { id: 'All', label: '✨ All Blueprints', icon: '✨' },
    { id: 'Breakfast', label: '🌅 Breakfast', icon: '🌅' },
    { id: 'Lunch', label: '🥪 Lunch', icon: '🥪' },
    { id: 'Dinner', label: '🍽️ Dinner', icon: '🍽️' },
    { id: 'Salads', label: '🥗 Salads', icon: '🥗' },
    { id: 'Desserts', label: '🍰 Desserts', icon: '🍰' },
  ];

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
    if (selectedFacet !== 'All') {
      const f = selectedFacet.toLowerCase();
      const titleLow = r.title.toLowerCase();
      if (f === 'breakfast' && !titleLow.includes('pancake') && !titleLow.includes('toast')) return false;
      if (f === 'lunch' && !titleLow.includes('salad') && !titleLow.includes('toast')) return false;
      if (f === 'dinner' && !titleLow.includes('risotto') && !titleLow.includes('pizza') && !titleLow.includes('ramen')) return false;
      if (f === 'salads' && !titleLow.includes('salad')) return false;
    }
    if (searchQuery.trim().length > 0) {
      return r.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Category Visual Facets Ribbon */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#a855f7' }}>Explore Recipe Categories</h3>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Showing <strong>{filteredRecipes.length}</strong> recipes
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {facets.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFacet(f.id)}
              style={{
                background: selectedFacet === f.id ? 'linear-gradient(135deg, #a855f7, #6366f1)' : '#090d16',
                color: selectedFacet === f.id ? '#ffffff' : '#94a3b8',
                border: selectedFacet === f.id ? 'none' : '1px solid #1e293b',
                borderRadius: '12px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: selectedFacet === f.id ? '0 4px 15px rgba(168,85,247,0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry Grid */}
      <div style={{ columnCount: 3, columnGap: '1.25rem' }}>
        {/* Full-Sized + Creation Tile */}
        <div
          onClick={() => alert('Create New Recipe Clicked!')}
          style={{
            breakInside: 'avoid',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.12) 100%)',
            border: '2px dashed #a855f7',
            borderRadius: '20px',
            minHeight: '340px', // MATCHING FULL SIZE
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '2rem',
            boxSizing: 'border-box',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(168, 85, 247, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#a855f7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.2rem', fontWeight: 300, marginBottom: '1.25rem' }}>
            +
          </div>
          <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', color: '#fff' }}>Create New Recipe</h3>
          <p style={{ margin: 0, color: '#c084fc', fontSize: '0.88rem' }}>Click to create recipe</p>
        </div>

        {filteredRecipes.map((r, idx) => (
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
              transition: 'transform 0.2s ease',
            }}
          >
            <div style={{ width: '100%', height: '260px', position: 'relative', overflow: 'hidden' }}>
              <img src={r.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(9,13,22,0.8)', color: '#34d399', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {r.effectiveTrait}
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem' }}>{r.title}</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{r.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
