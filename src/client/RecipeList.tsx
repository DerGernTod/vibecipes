import React, { useEffect, useState } from 'react';
import { recipeListSchema, type DietaryTrait, type RecipeDto } from '../shared/schemas.ts';
import { readJson } from './http.ts';
import { useLanguage } from './LanguageContext.tsx';
import { Button, RecipeCard, Row } from './ui/index.ts';

interface RecipeListProps {
  onSelectRecipe: (id: string) => void;
  onEditRecipe: (id: string) => void;
  onCreateRecipe: () => void;
}

function recipeCards(recipes: RecipeDto[], onSelect: (id: string) => void) {
  return recipes.map(r => (
    <RecipeCard
      key={r.id}
      title={r.title}
      imageUrl={r.imageUrl}
      servings={r.servings}
      trait={r.effectiveTrait}
      onClick={() => onSelect(r.id)}
    />
  ));
}

export function RecipeList({ onSelectRecipe }: RecipeListProps) {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/recipes')
      .then(res => readJson(res, recipeListSchema))
      .then(data => {
        setRecipes(data);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-state">{t('Loading recipes...', 'Lade Rezepte...')}</div>;
  if (error) return <div className="page-state page-state--error">Error: {error}</div>;

  const heroRecipe = recipes[0];
  const query = search.trim().toLowerCase();
  const filtered = query ? recipes.filter(r => r.title.toLowerCase().includes(query)) : recipes;

  const byTrait = (...traits: DietaryTrait[]) => filtered.filter(r => traits.includes(r.effectiveTrait));
  const rows: { title: string; recipes: RecipeDto[] }[] = [
    { title: t('Plant-Based Masterpieces', 'Pflanzliche Meisterwerke'), recipes: byTrait('VEGAN') },
    { title: t('Vegetarian Picks', 'Vegetarische Auswahl'), recipes: byTrait('VEGETARIAN') },
    { title: t('Rich & Hearty', 'Herzhaft & Kräftig'), recipes: byTrait('OMNIVORE', 'UNVERIFIED') },
  ];

  const searchBar = (
    <div className="search">
      <input
        type="text"
        className="search__input"
        placeholder={t('Search by title, ingredient, or craving...', 'Suche nach Titel, Zutat oder Verlangen...')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label={t('Search recipes', 'Rezepte suchen')}
      />
      {search ? (
        <Button variant="ghost" onClick={() => setSearch('')} aria-label={t('Clear search', 'Suche leeren')}>✕</Button>
      ) : (
        <Button variant="primary" size="lg" onClick={() => document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth' })}>
          {t('Search', 'Suchen')}
        </Button>
      )}
    </div>
  );

  return (
    <main>
      {/* One stable top section so the search input keeps focus while typing. */}
      <section className={query ? "home-top home-top--compact" : "hero"}>
        {!query && (
          <div
            className="hero__media"
            style={heroRecipe?.imageUrl ? { backgroundImage: `url("${heroRecipe.imageUrl}")` } : undefined}
          />
        )}
        {!query && <div className="hero__scrim" />}
        <div className={query ? "home-top__content" : "hero__content"}>
          {!query && <h1 className="hero__title">{t("Find your next meal.", "Finde dein nächstes Gericht.")}</h1>}
          {searchBar}
        </div>
      </section>

      <div id="home-results">
        {query ? (
          <section className="home-section home-section--top">
            <h2 className="home-section__title">
              {t('Search results for', 'Suchergebnisse für')} "{search}"
            </h2>
            {filtered.length > 0 ? (
              <div className="recipe-grid">{recipeCards(filtered, onSelectRecipe)}</div>
            ) : (
              <div className="home-empty">{t('No recipes found. Try a different search!', 'Keine Rezepte gefunden. Versuche eine andere Suche!')}</div>
            )}
          </section>
        ) : (
          <>
            {rows.filter(row => row.recipes.length > 0).map(row => (
              <section className="home-section home-section--top" key={row.title}>
                <Row title={row.title}>{recipeCards(row.recipes, onSelectRecipe)}</Row>
              </section>
            ))}
            <section className="home-section home-section--top home-section--end">
              <h2 className="home-section__title">{t('All recipes', 'Alle Rezepte')}</h2>
              {filtered.length > 0 ? (
                <div className="recipe-grid">{recipeCards(filtered, onSelectRecipe)}</div>
              ) : (
                <div className="home-empty">{t('No recipes yet.', 'Noch keine Rezepte.')}</div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
