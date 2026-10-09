import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { CookSession } from '../shared/schemas.ts';
import { AuthBar } from './AuthBar.tsx';
import { IngredientSearch } from './IngredientSearch.tsx';
import { RecipeList } from './RecipeList.tsx';
import { RecipeDetail } from './RecipeDetail.tsx';
import { RecipeEditor } from './RecipeEditor.tsx';
import { CookMode } from './CookMode.tsx';
import { alertTimersFinished, primeCookAlerts } from './cookAlerts.ts';
import {
  clearCookSession,
  createCookSession,
  dueAlerts,
  loadCookSession,
  markAlerted,
  saveCookSession,
} from '../domain/cookSession.ts';
import { LanguageProvider, LanguageToggle, useLanguage } from './LanguageContext.tsx';
import { AppShell, Button, Modal, NavLink } from './ui/index.ts';

type ActiveTab = 'recipes' | 'ingredients';
type RecipeViewMode = 'list' | 'detail' | 'create' | 'edit' | 'cook';

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

  // An active cook session survives reloads, so a stored session reopens Cook Mode directly.
  const [cookSession, setCookSession] = useState<CookSession | null>(() => loadCookSession(window.localStorage));
  const [recipeViewMode, setRecipeViewMode] = useState<RecipeViewMode>(cookSession ? 'cook' : 'list');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(cookSession?.recipeId ?? null);

  // Timers are driven from here, not from CookMode, so they still alert after leaving Cook Mode.
  const [now, setNow] = useState(() => Date.now());
  const cookSessionRef = useRef(cookSession);
  const hasTimers = (cookSession?.timers.length ?? 0) > 0;
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  const updateCookSession = useCallback((next: CookSession | null) => {
    cookSessionRef.current = next;
    setCookSession(next);
    if (next) saveCookSession(window.localStorage, next);
    else clearCookSession(window.localStorage);
  }, []);

  useEffect(() => {
    if (!hasTimers) return;
    const tick = () => {
      const current = cookSessionRef.current;
      const nowMs = Date.now();
      setNow(nowMs);
      const due = current ? dueAlerts(current, nowMs) : [];
      if (!current || due.length === 0) return;
      updateCookSession(markAlerted(current, due.map(timer => timer.id)));
      const stepLabels = due.map(timer => `${tRef.current('Step', 'Schritt')} ${timer.stepIndex + 1}`);
      alertTimersFinished(
        tRef.current('Timer finished', 'Timer abgelaufen'),
        stepLabels.join(', '),
      );
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [hasTimers, updateCookSession]);

  const startCooking = (recipeId: string, servings: number, system: CookSession['system']) => {
    let next: CookSession;
    if (cookSession?.recipeId === recipeId) {
      next = cookSession;
    } else {
      const replacesActiveTimers = (cookSession?.timers.length ?? 0) > 0;
      if (replacesActiveTimers && !window.confirm(t(
        'Starting this recipe replaces your running cook session and its timers. Continue?',
        'Diese Rezept ersetzt deine laufende Kochsitzung und ihre Timer. Fortfahren?',
      ))) return;
      next = createCookSession(recipeId, servings, system);
    }
    primeCookAlerts();
    updateCookSession(next);
    setSelectedRecipeId(recipeId);
    setRecipeViewMode('cook');
  };

  const endCookSession = () => {
    updateCookSession(null);
    setRecipeViewMode('detail');
  };

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

  if (recipeViewMode === 'cook' && cookSession) {
    return (
      <CookMode
        session={cookSession}
        now={now}
        onSessionChange={updateCookSession}
        onExit={() => setRecipeViewMode('detail')}
        onEnd={endCookSession}
        // The pantry deduction flow (#22) will hook in here before the session is cleared.
        onFinish={endCookSession}
      />
    );
  }

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
         <RecipeDetail
           recipeId={selectedRecipeId}
           cookingRecipeId={cookSession?.recipeId ?? null}
           onBack={() => setRecipeViewMode('list')}
           onEdit={(id) => handleEditRecipe(id)}
           onStartCooking={(servings, system) => startCooking(selectedRecipeId, servings, system)}
         />
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
