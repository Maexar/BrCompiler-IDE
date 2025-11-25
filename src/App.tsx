import { useState, useEffect, useRef } from 'react';
import { compileCode, checkHealth, type CompileResponse } from './api';
import './App.css';

interface FileItem {
  name: string;
  content: string;
  lastModified: Date;
  isDirty: boolean;
  history: string[];
  historyIndex: number;
}

function App() {
  const [files, setFiles] = useState<Map<string, FileItem>>(new Map());
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [code, setCode] = useState('gambiarra abre-te-sesamo\n  stonks x receba 10 br\nfecha-te-sesamo');
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (currentFile && files.has(currentFile)) {
      const timer = setTimeout(() => {
        saveCurrentFile();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [code, currentFile, files]);

  const handleCompile = async () => {
    setLoading(true);
    const response = await compileCode(code);
    setResult(response);
    setLoading(false);
  };

  const updateHistory = (newCode: string) => {
    if (!currentFile) return;

    const updatedFiles = new Map(files);
    const file = updatedFiles.get(currentFile);
    
    if (file) {
      if (file.historyIndex < file.history.length - 1) {
        file.history = file.history.slice(0, file.historyIndex + 1);
      }

      file.history.push(newCode);
      file.historyIndex = file.history.length - 1;
      file.isDirty = true;

      updatedFiles.set(currentFile, file);
      setFiles(updatedFiles);
    }
  };

  const handleUndo = () => {
    if (!currentFile) return;

    const file = files.get(currentFile);
    if (!file || file.historyIndex <= 0) return;

    const updatedFiles = new Map(files);
    const updatedFile = { ...file };
    updatedFile.historyIndex -= 1;
    updatedFile.isDirty = true;
    updatedFiles.set(currentFile, updatedFile);
    setFiles(updatedFiles);

    const previousCode = updatedFile.history[updatedFile.historyIndex];
    setCode(previousCode);
  };

  const handleRedo = () => {
    if (!currentFile) return;

    const file = files.get(currentFile);
    if (!file || file.historyIndex >= file.history.length - 1) return;

    const updatedFiles = new Map(files);
    const updatedFile = { ...file };
    updatedFile.historyIndex += 1;
    updatedFile.isDirty = true;
    updatedFiles.set(currentFile, updatedFile);
    setFiles(updatedFiles);

    const nextCode = updatedFile.history[updatedFile.historyIndex];
    setCode(nextCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading && connected) {
        handleCompile();
      }
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = editorRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const tabWidth = '  ';

      if (start !== end) {
        const beforeSelection = code.substring(0, start);
        const selection = code.substring(start, end);
        const afterSelection = code.substring(end);

        const beforeLineStart = beforeSelection.lastIndexOf('\n');
        const lineStart = beforeLineStart === -1 ? 0 : beforeLineStart + 1;

        const selectedLines = selection.split('\n');
        const indentedLines = selectedLines.map((line, index) => {
          if (index === selectedLines.length - 1 && line === '') {
            return line;
          }
          return tabWidth + line;
        }).join('\n');

        const newCode = code.substring(0, lineStart) + tabWidth + indentedLines + afterSelection;
        setCode(newCode);
        updateHistory(newCode);

        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = lineStart + tabWidth.length;
            editorRef.current.selectionEnd = lineStart + tabWidth.length + indentedLines.length;
          }
        }, 0);
      } else {
        const newCode = code.substring(0, start) + tabWidth + code.substring(start);
        setCode(newCode);
        updateHistory(newCode);

        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = start + tabWidth.length;
            editorRef.current.selectionEnd = start + tabWidth.length;
          }
        }, 0);
      }
    }

    if (e.shiftKey && e.key === 'Tab') {
      e.preventDefault();

      const textarea = editorRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const tabWidth = '  ';

      if (start !== end) {
        const beforeSelection = code.substring(0, start);
        const selection = code.substring(start, end);
        const afterSelection = code.substring(end);

        const beforeLineStart = beforeSelection.lastIndexOf('\n');
        const lineStart = beforeLineStart === -1 ? 0 : beforeLineStart + 1;

        const selectedLines = selection.split('\n');
        const unindentedLines = selectedLines.map((line, index) => {
          if (index === selectedLines.length - 1 && line === '') {
            return line;
          }
          if (line.startsWith(tabWidth)) {
            return line.substring(tabWidth.length);
          } else if (line.startsWith(' ')) {
            return line.substring(1);
          }
          return line;
        }).join('\n');

        const newCode = code.substring(0, lineStart) + unindentedLines + afterSelection;
        setCode(newCode);
        updateHistory(newCode);

        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = lineStart;
            editorRef.current.selectionEnd = lineStart + unindentedLines.length;
          }
        }, 0);
      } else {
        if (code.substring(start - tabWidth.length, start) === tabWidth) {
          const newCode = code.substring(0, start - tabWidth.length) + code.substring(start);
          setCode(newCode);
          updateHistory(newCode);

          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.selectionStart = start - tabWidth.length;
              editorRef.current.selectionEnd = start - tabWidth.length;
            }
          }, 0);
        } else if (code[start - 1] === ' ') {
          const newCode = code.substring(0, start - 1) + code.substring(start);
          setCode(newCode);
          updateHistory(newCode);

          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.selectionStart = start - 1;
              editorRef.current.selectionEnd = start - 1;
            }
          }, 0);
        }
      }
    }
  };

  const handleScroll = () => {
    if (lineNumbersRef.current && editorRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const createNewFile = (fileName: string) => {
    if (!fileName.trim()) return;
    
    const name = fileName.endsWith('.brcomp') ? fileName : `${fileName}.brcomp`;
    
    if (files.has(name)) {
      alert('Arquivo já existe!');
      return;
    }
    
    const initialContent = 'gambiarra abre-te-sesamo\n  \nfecha-te-sesamo';
    const newFile: FileItem = {
      name,
      content: initialContent,
      lastModified: new Date(),
      isDirty: true,
      history: [initialContent],
      historyIndex: 0
    };
    
    const updatedFiles = new Map(files);
    updatedFiles.set(name, newFile);
    setFiles(updatedFiles);
    setCurrentFile(name);
    setCode(newFile.content);
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  const openFile = (fileName: string) => {
    if (files.has(fileName)) {
      const file = files.get(fileName)!;
      setCurrentFile(fileName);
      setCode(file.content);
      setResult(null);
    }
  };

  const saveCurrentFile = () => {
    if (!currentFile) return;
    
    const updatedFiles = new Map(files);
    const file = updatedFiles.get(currentFile);
    
    if (file) {
      file.content = code;
      file.lastModified = new Date();
      file.isDirty = false;
      updatedFiles.set(currentFile, file);
      setFiles(updatedFiles);
      console.log(`[INFO] Arquivo salvo: ${currentFile}`);
    }
  };

  const deleteFile = (fileName: string) => {
    if (confirm(`Deseja deletar "${fileName}"?`)) {
      const updatedFiles = new Map(files);
      updatedFiles.delete(fileName);
      setFiles(updatedFiles);
      
      if (currentFile === fileName) {
        const remainingFiles = Array.from(updatedFiles.keys());
        if (remainingFiles.length > 0) {
          openFile(remainingFiles[0]);
        } else {
          setCurrentFile(null);
          setCode('');
        }
      }
    }
  };

  const downloadFile = (fileName: string) => {
    const file = files.get(fileName);
    if (!file) return;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(file.content));
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = file.name.endsWith('.brcomp') ? file.name : `${file.name}.brcomp`;
      
      if (files.has(fileName)) {
        if (!confirm(`Arquivo "${fileName}" já existe. Deseja substituir?`)) {
          return;
        }
      }
      
      const newFile: FileItem = {
        name: fileName,
        content,
        lastModified: new Date(),
        isDirty: false,
        history: [content],
        historyIndex: 0
      };
      
      const updatedFiles = new Map(files);
      updatedFiles.set(fileName, newFile);
      setFiles(updatedFiles);
      setCurrentFile(fileName);
      setCode(content);
    };
    
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const lineCount = code.split('\n').length;
  const charCount = code.length;
  const fileCount = files.size;
  const currentFileObj = currentFile ? files.get(currentFile) : null;
  const canUndo = currentFileObj ? currentFileObj.historyIndex > 0 : false;
  const canRedo = currentFileObj ? currentFileObj.historyIndex < currentFileObj.history.length - 1 : false;

  return (
    <div className="app" data-theme={theme}>
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚙️</span>
            <div className="logo-text">
              <h1>BrCompiler</h1>
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

      <div className="main-layout">
        {/* SIDEBAR - Gerenciador de Arquivos */}
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            {!sidebarCollapsed && (
              <>
                <h2>📁 Arquivos</h2>
                <div className="file-actions">
                  <button 
                    className="action-btn" 
                    title="Novo arquivo"
                    onClick={() => setShowNewFileDialog(true)}
                  >
                    ➕
                  </button>
                  <button 
                    className="action-btn" 
                    title="Importar arquivo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📥
                  </button>
                </div>
              </>
            )}
            <button
              className="sidebar-toggle"
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? '»' : '«'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".brcomp,.txt"
              onChange={importFile}
              style={{ display: 'none' }}
            />
          </div>

          {!sidebarCollapsed && (
            <>
              {showNewFileDialog && (
                <div className="new-file-dialog">
                  <input
                    type="text"
                    placeholder="Nome do arquivo..."
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        createNewFile(newFileName);
                      } else if (e.key === 'Escape') {
                        setShowNewFileDialog(false);
                      }
                    }}
                    autoFocus
                  />
                  <button onClick={() => createNewFile(newFileName)}>Criar</button>
                  <button onClick={() => setShowNewFileDialog(false)}>Cancelar</button>
                </div>
              )}

              <div className="file-list">
                {fileCount === 0 ? (
                  <div className="empty-state">Nenhum arquivo aberto</div>
                ) : (
                  Array.from(files.keys()).map((fileName) => (
                    <div
                      key={fileName}
                      className={`file-item ${currentFile === fileName ? 'active' : ''}`}
                    >
                      <div 
                        className="file-name"
                        onClick={() => openFile(fileName)}
                        title={fileName}
                      >
                        📄 {fileName}
                        {files.get(fileName)?.isDirty && <span className="dirty-indicator">●</span>}
                      </div>
                      <div className="file-item-actions">
                        <button
                          className="icon-btn"
                          title="Download"
                          onClick={() => downloadFile(fileName)}
                        >
                          💾
                        </button>
                        <button
                          className="icon-btn delete"
                          title="Deletar"
                          onClick={() => deleteFile(fileName)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="sidebar-footer">
                <small>Arquivos: {fileCount}</small>
              </div>
            </>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <div className="editor-container">
            <div className="editor-panel">
              <div className="editor-header">
                <div className="editor-title">
                  {currentFile ? (
                    <>
                      📝 {currentFile}
                      {files.get(currentFile)?.isDirty && <span className="dirty-indicator">●</span>}
                    </>
                  ) : (
                    'Código Fonte'
                  )}
                </div>

                <div className="editor-toolbar">
                  <div className="toolbar-group">
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="toolbar-btn"
                      title="Desfazer (Ctrl+Z)"
                    >
                      ↶
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="toolbar-btn"
                      title="Refazer (Ctrl+Y)"
                    >
                      ↷
                    </button>
                  </div>

                  <div className="toolbar-separator"></div>

                  <div className="toolbar-group">
                    <button
                      onClick={handleCompile}
                      disabled={loading || !connected}
                      className="toolbar-btn primary"
                      title="Compilar (Ctrl+Enter)"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => {
                        setCode('');
                        setResult(null);
                      }}
                      className="toolbar-btn"
                      disabled={!connected}
                      title="Limpar editor"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={saveCurrentFile}
                      className="toolbar-btn"
                      disabled={!currentFile}
                      title="Salvar arquivo (Ctrl+S)"
                    >
                      💾
                    </button>
                  </div>

                  <div className="toolbar-separator"></div>

                  <div className="editor-stats">
                    <span className="stat-badge">{lineCount} linhas</span>
                    <span className="stat-badge">{charCount} caracteres</span>
                  </div>
                </div>
              </div>
              
              <div className="editor-wrapper">
                <div className="line-numbers" ref={lineNumbersRef}>
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i + 1} className="line-number">{i + 1}</div>
                  ))}
                </div>
                
                <textarea
                  ref={editorRef}
                  value={code}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setCode(newCode);
                    
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    
                    typingTimeoutRef.current = setTimeout(() => {
                      updateHistory(newCode);
                    }, 500);

                    if (currentFile) {
                      const updatedFiles = new Map(files);
                      const file = updatedFiles.get(currentFile);
                      if (file) {
                        file.isDirty = true;
                        updatedFiles.set(currentFile, file);
                        setFiles(updatedFiles);
                      }
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  placeholder="Comece a digitar seu código BrCompiler aqui..."
                  className="code-editor"
                  disabled={!connected}
                  spellCheck="false"
                />
              </div>
              
              <div className="editor-footer">
                <span>Tab size: 2 espaços</span>
                <span>•</span>
                <span>Encoding: UTF-8</span>
                <span>•</span>
                <span>Ctrl+Z/Ctrl+Y • Ctrl+Enter • Ctrl+S</span>
              </div>
            </div>

            <div className="result-panel">
              <div className="result-header">
                <h2>📋 Resultado da Compilação</h2>
              </div>
              
              <div className="result-content">
                {result ? (
                  <div className={`result-box ${result.success ? 'success' : 'error'}`}>
                    <div className="result-title">
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
                    <p>Clique em <strong>▶ Compilar</strong> ou pressione <kbd>Ctrl+Enter</kbd></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <span>BrCompiler v1.0</span>
          <span>•</span>
          <span>Gerenciador de Arquivos Integrado</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
