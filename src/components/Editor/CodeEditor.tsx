import { forwardRef } from 'react';
import styles from './CodeEditor.module.css';
import { EditorToolbar } from './EditorToolbar';
import { LineNumbers } from './LineNumbers';
import type { FileItem } from '../../types';

interface CodeEditorProps {
  code: string;
  currentFile: string | null;
  currentFileObj: FileItem | undefined;
  connected: boolean;
  loading: boolean;
  canUndo: boolean;
  canRedo: boolean;
  lineNumbersRef: React.RefObject<HTMLDivElement | null>;
  onCodeChange: (code: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onScroll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCompile: () => void;
  onClear: () => void;
  onSave: () => void;
  getNameFromPath: (path: string) => string;
}

export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  (
    {
      code,
      currentFile,
      currentFileObj,
      connected,
      loading,
      canUndo,
      canRedo,
      lineNumbersRef,
      onCodeChange,
      onKeyDown,
      onScroll,
      onUndo,
      onRedo,
      onCompile,
      onClear,
      onSave,
      getNameFromPath
    },
    ref
  ) => {
    const lineCount = code.split('\n').length;
    const charCount = code.length;

    return (
      <div className={styles['editor-panel']}>
        <div className={styles['editor-header']}>
          <div className={styles['editor-title']}>
            {currentFile ? (
              <>
                📝 {getNameFromPath(currentFile)}
                {currentFileObj?.isDirty && (
                  <span className={styles['dirty-indicator']}>●</span>
                )}
              </>
            ) : (
              'Código Fonte'
            )}
          </div>

          <EditorToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            loading={loading}
            connected={connected}
            currentFile={currentFile}
            lineCount={lineCount}
            charCount={charCount}
            onUndo={onUndo}
            onRedo={onRedo}
            onCompile={onCompile}
            onClear={onClear}
            onSave={onSave}
          />
        </div>

        <div className={styles['editor-wrapper']}>
          <LineNumbers lineCount={lineCount} ref={lineNumbersRef} />

          <textarea
            ref={ref}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={onScroll}
            placeholder="Comece a digitar seu código BrCompiler aqui..."
            className={styles['code-editor']}
            disabled={!connected}
            spellCheck="false"
          />
        </div>

        <div className={styles['editor-footer']}>
          <span>Tab size: 2 espaços</span>
          <span>•</span>
          <span>Encoding: UTF-8</span>
          <span>•</span>
          <span>Ctrl+Z/Ctrl+Y • Ctrl+Enter • Ctrl+S</span>
        </div>
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
