// ===== TIPOS DE ERROS =====

export interface CompileError {
  message: string;
  line: number;
  column: number;
  context?: string;
  foundToken?: string;
  expectedTokens?: string;
}

export interface SemanticError {
  message: string;
  line: number;
  column: number;
  type: string;
  identifier?: string;
}

export interface SymbolInfo {
  name: string;
  type: string;
  scope: string;
  line: number;
  initialized?: boolean;
  used?: boolean;
}

export interface FunctionInfo {
  name: string;
  returnType: string;
  scope: string;
  line: number;
  paramCount: number;
  signature: string;
  used?: boolean;
}

export interface SymbolsData {
  variables: SymbolInfo[];
  functions: FunctionInfo[];
}

// ===== RESPOSTAS DA API =====

export interface CompileResponse {
  success: boolean;
  message?: string;
  error?: string;
  line?: number;
  column?: number;
  lines?: number;
  errors?: CompileError[];
  syntaxErrors?: CompileError[];
  semanticErrors?: SemanticError[];
  symbols?: {
    variables: number;
    functions: number;
  };
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

export interface SymbolsResponse {
  success: boolean;
  symbols?: SymbolsData;
  error?: string;
}

// ===== TIPO UNIFICADO DE ERRO PARA A IDE =====

export interface EditorError {
  message: string;
  line: number;
  column: number;
  type: 'syntax' | 'semantic' | 'lexical' | 'balance';
  identifier?: string;
}

// ===== URL DA API =====

const API_URL = "http://localhost:8085/api";

// ===== FUNCOES DA API =====

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

export async function fetchTokens(code: string): Promise<TokensResponse> {
  console.log('[FRONTEND] Iniciando fetchTokens');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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
      return { success: false, error: 'Timeout: requisicao demorou mais de 10 segundos' };
    }
    return { success: false, error: `Erro ao conectar: ${error}` };
  }
}

export async function fetchSymbols(code: string): Promise<SymbolsResponse> {
  console.log('[FRONTEND] Iniciando fetchSymbols');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_URL}/symbols`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { success: false, error: `Erro HTTP ${response.status}` };
    }
    
    return await response.json();
  } catch (error) {
    console.error('[FRONTEND] Erro ao buscar simbolos:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Timeout: requisicao demorou mais de 10 segundos' };
    }
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

// ===== FUNCAO UTILITARIA PARA EXTRAIR ERROS UNIFICADOS =====

export function extractEditorErrors(response: CompileResponse): EditorError[] {
  const errors: EditorError[] = [];
  
  // Extrai erros do array "errors" (compatibilidade)
  if (response.errors) {
    for (const err of response.errors) {
      let errorType: EditorError['type'] = 'syntax';
      
      // Detecta tipo pelo contexto ou mensagem
      if (err.context === 'semantico' || err.message.includes('[SEMANTICO]')) {
        errorType = 'semantic';
      } else if (err.context === 'lexico') {
        errorType = 'lexical';
      } else if (err.context === 'balanceamento') {
        errorType = 'balance';
      }
      
      errors.push({
        message: err.message.replace('[SINTAXE] ', '').replace('[SEMANTICO] ', ''),
        line: err.line,
        column: err.column,
        type: errorType
      });
    }
  }
  
  // Extrai erros sintaticos separados
  if (response.syntaxErrors) {
    for (const err of response.syntaxErrors) {
      // Evita duplicatas
      if (!errors.some(e => e.line === err.line && e.column === err.column && e.type === 'syntax')) {
        errors.push({
          message: err.message,
          line: err.line,
          column: err.column,
          type: 'syntax'
        });
      }
    }
  }
  
  // Extrai erros semanticos separados
  if (response.semanticErrors) {
    for (const err of response.semanticErrors) {
      // Evita duplicatas
      if (!errors.some(e => e.line === err.line && e.column === err.column && e.type === 'semantic')) {
        errors.push({
          message: err.message,
          line: err.line,
          column: err.column,
          type: 'semantic',
          identifier: err.identifier
        });
      }
    }
  }
  
  return errors;
}
