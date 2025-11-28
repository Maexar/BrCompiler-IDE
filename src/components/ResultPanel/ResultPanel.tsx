import styles from './ResultPanel.module.css';
import type { CompileResponse } from '../../api';

interface ResultPanelProps {
  result: CompileResponse | null;
}

export function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div className={styles['result-panel']}>
      <div className={styles['result-header']}>
        <h2>📋 Resultado da Compilação</h2>
      </div>

      <div className={styles['result-content']}>
        {result ? (
          <div
            className={`${styles['result-box']} ${
              result.success ? styles.success : styles.error
            }`}
          >
            <div className={styles['result-title']}>
              <span className={styles['result-icon']}>
                {result.success ? '✓' : '✕'}
              </span>
              <h3>
                {result.success
                  ? 'Compilação Bem-Sucedida'
                  : 'Erro na Compilação'}
              </h3>
            </div>

            <div className={styles['result-body']}>
              {result.success ? (
                <>
                  <p className={styles['result-message']}>{result.message}</p>
                  {result.lines && (
                    <div className={styles['result-detail']}>
                      <strong>Linhas compiladas:</strong> {result.lines}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <pre className={styles['error-message']}>{result.error}</pre>
                  {result.line && (
                    <div className={styles['error-location']}>
                      <strong>Posição:</strong> Linha {result.line}, Coluna{' '}
                      {result.column}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles['placeholder-icon']}>📋</div>
            <p>
              Clique em <strong>▶ Compilar</strong> ou pressione{' '}
              <kbd>Ctrl+Enter</kbd>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
