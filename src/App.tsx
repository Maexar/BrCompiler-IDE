import { useState, useEffect } from 'react';
import { compileCode, type CompileResponse } from './api';
import { useFileSystem } from './hooks/useFileSystem';
import { useCodeEditor } from './hooks/useCodeEditor';
import { useCompiler } from './hooks/useCompiler';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CodeEditor } from './components/Editor/CodeEditor';
import { ResultPanel } from './components/ResultPanel/ResultPanel';
import { Footer } from './components/Footer/Footer';
import './App.css';
import './styles/global.css';

function App() {
  // Hooks customizados
  const {
    files,
    folders,
    currentFile,
    selectedFolder,
    fileInputRef,
    folderInputRef,
    setFiles,
    getNameFromPath,
    createNewFolder,
    createNewFile,
    openFile,
    saveFile,
    deleteFile,
    deleteFolder,
    toggleFolder,
    selectFolder,
    downloadFile,
    downloadFolder,
    importFile,
    importFolder,
    updateFileContent
  } = useFileSystem();

  const {
    code,
    setCode,
    editorRef,
    lineNumbersRef,
    typingTimeoutRef,
    updateHistory,
    handleUndo,
    handleRedo,
    handleKeyDown: editorHandleKeyDown,
    handleScroll,
    canUndo,
    canRedo
  } = useCodeEditor(files, setFiles, currentFile);

  const { connected, checkingConnection } = useCompiler();
  const { theme, toggleTheme } = useTheme();

  // Estados locais
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-save quando currentFile ou code mudam
  useEffect(() => {
    if (currentFile && files.has(currentFile)) {
      const timer = setTimeout(() => {
        saveFile(currentFile, code);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [code, currentFile, files, saveFile]);

  // Handlers
  const handleCompile = async () => {
    setLoading(true);
    const response = await compileCode(code);
    setResult(response);
    setLoading(false);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      updateHistory(newCode);
    }, 500);

    if (currentFile) {
      updateFileContent(currentFile, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading && connected) {
        handleCompile();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (currentFile) {
        saveFile(currentFile, code);
      }
      return;
    }

    editorHandleKeyDown(e);
  };

  const handleOpenFile = (filePath: string) => {
    const file = openFile(filePath);
    if (file) {
      setCode(file.content);
      setResult(null);
    }
  };

  const handleCreateFile = (fileName: string) => {
    const newFile = createNewFile(fileName);
    if (newFile) {
      setCode(newFile.content);
    }
  };

  const handleDeleteFile = (filePath: string) => {
    const nextFile = deleteFile(filePath);
    if (nextFile) {
      setCode(nextFile.content);
    } else {
      setCode('');
    }
  };

  const handleClearEditor = () => {
    setCode('');
    setResult(null);
  };

  const handleSaveFile = () => {
    if (currentFile) {
      saveFile(currentFile, code);
    }
  };

  const handleToggleFolder = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(folderPath);
  };

  const handleDownloadFolder = async (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await downloadFolder(folderPath);
  };

  const handleDeleteFolder = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFolder(folderPath);
  };

  const currentFileObj = currentFile ? files.get(currentFile) : undefined;

  return (
    <div className="app" data-theme={theme}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        connected={connected}
        checkingConnection={checkingConnection}
      />

      <div className="main-layout">
        <Sidebar
          files={files}
          folders={folders}
          currentFile={currentFile}
          selectedFolder={selectedFolder}
          collapsed={sidebarCollapsed}
          fileInputRef={fileInputRef}
          folderInputRef={folderInputRef}
          onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCreateFile={handleCreateFile}
          onCreateFolder={createNewFolder}
          onOpenFile={handleOpenFile}
          onDownloadFile={downloadFile}
          onDeleteFile={handleDeleteFile}
          onToggleFolder={handleToggleFolder}
          onSelectFolder={selectFolder}
          onDownloadFolder={handleDownloadFolder}
          onDeleteFolder={handleDeleteFolder}
          onImportFile={() => fileInputRef.current?.click()}
          onImportFolder={() => folderInputRef.current?.click()}
          getNameFromPath={getNameFromPath}
        />

        <main className="main-content">
          <div className="editor-container">
            <CodeEditor
              ref={editorRef}
              code={code}
              currentFile={currentFile}
              currentFileObj={currentFileObj}
              connected={connected}
              loading={loading}
              canUndo={canUndo}
              canRedo={canRedo}
              lineNumbersRef={lineNumbersRef}
              onCodeChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onCompile={handleCompile}
              onClear={handleClearEditor}
              onSave={handleSaveFile}
              getNameFromPath={getNameFromPath}
            />

            <ResultPanel result={result} code={code} />
          </div>
        </main>
      </div>

      <Footer />

      {/* Hidden inputs para importação */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".brcomp,.txt"
        onChange={importFile}
        style={{ display: 'none' }}
      />
      <input
        ref={folderInputRef}
        type="file"
        /* @ts-ignore */
        webkitdirectory="true"
        directory="true"
        onChange={importFolder}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default App;
