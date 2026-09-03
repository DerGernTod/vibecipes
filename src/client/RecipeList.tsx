import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../shared/types.ts';
import { useLanguage } from './LanguageContext.tsx';

interface RecipeListProps {
  onSelectRecipe: (id: string) => void;
  onEditRecipe: (id: string) => void;
  onCreateRecipe: () => void;
}

export function RecipeList({ onSelectRecipe, onEditRecipe, onCreateRecipe }: RecipeListProps) {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        setRecipes(data);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  const heroRecipe = recipes[0];
  const filtered = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
  const veganRecipes = filtered.filter(r => r.effectiveTrait === 'VEGAN');
  const omnivoreRecipes = filtered.filter(r => r.effectiveTrait !== 'VEGAN');

  if (loading) return <div style={{ padding: '8rem 4rem' }}>{t('Loading recipes...', 'Lade Rezepte...')}</div>;
  if (error) return <div style={{ padding: '8rem 4rem', color: '#ef4444' }}>Error: {error}</div>;

  return (
    <main style={{ paddingBottom: '4rem' }}>
      {/* Hero Section with Variant C Search */}
      {heroRecipe && !search && (
        <div style={{ height: '70vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroRecipe.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.5)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #020617 0%, transparent 100%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', maxWidth: '700px', padding: '0 2rem' }}>
            <h1 style={{ fontSize: '3.5rem', margin: '0 0 2rem 0', fontWeight: 800, textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>{t('Find your next meal.', 'Finde dein nächstes Gericht.')}</h1>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', padding: '0.5rem', borderRadius: '100px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <input 
                type="text" 
                placeholder={t('Search by title, ingredient, or craving...', 'Suche nach Titel, Zutat oder Verlangen...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '1rem 1.5rem', fontSize: '1.2rem', color: '#000', outline: 'none' }}
              />
              <button 
                style={{ background: '#e50914', color: '#fff', border: 'none', padding: '0 2.5rem', borderRadius: '100px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {t('Search', 'Suchen')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* When searching, show a more compact search bar at the top */}
      {search && (
         <div style={{ paddingTop: '8rem', paddingBottom: '2rem', paddingLeft: '4rem', paddingRight: '4rem', background: '#020617' }}>
           <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', maxWidth: '700px' }}>
              <input 
                type="text" 
                placeholder={t('Search by title, ingredient, or craving...', 'Suche nach Titel, Zutat oder Verlangen...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '1rem 1.5rem', fontSize: '1.2rem', color: '#fff', outline: 'none' }}
              />
              <button onClick={() => setSearch('')} style={{ background: 'transparent', color: '#fff', border: 'none', padding: '0 1.5rem', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#94a3b8', marginTop: '2rem' }}>{t('Search results for', 'Suchergebnisse für')} "{search}"</h2>
         </div>
      )}

      {/* Horizontal Rows (Variant A suggestions) */}
      <div style={{ padding: '0 4rem', marginTop: search ? '0' : '-3rem', position: 'relative', zIndex: 10 }}>
        
        {veganRecipes.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#e2e8f0', marginBottom: '1rem' }}>{t('Plant-Based Masterpieces', 'Pflanzliche Meisterwerke')}</h2>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
              {veganRecipes.map(r => (
                <div key={r.id} onClick={() => onSelectRecipe(r.id)} style={{ flex: '0 0 300px', cursor: 'pointer', transition: '0.3s', borderRadius: '8px', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <img src={r.imageUrl || ''} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.75rem 0' }}>
                     <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>{r.title}</h4>
                     <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{r.servings} {t('servings', 'Portionen')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {omnivoreRecipes.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#e2e8f0', marginBottom: '1rem' }}>{t('Rich & Hearty', 'Herzhaft & Kräftig')}</h2>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
              {omnivoreRecipes.map(r => (
                <div key={r.id} onClick={() => onSelectRecipe(r.id)} style={{ flex: '0 0 300px', cursor: 'pointer', transition: '0.3s', borderRadius: '8px', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <img src={r.imageUrl || ''} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.75rem 0' }}>
                     <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>{r.title}</h4>
                     <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{r.servings} {t('servings', 'Portionen')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem' }}>
            {t('No recipes found. Try a different search!', 'Keine Rezepte gefunden. Versuche eine andere Suche!')}
          </div>
        )}
      </div>
    </main>
  );
}
