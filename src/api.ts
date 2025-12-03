// ===== INTERFACES DE ERRO =====

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

// ===== INTERFACES DE RESPOSTA =====

export interface CompileResponse {
  success: boolean;
  message?: string;
  error?: string;
  line?: number;
  column?: number;
  lines?: number;
  
  // Arrays separados para erros sintaticos e semanticos
  syntaxErrors?: CompileError[];
  semanticErrors?: SemanticError[];
  
  // Array unificado para retrocompatibilidade
  errors?: CompileError[];
  
  // Informacoes da tabela de simbolos
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

// ===== NOVAS INTERFACES PARA TABELA DE SIMBOLOS =====

export interface Variable {
  name: string;
  type: string;
  scope: string;
  line: number;
  initialized: boolean;
  used: boolean;
}

export interface Function {
  name: string;
  returnType: string;
  scope: string;
  line: number;
  paramCount: number;
  signature: string;
  used: boolean;
}

export interface SymbolTable {
  variables: Variable[];
  functions: Function[];
}

export interface SymbolsResponse {
  success: boolean;
  symbols?: SymbolTable;
  error?: string;
}

// ===== CONFIGURACAO DA API =====

const API_URL = "http://localhost:8085/api";

// ===== FUNCOES DE COMPILACAO =====

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

// ===== FUNCOES DE AST =====

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

// ===== FUNCOES DE TOKENS =====

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

// ===== NOVA FUNCAO: TABELA DE SIMBOLOS =====

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
    console.log('[FRONTEND] Resposta de symbols recebida:', response.status);
    
    if (!response.ok) {
      console.error('[FRONTEND] Erro HTTP:', response.status);
      return { success: false, error: `Erro HTTP ${response.status}` };
    }
    
    const result = await response.json();
    console.log('[FRONTEND] Tabela de simbolos parseada com sucesso');
    console.log('[FRONTEND] Variaveis:', result.symbols?.variables?.length || 0);
    console.log('[FRONTEND] Funcoes:', result.symbols?.functions?.length || 0);
    return result;
  } catch (error) {
    console.error('[FRONTEND] Erro ao buscar tabela de simbolos:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Timeout: requisicao demorou mais de 10 segundos' };
    }
    return { success: false, error: `Erro ao conectar: ${error}` };
  }
}

// ===== FUNCAO DE HEALTH CHECK =====

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ===== FUNCOES AUXILIARES =====

/**
 * Verifica se ha erros sintaticos na resposta de compilacao
 */
export function hasSyntaxErrors(response: CompileResponse): boolean {
  if (response.success) {
    return false;
  }
  
  const hasSyntax = response.syntaxErrors !== undefined && response.syntaxErrors.length > 0;
  const hasGeneric = response.errors !== undefined && response.errors.length > 0;
  
  return hasSyntax || hasGeneric;
}

/**
 * Verifica se ha erros semanticos na resposta de compilacao
 */
export function hasSemanticErrors(response: CompileResponse): boolean {
  if (response.success) {
    return false;
  }
  
  return response.semanticErrors !== undefined && response.semanticErrors.length > 0;
}

/**
 * Retorna todos os erros (sintaticos e semanticos) de forma unificada
 */
export function getAllErrors(response: CompileResponse): Array<CompileError | SemanticError> {
  const errors: Array<CompileError | SemanticError> = [];
  
  if (response.syntaxErrors) {
    errors.push(...response.syntaxErrors);
  }
  
  if (response.semanticErrors) {
    errors.push(...response.semanticErrors);
  }
  
  // Fallback para retrocompatibilidade
  if (errors.length === 0 && response.errors) {
    errors.push(...response.errors);
  }
  
  return errors;
}

/**
 * Formata erro para exibicao
 */
export function formatError(error: CompileError | SemanticError): string {
  let prefix = '[ERRO]';
  
  if ('type' in error) {
    // Erro semantico
    prefix = '[SEMANTICO]';
  } else if (error.context) {
    // Erro sintatico com contexto
    prefix = '[SINTAXE]';
  }
  
  const location = error.line > 0 
    ? ` [linha ${error.line}${error.column > 0 ? `, coluna ${error.column}` : ''}]`
    : '';
  
  return `${prefix}${location}: ${error.message}`;
}

