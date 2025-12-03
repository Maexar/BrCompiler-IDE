export interface CompileError {
  message: string;
  line: number;
  column: number;
  context?: string;
  foundToken?: string;
  expectedTokens?: string;
}

export interface CompileResponse {
  success: boolean;
  message?: string;
  error?: string;
  line?: number;
  column?: number;
  lines?: number;
  errors?: CompileError[]; 
  ast?: any;
}

export interface AstResponse {
  success: boolean;
  ast?: any;
  error?: string;
}

export interface Token {
  tipo: string;
  valor: string;
  linha: number;
  coluna: number;
}

export interface TokensResponse {
  success: boolean;
  tokens?: Token[];
  error?: string;
}

const API_URL = "http://localhost:8085/api";

export async function compileCode(code: string): Promise<CompileResponse> {
  try {
    const response = await fetch(`${API_URL}/compile`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `Erro HTTP ${response.status}`
      };
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: `Erro ao conectar: ${error}`
    };
  }
}

export async function fetchAST(code: string): Promise<AstResponse> {
  try {
    const response = await fetch(`${API_URL}/ast`, {  // ← Parênteses aqui!
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    if (!response.ok) {
      return { success: false, error: `Erro HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: `Erro ao conectar: ${error}` };
  }
}

export async function fetchTokens(code: string): Promise<TokensResponse> {
  console.log('[FRONTEND] Iniciando fetchTokens');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(`${API_URL}/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('[FRONTEND] Resposta recebida:', response.status);
    
    if (!response.ok) {
      console.error('[FRONTEND] Erro HTTP:', response.status);
      return { success: false, error: `Erro HTTP ${response.status}` };
    }
    
    const result = await response.json();
    console.log('[FRONTEND] JSON parseado com sucesso');
    return result;
  } catch (error) {
    console.error('[FRONTEND] Erro ao buscar tokens:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Timeout: requisição demorou mais de 10 segundos' };
    }
    return { success: false, error: `Erro ao conectar: ${error}` };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);  // ← Parênteses aqui!
    return response.ok;
  } catch {
    return false;
  }
}
