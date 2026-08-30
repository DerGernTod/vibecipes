// Vibecipes Prototype (Issue #8 - Multiple Image Attachments)
// Demonstrates 3 distinct UI variations for saving multiple image crops as recipe attachments.

export interface RecipeAttachment {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  tag: 'Cover Photo' | 'Step Technique' | 'Ingredient Detail' | 'Equipment' | 'Other';
  caption: string;
  assignedStep?: number; // For step-level attachment mapping
  isCover?: boolean;
}

// Draw realistic sample recipe card with multiple photo regions
function drawSampleRecipeCard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Header band
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, 70);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui';
  ctx.fillText('Classic German Potato Soup (Kartoffelsuppe)', 24, 42);

  // Dish Main Cover Photo region (Top Right)
  const imgX = 450, imgY = 90, imgW = 220, imgH = 150;
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(imgX, imgY, imgW, imgH);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.strokeRect(imgX, imgY, imgW, imgH);

  // Soup Illustration
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(imgX + 110, imgY + 80, 55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d97706';
  ctx.beginPath(); ctx.arc(imgX + 110, imgY + 80, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b91c1c'; ctx.fillRect(imgX + 90, imgY + 70, 18, 8); ctx.fillRect(imgX + 115, imgY + 90, 18, 8);
  ctx.fillStyle = '#475569'; ctx.font = 'bold 12px system-ui';
  ctx.fillText('📷 [Cover Dish Photo]', imgX + 45, imgY + 142);

  // Technique Photo Region (Step 4 Immersion Blender)
  const techX = 450, techY = 340, techW = 220, techH = 150;
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(techX, techY, techW, techH);
  ctx.strokeStyle = '#0284c7';
  ctx.strokeRect(techX, techY, techW, techH);

  // Blender Illustration
  ctx.fillStyle = '#64748b'; ctx.fillRect(techX + 100, techY + 20, 20, 70);
  ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(techX + 110, techY + 105, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px system-ui';
  ctx.fillText('📷 [Step 4 Blender Detail]', techX + 35, techY + 142);

  // Servings line
  ctx.font = '14px system-ui';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Servings: 4  |  Prep: 20 mins  |  Cook: 35 mins', 24, 100);

  // Ingredients Column
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px system-ui';
  ctx.fillText('Zutaten / Ingredients:', 24, 135);

  ctx.font = '14px system-ui';
  ctx.fillStyle = '#334155';
  const ingredients = [
    '• 1 kg Potatoes (festkochend), peeled & diced',
    '• 200 g Carrots, sliced into rounds',
    '• 1 Leek (Porree), thoroughly washed & chopped',
    '• 1.2 L Vegetable broth (Gemüsebrühe)',
    '• 100 ml Heavy cream (Schlagsahne)',
    '• 1 pinch Marjoram, salt & black pepper',
    '• 4 Wiener sausages, sliced'
  ];
  ingredients.forEach((ing, i) => {
    ctx.fillText(ing, 28, 162 + i * 24);
  });

  // Instructions Section
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px system-ui';
  ctx.fillText('Zubereitung / Instructions:', 24, 350);

  ctx.font = '14px system-ui';
  ctx.fillStyle = '#334155';
  const steps = [
    '1. Heat 1 tbsp butter in pot over medium heat.',
    '2. Sauté leek, carrots, and potatoes for 5 mins.',
    '3. Add broth & marjoram, simmer for 25 mins.',
    '4. Use immersion blender to partially purée.',
    '5. Stir in heavy cream & sausages. Serve warm.'
  ];
  steps.forEach((step, i) => {
    ctx.fillText(step, 28, 378 + i * 24);
  });
}

// Generate data URL for cropped canvas region
function extractCropDataUrl(sourceCanvas: HTMLCanvasElement, crop: { x: number; y: number; width: number; height: number }): string {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = crop.width;
  tempCanvas.height = crop.height;
  const tCtx = tempCanvas.getContext('2d')!;
  tCtx.drawImage(sourceCanvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return tempCanvas.toDataURL('image/png');
}

// Simulated Full-File OCR Worker Text
async function fetchFullFileOCR(): Promise<string> {
  return [
    'Title: Classic German Potato Soup (Kartoffelsuppe)',
    'Servings: 4 | Prep: 20 mins | Cook: 35 mins',
    '',
    '[INGREDIENTS]',
    '• 1 kg Potatoes (festkochend), peeled & diced',
    '• 200 g Carrots, sliced into rounds',
    '• 1 Leek (Porree), chopped',
    '• 1.2 L Vegetable broth',
    '• 100 ml Heavy cream',
    '• 1 pinch Marjoram, salt & pepper',
    '• 4 Wiener sausages',
    '',
    '[INSTRUCTIONS]',
    '1. Heat butter in pot over medium heat.',
    '2. Sauté leek, carrots, and potatoes for 5 mins.',
    '3. Add broth & marjoram, simmer for 25 mins.',
    '4. Use immersion blender to partially purée.',
    '5. Stir in heavy cream & sausages. Serve warm.'
  ].join('\n');
}

// ============================================================================
// VARIANT A: Multi-Bounding Box Canvas + Bottom Filmstrip Gallery Bar
// ============================================================================
function renderVariantA(container: HTMLElement) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="display: grid; grid-template-columns: 1fr 380px; gap: 1.25rem; align-items: start;">
        
        <!-- Canvas Workspace -->
        <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--text);">Canvas Multi-Crop Workspace</h3>
              <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color: var(--muted);">Click and drag to draw multiple crop regions to attach as recipe images.</p>
            </div>
            <button class="btn btn-secondary" id="va-auto-sample" style="font-size: 0.8rem;">✨ Auto-Crop Sample Regions</button>
          </div>

          <div style="position: relative; border: 1px solid #334155; border-radius: 8px; overflow: hidden; background: #000; text-align: center;">
            <canvas id="va-canvas" width="700" height="520" style="cursor: crosshair; max-width: 100%; display: block; margin: 0 auto;"></canvas>
          </div>
        </div>

        <!-- Right Side: Full File OCR & Raw Attachment Payload State -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--primary);">Full Document OCR Text</h4>
            <textarea id="va-ocr-text" readonly style="width: 100%; height: 180px; background: #090d16; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; padding: 0.75rem; font-family: monospace; font-size: 0.75rem; line-height: 1.4; resize: none;"></textarea>
          </div>

          <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4 style="margin: 0; color: var(--success);">Attachment Payload State (<span id="va-json-count">0</span>)</h4>
            </div>
            <pre id="va-json-preview" style="background: #090d16; color: #a7f3d0; padding: 0.75rem; border-radius: 6px; font-size: 0.72rem; height: 230px; overflow: auto; margin: 0;"></pre>
          </div>
        </div>
      </div>

      <!-- Bottom Filmstrip Gallery Bar for Saved Attachments -->
      <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <h4 style="margin: 0; font-size: 1rem; color: var(--text);">Saved Image Attachments Gallery</h4>
            <span class="badge" id="va-count-badge">0 Attachments</span>
          </div>
          <button class="btn" id="va-save-all-btn">💾 Save All Attachments to Recipe</button>
        </div>

        <div id="va-filmstrip" style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; min-height: 150px; align-items: center;">
          <div style="color: var(--muted); font-size: 0.85rem; text-align: center; width: 100%; padding: 2rem 0;">
            No attachments saved yet. Click & drag anywhere on the recipe photo to crop image attachments.
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('va-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const ocrTextEl = document.getElementById('va-ocr-text') as HTMLTextAreaElement;

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = canvas.width;
  baseCanvas.height = canvas.height;
  const baseCtx = baseCanvas.getContext('2d')!;
  drawSampleRecipeCard(baseCtx, baseCanvas.width, baseCanvas.height);

  let attachments: RecipeAttachment[] = [];
  let isDrawing = false;
  let startX = 0, startY = 0;
  let currentRect: { x: number; y: number; w: number; h: number } | null = null;

  const TAG_COLORS: Record<string, string> = {
    'Cover Photo': '#ef4444',
    'Step Technique': '#0284c7',
    'Ingredient Detail': '#10b981',
    'Equipment': '#f59e0b',
    'Other': '#8b5cf6'
  };

  fetchFullFileOCR().then(text => { ocrTextEl.value = text; });

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvas, 0, 0);

    // Draw active crop regions on canvas
    attachments.forEach((att, idx) => {
      const color = TAG_COLORS[att.tag] || '#6366f1';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(att.x, att.y, att.width, att.height);

      ctx.fillStyle = color;
      const tagText = `#${idx + 1} ${att.tag}`;
      ctx.fillRect(att.x, Math.max(0, att.y - 22), ctx.measureText(tagText).width + 12, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText(tagText, att.x + 6, Math.max(14, att.y - 6));
    });

    // Draw active dragging rect
    if (isDrawing && currentRect) {
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.setLineDash([]);
    }

    updateFilmstrip();
    updateJsonPreview();
  }

  function updateFilmstrip() {
    const stripEl = document.getElementById('va-filmstrip')!;
    document.getElementById('va-count-badge')!.innerText = `${attachments.length} Attachment${attachments.length === 1 ? '' : 's'}`;

    if (attachments.length === 0) {
      stripEl.innerHTML = `<div style="color: var(--muted); font-size: 0.85rem; text-align: center; width: 100%; padding: 2rem 0;">No attachments saved yet. Drag on canvas to crop images.</div>`;
      return;
    }

    stripEl.innerHTML = attachments.map((att, idx) => `
      <div style="background: #0f172a; border: 1px solid var(--card-border); border-top: 3px solid ${TAG_COLORS[att.tag]}; border-radius: 8px; padding: 0.6rem; min-width: 240px; display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: ${TAG_COLORS[att.tag]}">Attachment #${idx + 1}</span>
          <button data-del="${att.id}" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.9rem;">✕</button>
        </div>
        
        <div style="height: 100px; background: #000; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <img src="${att.dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <select data-tag="${att.id}" style="background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; padding: 0.2rem 0.4rem; font-size: 0.75rem;">
            <option value="Cover Photo" ${att.tag === 'Cover Photo' ? 'selected' : ''}>Cover Photo</option>
            <option value="Step Technique" ${att.tag === 'Step Technique' ? 'selected' : ''}>Step Technique</option>
            <option value="Ingredient Detail" ${att.tag === 'Ingredient Detail' ? 'selected' : ''}>Ingredient Detail</option>
            <option value="Equipment" ${att.tag === 'Equipment' ? 'selected' : ''}>Equipment</option>
            <option value="Other" ${att.tag === 'Other' ? 'selected' : ''}>Other</option>
          </select>

          <input type="text" data-caption="${att.id}" value="${att.caption}" placeholder="Add short caption..." style="background: #090d16; border: 1px solid #334155; color: white; border-radius: 4px; padding: 0.25rem 0.4rem; font-size: 0.75rem;">
        </div>
      </div>
    `).join('');

    // Event listeners for filmstrip card controls
    stripEl.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-del');
        attachments = attachments.filter(a => a.id !== id);
        redraw();
      });
    });

    stripEl.querySelectorAll('[data-tag]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-tag');
        const att = attachments.find(a => a.id === id);
        if (att) {
          att.tag = (e.currentTarget as HTMLSelectElement).value as any;
          redraw();
        }
      });
    });

    stripEl.querySelectorAll('[data-caption]').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-caption');
        const att = attachments.find(a => a.id === id);
        if (att) {
          att.caption = (e.currentTarget as HTMLInputElement).value;
          updateJsonPreview();
        }
      });
    });
  }

  function updateJsonPreview() {
    document.getElementById('va-json-count')!.innerText = String(attachments.length);
    const cleanPayload = attachments.map(a => ({
      id: a.id,
      tag: a.tag,
      caption: a.caption,
      dimensions: `${Math.round(a.width)}x${Math.round(a.height)}px`
    }));
    document.getElementById('va-json-preview')!.innerText = JSON.stringify(cleanPayload, null, 2);
  }

  // Mouse interaction
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    currentRect = { x: Math.min(startX, curX), y: Math.min(startY, curY), w: Math.abs(curX - startX), h: Math.abs(curY - startY) };
    redraw();
  });

  canvas.addEventListener('mouseup', () => {
    if (isDrawing && currentRect && currentRect.w > 30 && currentRect.h > 30) {
      const dataUrl = extractCropDataUrl(baseCanvas, { x: currentRect.x, y: currentRect.y, width: currentRect.w, height: currentRect.h });
      const defaultTag: RecipeAttachment['tag'] = attachments.length === 0 ? 'Cover Photo' : 'Step Technique';
      attachments.push({
        id: 'att_' + Date.now(),
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.w,
        height: currentRect.h,
        dataUrl,
        tag: defaultTag,
        caption: defaultTag === 'Cover Photo' ? 'Main Dish Cover Image' : `Attachment #${attachments.length + 1}`
      });
    }
    isDrawing = false;
    currentRect = null;
    redraw();
  });

  document.getElementById('va-auto-sample')!.addEventListener('click', () => {
    const crop1 = { x: 440, y: 80, width: 240, height: 170 };
    const crop2 = { x: 440, y: 330, width: 240, height: 170 };

    attachments = [
      {
        id: 'att_1',
        x: crop1.x, y: crop1.y, width: crop1.width, height: crop1.height,
        dataUrl: extractCropDataUrl(baseCanvas, crop1),
        tag: 'Cover Photo',
        caption: 'German Potato Soup Main Dish'
      },
      {
        id: 'att_2',
        x: crop2.x, y: crop2.y, width: crop2.width, height: crop2.height,
        dataUrl: extractCropDataUrl(baseCanvas, crop2),
        tag: 'Step Technique',
        caption: 'Step 4: Immersion blender purée technique'
      }
    ];
    redraw();
  });

  document.getElementById('va-save-all-btn')!.addEventListener('click', () => {
    alert(`Saved ${attachments.length} image attachments to the recipe payload!`);
  });

  redraw();
}

