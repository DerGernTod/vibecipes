import React, { useState } from 'react';
import { useLanguage } from './LanguageContext.tsx';
import { Button, Field } from './ui/index.ts';
import { importReportResponseSchema, type ImportReportRequest } from '../shared/schemas.ts';
import { readErrorMessage, readJson } from './http.ts';

// Lets the user report a wrong extraction for an import they applied. The editor passes a new
// `key` per import so the note and send state reset with it.
export function ImportReportForm({ report }: { report: ImportReportRequest }) {
  const { t } = useLanguage();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let buttonLabel = t('Report import problem', 'Importproblem melden');
  if (sending) buttonLabel = t('Sending...', 'Sende...');
  if (sent) buttonLabel = t('Reported', 'Gemeldet');

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/import-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, userMessage: note.trim() || undefined }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res, t('Could not send the report', 'Bericht konnte nicht gesendet werden')));
        return;
      }
      await readJson(res, importReportResponseSchema);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const disabled = sending || sent;

  return (
    <div className="import-report">
      <Field label={t('What went wrong? (optional)', 'Was lief schief? (optional)')} htmlFor="import-report-note">
        <textarea
          id="import-report-note"
          className="input"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={disabled}
        />
      </Field>
      {sent && (
        <div className="alert alert--success">{t('Thanks, the report was saved.', 'Danke, der Bericht wurde gespeichert.')}</div>
      )}
      {error && <div className="alert alert--error">{error}</div>}
      <div className="import-report__actions">
        <Button onClick={handleSend} disabled={disabled}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
