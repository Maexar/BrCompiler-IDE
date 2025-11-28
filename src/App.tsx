import { useState, useEffect, useRef, type JSX } from 'react';
import { compileCode, checkHealth, type CompileResponse } from './api';
import JSZip from 'jszip';
import './App.css';

interface FileItem {
  name: string;
  content: string;
  lastModified: Date;
  isDirty: boolean;
  history: string[];
  historyIndex: number;
  path: string;
}

interface FolderItem {
  name: string;
  path: string;
  isExpanded: boolean;
  children: string[];
}

function App() {
  const [files, setFiles] = useState<Map<string, FileItem>>(new Map());
  const [folders, setFolders] = useState<Map<string, FolderItem>>(
    new Map([
      ['/', { name: 'root', path: '/', isExpanded: true, children: [] }]
    ])
  );
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [code, setCode] = useState(
    'gambiarra abre-te-sesamo\n  stonks x receba 10 br\nfecha-te-sesamo'
  );
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('/');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!selectedFolder || selectedFolder === '/') return;

      const target = event.target as HTMLElement;

      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      setSelectedFolder('/');
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [selectedFolder]);

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

    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'y' || (e.key === 'z' && e.shiftKey))
    ) {
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
        const indentedLines = selectedLines
          .map((line, index) => {
            if (index === selectedLines.length - 1 && line === '') {
              return line;
            }
            return tabWidth + line;
          })
          .join('\n');

        const newCode =
          code.substring(0, lineStart) +
          tabWidth +
          indentedLines +
          afterSelection;
        setCode(newCode);
        updateHistory(newCode);

        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = lineStart + tabWidth.length;
            editorRef.current.selectionEnd =
              lineStart + tabWidth.length + indentedLines.length;
          }
        }, 0);
      } else {
        const newCode =
          code.substring(0, start) + tabWidth + code.substring(start);
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
        const unindentedLines = selectedLines
          .map((line, index) => {
            if (index === selectedLines.length - 1 && line === '') {
              return line;
            }
            if (line.startsWith(tabWidth)) {
              return line.substring(tabWidth.length);
            } else if (line.startsWith(' ')) {
              return line.substring(1);
            }
            return line;
          })
          .join('\n');

        const newCode =
          code.substring(0, lineStart) + unindentedLines + afterSelection;
        setCode(newCode);
        updateHistory(newCode);

        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = lineStart;
            editorRef.current.selectionEnd =
              lineStart + unindentedLines.length;
          }
        }, 0);
      } else {
        if (code.substring(start - tabWidth.length, start) === tabWidth) {
          const newCode =
            code.substring(0, start - tabWidth.length) +
            code.substring(start);
          setCode(newCode);
          updateHistory(newCode);

          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.selectionStart = start - tabWidth.length;
              editorRef.current.selectionEnd = start - tabWidth.length;
            }
          }, 0);
        } else if (code[start - 1] === ' ') {
          const newCode =
            code.substring(0, start - 1) + code.substring(start);
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

  const getNameFromPath = (path: string): string => {
    const parts = path.split('/').filter((p) => p);
    return parts[parts.length - 1] || 'root';
  };

  const getParentPath = (path: string): string => {
    if (path === '/') return '/';
    const parts = path.split('/').filter((p) => p);
    parts.pop();
    return parts.length === 0 ? '/' : '/' + parts.join('/');
  };

  const createNewFolder = (folderName: string) => {
    if (!folderName.trim()) return;

    const folderPath =
      selectedFolder === '/' ? `/${folderName}` : `${selectedFolder}/${folderName}`;

    if (folders.has(folderPath)) {
      alert('Pasta já existe!');
      return;
    }

    const newFolder: FolderItem = {
      name: folderName,
      path: folderPath,
      isExpanded: false,
      children: []
    };

    const updatedFolders = new Map(folders);
    updatedFolders.set(folderPath, newFolder);

    const parentFolder = updatedFolders.get(selectedFolder);
    if (parentFolder) {
      parentFolder.children.push(folderPath);
      updatedFolders.set(selectedFolder, parentFolder);
    }

    setFolders(updatedFolders);
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const createNewFile = (fileName: string) => {
    if (!fileName.trim()) return;

    const name = fileName.endsWith('.brcomp') ? fileName : `${fileName}.brcomp`;
    const filePath =
      selectedFolder === '/' ? `/${name}` : `${selectedFolder}/${name}`;

    if (files.has(filePath)) {
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
      historyIndex: 0,
      path: filePath
    };

    const updatedFiles = new Map(files);
    updatedFiles.set(filePath, newFile);
    setFiles(updatedFiles);

    const updatedFolders = new Map(folders);
    const parentFolder = updatedFolders.get(selectedFolder);
    if (parentFolder) {
      parentFolder.children.push(filePath);
      updatedFolders.set(selectedFolder, parentFolder);
      setFolders(updatedFolders);
    }

    setCurrentFile(filePath);
    setCode(newFile.content);
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  const openFile = (filePath: string) => {
    if (files.has(filePath)) {
      const file = files.get(filePath)!;
      setCurrentFile(filePath);
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

  const deleteFile = (filePath: string) => {
    if (confirm(`Deseja deletar "${getNameFromPath(filePath)}"?`)) {
      const updatedFiles = new Map(files);
      updatedFiles.delete(filePath);
      setFiles(updatedFiles);

      const parentPath = getParentPath(filePath);
      const updatedFolders = new Map(folders);
      const parentFolder = updatedFolders.get(parentPath);
      if (parentFolder) {
        parentFolder.children = parentFolder.children.filter(
          (child) => child !== filePath
        );
        updatedFolders.set(parentPath, parentFolder);
        setFolders(updatedFolders);
      }

      if (currentFile === filePath) {
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

  const deleteFolder = (folderPath: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (folderPath === '/') {
      alert('Não é possível deletar a pasta raiz!');
      return;
    }

    const folder = folders.get(folderPath);
    if (!folder) return;

    if (folder.children.length > 0) {
      alert('Não é possível deletar uma pasta que contém arquivos ou subpastas!');
      return;
    }

    if (confirm(`Deseja deletar a pasta "${folder.name}"?`)) {
      const updatedFolders = new Map(folders);
      updatedFolders.delete(folderPath);

      const parentPath = getParentPath(folderPath);
      const parentFolder = updatedFolders.get(parentPath);
      if (parentFolder) {
        parentFolder.children = parentFolder.children.filter(
          (child) => child !== folderPath
        );
        updatedFolders.set(parentPath, parentFolder);
      }

      setFolders(updatedFolders);

      if (selectedFolder === folderPath) {
        setSelectedFolder('/');
      }
    }
  };

  const toggleFolder = (folderPath: string, event: React.MouseEvent) => {
    event.stopPropagation();

    const updatedFolders = new Map(folders);
    const folder = updatedFolders.get(folderPath);
    if (folder) {
      folder.isExpanded = !folder.isExpanded;
      updatedFolders.set(folderPath, folder);
      setFolders(updatedFolders);
    }
  };

  const selectFolder = (folderPath: string) => {
    if (selectedFolder === folderPath) {
      setSelectedFolder('/');
    } else {
      setSelectedFolder(folderPath);
    }
  };

  const downloadFile = (filePath: string) => {
    const file = files.get(filePath);
    if (!file) return;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(file.content)
    );
    element.setAttribute('download', file.name);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // NOVA FUNÇÃO: Download de pasta como ZIP
  const downloadFolder = async (folderPath: string) => {
    const folder = folders.get(folderPath);
    if (!folder) return;

    const zip = new JSZip();
    const folderName = folder.name;

    // Função recursiva para adicionar arquivos e subpastas ao ZIP
    const addToZip = (currentPath: string, zipFolder: JSZip) => {
      const currentFolder = folders.get(currentPath);
      if (!currentFolder) return;

      currentFolder.children.forEach((childPath) => {
        // Se é arquivo
        if (files.has(childPath)) {
          const file = files.get(childPath)!;
          // Remove o caminho da pasta pai para ter caminho relativo
          const relativePath = childPath.replace(folderPath + '/', '');
          zipFolder.file(relativePath, file.content);
        }
        // Se é pasta
        else if (folders.has(childPath)) {
          const childFolder = folders.get(childPath)!;
          const relativePath = childPath.replace(folderPath + '/', '');
          const subFolder = zipFolder.folder(relativePath);
          if (subFolder) {
            addToZip(childPath, subFolder);
          }
        }
      });
    };

    // Adiciona todos os arquivos e subpastas
    addToZip(folderPath, zip);

    // Gera o blob do ZIP
    const blob = await zip.generateAsync({ type: 'blob' });

    // Cria link para download
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', `${folderName}.zip`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = file.name.endsWith('.brcomp')
        ? file.name
        : `${file.name}.brcomp`;
      const filePath =
        selectedFolder === '/' ? `/${fileName}` : `${selectedFolder}/${fileName}`;

      if (files.has(filePath)) {
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
        historyIndex: 0,
        path: filePath
      };

      const updatedFiles = new Map(files);
      updatedFiles.set(filePath, newFile);
      setFiles(updatedFiles);

      const updatedFolders = new Map(folders);
      const parentFolder = updatedFolders.get(selectedFolder);
      if (parentFolder && !parentFolder.children.includes(filePath)) {
        parentFolder.children.push(filePath);
        updatedFolders.set(selectedFolder, parentFolder);
        setFolders(updatedFolders);
      }

      setCurrentFile(filePath);
      setCode(content);
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // NOVA FUNÇÃO: Importar pasta do sistema
  const importFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const updatedFiles = new Map(files);
    const updatedFolders = new Map(folders);

    // Pega o nome da pasta raiz da importação
    const firstFile = fileList[0];
    const webkitPath = (firstFile as any).webkitRelativePath || firstFile.name;
    const rootFolderName = webkitPath.split('/')[0];

    // Cria o caminho da pasta de destino
    const basePath = selectedFolder === '/' 
      ? `/${rootFolderName}` 
      : `${selectedFolder}/${rootFolderName}`;

    // Cria a pasta raiz se não existir
    if (!updatedFolders.has(basePath)) {
      updatedFolders.set(basePath, {
        name: rootFolderName,
        path: basePath,
        isExpanded: false,
        children: []
      });

      // Adiciona ao pai
      const parentFolder = updatedFolders.get(selectedFolder);
      if (parentFolder) {
        parentFolder.children.push(basePath);
      }
    }

    // Processa cada arquivo
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const webkitPath = (file as any).webkitRelativePath || file.name;
        const pathParts = webkitPath.split('/');
        
        // Remove o primeiro elemento (nome da pasta raiz)
        pathParts.shift();
        
        // Constrói o caminho completo do arquivo
        const fileName = pathParts.pop()!;
        const filePath = selectedFolder === '/'
          ? `/${rootFolderName}/${pathParts.join('/')}${pathParts.length > 0 ? '/' : ''}${fileName}`
          : `${selectedFolder}/${rootFolderName}/${pathParts.join('/')}${pathParts.length > 0 ? '/' : ''}${fileName}`;

        // Cria as pastas intermediárias
        let currentPath = basePath;
        pathParts.forEach((folderName: any) => {
          const folderPath = `${currentPath}/${folderName}`;
          
          if (!updatedFolders.has(folderPath)) {
            updatedFolders.set(folderPath, {
              name: folderName,
              path: folderPath,
              isExpanded: false,
              children: []
            });

            const parentFolder = updatedFolders.get(currentPath);
            if (parentFolder) {
              parentFolder.children.push(folderPath);
            }
          }
          
          currentPath = folderPath;
        });

        // Adiciona o arquivo
        const newFile: FileItem = {
          name: fileName,
          content,
          lastModified: new Date(file.lastModified),
          isDirty: false,
          history: [content],
          historyIndex: 0,
          path: filePath
        };

        updatedFiles.set(filePath, newFile);

        // Adiciona o arquivo à pasta pai
        const parentPath = getParentPath(filePath);
        const parentFolder = updatedFolders.get(parentPath);
        if (parentFolder && !parentFolder.children.includes(filePath)) {
          parentFolder.children.push(filePath);
        }

        // Atualiza o estado após processar todos os arquivos
        setFiles(new Map(updatedFiles));
        setFolders(new Map(updatedFolders));
      };

      reader.readAsText(file);
    });

    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const renderFolderTree = (
    folderPath: string,
    level: number = 0
  ): JSX.Element[] => {
    const folder = folders.get(folderPath);
    if (!folder) return [];

    const elements: JSX.Element[] = [];

    if (folderPath !== '/') {
      elements.push(
        <div
          key={folderPath}
          className={`folder-item ${
            selectedFolder === folderPath ? 'selected' : ''
          }`}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => selectFolder(folderPath)}
        >
          <div className="folder-name">
            <span
              className="folder-icon"
              onClick={(e) => toggleFolder(folderPath, e)}
            >
              {folder.isExpanded ? '📂' : '📁'}
            </span>
            {folder.name}
          </div>
          <div className="folder-item-actions">
            <button
              className="icon-btn"
              title="Download pasta"
              onClick={(e) => {
                e.stopPropagation();
                downloadFolder(folderPath);
              }}
            >
              💾
            </button>
            <button
              className="icon-btn delete"
              title="Deletar pasta"
              onClick={(e) => deleteFolder(folderPath, e)}
            >
              🗑️
            </button>
          </div>
        </div>
      );
    }

    if (folder.isExpanded || folderPath === '/') {
      const childFolders = folder.children.filter((child) => folders.has(child));
      const childFiles = folder.children.filter((child) => files.has(child));

      childFolders.forEach((childPath) => {
        elements.push(...renderFolderTree(childPath, level + 1));
      });

      childFiles.forEach((filePath) => {
        const file = files.get(filePath);
        if (file) {
          elements.push(
            <div
              key={filePath}
              className={`file-item ${
                currentFile === filePath ? 'active' : ''
              }`}
              style={{ paddingLeft: `${(level + 1) * 16}px` }}
            >
              <div
                className="file-name"
                onClick={() => openFile(filePath)}
                title={file.name}
              >
                📄 {file.name}
                {file.isDirty && <span className="dirty-indicator">●</span>}
              </div>
              <div className="file-item-actions">
                <button
                  className="icon-btn"
                  title="Download"
                  onClick={() => downloadFile(filePath)}
                >
                  💾
                </button>
                <button
                  className="icon-btn delete"
                  title="Deletar"
                  onClick={() => deleteFile(filePath)}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        }
      });
    }

    return elements;
  };

  const lineCount = code.split('\n').length;
  const charCount = code.length;
  const fileCount = files.size;
  const folderCount = folders.size - 1;
  const currentFileObj = currentFile ? files.get(currentFile) : null;
  const canUndo = currentFileObj ? currentFileObj.historyIndex > 0 : false;
  const canRedo = currentFileObj
    ? currentFileObj.historyIndex < currentFileObj.history.length - 1
    : false;

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

          <div
            className={`status-indicator ${
              connected ? 'connected' : 'disconnected'
            }`}
          >
            <span className="status-dot"></span>
            <span className="status-text">
              {checkingConnection
                ? 'Verificando...'
                : connected
                ? 'Conectado'
                : 'Desconectado'}
            </span>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside
          className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
          ref={sidebarRef}
        >
          <div className="sidebar-header">
            {!sidebarCollapsed && (
              <>
                <h2>📁 Explorador</h2>
                <div className="file-actions">
                  <button
                    className="action-btn"
                    title="Nova pasta"
                    onClick={() => setShowNewFolderDialog(true)}
                  >
                    📁➕
                  </button>
                  <button
                    className="action-btn"
                    title="Novo arquivo"
                    onClick={() => setShowNewFileDialog(true)}
                  >
                    📄➕
                  </button>
                  <button
                    className="action-btn"
                    title="Importar pasta"
                    onClick={() => folderInputRef.current?.click()}
                  >
                    📂⬆️
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

          {!sidebarCollapsed && (
            <>
              {showNewFolderDialog && (
                <div className="new-file-dialog">
                  <input
                    type="text"
                    placeholder="Nome da pasta..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        createNewFolder(newFolderName);
                      } else if (e.key === 'Escape') {
                        setShowNewFolderDialog(false);
                        setNewFolderName('');
                      }
                    }}
                    autoFocus
                  />
                  <button onClick={() => createNewFolder(newFolderName)}>
                    Criar
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFolderDialog(false);
                      setNewFolderName('');
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}

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
                        setNewFileName('');
                      }
                    }}
                    autoFocus
                  />
                  <button onClick={() => createNewFile(newFileName)}>
                    Criar
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFileDialog(false);
                      setNewFileName('');
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <div className="current-folder">
                <small>
                  Destino:{' '}
                  <span className="current-folder-name">
                    {selectedFolder === '/'
                      ? 'Raiz'
                      : getNameFromPath(selectedFolder)}
                  </span>
                </small>
              </div>

              <div className="file-list">
                {fileCount === 0 && folderCount === 0 ? (
                  <div className="empty-state">Nenhum arquivo ou pasta</div>
                ) : (
                  renderFolderTree('/')
                )}
              </div>

              <div className="sidebar-footer">
                <small>
                  Pastas: {folderCount} • Arquivos: {fileCount}
                </small>
              </div>
            </>
          )}
        </aside>

        <main className="main-content">
          <div className="editor-container">
            <div className="editor-panel">
              <div className="editor-header">
                <div className="editor-title">
                  {currentFile ? (
                    <>
                      📝 {getNameFromPath(currentFile)}
                      {files.get(currentFile)?.isDirty && (
                        <span className="dirty-indicator">●</span>
                      )}
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

                  <div className="toolbar-separator" />

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

                  <div className="toolbar-separator" />

                  <div className="editor-stats">
                    <span className="stat-badge">{lineCount} linhas</span>
                    <span className="stat-badge">{charCount} caracteres</span>
                  </div>
                </div>
              </div>

              <div className="editor-wrapper">
                <div className="line-numbers" ref={lineNumbersRef}>
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i + 1} className="line-number">
                      {i + 1}
                    </div>
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

                    typingTimeoutRef.current = window.setTimeout(() => {
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
                  <div
                    className={`result-box ${
                      result.success ? 'success' : 'error'
                    }`}
                  >
                    <div className="result-title">
                      <span className="result-icon">
                        {result.success ? '✓' : '✕'}
                      </span>
                      <h3>
                        {result.success
                          ? 'Compilação Bem-Sucedida'
                          : 'Erro na Compilação'}
                      </h3>
                    </div>

                    <div className="result-body">
                      {result.success ? (
                        <>
                          <p className="result-message">{result.message}</p>
                          {result.lines && (
                            <div className="result-detail">
                              <strong>Linhas compiladas:</strong>{' '}
                              {result.lines}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <pre className="error-message">{result.error}</pre>
                          {result.line && (
                            <div className="error-location">
                              <strong>Posição:</strong> Linha {result.line},{' '}
                              Coluna {result.column}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="placeholder">
                    <div className="placeholder-icon">📋</div>
                    <p>
                      Clique em <strong>▶ Compilar</strong> ou pressione{' '}
                      <kbd>Ctrl+Enter</kbd>
                    </p>
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
          <span>Gerenciador de Pastas e Arquivos</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
