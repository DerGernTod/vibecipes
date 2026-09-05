import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function WallVariantW3_Editorial() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);

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

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Top Section Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            WALL VARIANT W3 • EDITORIAL CAROUSEL & COMPACT WALL
          </span>
          <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>Trending Recipes Reel</h2>
        </div>
      </div>

      {/* Horizontal Reel Carousel */}
      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
        {recipes.slice(0, 4).map((r) => (
          <div
            key={r.id}
            onClick={() => alert(`Selected Recipe: ${r.title}`)}
            style={{
              minWidth: '280px',
              height: '160px',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '1rem',
              boxSizing: 'border-box',
            }}
          >
            <img src={r.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'} alt={r.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(9,13,22,0.9), transparent)' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{ background: '#f59e0b', color: '#000', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {r.effectiveTrait}
              </span>
              <h4 style={{ margin: '0.3rem 0 0 0', color: '#fff', fontSize: '0.98rem' }}>{r.title}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* 4-Column Compact Photo Grid */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#a1a1aa' }}>All Recipes ({recipes.length})</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {/* Slot 1: Large + Creation Tile */}
        <div
          onClick={() => alert('Create New Recipe Clicked!')}
          style={{
            background: '#090d16',
            border: '2px dashed #f59e0b',
            borderRadius: '16px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            +
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Add Recipe</span>
        </div>

        {recipes.map((r) => (
          <div
            key={r.id}
            onClick={() => alert(`Selected Recipe: ${r.title}`)}
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#1e293b';
            }}
          >
            <div style={{ width: '100%', height: '140px', position: 'relative', overflow: 'hidden' }}>
              <img src={r.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.75)', color: '#f59e0b', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {r.effectiveTrait}
              </div>
            </div>

            <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.92rem', fontWeight: 600 }}>{r.title}</h4>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span>🍽️ {r.servings} Servings</span>
                <span>📝 {r.steps.length} Steps</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
