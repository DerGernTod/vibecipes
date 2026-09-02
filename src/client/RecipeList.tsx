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
          backdropFilter: 'blur(6px)',
        }}
        title={isOverridden ? t('Manually overridden', 'Manuell überschrieben') : ''}
      >
        {trait} {isOverridden ? '⚡' : ''}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{t('Pinterest Recipe Wall', 'Pinterest Rezept-Wand')}</h2>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            {t('Explore food inspirations and recipe blueprints', 'Entdecken Sie kulinarische Inspirationen und Rezepte')}
          </p>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>{t('Loading recipe wall...', 'Lade Rezeptwand...')}</p>}
      {error && <div style={{ color: '#ef4444' }}>{error}</div>}

      {!loading && !error && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          {/* First Wall Entry: Large + Add New Recipe Card */}
          <div
            onClick={onCreateRecipe}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '2px dashed var(--primary)',
              borderRadius: '16px',
              minHeight: '320px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
              padding: '1.5rem',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 300,
                marginBottom: '1rem',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
              }}
            >
              +
            </div>
            <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--text)', fontSize: '1.15rem' }}>
              {t('Add New Recipe', 'Neues Rezept erstellen')}
            </h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
              {t('Create a new culinary blueprint with ingredients and steps', 'Erstellen Sie ein neues Rezept mit Zutaten und Schritten')}
            </p>
          </div>

          {/* Recipe Photo Cards */}
          {recipes.map((recipe) => {
            const fallbackImg = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';
            const bgImage = recipe.imageUrl || fallbackImg;

            return (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe.id)}
                style={{
                  background: '#090d16',
                  border: '1px solid var(--card-border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Photo Image Box */}
                <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
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
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                    }}
                  >
                    {renderTraitBadge(recipe)}
                  </div>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', lineHeight: '1.3' }}>
                    {recipe.title}
                  </h3>

                  {recipe.description && (
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {recipe.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <span>🍽️ {recipe.servings} {t('servings', 'Portionen')}</span>
                    <span>📝 {recipe.steps.length} {t('steps', 'Schritte')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
