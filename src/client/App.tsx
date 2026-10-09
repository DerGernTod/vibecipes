import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import { AuthBar } from './AuthBar.tsx';
import { IngredientSearch } from './IngredientSearch.tsx';
import { RecipeList } from './RecipeList.tsx';
import { RecipeDetail } from './RecipeDetail.tsx';
import { RecipeEditor } from './RecipeEditor.tsx';
import { LanguageProvider, LanguageToggle, useLanguage } from './LanguageContext.tsx';
import { AppShell, Button, Modal, NavLink } from './ui/index.ts';

type ActiveTab = 'recipes' | 'ingredients';
type RecipeViewMode = 'list' | 'detail' | 'create' | 'edit';

function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <Modal title="Account & Settings" onClose={onClose}>
      <AuthBar />
    </Modal>
  );
}

function AppContent() {
  const { t } = useLanguage();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('recipes');
  const [recipeViewMode, setRecipeViewMode] = useState<RecipeViewMode>('list');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const handleSelectRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setRecipeViewMode('detail');
  };

  const handleEditRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setRecipeViewMode('edit');
  };

  const handleCreateRecipe = () => {
    setActiveTab('recipes');
    setSelectedRecipeId(null);
    setRecipeViewMode('create');
  };

  const handleSaveSuccess = (id: string) => {
    setSelectedRecipeId(id);
    setRecipeViewMode('detail');
  };

  return (
    <AppShell
      brand={<h1 className="app-brand">VIBECIPES</h1>}
      nav={
        <>
          <NavLink current={activeTab === 'recipes'} onClick={() => { setActiveTab('recipes'); setRecipeViewMode('list'); }}>{t('Home', 'Startseite')}</NavLink>
          <NavLink current={activeTab === 'ingredients'} onClick={() => setActiveTab('ingredients')}>{t('Taxonomy', 'Taxonomie')}</NavLink>
        </>
      }
      actions={
        <>
          <Button variant="ghost" onClick={handleCreateRecipe}>+ {t('New', 'Neu')}</Button>
          <LanguageToggle />
          <button
            type="button"
            className="app-avatar"
            onClick={() => setIsAuthOpen(true)}
            title={t('Profile & Settings', 'Profil & Einstellungen')}
          >
            ME
          </button>
        </>
      }
    >
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {activeTab === 'ingredients' ? (
         <IngredientSearch />
      ) : recipeViewMode === 'detail' && selectedRecipeId ? (
         <RecipeDetail recipeId={selectedRecipeId} onBack={() => setRecipeViewMode('list')} onEdit={(id) => handleEditRecipe(id)} />
      ) : recipeViewMode !== 'list' ? (
         <div className="editor-page">
           {(recipeViewMode === 'create' || recipeViewMode === 'edit') && <RecipeEditor recipeId={selectedRecipeId} onSaveSuccess={handleSaveSuccess} onCancel={() => setRecipeViewMode('list')} />}
         </div>
      ) : (
         <RecipeList onSelectRecipe={handleSelectRecipe} onEditRecipe={handleEditRecipe} onCreateRecipe={handleCreateRecipe} />
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
