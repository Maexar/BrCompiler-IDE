import { useState, useRef } from 'react';
import type { FileItem, FolderItem } from '../types';
import JSZip from 'jszip';

/**
 * Hook para gerenciar sistema de arquivos e pastas
 */
export function useFileSystem() {
  const [files, setFiles] = useState<Map<string, FileItem>>(new Map());
  const [folders, setFolders] = useState<Map<string, FolderItem>>(
    new Map([
      ['/', { name: 'root', path: '/', isExpanded: true, children: [] }]
    ])
  );
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('/');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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
    return newFile;
  };

  const openFile = (filePath: string) => {
    if (files.has(filePath)) {
      setCurrentFile(filePath);
      return files.get(filePath)!;
    }
    return null;
  };

  const saveFile = (filePath: string, content: string) => {
    const updatedFiles = new Map(files);
    const file = updatedFiles.get(filePath);

    if (file) {
      file.content = content;
      file.lastModified = new Date();
      file.isDirty = false;
      updatedFiles.set(filePath, file);
      setFiles(updatedFiles);
      console.log(`[INFO] Arquivo salvo: ${filePath}`);
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
          setCurrentFile(remainingFiles[0]);
          return updatedFiles.get(remainingFiles[0])!;
        } else {
          setCurrentFile(null);
          return null;
        }
      }
    }
    return null;
  };

  const deleteFolder = (folderPath: string) => {
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

  const toggleFolder = (folderPath: string) => {
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

  const downloadFolder = async (folderPath: string) => {
    const folder = folders.get(folderPath);
    if (!folder) return;

    const zip = new JSZip();
    const folderName = folder.name;

    const addToZip = (currentPath: string, zipFolder: JSZip) => {
      const currentFolder = folders.get(currentPath);
      if (!currentFolder) return;

      currentFolder.children.forEach((childPath) => {
        if (files.has(childPath)) {
          const file = files.get(childPath)!;
          const relativePath = childPath.replace(folderPath + '/', '');
          zipFolder.file(relativePath, file.content);
        } else if (folders.has(childPath)) {
          const relativePath = childPath.replace(folderPath + '/', '');
          const subFolder = zipFolder.folder(relativePath);
          if (subFolder) {
            addToZip(childPath, subFolder);
          }
        }
      });
    };

    addToZip(folderPath, zip);

    const blob = await zip.generateAsync({ type: 'blob' });
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
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const importFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const updatedFiles = new Map(files);
    const updatedFolders = new Map(folders);

    const firstFile = fileList[0];
    const webkitPath = (firstFile as any).webkitRelativePath || firstFile.name;
    const rootFolderName = webkitPath.split('/')[0];

    const basePath = selectedFolder === '/' 
      ? `/${rootFolderName}` 
      : `${selectedFolder}/${rootFolderName}`;

    if (!updatedFolders.has(basePath)) {
      updatedFolders.set(basePath, {
        name: rootFolderName,
        path: basePath,
        isExpanded: false,
        children: []
      });

      const parentFolder = updatedFolders.get(selectedFolder);
      if (parentFolder) {
        parentFolder.children.push(basePath);
      }
    }

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const webkitPath = (file as any).webkitRelativePath || file.name;
        const pathParts = webkitPath.split('/');
        
        pathParts.shift();
        
        const fileName = pathParts.pop()!;
        const filePath = selectedFolder === '/'
          ? `/${rootFolderName}/${pathParts.join('/')}${pathParts.length > 0 ? '/' : ''}${fileName}`
          : `${selectedFolder}/${rootFolderName}/${pathParts.join('/')}${pathParts.length > 0 ? '/' : ''}${fileName}`;

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

        const parentPath = getParentPath(filePath);
        const parentFolder = updatedFolders.get(parentPath);
        if (parentFolder && !parentFolder.children.includes(filePath)) {
          parentFolder.children.push(filePath);
        }

        setFiles(new Map(updatedFiles));
        setFolders(new Map(updatedFolders));
      };

      reader.readAsText(file);
    });

    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const updateFileContent = (filePath: string, isDirty: boolean = true) => {
    const updatedFiles = new Map(files);
    const file = updatedFiles.get(filePath);
    if (file) {
      file.isDirty = isDirty;
      updatedFiles.set(filePath, file);
      setFiles(updatedFiles);
    }
  };

  return {
    files,
    folders,
    currentFile,
    selectedFolder,
    fileInputRef,
    folderInputRef,
    setFiles,
    setFolders,
    setCurrentFile,
    setSelectedFolder,
    getNameFromPath,
    getParentPath,
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
  };
}
