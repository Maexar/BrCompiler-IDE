// Tipos e interfaces do projeto BrCompiler IDE

export interface FileItem {
  name: string;
  content: string;
  lastModified: Date;
  isDirty: boolean;
  history: string[];
  historyIndex: number;
  path: string;
}

export interface FolderItem {
  name: string;
  path: string;
  isExpanded: boolean;
  children: string[];
}

export type Theme = 'light' | 'dark';
