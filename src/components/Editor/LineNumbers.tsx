import { forwardRef, useMemo } from 'react';
import styles from './LineNumbers.module.css';
import type { EditorError } from '../../api';

interface LineNumbersProps {
  lineCount: number;
  errors?: EditorError[];
  onLineClick?: (line: number) => void;
}

export const LineNumbers = forwardRef<HTMLDivElement, LineNumbersProps>(
  ({ lineCount, errors = [], onLineClick }, ref) => {
    
    // Cria um mapa de erros por linha para acesso rapido
    const errorsByLine = useMemo(() => {
      const map = new Map<number, EditorError[]>();
      
      for (const error of errors) {
        if (error.line > 0) {
          const lineErrors = map.get(error.line) || [];
          lineErrors.push(error);
          map.set(error.line, lineErrors);
        }
      }
      
      return map;
    }, [errors]);
    
    // Determina a classe CSS baseada no tipo de erro
    const getErrorClass = (lineErrors: EditorError[] | undefined): string => {
      if (!lineErrors || lineErrors.length === 0) return '';
      
      // Prioridade: syntax > semantic > lexical > balance
      const hasSyntax = lineErrors.some(e => e.type === 'syntax');
      const hasSemantic = lineErrors.some(e => e.type === 'semantic');
      const hasLexical = lineErrors.some(e => e.type === 'lexical');
      
      if (hasSyntax) return styles['line-error-syntax'];
      if (hasSemantic) return styles['line-error-semantic'];
      if (hasLexical) return styles['line-error-lexical'];
      return styles['line-error-balance'];
    };
    
    // Gera tooltip com todos os erros da linha
    const getErrorTooltip = (lineErrors: EditorError[] | undefined): string => {
      if (!lineErrors || lineErrors.length === 0) return '';
      
      return lineErrors.map(e => e.message).join('\n');
    };
    
    const handleLineClick = (lineNumber: number) => {
      if (onLineClick) {
        onLineClick(lineNumber);
      }
    };
    
    return (
      <div className={styles['line-numbers']} ref={ref}>
        {Array.from({ length: lineCount }, (_, i) => {
          const lineNumber = i + 1;
          const lineErrors = errorsByLine.get(lineNumber);
          const hasError = lineErrors && lineErrors.length > 0;
          const errorClass = getErrorClass(lineErrors);
          const tooltip = getErrorTooltip(lineErrors);
          
          return (
            <div 
              key={lineNumber} 
              className={`${styles['line-number']} ${errorClass}`}
              title={tooltip}
              onClick={() => handleLineClick(lineNumber)}
              style={{ cursor: hasError ? 'pointer' : 'default' }}
            >
              {hasError && (
                <span className={styles['error-indicator']}>!</span>
              )}
              <span className={styles['line-number-text']}>{lineNumber}</span>
            </div>
          );
        })}
      </div>
    );
  }
);

LineNumbers.displayName = 'LineNumbers';
