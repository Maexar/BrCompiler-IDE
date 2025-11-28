import styles from './FileItem.module.css';
import type { FileItem as FileType } from '../../types';

interface FileItemProps {
  file: FileType;
  isActive: boolean;
  paddingLevel: number;
  onOpen: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function FileItem({
  file,
  isActive,
  paddingLevel,
  onOpen,
  onDownload,
  onDelete
}: FileItemProps) {
  return (
    <div
      className={`${styles['file-item']} ${isActive ? styles.active : ''}`}
      style={{ paddingLeft: `${paddingLevel * 16}px` }}
    >
      <div
        className={styles['file-name']}
        onClick={onOpen}
        title={file.name}
      >
        📄 {file.name}
        {file.isDirty && <span className={styles['dirty-indicator']}>●</span>}
      </div>
      <div className={styles['file-item-actions']}>
        <button
          className={styles['icon-btn']}
          title="Download"
          onClick={onDownload}
        >
          💾
        </button>
        <button
          className={`${styles['icon-btn']} ${styles.delete}`}
          title="Deletar"
          onClick={onDelete}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
