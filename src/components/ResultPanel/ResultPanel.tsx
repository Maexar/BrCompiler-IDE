// src/components/ResultPanel/ResultPanel.tsx
import { useState, useEffect, useRef } from 'react';
import styles from './ResultPanel.module.css';
import type { CompileResponse, Token } from '../../api';
import AstView from './AstView';
import { TokensView } from './TokensView';
import { fetchAST, fetchTokens } from '../../api';
import { TabNavigation, type TabId, type Tab } from './TabNavigation';

interface ResultPanelProps {
  result: CompileResponse | null;
  code?: string;
}

const TABS: Tab[] = [
  { id: 'resultado', label: 'Resultado', icon: '📋' },
  { id: 'tokens', label: 'Tokens', icon: '🔤' },
  { id: 'arvore', label: 'Arvore', icon: '🌳' }
];

export function ResultPanel({ result, code }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('resultado');
  const [localAst, setLocalAst] = useState<any | null>(null);
  const [astLoading, setAstLoading] = useState(false);
  const [astError, setAstError] = useState<string | null>(null);
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);

  const tokensRequestInProgress = useRef(false);
  const astRequestInProgress = useRef(false);
  const lastCodeForTokens = useRef<string>('');
  const lastCodeForAst = useRef<string>('');

  useEffect(() => {
    setLocalAst(result?.ast ?? null);
    setAstError(null);
    setAstLoading(false);
    setTokens([]);
    setTokensError(null);
    setTokensLoading(false);
    setActiveTab('resultado');

    tokensRequestInProgress.current = false;
    astRequestInProgress.current = false;
    lastCodeForTokens.current = '';
    lastCodeForAst.current = '';
  }, [result]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);

    if (tabId === 'arvore' && !localAst && !astLoading && !astError) {
      loadAst();
    }

    if (tabId === 'tokens' && tokens.length === 0 && !tokensLoading && !tokensError) {
      loadTokens();
    }
  };

  const loadAst = async () => {
    if (!code) {
      setAstError('Codigo nao disponivel para gerar AST');
      return;
    }

    // Prevenir múltiplas chamadas simultâneas
    if (astRequestInProgress.current) {
      console.log('[FRONTEND] Requisição de AST já em andamento, ignorando');
      return;
    }

    // Se já carregou para este código, não carregar novamente
    if (lastCodeForAst.current === code && localAst) {
      console.log('[FRONTEND] AST já carregada para este código');
      return;
    }

    astRequestInProgress.current = true;
    setAstLoading(true);
    setAstError(null);
    try {
      console.log('[FRONTEND] Carregando AST...');
      const resp = await fetchAST(code);
      if (resp.success) {
        setLocalAst(resp.ast ?? null);
      } else {
        setAstError(resp.error ?? 'Erro ao obter AST');
      }
    } catch (e) {
      console.error('[FRONTEND] Erro ao carregar AST:', e);
      setAstError(String(e));
    } finally {
      setAstLoading(false);
    }
  };

  const loadTokens = async () => {
    if (!code) {
      setTokensError('Codigo nao disponivel para gerar tokens');
      return;
    }

    // Prevenir múltiplas chamadas simultâneas
    if (tokensRequestInProgress.current) {
      console.log('[FRONTEND] Requisição de tokens já em andamento, ignorando');
      return;
    }

    // Se já carregou para este código, não carregar novamente
    if (lastCodeForTokens.current === code && tokens.length > 0) {
      console.log('[FRONTEND] Tokens já carregados para este código');
      return;
    }

    tokensRequestInProgress.current = true;
    setTokensLoading(true);
    setTokensError(null);
    try {
      console.log('[FRONTEND] Carregando tokens...');
      const resp = await fetchTokens(code);
      if (resp.success && resp.tokens) {
        setTokens(resp.tokens);
        lastCodeForTokens.current = code;
        console.log('[FRONTEND] Tokens carregados com sucesso:', resp.tokens.length);
      } else {
        setTokensError(resp.error ?? 'Erro ao obter tokens');
      }
    } catch (e) {
      console.error('[FRONTEND] Erro ao carregar tokens:', e);
      setTokensError(String(e));
    } finally {
      setTokensLoading(false);
      tokensRequestInProgress.current = false;
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resultado':
        return renderResultadoTab();
      case 'tokens':
        return renderTokensTab();
      case 'arvore':
        return renderArvoreTab();
      default:
        return null;
    }
  };

  const renderResultadoTab = () => {
    if (!result) {
      return (
        <div className={styles.placeholder}>
          <div className={styles['placeholder-icon']}>📋</div>
          <p>
            Clique em <strong>▶ Compilar</strong> ou pressione{' '}
            <kbd>Ctrl+Enter</kbd>
          </p>
        </div>
      );
    }

    return (
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
              ? 'Compilacao Bem-Sucedida'
              : 'Erro na Compilacao'}
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
                        <strong>Posicao:</strong> Linha {error.line}, Coluna{' '}
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
                <>
                  <pre className={styles['error-message']}>{result.error}</pre>
                  {result.line && (
                    <div className={styles['error-location']}>
                      <strong>Posicao:</strong> Linha {result.line}, Coluna{' '}
                      {result.column}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTokensTab = () => {
    if (!code) {
      return (
        <div className={styles.placeholder}>
          <div className={styles['placeholder-icon']}>🔤</div>
          <p>Escreva codigo para visualizar os tokens</p>
        </div>
      );
    }

    if (tokensLoading) {
      return (
        <div className={styles.placeholder}>
          <div className={styles['placeholder-icon']}>⏳</div>
          <p>Carregando tokens...</p>
        </div>
      );
    }

    if (tokensError) {
      return (
        <div className={styles.placeholder}>
          <div className={styles['placeholder-icon']}>❌</div>
          <p style={{ color: 'var(--color-error)' }}>{tokensError}</p>
        </div>
      );
    }

    if (tokens.length === 0) {
      return (
        <div className={styles.placeholder}>
          <div className={styles['placeholder-icon']}>📭</div>
          <p>Nenhum token encontrado</p>
        </div>
      );
    }

    return <TokensView tokens={tokens} />;
  };

  const renderArvoreTab = () => {
    if (!result) {
      return (
        <div className={styles.placeholder}>
          <div className={styles['placeholder-icon']}>🌳</div>
          <p>Compile o codigo para visualizar a arvore de derivacao</p>
        </div>
      );
    }

    if (!result.success) {
      return (
        <div className={styles.placeholder}>
          <div className={styles['placeholder-icon']}>⚠️</div>
          <p>A arvore so esta disponivel para compilacao bem-sucedida</p>
        </div>
      );
    }

    return (
      <div className={styles['ast-container']}>
        {astLoading && (
          <div className={styles.placeholder}>
            <div className={styles['placeholder-icon']}>⏳</div>
            <p>Carregando arvore de derivacao...</p>
          </div>
        )}

        {astError && (
          <div className={styles.placeholder}>
            <div className={styles['placeholder-icon']}>❌</div>
            <p style={{ color: 'var(--color-error)' }}>{astError}</p>
          </div>
        )}

        {!astLoading && !astError && (localAst || result?.ast) && (
          <>
            <div className={styles['ast-actions']}>
              <button onClick={handleDownloadAst} className={styles['ast-download']}>
                ⬇️ Baixar arvore (JSON)
              </button>
            </div>
            <div className={styles['ast-view-wrapper']}>
              <AstView ast={localAst || result?.ast} />
            </div>
          </>
        )}

        {!astLoading && !astError && !localAst && !result?.ast && (
          <div className={styles.placeholder}>
            <div className={styles['placeholder-icon']}>📭</div>
            <p>Nenhuma arvore disponivel</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles['result-panel']}>
      <div className={styles['result-header']}>
        <h2>📋 Resultado da Compilacao</h2>
      </div>

      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      <div className={styles['result-content']}>
        {renderTabContent()}
      </div>
    </div>
  );
}
