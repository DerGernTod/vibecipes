import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { HealthCheckResponse } from '../shared/types.ts';
import { AuthBar } from './AuthBar.tsx';
import { IngredientSearch } from './IngredientSearch.tsx';
import { LanguageProvider, LanguageToggle, useLanguage } from './LanguageContext.tsx';

const client = hc<AppType>('/');

function AppContent() {
  const { t } = useLanguage();
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="container">
      <div className="header-top-bar">
        <span className="badge">Vibecipes Web Platform</span>
        <LanguageToggle />
      </div>

      <h1>Vibecipes Core Architecture</h1>
      <p style={{ color: 'var(--muted)' }}>
        {t(
          "Hono API server, Vite + React SPA frontend, and Drizzle SQLite database running under Node 24 native TypeScript.",
          "Hono API Server, Vite + React SPA Frontend und Drizzle SQLite Datenbank unter Node 24 TypeScript."
        )}
      </p>

      <AuthBar />

      {error && <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Error: {error}</div>}

      <div className="card">
        <h2>{t("Backend Health (Hono RPC)", "Backend Systemstatus (Hono RPC)")}</h2>
        {health ? (
          <div>
            <p><strong>{t("Status:", "Status:")}</strong> <span style={{ color: 'var(--success)' }}>{health.status}</span></p>
            <p><strong>{t("Database Status:", "Datenbank Status:")}</strong> {health.database}</p>
            <p><strong>{t("Total Ingredients in Catalog:", "Zutaten im Gesamtkatalog:")}</strong> {health.ingredientCount}</p>
            <p><strong>{t("Timestamp:", "Zeitstempel:")}</strong> {health.timestamp}</p>
          </div>
        ) : (
          <p>{t("Loading health check via Hono Client RPC...", "Lade Systemstatus über Hono Client RPC...")}</p>
        )}
      </div>

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
