import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as calendarioService from "@/services/calendario-fiscal.service";
import type {
  ConfiguracaoNotificacoes,
  ConfiguracaoEnvioAutomatico,
  EventoFiscal,
  PendenciaContador,
} from "@/services/calendario-fiscal.service";

// ==========================================
// EVENTOS E VENCIMENTOS HOOKS
// ==========================================
export function useEventos(
  produtorId: string,
  params?: {
    mes?: number;
    ano?: number;
    tipo?: string;
    status?: string;
  },
) {
  return useQuery({
    queryKey: ["eventos", produtorId, params],
    queryFn: () => calendarioService.getEventos(produtorId, params),
    enabled: !!produtorId,
  });
}

export function useVencimentos(produtorId: string, dias?: number) {
  return useQuery({
    queryKey: ["vencimentos", produtorId, dias],
    queryFn: async () => {
      try {
        return await calendarioService.getVencimentos(produtorId, { dias });
      } catch (error: any) {
        // Se backend não implementado (404), retorna array vazio sem logar erro
        if (error?.status === 404) {
          return { vencimentos: [] };
        }
        throw error;
      }
    },
    // TODO: Mudar para 'enabled: !!produtorId' quando API calendario-fiscal for implementada no backend
    enabled: false, // Temporariamente desabilitado - API não implementada
    retry: false,
  });
}

export function useCreateEvento() {
  const queryClient = useQueryClient();
  return useMutation<
    EventoFiscal,
    Error,
    Omit<EventoFiscal, "id" | "createdAt" | "updatedAt">
  >({
    mutationFn: calendarioService.createEvento,
    onSuccess: (result: EventoFiscal) => {
      queryClient.invalidateQueries({
        queryKey: ["eventos", result.produtorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vencimentos", result.produtorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["resumoCalendario", result.produtorId],
      });
    },
  });
}

export function useMarcarEventoPago() {
  const queryClient = useQueryClient();
  return useMutation<EventoFiscal, Error, string>({
    mutationFn: (id: string) => calendarioService.marcarEventoPago(id),
    onSuccess: (result: EventoFiscal) => {
      queryClient.invalidateQueries({
        queryKey: ["eventos", result.produtorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vencimentos", result.produtorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["resumoCalendario", result.produtorId],
      });
    },
  });
}

// ==========================================
// NOTIFICAÇÕES HOOKS
// ==========================================
export function useNotificacoes(produtorId: string, lida?: boolean) {
  return useQuery({
    queryKey: ["notificacoes", produtorId, lida],
    queryFn: () => calendarioService.getNotificacoes(produtorId, { lida }),
    enabled: !!produtorId,
  });
}

export function useMarcarNotificacaoLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarioService.marcarNotificacaoLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumoCalendario"] });
    },
  });
}

export function useConfigurarNotificacoes() {
  return useMutation({
    mutationFn: ({
      produtorId,
      data,
    }: {
      produtorId: string;
      data: ConfiguracaoNotificacoes;
    }) => calendarioService.configurarNotificacoes(produtorId, data),
  });
}

// ==========================================
// RESUMO E RELATÓRIOS HOOKS
// ==========================================
export function useResumoCalendario(produtorId: string) {
  return useQuery({
    queryKey: ["resumoCalendario", produtorId],
    queryFn: () => calendarioService.getResumo(produtorId),
    enabled: !!produtorId,
  });
}

export function useGerarRelatorioMensal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      produtorId,
      mes,
      ano,
    }: {
      produtorId: string;
      mes: number;
      ano: number;
    }) => calendarioService.gerarRelatorioMensal(produtorId, { mes, ano }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["relatorios", variables.produtorId],
      });
    },
  });
}

export function useEnviarRelatorioContador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      produtorId,
      relatorioId,
      contadorEmail,
    }: {
      produtorId: string;
      relatorioId: string;
      contadorEmail: string;
    }) =>
      calendarioService.enviarRelatorioContador(produtorId, {
        relatorioId,
        contadorEmail,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["relatorios", variables.produtorId],
      });
    },
  });
}

export function useConfigurarEnvioAutomatico() {
  return useMutation({
    mutationFn: ({
      produtorId,
      data,
    }: {
      produtorId: string;
      data: ConfiguracaoEnvioAutomatico;
    }) => calendarioService.configurarEnvioAutomatico(produtorId, data),
  });
}

// ==========================================
// PENDÊNCIAS HOOKS
// ==========================================
export function usePendencias(produtorId: string, status?: string) {
  return useQuery({
    queryKey: ["pendencias", produtorId, status],
    queryFn: () => calendarioService.getPendencias(produtorId, { status }),
    enabled: !!produtorId,
  });
}

export function useCreatePendencia() {
  const queryClient = useQueryClient();
  return useMutation<
    PendenciaContador,
    Error,
    Omit<PendenciaContador, "id" | "createdAt" | "status">
  >({
    mutationFn: calendarioService.createPendencia,
    onSuccess: (result: PendenciaContador) => {
      queryClient.invalidateQueries({
        queryKey: ["pendencias", result.produtorId],
      });
    },
  });
}

export function useUpdatePendencia() {
  const queryClient = useQueryClient();
  return useMutation<
    PendenciaContador,
    Error,
    { id: string; data: Partial<PendenciaContador> }
  >({
    mutationFn: ({ id, data }) => calendarioService.updatePendencia(id, data),
    onSuccess: (result: PendenciaContador) => {
      queryClient.invalidateQueries({
        queryKey: ["pendencias", result.produtorId],
      });
    },
  });
}

export function useAnexarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pendenciaId, file }: { pendenciaId: string; file: File }) =>
      calendarioService.anexarDocumento(pendenciaId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendencias"] });
    },
  });
}

// ==========================================
// PACOTE DE DOCUMENTOS HOOKS
// ==========================================
export function useGerarPacoteDocumentos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      produtorId,
      mes,
      ano,
      tiposDocumento,
    }: {
      produtorId: string;
      mes: number;
      ano: number;
      tiposDocumento?: string[];
    }) =>
      calendarioService.gerarPacoteDocumentos(produtorId, {
        mes,
        ano,
        tiposDocumento,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pacotes", variables.produtorId],
      });
    },
  });
}

export function usePacotes(produtorId: string) {
  return useQuery({
    queryKey: ["pacotes", produtorId],
    queryFn: () => calendarioService.getPacotes(produtorId),
    enabled: !!produtorId,
  });
}
