import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  loading: boolean;
  connected: boolean;
  currentFile: string | null;
  lineCount: number;
  charCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onCompile: () => void;
  onClear: () => void;
  onSave: () => void;
}

export function EditorToolbar({
  canUndo,
  canRedo,
  loading,
  connected,
  currentFile,
  lineCount,
  charCount,
  onUndo,
  onRedo,
  onCompile,
  onClear,
  onSave
}: EditorToolbarProps) {
  return (
    <div className={styles['editor-toolbar']}>
      <div className={styles['toolbar-group']}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={styles['toolbar-btn']}
          title="Desfazer (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={styles['toolbar-btn']}
          title="Refazer (Ctrl+Y)"
        >
          ↷
        </button>
      </div>

      <div className={styles['toolbar-separator']} />

      <div className={styles['toolbar-group']}>
        <button
          onClick={onCompile}
          disabled={loading || !connected}
          className={`${styles['toolbar-btn']} ${styles.primary}`}
          title="Compilar (Ctrl+Enter)"
        >
          ▶
        </button>
        <button
          onClick={onClear}
          className={styles['toolbar-btn']}
          disabled={!connected}
          title="Limpar editor"
        >
          🗑️
        </button>
        <button
          onClick={onSave}
          className={styles['toolbar-btn']}
          disabled={!currentFile}
          title="Salvar arquivo (Ctrl+S)"
        >
          💾
        </button>
      </div>

      <div className={styles['toolbar-separator']} />

      <div className={styles['editor-stats']}>
        <span className={styles['stat-badge']}>{lineCount} linhas</span>
        <span className={styles['stat-badge']}>{charCount} caracteres</span>
      </div>
    </div>
  );
}
