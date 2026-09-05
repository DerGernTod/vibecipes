import React, { useState } from 'react';
import { useLanguage } from './LanguageContext.tsx';

interface UrlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function UrlImportModal({ isOpen, onClose, onImport }: UrlImportModalProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        onImport(data);
        onClose();
        setUrl('');
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || t('Failed to fetch recipe from URL', 'Rezept konnte nicht von der URL geladen werden'));
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
        <h3>{t('Import Recipe from URL', 'Rezept von URL importieren')}</h3>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}
        <div className="form-group">
          <label>{t('Recipe URL', 'Rezept-URL')}</label>
          <input
            type="url"
            className="form-control"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/recipe"
            disabled={loading}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            {t('Cancel', 'Abbrechen')}
          </button>
          <button className="btn-primary" onClick={handleFetch} disabled={loading || !url.trim()}>
            {loading ? t('Importing...', 'Importiere...') : t('Import', 'Importieren')}
          </button>
        </div>
      </div>
    </div>
  );
}
