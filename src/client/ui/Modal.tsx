import React from 'react';
import { useLanguage } from '../LanguageContext.tsx';

interface ModalProps {
  title: string;
  onClose: () => void;
  /** Blocks the close button while work is in flight. */
  closeDisabled?: boolean;
  children: React.ReactNode;
}

/** Centred dialog over a dimmed backdrop. Closes only via the × button; callers own the rest. */
export function Modal({ title, onClose, closeDisabled = false, children }: ModalProps) {
  const { t } = useLanguage();
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label={t('Close', 'Schließen')}
        >
          ×
        </button>
        <h2 className="modal__title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
