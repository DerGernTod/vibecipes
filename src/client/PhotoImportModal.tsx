import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageContext.tsx';
import { Button, Field, Input, Modal, Panel } from './ui/index.ts';
import {
  clampRect,
  displayPointToImage,
  isUsableRect,
  rectFromPoints,
  snapRectToPixels,
  type Point,
  type Rect,
} from '../domain/crop.ts';
import { cropToDataUrl, loadImageFile } from './ocr/cropImage.ts';
import { recognizeRegion, releaseOcrWorker } from './ocr/recognizeText.ts';

// What the editor receives when the user accepts the draft.
export interface PhotoImportDraft {
  title: string;
  steps: Array<{ instruction: string; imageUrl: string | null }>;
}

interface DraftStep {
  id: string;
  instruction: string;
  imageUrl: string | null;
}

type RegionStatus = 'reading' | 'done' | 'failed';

// A crop drawn on the photo. `target` is the draft step it goes to, or NEW_STEP.
interface PhotoRegion {
  id: string;
  rect: Rect;
  text: string;
  status: RegionStatus;
  target: string;
  sentTo: string | null;
}

const NEW_STEP = 'new';
const HIGHLIGHT = '#e0a526';

const joinText = (existing: string, addition: string) => {
  if (!addition) return existing;
  return existing.trim() ? `${existing.trim()}\n${addition}` : addition;
};

interface PhotoImportModalProps {
  onClose: () => void;
  onApply: (draft: PhotoImportDraft) => void;
}

