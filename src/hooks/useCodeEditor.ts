import { useState, useRef } from 'react';
import type { FileItem } from '../types';

/**
 * Hook para gerenciar funcionalidades do editor de código
 */
export function useCodeEditor(
  files: Map<string, FileItem>,
  setFiles: (files: Map<string, FileItem>) => void,
  currentFile: string | null
) {
  const [code, setCode] = useState(
    'gambiarra abre-te-sesamo\n  stonks x receba 10 br\nfecha-te-sesamo'
  );
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

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

  const canUndo = currentFile 
    ? (files.get(currentFile)?.historyIndex ?? 0) > 0 
    : false;
  
  const canRedo = currentFile
    ? (files.get(currentFile)?.historyIndex ?? 0) < (files.get(currentFile)?.history.length ?? 1) - 1
    : false;

  return {
    code,
    setCode,
    editorRef,
    lineNumbersRef,
    typingTimeoutRef,
    updateHistory,
    handleUndo,
    handleRedo,
    handleKeyDown,
    handleScroll,
    canUndo,
    canRedo
  };
}
