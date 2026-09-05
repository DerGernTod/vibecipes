import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { IngredientDto } from '../shared/types.ts';
import { useLanguage } from './LanguageContext.tsx';

const client = hc<AppType>('/');

interface IngredientSearchProps {
  onSelect?: (ingredient: IngredientDto) => void;
}

const TRAIT_COLORS: Record<string, string> = {
  VEGAN: '#10b981',
  VEGETARIAN: '#3b82f6',
  OMNIVORE: '#f59e0b',
  UNVERIFIED: '#94a3b8'
};

export function IngredientSearch({ onSelect }: IngredientSearchProps) {
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch full taxonomy up front (we can filter locally since it's a small dataset)
  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      setLoading(true);
      try {
        const res = await client.api.ingredients.$get();
        if (res.ok && active) {
          const data = await res.json();
          setIngredients(data);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCatalog();
    return () => { active = false; };
  }, []);

  const filtered = ingredients.filter(ing => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ing.primaryNameEn.toLowerCase().includes(q) ||
      ing.primaryNameDe.toLowerCase().includes(q) ||
      ing.aliases.some(a => a.toLowerCase().includes(q))
    );
  });

  if (loading) return <div style={{ padding: '4rem', color: '#fff' }}>{t('Loading Taxonomy...', 'Lade Taxonomie...')}</div>;

  return (
    <div style={{ minHeight: '600px', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>
          {t('Taxonomy Library', 'Taxonomie Bibliothek')}
        </h2>
        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder={t('Search ingredients...', 'Zutaten durchsuchen...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '100px', border: '1px solid #3f3f46', background: '#18181b', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {filtered.map(ing => {
          const color = TRAIT_COLORS[ing.defaultTrait] || '#94a3b8';
          const name = lang === 'de' ? ing.primaryNameDe : ing.primaryNameEn;
          // Use the real imageUrl or a fallback gradient
          const imgUrl = ing.imageUrl;
          
          return (
            <div 
              key={ing.id} 
              onClick={() => onSelect && onSelect(ing)}
              style={{ 
                background: '#18181b', 
                borderRadius: '12px', 
                border: '1px solid #27272a', 
                overflow: 'hidden', 
                borderTop: `4px solid ${color}`, 
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)', 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: onSelect ? 'pointer' : 'default',
                transition: '0.2s',
              }}
              onMouseEnter={e => {
                 if (onSelect) {
                   e.currentTarget.style.transform = 'translateY(-4px)';
                   e.currentTarget.style.borderColor = '#e50914';
                 }
              }}
              onMouseLeave={e => {
                 if (onSelect) {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.borderColor = '#27272a';
                 }
              }}
            >
              <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: color, color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', zIndex: 10 }}>
                {ing.defaultTrait}
              </div>
              
              {imgUrl ? (
                <img src={imgUrl} alt={name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '140px', background: 'linear-gradient(45deg, #1f2937, #374151)' }} />
              )}
              
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0', color: '#fff' }}>{name}</h3>
                <div style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: 'auto' }}>
                   ID: {ing.id.split('_')[1]}
                   {ing.parentGroupId && <div style={{ color: '#fca5a5', marginTop: '0.2rem' }}>Parent: {ing.parentGroupId}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '4rem' }}>{t('No ingredients found.', 'Keine Zutaten gefunden.')}</div>}
    </div>
  );
}
