import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './UnsavedChangesDialog.module.css';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  unsavedFiles: string[];
  onSaveAll: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  unsavedFiles,
  onSaveAll,
  onDiscard,
  onCancel
}: UnsavedChangesDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Foca no diálogo quando aberto
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  // Handler para tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles['dialog-overlay']} onClick={onCancel}>
      <div
        ref={dialogRef}
        className={styles['dialog-container']}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className={styles['dialog-header']}>
          <div className={styles['dialog-icon']}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 id="dialog-title" className={styles['dialog-title']}>
            Alterações não salvas
          </h2>
        </div>

        <div id="dialog-description" className={styles['dialog-content']}>
          <p className={styles['dialog-message']}>
            Você tem {unsavedFiles.length} arquivo{unsavedFiles.length > 1 ? 's' : ''} com alterações não salvas.
            Se você sair agora, essas alterações serão perdidas.
          </p>

          {unsavedFiles.length > 0 && unsavedFiles.length <= 5 && (
            <ul className={styles['file-list']}>
              {unsavedFiles.map((fileName) => (
                <li key={fileName} className={styles['file-item']}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>{fileName}</span>
                  <span className={styles['modified-badge']}>modificado</span>
                </li>
              ))}
            </ul>
          )}

          {unsavedFiles.length > 5 && (
            <p className={styles['more-files']}>
              E mais {unsavedFiles.length - 5} arquivo(s)...
            </p>
          )}
        </div>

        <div className={styles['dialog-actions']}>
          <button
            className={`${styles['dialog-btn']} ${styles['btn-secondary']}`}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className={`${styles['dialog-btn']} ${styles['btn-danger']}`}
            onClick={onDiscard}
          >
            Descartar alterações
          </button>
          <button
            className={`${styles['dialog-btn']} ${styles['btn-primary']}`}
            onClick={onSaveAll}
          >
            Salvar todos
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