// ============================================================================
// VARIANT B: Canvas Crop Drawer Inspector & Published Recipe Live Preview
// ============================================================================
function renderVariantB(container: HTMLElement) {
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 420px; gap: 1.25rem; align-items: start;">
      
      <!-- Left: Interactive Canvas -->
      <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--text);">Document Image Inspector Workspace</h3>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color: var(--muted);">Crop any area to open the Attachments Manager drawer.</p>
          </div>
          <button class="btn btn-secondary" id="vb-auto-crop" style="font-size: 0.8rem;">⚡ Sample Auto-Crops</button>
        </div>

        <div style="border: 1px solid #334155; border-radius: 8px; overflow: hidden; background: #000; text-align: center;">
          <canvas id="vb-canvas" width="700" height="520" style="cursor: crosshair; max-width: 100%; display: block; margin: 0 auto;"></canvas>
        </div>
      </div>

      <!-- Right: Attachments Inspector Side Drawer & Recipe Live Preview -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Tabs Header -->
        <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 0.5rem; display: flex; gap: 0.5rem;">
          <button class="btn" id="vb-tab-drawer" style="flex: 1; justify-content: center; font-size: 0.85rem; padding: 0.4rem;">Attachments Drawer (<span id="vb-att-count">0</span>)</button>
          <button class="btn btn-secondary" id="vb-tab-preview" style="flex: 1; justify-content: center; font-size: 0.85rem; padding: 0.4rem;">👁️ Recipe Preview</button>
        </div>

        <!-- Drawer Content Container -->
        <div id="vb-drawer-view" style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; min-height: 520px; display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; color: var(--primary);">Attached Recipe Images</h4>
            <span style="font-size: 0.75rem; color: var(--muted);">Select 1 Primary Cover Photo</span>
          </div>

          <div id="vb-attachment-cards" style="flex: 1; display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; max-height: 440px;">
            <div style="color: var(--muted); font-size: 0.85rem; text-align: center; margin-top: 2rem;">No images cropped yet. Highlight regions on the canvas.</div>
          </div>
        </div>

        <!-- Published Recipe Live Preview Container (Hidden by default) -->
        <div id="vb-preview-view" style="display: none; background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; min-height: 520px;">
          <h4 style="margin: 0 0 1rem 0; color: var(--success);">Published Recipe Page Mockup</h4>
          <div id="vb-published-recipe" style="background: #0f172a; border-radius: 8px; padding: 1rem; border: 1px solid #334155;"></div>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('vb-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = canvas.width;
  baseCanvas.height = canvas.height;
  const baseCtx = baseCanvas.getContext('2d')!;
  drawSampleRecipeCard(baseCtx, baseCanvas.width, baseCanvas.height);

  let attachments: RecipeAttachment[] = [];
  let isDrawing = false;
  let startX = 0, startY = 0;
  let currentRect: { x: number; y: number; w: number; h: number } | null = null;

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvas, 0, 0);

    attachments.forEach((att, idx) => {
      ctx.strokeStyle = att.isCover ? '#ef4444' : '#6366f1';
      ctx.lineWidth = 3;
      ctx.strokeRect(att.x, att.y, att.width, att.height);

      const label = att.isCover ? '⭐ Primary Cover' : `Attachment #${idx + 1}`;
      ctx.fillStyle = att.isCover ? '#ef4444' : '#6366f1';
      ctx.fillRect(att.x, Math.max(0, att.y - 22), ctx.measureText(label).width + 12, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText(label, att.x + 6, Math.max(14, att.y - 6));
    });

    if (isDrawing && currentRect) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.setLineDash([]);
    }

    updateDrawer();
    updatePublishedPreview();
  }

  function updateDrawer() {
    const listEl = document.getElementById('vb-attachment-cards')!;
    document.getElementById('vb-att-count')!.innerText = String(attachments.length);

    if (attachments.length === 0) {
      listEl.innerHTML = `<div style="color: var(--muted); font-size: 0.85rem; text-align: center; margin-top: 2rem;">No images cropped yet. Highlight regions on the canvas.</div>`;
      return;
    }

    listEl.innerHTML = attachments.map((att, idx) => `
      <div style="background: #0f172a; border: 1px solid ${att.isCover ? '#ef4444' : '#334155'}; border-radius: 8px; padding: 0.75rem; display: flex; gap: 0.75rem; align-items: start;">
        <div style="width: 80px; height: 70px; background: #000; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <img src="${att.dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-size: 0.75rem; font-weight: 600; color: ${att.isCover ? '#ef4444' : 'var(--primary)'}; display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
              <input type="radio" name="vb-cover" data-cover-id="${att.id}" ${att.isCover ? 'checked' : ''}>
              ${att.isCover ? '⭐ Primary Cover' : 'Set as Cover'}
            </label>
            <button data-del-id="${att.id}" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.85rem;">✕</button>
          </div>

          <input type="text" data-caption-id="${att.id}" value="${att.caption}" placeholder="Caption / description..." style="background: #1e293b; border: 1px solid #334155; color: white; border-radius: 4px; padding: 0.25rem 0.5rem; font-size: 0.75rem;">
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-cover-id]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-cover-id');
        attachments.forEach(a => { a.isCover = (a.id === id); });
        redraw();
      });
    });

    listEl.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-del-id');
        attachments = attachments.filter(a => a.id !== id);
        if (attachments.length > 0 && !attachments.some(a => a.isCover)) {
          attachments[0].isCover = true;
        }
        redraw();
      });
    });

    listEl.querySelectorAll('[data-caption-id]').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-caption-id');
        const att = attachments.find(a => a.id === id);
        if (att) att.caption = (e.currentTarget as HTMLInputElement).value;
        updatePublishedPreview();
      });
    });
  }

  function updatePublishedPreview() {
    const previewEl = document.getElementById('vb-published-recipe')!;
    const cover = attachments.find(a => a.isCover);
    const extraAttachments = attachments.filter(a => !a.isCover);

    previewEl.innerHTML = `
      <div style="font-weight: bold; font-size: 1.1rem; color: #f8fafc; margin-bottom: 0.5rem;">Classic German Potato Soup</div>
      ${cover ? `
        <div style="position: relative; height: 140px; background: #000; border-radius: 6px; overflow: hidden; margin-bottom: 1rem; border: 1px solid #ef4444;">
          <img src="${cover.dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">
          <span style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">📷 Cover: ${cover.caption}</span>
        </div>
      ` : '<div style="color: var(--muted); font-size: 0.8rem; margin-bottom: 1rem;">(No cover photo attached)</div>'}

      <div style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.75rem;"><strong>Step 4:</strong> Use immersion blender to partially purée the soup.</div>

      ${extraAttachments.length > 0 ? `
        <div style="display: flex; gap: 0.5rem; overflow-x: auto;">
          ${extraAttachments.map(att => `
            <div style="width: 90px; height: 70px; background: #000; border-radius: 4px; overflow: hidden; flex-shrink: 0; position: relative;">
              <img src="${att.dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">
              <span style="position: absolute; bottom: 2px; left: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; font-size: 0.65rem; padding: 1px 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${att.caption}</span>
            </div>
          `).join('')}
        </div>
      ` : '<div style="font-size: 0.75rem; color: var(--muted);">(No additional step photo attachments)</div>'}
    `;
  }

  // Mouse interaction
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    currentRect = { x: Math.min(startX, curX), y: Math.min(startY, curY), w: Math.abs(curX - startX), h: Math.abs(curY - startY) };
    redraw();
  });

  canvas.addEventListener('mouseup', () => {
    if (isDrawing && currentRect && currentRect.w > 30 && currentRect.h > 30) {
      const dataUrl = extractCropDataUrl(baseCanvas, { x: currentRect.x, y: currentRect.y, width: currentRect.w, height: currentRect.h });
      const isFirst = attachments.length === 0;
      attachments.push({
        id: 'att_' + Date.now(),
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.w,
        height: currentRect.h,
        dataUrl,
        tag: isFirst ? 'Cover Photo' : 'Step Technique',
        caption: isFirst ? 'Finished Potato Soup' : `Photo Attachment #${attachments.length + 1}`,
        isCover: isFirst
      });
    }
    isDrawing = false;
    currentRect = null;
    redraw();
  });

  document.getElementById('vb-auto-crop')!.addEventListener('click', () => {
    const crop1 = { x: 440, y: 80, width: 240, height: 170 };
    const crop2 = { x: 440, y: 330, width: 240, height: 170 };

    attachments = [
      { id: 'att_1', x: crop1.x, y: crop1.y, width: crop1.width, height: crop1.height, dataUrl: extractCropDataUrl(baseCanvas, crop1), tag: 'Cover Photo', caption: 'Potato Soup Plated Bowl', isCover: true },
      { id: 'att_2', x: crop2.x, y: crop2.y, width: crop2.width, height: crop2.height, dataUrl: extractCropDataUrl(baseCanvas, crop2), tag: 'Step Technique', caption: 'Immersion Blender Technique', isCover: false }
    ];
    redraw();
  });

  // Tab switching logic
  const btnDrawer = document.getElementById('vb-tab-drawer')!;
  const btnPreview = document.getElementById('vb-tab-preview')!;
  const drawerView = document.getElementById('vb-drawer-view')!;
  const previewView = document.getElementById('vb-preview-view')!;

  btnDrawer.addEventListener('click', () => {
    btnDrawer.className = 'btn';
    btnPreview.className = 'btn btn-secondary';
    drawerView.style.display = 'flex';
    previewView.style.display = 'none';
  });

  btnPreview.addEventListener('click', () => {
    btnPreview.className = 'btn';
    btnDrawer.className = 'btn btn-secondary';
    previewView.style.display = 'block';
    drawerView.style.display = 'none';
  });

  redraw();
}

