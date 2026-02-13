import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as dashboardService from "@/services/dashboard.service";
import type {
  Produtor,
  NotaFiscal,
  RascunhoNota,
  CreateRascunhoDto,
  FeedbackRascunhoDto,
  GerarNotaDiretaDto,
} from "@/services/types";

// ==========================================
// PRODUTOR HOOKS
// ==========================================
export function useProdutores() {
  return useQuery({
    queryKey: ["produtores"],
    queryFn: dashboardService.getProdutores,
  });
}

export function useProdutor(id: string) {
  return useQuery({
    queryKey: ["produtor", id],
    queryFn: () => dashboardService.getProdutor(id),
    enabled: !!id,
  });
}

export function useCreateProdutor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Produtor, "id" | "createdAt" | "updatedAt">) =>
      dashboardService.createProdutor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtores"] });
    },
  });
}

// ==========================================
// NOTAS FISCAIS HOOKS
// ==========================================
export function useNotas(
  produtorId: string,
  params?: {
    tipo?: "entrada" | "saida";
    dataInicio?: string;
    dataFim?: string;
    status?: string;
  },
) {
  return useQuery({
    queryKey: ["notas", produtorId, params],
    queryFn: () => dashboardService.getNotas(produtorId, params),
    enabled: !!produtorId,
  });
}

export function useNota(id: string) {
  return useQuery({
    queryKey: ["nota", id],
    queryFn: () => dashboardService.getNota(id),
    enabled: !!id,
  });
}

export function useUploadNota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ produtorId, file }: { produtorId: string; file: File }) =>
      dashboardService.uploadNota(produtorId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notas", variables.produtorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["fluxoCaixa", variables.produtorId],
      });
    },
  });
}

export function useGerarNotaDireta() {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, Error, GerarNotaDiretaDto>({
    mutationFn: dashboardService.gerarNotaDireta,
    onSuccess: (_: NotaFiscal, variables: GerarNotaDiretaDto) => {
      queryClient.invalidateQueries({
        queryKey: ["notas", variables.produtorId],
      });
    },
  });
}

// ==========================================
// FLUXO DE CAIXA E IMPOSTOS HOOKS
// ==========================================
export function useFluxoCaixa(
  produtorId: string,
  params?: {
    dataInicio?: string;
    dataFim?: string;
  },
) {
  return useQuery({
    queryKey: ["fluxoCaixa", produtorId, params],
    queryFn: () => dashboardService.getFluxoCaixa(produtorId, params),
    enabled: !!produtorId,
  });
}

export function useImpostosPorTipo(
  produtorId: string,
  params?: {
    mes?: number;
    ano?: number;
  },
) {
  return useQuery({
    queryKey: ["impostos", produtorId, params],
    queryFn: () => dashboardService.getImpostosPorTipo(produtorId, params),
    enabled: !!produtorId,
  });
}

// ==========================================
// CALCULADORA HOOKS
// ==========================================
export function useCalcularImpostos() {
  return useMutation({
    mutationFn: dashboardService.calcularImpostos,
  });
}

export function useSimularPreco() {
  return useMutation({
    mutationFn: dashboardService.simularPreco,
  });
}

export function useCompararCenarios() {
  return useMutation({
    mutationFn: dashboardService.compararCenarios,
  });
}

// ==========================================
// RASCUNHOS HOOKS
// ==========================================
export function useRascunhos(produtorId: string, params?: { status?: string }) {
  return useQuery({
    queryKey: ["rascunhos", produtorId, params],
    queryFn: () => dashboardService.getRascunhos(produtorId, params),
    enabled: !!produtorId,
  });
}

export function useRascunho(id: string) {
  return useQuery({
    queryKey: ["rascunho", id],
    queryFn: () => dashboardService.getRascunho(id),
    enabled: !!id,
  });
}

export function useCreateRascunho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRascunhoDto) =>
      dashboardService.createRascunho(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rascunhos", variables.produtorId],
      });
    },
  });
}

export function useUpdateRascunho() {
  const queryClient = useQueryClient();
  return useMutation<
    RascunhoNota,
    Error,
    { id: string; data: Partial<CreateRascunhoDto> }
  >({
    mutationFn: ({ id, data }) => dashboardService.updateRascunho(id, data),
    onSuccess: (result: RascunhoNota) => {
      queryClient.invalidateQueries({
        queryKey: ["rascunhos", result.produtorId],
      });
      queryClient.invalidateQueries({ queryKey: ["rascunho", result.id] });
    },
  });
}

export function useEnviarRascunhoContador() {
  const queryClient = useQueryClient();
  return useMutation<RascunhoNota, Error, string>({
    mutationFn: (id: string) => dashboardService.enviarRascunhoContador(id),
    onSuccess: (result: RascunhoNota) => {
      queryClient.invalidateQueries({
        queryKey: ["rascunhos", result.produtorId],
      });
      queryClient.invalidateQueries({ queryKey: ["rascunhosPendentes"] });
    },
  });
}

export function useFeedbackRascunho() {
  const queryClient = useQueryClient();
  return useMutation<
    RascunhoNota,
    Error,
    { id: string; data: FeedbackRascunhoDto }
  >({
    mutationFn: ({ id, data }) => dashboardService.feedbackRascunho(id, data),
    onSuccess: (result: RascunhoNota) => {
      queryClient.invalidateQueries({
        queryKey: ["rascunhos", result.produtorId],
      });
      queryClient.invalidateQueries({ queryKey: ["rascunhosPendentes"] });
    },
  });
}

export function useFinalizarRascunho() {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, Error, string>({
    mutationFn: (id: string) => dashboardService.finalizarRascunho(id),
    onSuccess: (result: NotaFiscal) => {
      queryClient.invalidateQueries({
        queryKey: ["rascunhos", result.produtorId],
      });
      queryClient.invalidateQueries({ queryKey: ["notas", result.produtorId] });
    },
  });
}

export function useRascunhosPendentesContador() {
  return useQuery({
    queryKey: ["rascunhosPendentes"],
    queryFn: dashboardService.getRascunhosPendentesContador,
  });
}
