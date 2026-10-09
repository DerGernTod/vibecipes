import React, { useState } from 'react';
import { useLanguage } from './LanguageContext.tsx';
import { Button, Field, Input, Modal } from './ui/index.ts';
import { importedRecipeSchema, type ImportedRecipe } from '../shared/schemas.ts';
import { readErrorMessage, readJson } from './http.ts';

// Where an imported recipe came from. The editor keeps this so the user can report the extraction.
export interface ImportOrigin {
  url: string;
  httpStatus: number;
}

interface UrlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (recipe: ImportedRecipe, origin: ImportOrigin) => void;
}

// On success the modal closes and the editor shows the result, including the report form.
// On failure the modal shows the error and stays open.
export function UrlImportModal({ isOpen, onClose, onImport }: UrlImportModalProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError(null);
  };

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      });
      if (res.ok) {
        const recipe = await readJson(res, importedRecipeSchema);
        onImport(recipe, { url: trimmed, httpStatus: res.status });
        setUrl('');
        onClose();
      } else {
        setError(await readErrorMessage(res, t('Failed to fetch recipe from URL', 'Rezept konnte nicht von der URL geladen werden')));
      }
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={t('Import Recipe from URL', 'Rezept von URL importieren')} onClose={onClose} closeDisabled={loading}>
      <Field label={t('Recipe URL', 'Rezept-URL')} htmlFor="import-url">
        <Input
          id="import-url"
          type="url"
          value={url}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="https://example.com/recipe"
          disabled={loading}
        />
      </Field>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="modal__actions">
        <Button onClick={onClose} disabled={loading}>
          {t('Cancel', 'Abbrechen')}
        </Button>
        <Button variant="primary" onClick={handleImport} disabled={loading || !url.trim()}>
          {loading ? t('Importing...', 'Importiere...') : t('Import', 'Importieren')}
        </Button>
      </div>
    </Modal>
  );
}