// Mount this only while it is open: each mount starts with an empty session and its cleanup frees the OCR worker.
export function PhotoImportModal({ onClose, onApply }: PhotoImportModalProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef<Point | null>(null);
  const sourceUrl = useRef<string | null>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dragRect, setDragRect] = useState<Rect | null>(null);
  const [regions, setRegions] = useState<PhotoRegion[]>([]);
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<DraftStep[]>([]);

  useEffect(() => {
    return () => {
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
      void releaseOcrWorker();
    };
  }, []);

  // Redraws the photo with saved crops and the drag in progress.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);
    ctx.lineWidth = Math.max(2, image.naturalWidth / 300);
    ctx.strokeStyle = HIGHLIGHT;
    for (const region of regions) {
      const { left, top, width, height } = region.rect;
      ctx.strokeRect(left, top, width, height);
    }
    if (dragRect) {
      ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
      ctx.strokeRect(dragRect.left, dragRect.top, dragRect.width, dragRect.height);
      ctx.setLineDash([]);
    }
  }, [image, regions, dragRect]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const box = e.currentTarget.getBoundingClientRect();
    return displayPointToImage(
      { x: e.clientX - box.left, y: e.clientY - box.top },
      { width: box.width, height: box.height },
      { width: image?.naturalWidth ?? 0, height: image?.naturalHeight ?? 0 }
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image || e.button !== 0) return;
    const start = pointFromEvent(e);
    dragStart.current = start;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragRect(rectFromPoints(start, start));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStart.current) return;
    setDragRect(rectFromPoints(dragStart.current, pointFromEvent(e)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    setDragRect(null);
    if (!start || !image) return;
    const bounds = { width: image.naturalWidth, height: image.naturalHeight };
    const rect = clampRect(rectFromPoints(start, pointFromEvent(e)), bounds);
    if (isUsableRect(rect)) addRegion(image, rect);
  };

  const addRegion = (source: HTMLImageElement, rect: Rect) => {
    const id = crypto.randomUUID();
    setRegions((prev) => [...prev, { id, rect, text: '', status: 'reading', target: NEW_STEP, sentTo: null }]);
    recognizeRegion(source, snapRectToPixels(rect))
      .then((text) => setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, text, status: 'done' } : r))))
      .catch(() => setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'failed' } : r))));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLoadError(null);
    try {
      const loaded = await loadImageFile(file);
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
      sourceUrl.current = loaded.objectUrl;
      setImage(loaded.image);
      setRegions([]);
      setDragRect(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  };

  const updateRegion = (id: string, patch: Partial<PhotoRegion>) => {
    setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // Sends a crop to the draft: its text goes to the step, its photo fills the step's image slot.
  const sendRegion = (region: PhotoRegion) => {
    if (!image) return;
    const imageUrl = cropToDataUrl(image, snapRectToPixels(region.rect));
    const text = region.text.trim();
    const existingTarget = steps.some((s) => s.id === region.target);

    let stepId = region.target;
    if (!existingTarget) {
      stepId = crypto.randomUUID();
      setSteps((prev) => [...prev, { id: stepId, instruction: text, imageUrl }]);
    } else {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, instruction: joinText(s.instruction, text), imageUrl } : s))
      );
    }
    updateRegion(region.id, { sentTo: stepId });
  };

  const stepNumber = (id: string | null) => {
    const index = steps.findIndex((s) => s.id === id);
    return index === -1 ? null : index + 1;
  };

  const updateStep = (id: string, patch: Partial<DraftStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleApply = () => {
    const draftSteps = steps
      .map((s) => ({ instruction: s.instruction.trim(), imageUrl: s.imageUrl }))
      .filter((s) => s.instruction || s.imageUrl);
    onApply({ title: title.trim(), steps: draftSteps });
  };

  return (
    <Modal wide title={t('Import Recipe from Photo', 'Rezept aus Foto importieren')} onClose={onClose}>
      <div className="photo-import">
        <section className="photo-import__pane" aria-label={t('Photo', 'Foto')}>
          <Field label={t('Photo (cookbook or magazine page)', 'Foto (Kochbuch- oder Zeitschriftenseite)')} htmlFor="photo-file">
            <input id="photo-file" className="input" type="file" accept="image/*" onChange={handleFileChange} />
          </Field>
          {loadError && <div className="alert alert--error">{loadError}</div>}

          {image ? (
            <>
              <p className="field__hint">
                {t(
                  'Drag a box around text or a photo. Text is read on your device; nothing is uploaded.',
                  'Ziehe einen Rahmen um Text oder ein Foto. Der Text wird auf deinem Gerät gelesen; nichts wird hochgeladen.'
                )}
              </p>
              <canvas
                ref={canvasRef}
                className="photo-import__canvas"
                aria-label={t('Photo to crop', 'Foto zum Zuschneiden')}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                  dragStart.current = null;
                  setDragRect(null);
                }}
              />
            </>
          ) : (
            <p className="field__hint">{t('Choose a photo to start cropping.', 'Wähle ein Foto, um mit dem Zuschneiden zu beginnen.')}</p>
          )}

          <div className="photo-import__regions">
            {regions.map((region, index) => (
              <div key={region.id} className="photo-region">
                <div className="photo-region__head">
                  <strong>{t('Region', 'Bereich')} {index + 1}</strong>
                  {region.status === 'reading' && <span className="field__hint">{t('Reading text…', 'Lese Text…')}</span>}
                  {region.status === 'failed' && (
                    <span className="field__hint">{t('Text could not be read', 'Text konnte nicht gelesen werden')}</span>
                  )}
                </div>
                <textarea
                  className="input"
                  rows={3}
                  aria-label={t('Extracted text', 'Erkannter Text')}
                  value={region.text}
                  disabled={region.status === 'reading'}
                  onChange={(e) => updateRegion(region.id, { text: e.target.value })}
                />
                <div className="photo-region__actions">
                  <select
                    className="input"
                    aria-label={t('Send to', 'Senden an')}
                    value={region.target}
                    onChange={(e) => updateRegion(region.id, { target: e.target.value })}
                  >
                    <option value={NEW_STEP}>{t('New step', 'Neuer Schritt')}</option>
                    {steps.map((s, i) => (
                      <option key={s.id} value={s.id}>
                        {t('Step', 'Schritt')} {i + 1}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => sendRegion(region)} disabled={region.status === 'reading'}>
                    {t('Add to draft', 'Zum Entwurf hinzufügen')}
                  </Button>
                  {region.sentTo && (
                    <span className="field__hint">
                      {t('Sent to step', 'Gesendet an Schritt')} {stepNumber(region.sentTo)}
                    </span>
                  )}
                  <Button variant="danger" size="sm" aria-label={t('Remove region', 'Bereich entfernen')} onClick={() => setRegions((prev) => prev.filter((r) => r.id !== region.id))}>
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="photo-import__pane" aria-label={t('Draft recipe', 'Rezeptentwurf')}>
          <Field label={t('Recipe Title *', 'Rezepttitel *')} htmlFor="photo-title">
            <Input id="photo-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <div className="editor-header">
            <h3>{t('Draft steps', 'Entwurfsschritte')}</h3>
            <Button size="sm" onClick={() => setSteps((prev) => [...prev, { id: crypto.randomUUID(), instruction: '', imageUrl: null }])}>
              + {t('Add Step', 'Schritt hinzufügen')}
            </Button>
          </div>
          <p className="field__hint">
            {t('Each step has one photo slot. Adding another crop to the same step replaces its photo.', 'Jeder Schritt hat einen Fotoplatz. Ein weiterer Ausschnitt für denselben Schritt ersetzt das Foto.')}
          </p>

          {steps.length === 0 && (
            <p className="editor-step__empty">{t('No steps yet. Add a region or a step.', 'Noch keine Schritte. Füge einen Bereich oder Schritt hinzu.')}</p>
          )}

          {steps.map((step, index) => (
            <Panel key={step.id} tone="raised" padding="sm" className="photo-step">
              <div className="editor-header">
                <strong className="editor-step__number">
                  {t('Step', 'Schritt')} {index + 1}
                </strong>
                <Button variant="danger" size="sm" onClick={() => setSteps((prev) => prev.filter((s) => s.id !== step.id))}>
                  ✕ {t('Remove Step', 'Schritt entfernen')}
                </Button>
              </div>
              <textarea
                className="input"
                rows={3}
                aria-label={`${t('Step', 'Schritt')} ${index + 1} ${t('instruction', 'Anweisung')}`}
                value={step.instruction}
                onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
              />
              {step.imageUrl ? (
                <div className="photo-step__image">
                  <img src={step.imageUrl} alt={t('Step photo', 'Schrittfoto')} />
                  <Button size="sm" onClick={() => updateStep(step.id, { imageUrl: null })}>
                    {t('Remove photo', 'Foto entfernen')}
                  </Button>
                </div>
              ) : (
                <p className="field__hint">{t('No photo for this step', 'Kein Foto für diesen Schritt')}</p>
              )}
            </Panel>
          ))}
        </section>
      </div>

      <div className="modal__actions">
        <Button onClick={onClose}>{t('Cancel', 'Abbrechen')}</Button>
        <Button variant="primary" onClick={handleApply} disabled={!title.trim()}>
          {t('Use draft in recipe', 'Entwurf im Rezept verwenden')}
        </Button>
      </div>
    </Modal>
  );
}
