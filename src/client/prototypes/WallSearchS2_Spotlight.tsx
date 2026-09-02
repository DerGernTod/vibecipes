import React, { useEffect, useState } from 'react';
import type { RecipeDto } from '../../shared/types.ts';
import { useLanguage } from '../LanguageContext.tsx';

export function WallSearchS2_Spotlight() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const tags = ['All', '🥞 Breakfast', '🥗 Salads', '🍕 Italian', '🍜 Asian', '🍰 Sweets'];

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
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }
    return true;
  });

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Spotlight Command Bar */}
      <div style={{ background: '#0d1322', border: '1px solid #334155', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#161f36', border: '1px solid #6366f1', borderRadius: '12px', padding: '0.85rem 1.25rem' }}>
          <span style={{ fontSize: '1.2rem', color: '#818cf8' }}>⚡</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Command Spotlight: Type ingredients, title, or keywords to filter recipes..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.05rem', outline: 'none' }}
          />
          <kbd style={{ background: '#1e293b', border: '1px solid #475569', color: '#94a3b8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            CTRL + K
          </kbd>
        </div>

        {/* Quick Tag Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                background: selectedTag === tag ? '#6366f1' : '#1e293b',
                color: selectedTag === tag ? '#fff' : '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tag}
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
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.12) 100%)',
            border: '2px dashed #6366f1',
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
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(99, 102, 241, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.2rem', fontWeight: 300, marginBottom: '1.25rem' }}>
            +
          </div>
          <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', color: '#fff' }}>Create New Recipe</h3>
          <p style={{ margin: 0, color: '#a5b4fc', fontSize: '0.88rem' }}>Add recipe blueprint</p>
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
