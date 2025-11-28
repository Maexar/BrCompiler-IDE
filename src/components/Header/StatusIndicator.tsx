import styles from './StatusIndicator.module.css';

interface StatusIndicatorProps {
  connected: boolean;
  checking: boolean;
}

export function StatusIndicator({ connected, checking }: StatusIndicatorProps) {
  return (
    <div
      className={`${styles['status-indicator']} ${
        connected ? styles.connected : styles.disconnected
      }`}
    >
      <span className={styles['status-dot']}></span>
      <span className={styles['status-text']}>
        {checking
          ? 'Verificando...'
          : connected
          ? 'Conectado'
          : 'Desconectado'}
      </span>
    </div>
  );
}
