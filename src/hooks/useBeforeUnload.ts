import { useEffect, useCallback, useRef } from 'react';
import type { FileItem } from '../types';

/**
 * Hook para gerenciar o evento beforeunload
 * Previne fechamento/reload da página quando há arquivos não salvos
 */
export function useBeforeUnload(files: Map<string, FileItem>) {
  // Usar ref para sempre ter acesso ao valor mais recente de files
  const filesRef = useRef(files);
  
  // Atualiza a ref sempre que files mudar
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Verifica se há arquivos não salvos (dirty)
  const hasUnsavedChanges = useCallback(() => {
    for (const file of filesRef.current.values()) {
      if (file.isDirty) {
        return true;
      }
    }
    return false;
  }, []);

  // Lista arquivos não salvos
  const getUnsavedFiles = useCallback(() => {
    const unsaved: string[] = [];
    for (const file of filesRef.current.values()) {
      if (file.isDirty) {
        unsaved.push(file.name);
      }
    }
    return unsaved;
  }, []);

  // Registra o evento beforeunload uma única vez
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Verifica diretamente a ref para garantir o valor mais atual
      let hasDirtyFiles = false;
      for (const file of filesRef.current.values()) {
        if (file.isDirty) {
          hasDirtyFiles = true;
          break;
        }
      }

      if (hasDirtyFiles) {
        // Navegadores modernos exigem preventDefault() E returnValue
        e.preventDefault();
        // Chrome requer returnValue para funcionar
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Array vazio - registra apenas uma vez

  return {
    hasUnsavedChanges,
    getUnsavedFiles
  };
}
