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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedTrait, setSelectedTrait] = useState<string>('All');

  const tags = [
    { id: 'All', label: t('All Recipes', 'Alle Rezepte') },
    { id: 'Breakfast', label: '🥞 Breakfast' },
    { id: 'Salads', label: '🥗 Salads' },
    { id: 'Italian', label: '🍕 Italian' },
    { id: 'Asian', label: '🍜 Asian' },
    { id: 'Sweets', label: '🍰 Sweets' },
  ];

  const traits = ['All', 'VEGAN', 'VEGETARIAN', 'OMNIVORE'];

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) {
        const data: RecipeDto[] = await res.json();
        setRecipes(data);
      } else {
        setError(t('Failed to load recipes', 'Rezepte konnten nicht geladen werden'));
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Shortcut key CTRL+K or / to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('spotlight-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(t(`Delete recipe "${title}"?`, `Rezept "${title}" löschen?`))) {
      return;
    }
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(t('Failed to delete recipe', 'Rezept konnte nicht gelöscht werden'));
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const renderTraitBadge = (recipe: RecipeDto) => {
    const trait = recipe.effectiveTrait;
    const isOverridden = !!recipe.overrideTrait;
    let traitClass = 'trait-unverified';
    if (trait === 'VEGAN') traitClass = 'trait-vegan';
    if (trait === 'VEGETARIAN') traitClass = 'trait-vegetarian';
    if (trait === 'OMNIVORE') traitClass = 'trait-omnivore';

    return (
      <span
        className={`trait-badge ${traitClass}`}
        style={{
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
        }}
        title={isOverridden ? t('Manually overridden', 'Manuell überschrieben') : ''}
      >
        {trait} {isOverridden ? '⚡' : ''}
      </span>
    );
  };

  // Filtered recipes
  const filteredRecipes = recipes.filter((r) => {
    if (selectedTrait !== 'All' && r.effectiveTrait !== selectedTrait) {
      return false;
    }
    if (selectedTag !== 'All') {
      const tagLow = selectedTag.toLowerCase();
      const titleLow = r.title.toLowerCase();
      const descLow = (r.description || '').toLowerCase();
      if (tagLow === 'breakfast' && !titleLow.includes('pancake') && !titleLow.includes('toast') && !descLow.includes('morning')) return false;
      if (tagLow === 'salads' && !titleLow.includes('salad')) return false;
      if (tagLow === 'italian' && !titleLow.includes('pizza') && !titleLow.includes('risotto')) return false;
      if (tagLow === 'asian' && !titleLow.includes('ramen')) return false;
    }
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
    <div>
      {/* Command Spotlight & Filter Control Panel */}
      <div style={{ background: '#0d1322', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '1.25rem 1.5rem', marginBottom: '1.75rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#161f36', border: '1px solid var(--primary)', borderRadius: '12px', padding: '0.75rem 1.25rem' }}>
          <span style={{ fontSize: '1.2rem', color: '#818cf8' }}>⚡</span>
          <input
            id="spotlight-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Command Spotlight: Search titles, descriptions, or ingredients...', 'Command Spotlight: Nach Rezepten oder Zutaten suchen...')}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', outline: 'none' }}
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>
              ✕
            </button>
          ) : (
            <kbd style={{ background: '#1e293b', border: '1px solid #475569', color: 'var(--muted)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              CTRL + K
            </kbd>
          )}
        </div>

        {/* Category & Trait Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                style={{
                  background: selectedTag === tag.id ? 'var(--primary)' : '#1e293b',
                  color: selectedTag === tag.id ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, marginRight: '0.2rem' }}>Dietary:</span>
            {traits.map((tr) => (
              <button
                key={tr}
                onClick={() => setSelectedTrait(tr)}
                style={{
                  background: selectedTrait === tr ? (tr === 'VEGAN' ? '#10b981' : tr === 'VEGETARIAN' ? '#3b82f6' : tr === 'OMNIVORE' ? '#f59e0b' : 'var(--primary)') : '#1e293b',
                  color: selectedTrait === tr ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
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

      {loading && <p style={{ color: 'var(--muted)' }}>{t('Loading recipe wall...', 'Lade Rezeptwand...')}</p>}
      {error && <div style={{ color: '#ef4444' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ columnCount: 3, columnGap: '1.25rem' }}>
          {/* First Wall Entry: Full-Sized + Create Recipe Card */}
          <div
            onClick={onCreateRecipe}
            style={{
              breakInside: 'avoid',
              marginBottom: '1.25rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.12) 100%)',
              border: '2px dashed var(--primary)',
              borderRadius: '20px',
              minHeight: '340px', // FULL SIZE MATCHING REGULAR RECIPE CARDS
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
                background: 'var(--primary)',
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
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', color: '#fff', fontWeight: 600 }}>
              {t('Create New Recipe', 'Neues Rezept erstellen')}
            </h3>
            <p style={{ margin: 0, color: '#a5b4fc', fontSize: '0.88rem', lineHeight: '1.4', maxWidth: '200px' }}>
              {t('Author a fresh culinary blueprint with step ingredients', 'Erstellen Sie ein neues Rezept mit Zutaten und Schritten')}
            </p>
          </div>

          {/* Recipe Photo Cards */}
          {filteredRecipes.map((recipe, idx) => {
            const heights = ['240px', '300px', '220px', '280px', '340px'];
            const imgHeight = heights[idx % heights.length];
            const fallbackImg = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';
            const bgImage = recipe.imageUrl || fallbackImg;

            return (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe.id)}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '1.25rem',
                  background: '#090d16',
                  border: '1px solid var(--card-border)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: imgHeight, overflow: 'hidden' }}>
                  <img
                    src={bgImage}
                    alt={recipe.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1.0)';
                    }}
                  />
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                    {renderTraitBadge(recipe)}
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 600, lineHeight: '1.3' }}>
                    {recipe.title}
                  </h3>

                  {recipe.description && (
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {recipe.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.85rem' }}>
                    <span>🍽️ {recipe.servings} {t('servings', 'Portionen')}</span>
                    <span>📝 {recipe.steps.length} {t('steps', 'Schritte')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecipe(recipe.id);
                      }}
                    >
                      {t('View', 'Anzeigen')}
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRecipe(recipe.id);
                      }}
                    >
                      {t('Edit', 'Bearbeiten')}
                    </button>
                    <button
                      className="btn-danger"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                      onClick={(e) => handleDelete(e, recipe.id, recipe.title)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