// ============================================================================
// VARIANT C: Recipe-Step Direct Attachment Mapper (Step Pinboard)
// ============================================================================
function renderVariantC(container: HTMLElement) {
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 450px; gap: 1.25rem; align-items: start;">
      
      <!-- Left Canvas Window -->
      <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--text);">Step Image Pinboard Workspace</h3>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color: var(--muted);">Crop an image, then assign it directly to a recipe step slot on the right.</p>
          </div>
        </div>

        <div style="border: 1px solid #334155; border-radius: 8px; overflow: hidden; background: #000; text-align: center;">
          <canvas id="vc-canvas" width="700" height="520" style="cursor: crosshair; max-width: 100%; display: block; margin: 0 auto;"></canvas>
        </div>

        <div style="margin-top: 0.75rem; background: #0f172a; border-radius: 6px; padding: 0.6rem; font-size: 0.8rem; color: var(--accent); display: flex; align-items: center; justify-content: space-between;">
          <span>Active Selection: <strong id="vc-selection-status">Draw a box on canvas</strong></span>
          <button class="btn btn-secondary" id="vc-clear-selection" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Clear Box</button>
        </div>
      </div>

      <!-- Right Recipe Steps Image Assignment Drop Zones -->
      <div style="background: var(--card); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; min-height: 570px; display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; color: var(--primary);">Recipe Step Attachment Slots</h4>
          <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: var(--success);">Direct Mapping</span>
        </div>

        <div id="vc-step-slots" style="display: flex; flex-direction: column; gap: 0.85rem; flex: 1; overflow-y: auto;"></div>
      </div>

    </div>
  `;

  const canvas = document.getElementById('vc-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = canvas.width;
  baseCanvas.height = canvas.height;
  const baseCtx = baseCanvas.getContext('2d')!;
  drawSampleRecipeCard(baseCtx, baseCanvas.width, baseCanvas.height);

  let activeCrop: { x: number; y: number; w: number; h: number } | null = null;
  let isDrawing = false;
  let startX = 0, startY = 0;

  // Recipe Step Slots
  interface StepSlot {
    id: string;
    title: string;
    description: string;
    attachedImage?: string;
  }

  let slots: StepSlot[] = [
    { id: 'cover', title: 'Main Cover Photo', description: 'Hero image shown on top of recipe card.' },
    { id: 'step_1', title: 'Step 1: Prep & Butter', description: 'Heat 1 tbsp butter in pot over medium heat.' },
    { id: 'step_2', title: 'Step 2: Sauté Vegetables', description: 'Sauté leek, carrots, and potatoes for 5 mins.' },
    { id: 'step_4', title: 'Step 4: Purée Soup', description: 'Use immersion blender to partially purée.' }
  ];

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvas, 0, 0);

    if (activeCrop) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(activeCrop.x, activeCrop.y, activeCrop.w, activeCrop.h);

      const label = '✂️ Ready to Assign';
      ctx.fillStyle = '#10b981';
      ctx.fillRect(activeCrop.x, Math.max(0, activeCrop.y - 22), ctx.measureText(label).width + 12, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText(label, activeCrop.x + 6, Math.max(14, activeCrop.y - 6));
    }

    updateSlotsView();
  }

  function updateSlotsView() {
    const slotsEl = document.getElementById('vc-step-slots')!;
    const statusEl = document.getElementById('vc-selection-status')!;

    if (activeCrop) {
      statusEl.innerText = `${Math.round(activeCrop.w)}x${Math.round(activeCrop.h)}px box active`;
    } else {
      statusEl.innerText = 'Draw a box on canvas';
    }

    slotsEl.innerHTML = slots.map((slot) => `
      <div style="background: #0f172a; border: 1px solid var(--card-border); border-radius: 8px; padding: 0.75rem; display: flex; gap: 0.75rem; align-items: center;">
        
        <div style="width: 90px; height: 75px; background: #000; border: 1px dashed ${slot.attachedImage ? 'var(--success)' : '#334155'}; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${slot.attachedImage ? `<img src="${slot.attachedImage}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : '<span style="font-size: 0.7rem; color: var(--muted); text-align: center;">No image</span>'}
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.2rem;">
          <strong style="font-size: 0.85rem; color: var(--text);">${slot.title}</strong>
          <p style="margin: 0; font-size: 0.75rem; color: var(--muted); line-height: 1.3;">${slot.description}</p>
          
          <div style="margin-top: 0.3rem; display: flex; gap: 0.5rem; align-items: center;">
            <button data-assign-slot="${slot.id}" class="btn" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; ${!activeCrop ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
              ${slot.attachedImage ? '🔄 Replace Image' : '➕ Assign Active Crop'}
            </button>
            ${slot.attachedImage ? `<button data-clear-slot="${slot.id}" style="background: none; border: none; color: var(--danger); font-size: 0.75rem; cursor: pointer;">Remove</button>` : ''}
          </div>
        </div>

      </div>
    `).join('');

    slotsEl.querySelectorAll('[data-assign-slot]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!activeCrop) {
          alert('Draw a crop box on the canvas first!');
          return;
        }
        const slotId = (e.currentTarget as HTMLElement).getAttribute('data-assign-slot');
        const slot = slots.find(s => s.id === slotId);
        if (slot) {
          slot.attachedImage = extractCropDataUrl(baseCanvas, { x: activeCrop.x, y: activeCrop.y, width: activeCrop.w, height: activeCrop.h });
          redraw();
        }
      });
    });

    slotsEl.querySelectorAll('[data-clear-slot]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotId = (e.currentTarget as HTMLElement).getAttribute('data-clear-slot');
        const slot = slots.find(s => s.id === slotId);
        if (slot) {
          slot.attachedImage = undefined;
          redraw();
        }
      });
    });
  }

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);
    const w = Math.abs(curX - startX);
    const h = Math.abs(curY - startY);

    if (w > 20 && h > 20) {
      activeCrop = { x, y, w, h };
      redraw();
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
  });

  document.getElementById('vc-clear-selection')!.addEventListener('click', () => {
    activeCrop = null;
    redraw();
  });

  // Pre-assign sample image to cover & step 4
  const coverCrop = { x: 440, y: 80, width: 240, height: 150 };
  const step4Crop = { x: 440, y: 340, width: 240, height: 150 };
  slots[0].attachedImage = extractCropDataUrl(baseCanvas, coverCrop);
  slots[3].attachedImage = extractCropDataUrl(baseCanvas, step4Crop);

  redraw();
}

// ============================================================================
// PROTOTYPE ROUTER & SWITCHER
// ============================================================================
const VARIANTS = [
  { key: 'A', name: 'Variant A (Filmstrip Gallery)', render: renderVariantA },
  { key: 'B', name: 'Variant B (Drawer Inspector)', render: renderVariantB },
  { key: 'C', name: 'Variant C (Recipe Step Mapper)', render: renderVariantC }
];

function initPrototypeSwitcher() {
  const container = document.getElementById('variant-container')!;
  const labelEl = document.getElementById('current-variant-label')!;
  const prevBtn = document.getElementById('prev-variant')!;
  const nextBtn = document.getElementById('next-variant')!;
  const switcher = document.getElementById('prototype-switcher');

  if (switcher) switcher.style.display = 'flex';

  function getVariantFromURL(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get('variant') || 'A';
  }

  function setVariant(key: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', key);
    window.history.replaceState({}, '', url.toString());
    loadCurrentVariant();
  }

  function loadCurrentVariant() {
    const curKey = getVariantFromURL();
    const variant = VARIANTS.find(v => v.key === curKey) || VARIANTS[0];

    labelEl.innerText = `${variant.key}: ${variant.name}`;
    container.innerHTML = '';
    variant.render(container);
  }

  prevBtn.addEventListener('click', () => {
    const curKey = getVariantFromURL();
    const idx = VARIANTS.findIndex(v => v.key === curKey);
    const prevIdx = (idx - 1 + VARIANTS.length) % VARIANTS.length;
    setVariant(VARIANTS[prevIdx].key);
  });

  nextBtn.addEventListener('click', () => {
    const curKey = getVariantFromURL();
    const idx = VARIANTS.findIndex(v => v.key === curKey);
    const nextIdx = (idx + 1) % VARIANTS.length;
    setVariant(VARIANTS[nextIdx].key);
  });

  // Keyboard navigation (← and →)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });

  loadCurrentVariant();
}

initPrototypeSwitcher();
