import api from "@/lib/api";

// ==========================================
// TIPOS DO CHAT
// ==========================================
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  produtorId?: string;
  cpfCnpj?: string;
  regimeTributario?: string;
  culturas?: string[];
  estado?: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  sources: string[];
  timestamp: string;
}

export interface NotaFiscalChat {
  tipo: "entrada" | "saida";
  produto: string;
  valor: number;
  quantidade?: number;
  destino?: string;
  exportacao?: boolean;
}

export interface AnaliseNotaResponse {
  analise: string;
  impostos: {
    cbs: number;
    ibs: number;
    funrural: number;
    total: number;
  };
  recomendacoes: string[];
}

export interface CalculoImpostoChat {
  faturamentoAnual: number;
  regime: string;
  culturas: string[];
  custoInsumos?: number;
}

export interface SimulacaoPrecoChat {
  valorVenda: number;
  custoProducao: number;
  margem: number;
  produto: string;
}

export interface DicasLucroResponse {
  dicas: string[];
  potencialEconomia: number;
}

// ==========================================
// FUNÇÕES DO CHAT
// ==========================================
export async function enviarMensagem(
  message: string,
  context?: ChatContext,
): Promise<ChatResponse> {
  return api.post<ChatResponse>("/chat", { message, context });
}

export async function analisarNota(
  nota: NotaFiscalChat,
  context?: ChatContext,
): Promise<AnaliseNotaResponse> {
  return api.post<AnaliseNotaResponse>("/chat/analisar-nota", {
    nota,
    context,
  });
}

export async function calcularImpostosChat(
  dados: CalculoImpostoChat,
): Promise<ChatResponse> {
  return api.post<ChatResponse>("/chat/calcular", dados);
}

export async function simularPrecoChat(
  dados: SimulacaoPrecoChat,
): Promise<ChatResponse> {
  return api.post<ChatResponse>("/chat/simular-preco", dados);
}

export async function getDicasLucro(
  produtorId: string,
): Promise<DicasLucroResponse> {
  return api.post<DicasLucroResponse>("/chat/dicas-lucro", { produtorId });
}
