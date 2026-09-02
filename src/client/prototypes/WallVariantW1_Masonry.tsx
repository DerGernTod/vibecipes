import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function WallVariantW1_Masonry() {
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
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            WALL VARIANT W1 • PINTEREST STAGGERED MASONRY
          </span>
          <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>Visual Inspiration Board</h2>
        </div>
      </div>

      <div style={{ columnCount: 3, columnGap: '1.25rem' }}>
        {/* First Wall Entry: Large + Creation Tile */}
        <div
          onClick={() => alert('Create New Recipe Clicked!')}
          style={{
            breakInside: 'avoid',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '2px dashed #6366f1',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#6366f1',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 300,
              marginBottom: '1rem',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.5)',
            }}
          >
            +
          </div>
          <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.2rem', color: '#fff' }}>Add New Recipe</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Click to author a new culinary blueprint</p>
        </div>

        {/* Masonry Recipe Cards with Dynamic Heights */}
        {recipes.map((r, idx) => {
          // Vary image heights to create authentic staggered masonry feel
          const heights = ['240px', '320px', '220px', '280px', '350px'];
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
