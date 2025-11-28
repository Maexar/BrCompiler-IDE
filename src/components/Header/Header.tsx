import styles from './Header.module.css';
import { ThemeToggle } from './ThemeToggle';
import { StatusIndicator } from './StatusIndicator';
import type { Theme } from '../../types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  connected: boolean;
  checkingConnection: boolean;
}

export function Header({ theme, onToggleTheme, connected, checkingConnection }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles['header-left']}>
        <div className={styles.logo}>
          <span className={styles['logo-icon']}>⚙️</span>
          <div className={styles['logo-text']}>
            <h1>BrCompiler</h1>
          </div>
        </div>
      </div>

      <div className={styles['header-right']}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <StatusIndicator connected={connected} checking={checkingConnection} />
      </div>
    </header>
  );
}
