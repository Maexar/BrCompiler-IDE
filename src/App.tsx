import { useState, useEffect } from 'react';
import { compileCode, checkHealth, type CompileResponse } from './api';
import './App.css';

interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

function App() {
  const [code, setCode] = useState('gambiarra abre-te-sesamo\n  stonks x receba 10 br\nfecha-te-sesamo');
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkHealth();
      setConnected(isConnected);
      setCheckingConnection(false);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
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
  const charCount = code.length;

  return (
    <div className="app" data-theme={theme}>
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚙️</span>
            <div className="logo-text">
              <h1>BrCompiler</h1>
              <span className="tagline">Compilador de Linguagem Coloquial Brasileira</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className={`theme-toggle ${theme}`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Alternar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {checkingConnection ? 'Verificando...' : connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="editor-panel">
          <div className="panel-header">
            <h2>Código Fonte</h2>
            <div className="panel-info">
              <span className="info-badge">{lineCount} linhas</span>
              <span className="info-badge">{charCount} caracteres</span>
            </div>
          </div>
          
          <div className="editor-wrapper">
            <div className="line-numbers">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="line-number">{i + 1}</div>
              ))}
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Comece a digitar seu código BrCompiler aqui..."
              className="code-editor"
              disabled={!connected}
              spellCheck="false"
            />
          </div>
          
          <div className="editor-footer">
            <div className="footer-info">
              <span>Tab size: 2 espaços</span>
              <span>Encoding: UTF-8</span>
            </div>
            <span className="shortcut-hint">Ctrl+Enter para compilar</span>
          </div>
        </div>

        <div className="button-group">
          <button
            onClick={handleCompile}
            disabled={loading || !connected}
            className={`btn-compile ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Compilando...' : 'Compilar'}
          </button>
          <button
            onClick={() => setCode('')}
            className="btn-clear"
            disabled={!connected}
          >
            Limpar
          </button>
        </div>

        <div className="result-panel">
          <div className="panel-header">
            <h2>Resultado da Compilação</h2>
          </div>
          
          <div className="result-content">
            {result ? (
              <div className={`result-box ${result.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <span className="result-icon">
                    {result.success ? '✓' : '✕'}
                  </span>
                  <h3>
                    {result.success ? 'Compilação Bem-Sucedida' : 'Erro na Compilação'}
                  </h3>
                </div>
                
                <div className="result-body">
                  {result.success ? (
                    <>
                      <p className="result-message">{result.message}</p>
                      {result.lines && (
                        <div className="result-detail">
                          <strong>Linhas compiladas:</strong> {result.lines}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <pre className="error-message">{result.error}</pre>
                      {result.line && (
                        <div className="error-location">
                          <strong>Posição:</strong> Linha {result.line}, Coluna {result.column}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="placeholder">
                <div className="placeholder-icon">📋</div>
                <p>Clique em "Compilar" ou pressione <kbd>Ctrl+Enter</kbd></p>
                <p className="placeholder-subtext">O resultado da compilação aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <span>BrCompiler v1.0</span>
          <span>•</span>
          <span>Servidor: localhost:8085</span>
          <span>•</span>
          <span>IDE: React + TypeScript</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
