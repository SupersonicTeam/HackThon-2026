import api from "@/lib/api";

// ==========================================
// TIPOS DO CALENDÁRIO FISCAL
// ==========================================
export interface EventoFiscal {
  id: string;
  produtorId: string;
  titulo: string;
  descricao?: string;
  tipo: "imposto" | "obrigacao" | "prazo" | "outro";
  dataVencimento: string;
  valor?: number;
  status: "pendente" | "pago" | "vencido" | "cancelado";
  recorrente: boolean;
  frequencia?: "mensal" | "trimestral" | "anual";
  createdAt: string;
  updatedAt: string;
}

export interface Vencimento {
  evento: string;
  descricao: string;
  dataVencimento: string;
  valor?: number;
  status: string;
  diasRestantes: number;
  urgente: boolean;
  atencao: boolean;
  obrigatorio: boolean;
  observacoes?: string;
}

export interface NotificacaoFiscal {
  id: string;
  produtorId: string;
  eventoId: string;
  titulo: string;
  mensagem: string;
  tipo: "email" | "whatsapp" | "sistema";
  lida: boolean;
  dataEnvio: string;
  createdAt: string;
}

export interface ConfiguracaoNotificacoes {
  diasAntecedencia: number[];
  tiposNotificacao: ("email" | "whatsapp" | "sistema")[];
  ativo: boolean;
}

export interface RelatorioMensal {
  id: string;
  produtorId: string;
  mes: number;
  ano: number;
  status: "gerado" | "enviado" | "erro";
  arquivoUrl?: string;
  dataGeracao: string;
  dataEnvio?: string;
  contadorEmail?: string;
}

export interface ResumoCalendario {
  eventosPendentes: number;
  eventosVencidos: number;
  proximosVencimentos: Vencimento[];
  totalPagar: number;
  notificacoesNaoLidas: number;
}

export interface PendenciaContador {
  id: string;
  produtorId: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  prioridade: "baixa" | "media" | "alta";
  prazo: string;
  status: "pendente" | "enviado" | "recebido" | "concluido" | "cancelado";
  createdAt: string;
}

export interface DocumentoAnexado {
  id: string;
  pendenciaId: string;
  nome: string;
  tipo: string;
  url: string;
  tamanho: number;
  dataUpload: string;
}

export interface PacoteDocumentos {
  id: string;
  produtorId: string;
  mes: number;
  ano: number;
  arquivoUrl: string;
  senha: string;
  validade: string;
  createdAt: string;
}

export interface ConfiguracaoEnvioAutomatico {
  contadorEmail: string;
  diaEnvio: number;
  ativo: boolean;
  incluirAnexos: string[];
}

// ==========================================
// EVENTOS E VENCIMENTOS
// ==========================================
export async function getEventos(
  produtorId: string,
  params?: {
    mes?: number;
    ano?: number;
    tipo?: string;
    status?: string;
  },
): Promise<EventoFiscal[]> {
  return api.get<EventoFiscal[]>(
    `/calendario-fiscal/${produtorId}/eventos`,
    params,
  );
}

export async function getVencimentos(
  produtorId: string,
  params?: {
    dias?: number;
  },
): Promise<Vencimento[]> {
  return api.get<Vencimento[]>(
    `/calendario-fiscal/${produtorId}/vencimentos`,
    params,
  );
}

export async function createEvento(
  data: Omit<EventoFiscal, "id" | "createdAt" | "updatedAt">,
): Promise<EventoFiscal> {
  return api.post<EventoFiscal>("/calendario-fiscal/eventos", data);
}

export async function updateEvento(
  id: string,
  data: Partial<EventoFiscal>,
): Promise<EventoFiscal> {
  return api.patch<EventoFiscal>(`/calendario-fiscal/eventos/${id}`, data);
}

export async function marcarEventoPago(id: string): Promise<EventoFiscal> {
  return api.post<EventoFiscal>(`/calendario-fiscal/eventos/${id}/pagar`);
}

// ==========================================
// NOTIFICAÇÕES
// ==========================================
export async function getNotificacoes(
  produtorId: string,
  params?: {
    lida?: boolean;
  },
): Promise<NotificacaoFiscal[]> {
  return api.get<NotificacaoFiscal[]>(
    `/calendario-fiscal/${produtorId}/notificacoes`,
    params,
  );
}

export async function marcarNotificacaoLida(
  id: string,
): Promise<NotificacaoFiscal> {
  return api.patch<NotificacaoFiscal>(
    `/calendario-fiscal/notificacoes/${id}/lida`,
  );
}

export async function configurarNotificacoes(
  produtorId: string,
  data: ConfiguracaoNotificacoes,
): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(
    `/calendario-fiscal/${produtorId}/notificacoes`,
    data,
  );
}

// ==========================================
// RESUMO E RELATÓRIOS
// ==========================================
export async function getResumo(produtorId: string): Promise<ResumoCalendario> {
  return api.get<ResumoCalendario>(`/calendario-fiscal/${produtorId}/resumo`);
}

export async function gerarRelatorioMensal(
  produtorId: string,
  data: { mes: number; ano: number },
): Promise<RelatorioMensal> {
  return api.post<RelatorioMensal>(
    `/calendario-fiscal/${produtorId}/relatorio-mensal/gerar`,
    data,
  );
}

export async function enviarRelatorioContador(
  produtorId: string,
  data: {
    relatorioId: string;
    contadorEmail: string;
  },
): Promise<RelatorioMensal> {
  return api.post<RelatorioMensal>(
    `/calendario-fiscal/${produtorId}/relatorio-mensal/enviar`,
    data,
  );
}

export async function configurarEnvioAutomatico(
  produtorId: string,
  data: ConfiguracaoEnvioAutomatico,
): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(
    `/calendario-fiscal/${produtorId}/relatorio-mensal/configurar-automatico`,
    data,
  );
}

// ==========================================
// PENDÊNCIAS DO CONTADOR
// ==========================================
export async function getPendencias(
  produtorId: string,
  params?: {
    status?: string;
  },
): Promise<PendenciaContador[]> {
  return api.get<PendenciaContador[]>(
    `/calendario-fiscal/${produtorId}/pendencias`,
    params,
  );
}

export async function createPendencia(
  data: Omit<PendenciaContador, "id" | "createdAt" | "status">,
): Promise<PendenciaContador> {
  return api.post<PendenciaContador>("/calendario-fiscal/pendencias", data);
}

export async function updatePendencia(
  id: string,
  data: Partial<PendenciaContador>,
): Promise<PendenciaContador> {
  return api.patch<PendenciaContador>(
    `/calendario-fiscal/pendencias/${id}`,
    data,
  );
}

export async function anexarDocumento(
  pendenciaId: string,
  file: File,
): Promise<DocumentoAnexado> {
  return api.uploadFile<DocumentoAnexado>(
    `/calendario-fiscal/pendencias/${pendenciaId}/anexar`,
    file,
    "arquivo",
  );
}

// ==========================================
// PACOTE DE DOCUMENTOS
// ==========================================
export async function gerarPacoteDocumentos(
  produtorId: string,
  data: {
    mes: number;
    ano: number;
    tiposDocumento?: string[];
  },
): Promise<PacoteDocumentos> {
  return api.post<PacoteDocumentos>(
    `/calendario-fiscal/${produtorId}/documentos/gerar-pacote`,
    data,
  );
}

export async function getPacotes(
  produtorId: string,
): Promise<PacoteDocumentos[]> {
  return api.get<PacoteDocumentos[]>(
    `/calendario-fiscal/${produtorId}/documentos/pacotes`,
  );
}
