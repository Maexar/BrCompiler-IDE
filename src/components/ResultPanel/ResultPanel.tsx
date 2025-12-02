import styles from './ResultPanel.module.css';
import type { CompileResponse } from '../../api';
import AstView from './AstView';
import { fetchAST } from '../../api';
import { useState, useEffect } from 'react';

interface ResultPanelProps {
  result: CompileResponse | null;
  code?: string;
}

export function ResultPanel({ result, code }: ResultPanelProps) {
  const [localAst, setLocalAst] = useState<any | null>(null);
  const [showAst, setShowAst] = useState(false);
  const [astLoading, setAstLoading] = useState(false);
  const [astError, setAstError] = useState<string | null>(null);

  useEffect(() => {
    // reset when result changes
    setLocalAst(result?.ast ?? null);
    setShowAst(false);
    setAstError(null);
    setAstLoading(false);
  }, [result]);

  const handleToggleAst = async () => {
    const next = !showAst;
    setShowAst(next);
    if (next && !localAst) {
      if (!code) {
        setAstError('Código não disponível para gerar AST');
        return;
      }
      setAstLoading(true);
      setAstError(null);
      try {
        const resp = await fetchAST(code);
        if (resp.success) {
          setLocalAst(resp.ast ?? null);
        } else {
          setAstError(resp.error ?? 'Erro ao obter AST');
        }
      } catch (e) {
        setAstError(String(e));
      } finally {
        setAstLoading(false);
      }
    }
  };

  const handleDownloadAst = () => {
    const ast = localAst || result?.ast;
    if (!ast) return;
    const blob = new Blob([JSON.stringify(ast, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ast.json';
    a.click();
    URL.revokeObjectURL(url);
  };
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

                  <div style={{ marginTop: 12 }}>
                    <button onClick={handleToggleAst} className={styles['ast-toggle']}>
                      {showAst ? 'Ocultar árvore' : 'Mostrar árvore'}
                    </button>
                    {(localAst || result?.ast) && (
                      <button onClick={handleDownloadAst} style={{ marginLeft: 8 }} className={styles['ast-download']}>Baixar árvore</button>
                    )}
                    {astLoading && <span style={{ marginLeft: 8 }}>Carregando árvore...</span>}
                    {astError && <div style={{ color: 'var(--color-error)', marginTop: 8 }}>{astError}</div>}
                    {showAst && (localAst || result?.ast) && (
                      <div style={{ marginTop: 8 }}>
                        <AstView ast={localAst || result?.ast} />
                      </div>
                    )}
                    {showAst && !localAst && !result?.ast && !astLoading && !astError && (
                      <div style={{ marginTop: 8, color: '#666' }}>Nenhuma AST disponível</div>
                    )}
                  </div>
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
