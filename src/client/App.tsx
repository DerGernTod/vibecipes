import React, { useEffect, useState } from 'react';
import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';
import type { HealthCheckResponse, IngredientDto } from '../shared/types.ts';

const client = hc<AppType>('/');

export function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const resHealth = await client.api.health.$get();
        if (resHealth.ok) {
          const data = await resHealth.json();
          setHealth(data);
        }
        const resIng = await client.api.ingredients.$get();
        if (resIng.ok) {
          const data = await resIng.json();
          setIngredients(data);
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

      {error && <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Error: {error}</div>}

      <div className="card">
        <h2>Backend Health (Hono RPC)</h2>
        {health ? (
          <div>
            <p><strong>Status:</strong> <span style={{ color: 'var(--success)' }}>{health.status}</span></p>
            <p><strong>Database Status:</strong> {health.database}</p>
            <p><strong>Total Ingredients in DB:</strong> {health.ingredientCount}</p>
            <p><strong>Timestamp:</strong> {health.timestamp}</p>
          </div>
        ) : (
          <p>Loading health check via Hono Client RPC...</p>
        )}
      </div>

      <div className="card">
        <h2>Canonical Ingredients (Drizzle SQLite)</h2>
        {ingredients.length > 0 ? (
          <ul>
            {ingredients.map((ing) => (
              <li key={ing.id}>
                <strong>{ing.primaryNameEn}</strong> ({ing.primaryNameDe}){' '}
                <span className="badge" style={{ marginLeft: '0.5rem' }}>{ing.defaultTrait}</span>
                <br />
                <small style={{ color: 'var(--muted)' }}>
                  Aliases: {ing.aliases.join(', ')} | Density: {ing.densityGPerMl ?? 'N/A'} g/ml
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading canonical ingredients...</p>
        )}
      </div>
    </div>
  );
}
