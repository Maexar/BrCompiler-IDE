import styles from './FolderItem.module.css';
import type { FolderItem as FolderType } from '../../types';

interface FolderItemProps {
  folder: FolderType;
  isSelected: boolean;
  paddingLevel: number;
  onToggle: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onDownload: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function FolderItem({
  folder,
  isSelected,
  paddingLevel,
  onToggle,
  onSelect,
  onDownload,
  onDelete
}: FolderItemProps) {
  return (
    <div
      className={`${styles['folder-item']} ${isSelected ? styles.selected : ''}`}
      style={{ paddingLeft: `${paddingLevel * 16}px` }}
      onClick={onSelect}
    >
      <div className={styles['folder-name']}>
        <span
          className={styles['folder-icon']}
          onClick={onToggle}
        >
          {folder.isExpanded ? '📂' : '📁'}
        </span>
        {folder.name}
      </div>
      <div className={styles['folder-item-actions']}>
        <button
          className={styles['icon-btn']}
          title="Download pasta"
          onClick={onDownload}
        >
          💾
        </button>
        <button
          className={`${styles['icon-btn']} ${styles.delete}`}
          title="Deletar pasta"
          onClick={onDelete}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
