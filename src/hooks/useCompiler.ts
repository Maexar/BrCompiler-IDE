import { useState, useEffect } from 'react';
import { checkHealth } from '../api';

/**
 * Hook para gerenciar estado de conexão com o servidor de compilação
 */
export function useCompiler() {
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkHealth();
      setConnected(isConnected);
      setCheckingConnection(false);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return { connected, checkingConnection };
}
