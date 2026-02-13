import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

// DTOs
export interface EnviarNotificacaoDto {
  produtorId: string;
  mensagem: string;
}

export interface NotificarDocumentoDto {
  tipo: string;
  numero?: string;
  dataVencimento: string;
  valor?: number;
}

export interface MensagemPersonalizadaDto {
  titulo: string;
  corpo: string;
}

export interface NotificarNFeDto {
  numero: string;
  serie: string;
  valor: number;
  tipo: string;
  chaveAcesso: string;
}

export interface NotificacaoResult {
  success: boolean;
  telefone?: string;
  mensagem?: string;
  erro?: string;
}

export interface NotificacaoLoteResult {
  total: number;
  enviados: number;
  erros?: NotificacaoResult[];
  obrigacoes?: any[];
}

// API Calls
export const notificacaoService = {
  enviar: (data: EnviarNotificacaoDto) =>
    api.post<NotificacaoResult>("/notificacao/enviar", data),

  documentoAtrasado: (produtorId: string, data: NotificarDocumentoDto) =>
    api.post<NotificacaoResult>(
      `/notificacao/${produtorId}/documento-atrasado`,
      data
    ),

  todosAtrasados: (produtorId: string) =>
    api.post<NotificacaoLoteResult>(
      `/notificacao/${produtorId}/todos-atrasados`
    ),

  proximasObrigacoes: (produtorId: string) =>
    api.post<NotificacaoLoteResult>(
      `/notificacao/${produtorId}/proximas-obrigacoes`
    ),

  mensagemPersonalizada: (produtorId: string, data: MensagemPersonalizadaDto) =>
    api.post<NotificacaoResult>(`/notificacao/${produtorId}/mensagem`, data),

  nfeEmitida: (produtorId: string, data: NotificarNFeDto) =>
    api.post<NotificacaoResult>(`/notificacao/${produtorId}/nfe-emitida`, data),
};

// Hooks
export const useEnviarNotificacao = () => {
  return useMutation({
    mutationFn: (data: EnviarNotificacaoDto) => notificacaoService.enviar(data),
  });
};

export const useNotificarDocumentoAtrasado = () => {
  return useMutation({
    mutationFn: ({
      produtorId,
      documento,
    }: {
      produtorId: string;
      documento: NotificarDocumentoDto;
    }) => notificacaoService.documentoAtrasado(produtorId, documento),
  });
};

export const useNotificarTodosAtrasados = () => {
  return useMutation({
    mutationFn: (produtorId: string) =>
      notificacaoService.todosAtrasados(produtorId),
  });
};

export const useNotificarProximasObrigacoes = () => {
  return useMutation({
    mutationFn: (produtorId: string) =>
      notificacaoService.proximasObrigacoes(produtorId),
  });
};

export const useEnviarMensagemPersonalizada = () => {
  return useMutation({
    mutationFn: ({
      produtorId,
      mensagem,
    }: {
      produtorId: string;
      mensagem: MensagemPersonalizadaDto;
    }) => notificacaoService.mensagemPersonalizada(produtorId, mensagem),
  });
};

export const useNotificarNFeEmitida = () => {
  return useMutation({
    mutationFn: ({
      produtorId,
      nota,
    }: {
      produtorId: string;
      nota: NotificarNFeDto;
    }) => notificacaoService.nfeEmitida(produtorId, nota),
  });
};
