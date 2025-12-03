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

export interface AstResponse {
  success: boolean;
  ast?: any;
  error?: string;
}

export async function fetchAST(code: string): Promise<AstResponse> {
  try {
    const response = await fetch(`${API_URL}/ast`, {
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

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
