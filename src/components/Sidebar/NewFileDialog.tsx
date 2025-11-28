import { useState } from 'react';
import styles from './NewFileDialog.module.css';

interface NewFileDialogProps {
  type: 'file' | 'folder';
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function NewFileDialog({ type, onConfirm, onCancel }: NewFileDialogProps) {
  const [name, setName] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onConfirm(name);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={styles['new-file-dialog']}>
      <input
        type="text"
        placeholder={`Nome ${type === 'file' ? 'do arquivo' : 'da pasta'}...`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <button onClick={() => onConfirm(name)}>Criar</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  );
}
