import { hc } from 'hono/client';
import type { AppType } from '../server/index.ts';

const client = hc<AppType>('/');

async function init() {
  const healthEl = document.getElementById('health-status');
  const ingredientsEl = document.getElementById('ingredients-list');

  try {
    const res = await client.api.health.$get();
    if (res.ok) {
      const data = await res.json();
      if (healthEl) {
        healthEl.innerHTML = `
          <p><strong>Status:</strong> <span style="color: var(--success);">${data.status}</span></p>
          <p><strong>Database Status:</strong> ${data.database}</p>
          <p><strong>Total Ingredients in DB:</strong> ${data.ingredientCount}</p>
          <p><strong>Timestamp:</strong> ${data.timestamp}</p>
        `;
      }
    }
  } catch (err) {
    if (healthEl) healthEl.innerText = 'Failed to load health check: ' + String(err);
  }

  try {
    const res = await client.api.ingredients.$get();
    if (res.ok) {
      const ingredients = await res.json();
      if (ingredientsEl) {
        ingredientsEl.innerHTML = `
          <ul>
            ${ingredients
              .map(
                (ing) => `
              <li>
                <strong>${ing.primaryNameEn}</strong> (${ing.primaryNameDe}) 
                <span class="badge" style="margin-left: 0.5rem">${ing.defaultTrait}</span><br/>
                <small style="color: var(--muted)">Aliases: ${ing.aliases.join(', ')} | Density: ${ing.densityGPerMl ?? 'N/A'} g/ml</small>
              </li>
            `
              )
              .join('')}
          </ul>
        `;
      }
    }
  } catch (err) {
    if (ingredientsEl) ingredientsEl.innerText = 'Failed to load ingredients: ' + String(err);
  }
}

init();
