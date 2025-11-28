import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles['footer-content']}>
        <span>BrCompiler v1.0</span>
        <span>•</span>
        <span>Gerenciador de Pastas e Arquivos</span>
      </div>
    </footer>
  );
}
