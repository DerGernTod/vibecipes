import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { HealthCheckResponse } from '../shared/types.ts';
import { AuthBar } from './AuthBar.tsx';
import { IngredientSearch } from './IngredientSearch.tsx';
import { RecipeList } from './RecipeList.tsx';
import { RecipeDetail } from './RecipeDetail.tsx';
import { RecipeEditor } from './RecipeEditor.tsx';
import { LanguageProvider, LanguageToggle, useLanguage } from './LanguageContext.tsx';

const client = hc<AppType>('/');

type ActiveTab = 'recipes' | 'ingredients';
type RecipeViewMode = 'list' | 'detail' | 'create' | 'edit';

function AppContent() {
  const { t } = useLanguage();
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('recipes');
  const [recipeViewMode, setRecipeViewMode] = useState<RecipeViewMode>('list');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const resHealth = await client.api.health.$get();
        if (resHealth.ok) {
          const data = await resHealth.json();
          setHealth(data);
        }
      } catch (err) {
        setError(String(err));
      }
    }
    loadData();
  }, []);

  const handleSelectRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setRecipeViewMode('detail');
  };

  const handleEditRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setRecipeViewMode('edit');
  };

  const handleCreateRecipe = () => {
    setSelectedRecipeId(null);
    setRecipeViewMode('create');
  };

  const handleSaveSuccess = (id: string) => {
    setSelectedRecipeId(id);
    setRecipeViewMode('detail');
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="header-top-bar">
        <span className="badge">Vibecipes Web Platform</span>
        <LanguageToggle />
      </div>

      <h1 style={{ margin: '0.5rem 0' }}>Vibecipes Platform</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        {t(
          "Manage recipes, automatic dietary trait inferencing, and canonical ingredient taxonomy.",
          "Verwalten Sie Rezepte, automatische Ernährungsanalyse und kanonische Zutaten-Taxonomie."
        )}
      </p>

      <AuthBar />

      {error && <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Error: {error}</div>}

      {/* Main Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('recipes');
            setRecipeViewMode('list');
          }}
        >
          📖 {t('Recipes Wall & Trait Engine', 'Rezepte-Wand & Ernährungs-Engine')}
        </button>
        <button
          className={`nav-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredients')}
        >
          🥦 {t('Canonical Ingredients Taxonomy', 'Kanonischer Zutatenkatalog')}
        </button>
      </div>

      {activeTab === 'recipes' && (
        <div style={{ marginTop: '1rem' }}>
          {recipeViewMode === 'list' && (
            <RecipeList
              onSelectRecipe={handleSelectRecipe}
              onEditRecipe={handleEditRecipe}
              onCreateRecipe={handleCreateRecipe}
            />
          )}

          {recipeViewMode === 'detail' && selectedRecipeId && (
            <RecipeDetail
              recipeId={selectedRecipeId}
              onBack={() => setRecipeViewMode('list')}
              onEdit={(id) => handleEditRecipe(id)}
            />
          )}

          {(recipeViewMode === 'create' || recipeViewMode === 'edit') && (
            <RecipeEditor
              recipeId={selectedRecipeId}
              onSaveSuccess={handleSaveSuccess}
              onCancel={() => setRecipeViewMode('list')}
            />
          )}
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="card">
          <h2>{t("Canonical Ingredient Taxonomy & Search", "Kanonische Zutaten-Taxonomie & Suche")}</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {t(
              "Explore the global catalog with EN/DE alias matching, volumetric densities (g/ml), dietary traits, and smart substitution parent groups.",
              "Durchsuchen Sie den globalen Katalog mit EN/DE Alias-Matching, Volumendichte (g/ml), Ernährungseigenschaften und intelligenten Ersetzungsgruppen."
            )}
          </p>
          <IngredientSearch />
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}


