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
                  {/* VERIFICACAO: Se existe array de multiplos erros */}
                  {result.errors && result.errors.length > 0 ? (
                    <div className={styles['multiple-errors']}>
                      <div className={styles['error-count']}>
                        {result.errors.length} erro(s) encontrado(s):
                      </div>
                      {result.errors.map((error, index) => (
                        <div key={index} className={styles['error-item']}>
                          <div className={styles['error-number']}>
                            Erro #{index + 1}
                          </div>
                          <pre className={styles['error-message']}>
                            {error.message}
                          </pre>
                          <div className={styles['error-location']}>
                            <strong>Posição:</strong> Linha {error.line}, Coluna{' '}
                            {error.column}
                          </div>
                          {error.context && (
                            <div className={styles['error-detail']}>
                              <strong>Contexto:</strong> {error.context}
                            </div>
                          )}
                          {error.foundToken && (
                            <div className={styles['error-detail']}>
                              <strong>Token encontrado:</strong> {error.foundToken}
                            </div>
                          )}
                          {error.expectedTokens && (
                            <div className={styles['error-detail']}>
                              <strong>Era esperado:</strong> {error.expectedTokens}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* MANTIDO: Exibicao de erro unico (lexico ou nao recuperavel) */
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
