import { forwardRef, useMemo, useCallback, useEffect, useState } from 'react';
import styles from './CodeEditor.module.css';
import { EditorToolbar } from './EditorToolbar';
import { LineNumbers } from './LineNumbers';
import type { FileItem } from '../../types';
import type { EditorError } from '../../api';

interface CodeEditorProps {
  code: string;
  currentFile: string | null;
  currentFileObj: FileItem | undefined;
  connected: boolean;
  loading: boolean;
  canUndo: boolean;
  canRedo: boolean;
  lineNumbersRef: React.RefObject<HTMLDivElement | null>;
  errors?: EditorError[];
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
      errors = [],
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
    
    // Estado para linha selecionada (quando clica em erro)
    const [selectedErrorLine, setSelectedErrorLine] = useState<number | null>(null);
    
    // Linhas com erros para o overlay
    const errorLines = useMemo(() => {
      const lines = new Set<number>();
      for (const error of errors) {
        if (error.line > 0) {
          lines.add(error.line);
        }
      }
      return lines;
    }, [errors]);
    
    // Mapa de erros por linha para estilos
    const errorsByLine = useMemo(() => {
      const map = new Map<number, EditorError>();
      for (const error of errors) {
        if (error.line > 0 && !map.has(error.line)) {
          map.set(error.line, error);
        }
      }
      return map;
    }, [errors]);
    
    // Handler para clique em linha com erro
    const handleLineClick = useCallback((line: number) => {
      setSelectedErrorLine(line);
      
      // Move o cursor para a linha clicada
      if (ref && 'current' in ref && ref.current) {
        const textarea = ref.current;
        const lines = code.split('\n');
        
        // Calcula posicao do inicio da linha
        let position = 0;
        for (let i = 0; i < line - 1 && i < lines.length; i++) {
          position += lines[i].length + 1; // +1 para o \n
        }
        
        // Encontra a coluna do erro
        const error = errorsByLine.get(line);
        if (error && error.column > 0) {
          position += Math.min(error.column - 1, lines[line - 1]?.length || 0);
        }
        
        textarea.focus();
        textarea.setSelectionRange(position, position);
        
        // Scroll para a linha
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
        const scrollTop = (line - 5) * lineHeight; // 5 linhas de margem
        textarea.scrollTop = Math.max(0, scrollTop);
      }
    }, [code, ref, errorsByLine]);
    
    // Limpa linha selecionada quando codigo muda
    useEffect(() => {
      setSelectedErrorLine(null);
    }, [code]);
    
    // Gera o overlay de realce de linhas
    const renderErrorOverlay = () => {
      if (errorLines.size === 0) return null;
      
      const lines = code.split('\n');
      
      return (
        <div className={styles['error-overlay']} aria-hidden="true">
          {lines.map((_, index) => {
            const lineNumber = index + 1;
            const error = errorsByLine.get(lineNumber);
            const isSelected = selectedErrorLine === lineNumber;
            
            if (!error) {
              return <div key={lineNumber} className={styles['overlay-line']} />;
            }
            
            let errorClass = styles['overlay-line-error'];
            
            switch (error.type) {
              case 'syntax':
                errorClass += ' ' + styles['overlay-error-syntax'];
                break;
              case 'semantic':
                errorClass += ' ' + styles['overlay-error-semantic'];
                break;
              case 'lexical':
                errorClass += ' ' + styles['overlay-error-lexical'];
                break;
              case 'balance':
                errorClass += ' ' + styles['overlay-error-balance'];
                break;
            }
            
            if (isSelected) {
              errorClass += ' ' + styles['overlay-line-selected'];
            }
            
            return (
              <div 
                key={lineNumber} 
                className={errorClass}
                title={error.message}
              />
            );
          })}
        </div>
      );
    };
    
    // Contagem de erros por tipo
    const errorCounts = useMemo(() => {
      const counts = { syntax: 0, semantic: 0, lexical: 0, balance: 0 };
      for (const error of errors) {
        counts[error.type]++;
      }
      return counts;
    }, [errors]);
    
    const hasErrors = errors.length > 0;

    return (
      <div className={styles['editor-panel']}>
        <div className={styles['editor-header']}>
          <div className={styles['editor-title']}>
            {currentFile ? (
              <>
                <span role="img" aria-label="file">&#128196;</span> {getNameFromPath(currentFile)}
                {currentFileObj?.isDirty && (
                  <span className={styles['dirty-indicator']}>&#9679;</span>
                )}
              </>
            ) : (
              'Codigo Fonte'
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

        {/* Barra de resumo de erros */}
        {hasErrors && (
          <div className={styles['error-summary']}>
            <span className={styles['error-summary-icon']}>&#9888;</span>
            <span className={styles['error-summary-text']}>
              {errors.length} erro{errors.length > 1 ? 's' : ''} encontrado{errors.length > 1 ? 's' : ''}
            </span>
            <div className={styles['error-summary-badges']}>
              {errorCounts.syntax > 0 && (
                <span className={`${styles['error-badge']} ${styles['error-badge-syntax']}`}>
                  {errorCounts.syntax} sintatico{errorCounts.syntax > 1 ? 's' : ''}
                </span>
              )}
              {errorCounts.semantic > 0 && (
                <span className={`${styles['error-badge']} ${styles['error-badge-semantic']}`}>
                  {errorCounts.semantic} semantico{errorCounts.semantic > 1 ? 's' : ''}
                </span>
              )}
              {errorCounts.lexical > 0 && (
                <span className={`${styles['error-badge']} ${styles['error-badge-lexical']}`}>
                  {errorCounts.lexical} lexico{errorCounts.lexical > 1 ? 's' : ''}
                </span>
              )}
              {errorCounts.balance > 0 && (
                <span className={`${styles['error-badge']} ${styles['error-badge-balance']}`}>
                  {errorCounts.balance} balanceamento
                </span>
              )}
            </div>
          </div>
        )}

        <div className={styles['editor-wrapper']}>
          <LineNumbers 
            lineCount={lineCount} 
            ref={lineNumbersRef}
            errors={errors}
            onLineClick={handleLineClick}
          />

          <div className={styles['editor-content']}>
            {renderErrorOverlay()}
            
            <textarea
              ref={ref}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={onKeyDown}
              onScroll={onScroll}
              placeholder="Comece a digitar seu codigo BrCompiler aqui..."
              className={styles['code-editor']}
              disabled={!connected}
              spellCheck="false"
            />
          </div>
        </div>

        <div className={styles['editor-footer']}>
          <span>Tab size: 2 espacos</span>
          <span>&#8226;</span>
          <span>Encoding: UTF-8</span>
          <span>&#8226;</span>
          <span>Ctrl+Z/Ctrl+Y &#8226; Ctrl+Enter &#8226; Ctrl+S</span>
        </div>
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
