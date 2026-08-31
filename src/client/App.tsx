import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { HealthCheckResponse } from '../shared/types.ts';
import { AuthBar } from './AuthBar.tsx';
import { IngredientSearch } from './IngredientSearch.tsx';

const client = hc<AppType>('/');

export function App() {
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
      <span className="badge">Vibecipes Web Platform</span>
      <h1>Vibecipes Core Architecture</h1>
      <p style={{ color: 'var(--muted)' }}>
        Hono API server, Vite + React SPA frontend, and Drizzle SQLite database running under Node 24 native TypeScript.
      </p>

      <AuthBar />

      {error && <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Error: {error}</div>}

      <div className="card">
        <h2>Backend Health (Hono RPC)</h2>
        {health ? (
          <div>
            <p><strong>Status:</strong> <span style={{ color: 'var(--success)' }}>{health.status}</span></p>
            <p><strong>Database Status:</strong> {health.database}</p>
            <p><strong>Total Ingredients in Catalog:</strong> {health.ingredientCount}</p>
            <p><strong>Timestamp:</strong> {health.timestamp}</p>
          </div>
        ) : (
          <p>Loading health check via Hono Client RPC...</p>
        )}
      </div>

      <div className="card">
        <h2>Canonical Ingredient Taxonomy & Search</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Explore the global catalog with EN/DE alias matching, volumetric densities ($g/ml$), dietary traits, and smart substitution parent groups.
        </p>
        <IngredientSearch />
      </div>
    </div>
  );
}
