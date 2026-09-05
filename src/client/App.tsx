import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import { AuthBar } from './AuthBar.tsx';
import { IngredientSearch } from './IngredientSearch.tsx';
import { RecipeList } from './RecipeList.tsx';
import { RecipeDetail } from './RecipeDetail.tsx';
import { RecipeEditor } from './RecipeEditor.tsx';
import { LanguageProvider, LanguageToggle, useLanguage } from './LanguageContext.tsx';

type ActiveTab = 'recipes' | 'ingredients';
type RecipeViewMode = 'list' | 'detail' | 'create' | 'edit';

function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
      <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', position: 'relative', border: '1px solid #334155' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Account & Settings</h2>
        <AuthBar />
      </div>
    </div>
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
    setSelectedRecipeId(null);
    setRecipeViewMode('create');
  };

  const handleSaveSuccess = (id: string) => {
    setSelectedRecipeId(id);
    setRecipeViewMode('detail');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', overflowX: 'hidden' }}>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <nav style={{ boxSizing: 'border-box', position: 'fixed', top: 0, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 4rem', zIndex: 100, background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <h1 style={{ margin: 0, color: '#e50914', fontSize: '1.8rem', letterSpacing: '-1px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>VIBECIPES</h1>
          <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
            <span style={{ cursor: 'pointer', transition: '0.2s', color: activeTab === 'recipes' ? '#fff' : '#94a3b8' }} onClick={() => { setActiveTab('recipes'); setRecipeViewMode('list'); }}>{t('Home', 'Startseite')}</span>
            <span style={{ cursor: 'pointer', transition: '0.2s', color: activeTab === 'ingredients' ? '#fff' : '#94a3b8' }} onClick={() => setActiveTab('ingredients')}>{t('Taxonomy', 'Taxonomie')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }} onClick={handleCreateRecipe}>+ {t('New', 'Neu')}</button>
          <LanguageToggle />
          <div 
            onClick={() => setIsAuthOpen(true)}
            style={{ width: '35px', height: '35px', borderRadius: '4px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
            title={t('Profile & Settings', 'Profil & Einstellungen')}
          >
            ME
          </div>
        </div>
      </nav>

      {activeTab === 'ingredients' ? (
         <div style={{ maxWidth: '900px', margin: '8rem auto', padding: '2rem' }}>
           <IngredientSearch />
         </div>
      ) : recipeViewMode !== 'list' ? (
         <div style={{ maxWidth: '900px', margin: '8rem auto', background: '#0f172a', padding: '2rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
           {recipeViewMode === 'detail' && selectedRecipeId && <RecipeDetail recipeId={selectedRecipeId} onBack={() => setRecipeViewMode('list')} onEdit={(id) => handleEditRecipe(id)} />}
           {(recipeViewMode === 'create' || recipeViewMode === 'edit') && <RecipeEditor recipeId={selectedRecipeId} onSaveSuccess={handleSaveSuccess} onCancel={() => setRecipeViewMode('list')} />}
         </div>
      ) : (
         <RecipeList onSelectRecipe={handleSelectRecipe} onEditRecipe={handleEditRecipe} onCreateRecipe={handleCreateRecipe} />
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
