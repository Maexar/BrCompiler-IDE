import type { JSX } from 'react';
import styles from './FileTree.module.css';
import { FileItem } from './FileItem';
import { FolderItem } from './FolderItem';
import type { FileItem as FileType, FolderItem as FolderType } from '../../types';

interface FileTreeProps {
  files: Map<string, FileType>;
  folders: Map<string, FolderType>;
  currentFile: string | null;
  selectedFolder: string;
  onOpenFile: (path: string) => void;
  onDownloadFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onToggleFolder: (path: string, e: React.MouseEvent) => void;
  onSelectFolder: (path: string) => void;
  onDownloadFolder: (path: string, e: React.MouseEvent) => void;
  onDeleteFolder: (path: string, e: React.MouseEvent) => void;
}

export function FileTree({
  files,
  folders,
  currentFile,
  selectedFolder,
  onOpenFile,
  onDownloadFile,
  onDeleteFile,
  onToggleFolder,
  onSelectFolder,
  onDownloadFolder,
  onDeleteFolder
}: FileTreeProps) {
  const renderFolderTree = (
    folderPath: string,
    level: number = 0
  ): JSX.Element[] => {
    const folder = folders.get(folderPath);
    if (!folder) return [];

    const elements: JSX.Element[] = [];

    if (folderPath !== '/') {
      elements.push(
        <FolderItem
          key={folderPath}
          folder={folder}
          isSelected={selectedFolder === folderPath}
          paddingLevel={level}
          onToggle={(e) => onToggleFolder(folderPath, e)}
          onSelect={() => onSelectFolder(folderPath)}
          onDownload={(e) => onDownloadFolder(folderPath, e)}
          onDelete={(e) => onDeleteFolder(folderPath, e)}
        />
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
            <FileItem
              key={filePath}
              file={file}
              isActive={currentFile === filePath}
              paddingLevel={level + 1}
              onOpen={() => onOpenFile(filePath)}
              onDownload={() => onDownloadFile(filePath)}
              onDelete={() => onDeleteFile(filePath)}
            />
          );
        }
      });
    }

    return elements;
  };

  const fileCount = files.size;
  const folderCount = folders.size - 1;

  return (
    <div className={styles['file-list']}>
      {fileCount === 0 && folderCount === 0 ? (
        <div className={styles['empty-state']}>Nenhum arquivo ou pasta</div>
      ) : (
        renderFolderTree('/')
      )}
    </div>
  );
}
