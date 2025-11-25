import { useState, useEffect } from 'react';
import { compileCode, checkHealth, type CompileResponse } from './api';
import './App.css';

function App() {
  const [code, setCode] = useState('gambiarra abre-te-sesamo stonks x receba 10 br fecha-te-sesamo');
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // verifica a conexao com compilador
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkHealth();
      setConnected(isConnected);
      setCheckingConnection(false);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCompile = async () => {
    setLoading(true);
    const response = await compileCode(code);
    setResult(response);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading && connected) {
        handleCompile();
      }
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>🎯 BrCompiler IDE</h1>
          <span className="version">v1.0</span>
        </div>
        <div className={`status ${connected ? 'connected' : checkingConnection ? 'checking' : 'disconnected'}`}>
          {checkingConnection ? (
            <>⏳ Verificando...</>
          ) : connected ? (
            <>Conectado ao compilador</>
          ) : (
            <> Desconectado: inicie CompilerRestServer no eclipse</>
          )}
        </div>
      </header>

      <main className="main">
        <div className="editor-container">
          <div className="panel-header">
            <h2>📝 Codigo Fonte</h2>
            <span className="char-count">{code.length} caracteres</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite código BrCompiler aqui..."
            className="editor"
            disabled={!connected}
          />
          <div className="editor-footer">
            <span>📄 {lineCount} linhas</span>
            <span className="hint">Ctrl+Enter para compilar</span>
          </div>
        </div>

        <div className="actions">
          <button
            onClick={handleCompile}
            disabled={loading || !connected}
            className={`compile-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>⏳ Compilando...</>
            ) : (
              <>▶️ Compilar</>
            )}
          </button>
        </div>

        <div className="result-container">
          <div className="panel-header">
            <h2>📋 Resultado</h2>
          </div>
          <div className="result-content">
            {result ? (
              <div className={`result ${result.success ? 'success' : 'error'}`}>
                {result.success ? (
                  <>
                    <div className="result-icon">✅</div>
                    <h3>Compilação Bem-Sucedida!</h3>
                    <p className="message">{result.message}</p>
                    {result.lines && (
                      <p className="info">📊 {result.lines} linhas compiladas</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="result-icon">❌</div>
                    <h3>Erro na Compilação</h3>
                    <p className="error-message">{result.error}</p>
                    {result.line && (
                      <p className="location">
                        📍 Linha {result.line}, Coluna {result.column}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="placeholder">
                <p>Clique em "Compilar" ou pressione Ctrl+Enter para analisar o código</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
