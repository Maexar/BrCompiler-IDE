import { useState, useRef, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { FileTree } from './FileTree';
import { NewFileDialog } from './NewFileDialog';
import type { FileItem, FolderItem } from '../../types';

interface SidebarProps {
  files: Map<string, FileItem>;
  folders: Map<string, FolderItem>;
  currentFile: string | null;
  selectedFolder: string;
  collapsed: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  onToggleCollapsed: () => void;
  onCreateFile: (name: string) => void;
  onCreateFolder: (name: string) => void;
  onOpenFile: (path: string) => void;
  onDownloadFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onToggleFolder: (path: string, e: React.MouseEvent) => void;
  onSelectFolder: (path: string) => void;
  onDownloadFolder: (path: string, e: React.MouseEvent) => void;
  onDeleteFolder: (path: string, e: React.MouseEvent) => void;
  onImportFile: () => void;
  onImportFolder: () => void;
  getNameFromPath: (path: string) => string;
}

export function Sidebar({
  files,
  folders,
  currentFile,
  selectedFolder,
  collapsed,
  fileInputRef,
  folderInputRef,
  onToggleCollapsed,
  onCreateFile,
  onCreateFolder,
  onOpenFile,
  onDownloadFile,
  onDeleteFile,
  onToggleFolder,
  onSelectFolder,
  onDownloadFolder,
  onDeleteFolder,
  onImportFile,
  onImportFolder,
  getNameFromPath
}: SidebarProps) {
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!selectedFolder || selectedFolder === '/') return;

      const target = event.target as HTMLElement;

      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      onSelectFolder('/');
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [selectedFolder, onSelectFolder]);

  const handleCreateFile = (name: string) => {
    onCreateFile(name);
    setShowNewFileDialog(false);
  };

  const handleCreateFolder = (name: string) => {
    onCreateFolder(name);
    setShowNewFolderDialog(false);
  };

  const fileCount = files.size;
  const folderCount = folders.size - 1;

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
      ref={sidebarRef}
    >
      <div className={styles['sidebar-header']}>
        {!collapsed && (
          <>
            <h2>📁 Explorador</h2>
            <div className={styles['file-actions']}>
              <button
                className={styles['action-btn']}
                title="Nova pasta"
                onClick={() => setShowNewFolderDialog(true)}
              >
                📁➕
              </button>
              <button
                className={styles['action-btn']}
                title="Novo arquivo"
                onClick={() => setShowNewFileDialog(true)}
              >
                📄➕
              </button>
              <button
                className={styles['action-btn']}
                title="Importar pasta"
                onClick={onImportFolder}
              >
                📂⬆️
              </button>
              <button
                className={styles['action-btn']}
                title="Importar arquivo"
                onClick={onImportFile}
              >
                📥
              </button>
            </div>
          </>
        )}
        <button
          className={styles['sidebar-toggle']}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          onClick={onToggleCollapsed}
        >
          {collapsed ? '»' : '«'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".brcomp,.txt"
          style={{ display: 'none' }}
        />
        <input
          ref={folderInputRef}
          type="file"
          /* @ts-ignore */
          webkitdirectory="true"
          directory="true"
          style={{ display: 'none' }}
        />
      </div>

      {!collapsed && (
        <>
          {showNewFolderDialog && (
            <NewFileDialog
              type="folder"
              onConfirm={handleCreateFolder}
              onCancel={() => setShowNewFolderDialog(false)}
            />
          )}

          {showNewFileDialog && (
            <NewFileDialog
              type="file"
              onConfirm={handleCreateFile}
              onCancel={() => setShowNewFileDialog(false)}
            />
          )}

          <div className={styles['current-folder']}>
            <small>
              Destino:{' '}
              <span className={styles['current-folder-name']}>
                {selectedFolder === '/'
                  ? 'Raiz'
                  : getNameFromPath(selectedFolder)}
              </span>
            </small>
          </div>

          <FileTree
            files={files}
            folders={folders}
            currentFile={currentFile}
            selectedFolder={selectedFolder}
            onOpenFile={onOpenFile}
            onDownloadFile={onDownloadFile}
            onDeleteFile={onDeleteFile}
            onToggleFolder={onToggleFolder}
            onSelectFolder={onSelectFolder}
            onDownloadFolder={onDownloadFolder}
            onDeleteFolder={onDeleteFolder}
          />

          <div className={styles['sidebar-footer']}>
            <small>
              Pastas: {folderCount} • Arquivos: {fileCount}
            </small>
          </div>
        </>
      )}
    </aside>
  );
}
