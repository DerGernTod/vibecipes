import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function WallVariantW2_Bento() {
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

  const heroRecipe = recipes[0];
  const otherRecipes = recipes.slice(1);

  return (
    <div style={{ color: '#f8fafc' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            WALL VARIANT W2 • BENTO BOX ASYMMETRIC GRID
          </span>
          <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>Bento Culinary Wall</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {/* Slot 1: Large + Creation Tile */}
        <div
          onClick={() => alert('Create New Recipe Clicked!')}
          style={{
            background: '#090d16',
            border: '2px dashed #34d399',
            borderRadius: '24px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.borderColor = '#10b981';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = '#34d399';
          }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#34d399', color: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            +
          </div>
          <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem' }}>Add Recipe</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>Author new recipe</p>
        </div>

        {/* Slot 2 & 3 Span 2x2: Featured Hero Recipe */}
        {heroRecipe && (
          <div
            onClick={() => alert(`Selected Featured Recipe: ${heroRecipe.title}`)}
            style={{
              gridColumn: 'span 2',
              gridRow: 'span 2',
              background: '#090d16',
              border: '1px solid #334155',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: '420px',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)';
              e.currentTarget.style.borderColor = '#34d399';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = '#334155';
            }}
          >
            <img
              src={heroRecipe.imageUrl || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80'}
              alt={heroRecipe.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(9,13,22,0.95) 0%, rgba(9,13,22,0.2) 60%, transparent 100%)' }} />

            <div style={{ position: 'relative', padding: '2rem', zIndex: 2 }}>
              <span style={{ background: '#34d399', color: '#090d16', fontWeight: 900, padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                FEATURED BLUEPRINT • {heroRecipe.effectiveTrait}
              </span>
              <h1 style={{ fontSize: '2rem', margin: '0.75rem 0 0.5rem 0', color: '#fff' }}>{heroRecipe.title}</h1>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0, maxWidth: '90%' }}>{heroRecipe.description}</p>
            </div>
          </div>
        )}

        {/* Other Bento Tiles */}
        {otherRecipes.map((r) => (
          <div
            key={r.id}
            onClick={() => alert(`Selected Recipe: ${r.title}`)}
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '24px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#1e293b';
            }}
          >
            <div style={{ width: '100%', height: '160px', position: 'relative', overflow: 'hidden' }}>
              <img src={r.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'rgba(9,13,22,0.8)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {r.effectiveTrait}
              </div>
            </div>
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem' }}>{r.title}</h4>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.75rem' }}>
                🍽️ {r.servings} Servings • 📝 {r.steps.length} Steps
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
