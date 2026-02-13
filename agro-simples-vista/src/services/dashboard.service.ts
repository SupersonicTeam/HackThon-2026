import api from "@/lib/api";
import type {
  Produtor,
  NotaFiscal,
  FluxoCaixa,
  ImpostosPorTipo,
  CalculoImposto,
  SimulacaoPreco,
  ComparacaoCenario,
  RascunhoNota,
  CreateRascunhoDto,
  FeedbackRascunhoDto,
  GerarNotaDiretaDto,
  OcrResult,
} from "./types";

// ==========================================
// PRODUTOR
// ==========================================
export async function getProdutores(): Promise<Produtor[]> {
  return api.get<Produtor[]>("/dashboard/produtores");
}

export async function getProdutor(id: string): Promise<Produtor> {
  return api.get<Produtor>(`/dashboard/produtores/${id}`);
}

export async function createProdutor(
  data: Omit<Produtor, "id" | "createdAt" | "updatedAt">,
): Promise<Produtor> {
  return api.post<Produtor>("/dashboard/produtores", data);
}

export async function updateProdutor(
  id: string,
  data: Partial<Produtor>,
): Promise<Produtor> {
  return api.patch<Produtor>(`/dashboard/produtores/${id}`, data);
}

// ==========================================
// NOTAS FISCAIS
// ==========================================
export async function getNotas(
  produtorId: string,
  params?: {
    tipo?: "entrada" | "saida";
    dataInicio?: string;
    dataFim?: string;
    status?: string;
  },
): Promise<NotaFiscal[]> {
  return api.get<NotaFiscal[]>("/dashboard/notas", { produtorId, ...params });
}

export async function getNota(id: string): Promise<NotaFiscal> {
  return api.get<NotaFiscal>(`/dashboard/notas/${id}`);
}

export async function createNota(
  data: Partial<NotaFiscal> & { itens: NotaFiscal["itens"] },
): Promise<NotaFiscal> {
  return api.post<NotaFiscal>("/dashboard/notas", data);
}

export async function uploadNota(
  produtorId: string,
  file: File,
): Promise<OcrResult> {
  return api.uploadFile<OcrResult>(
    `/dashboard/notas/upload?produtorId=${produtorId}`,
    file,
    "arquivo",
  );
}

export async function gerarNotaDireta(data: GerarNotaDiretaDto): Promise<NotaFiscal> {
  return api.post<NotaFiscal>("/dashboard/notas/gerar-direta", data);
}

// ==========================================
// FLUXO DE CAIXA E IMPOSTOS
// ==========================================
export async function getFluxoCaixa(
  produtorId: string,
  params?: {
    dataInicio?: string;
    dataFim?: string;
  },
): Promise<FluxoCaixa> {
  return api.get<FluxoCaixa>(`/dashboard/${produtorId}/fluxo-caixa`, params);
}

export async function getImpostosPorTipo(
  produtorId: string,
  params?: {
    mes?: number;
    ano?: number;
  },
): Promise<ImpostosPorTipo[]> {
  return api.get<ImpostosPorTipo[]>(
    `/dashboard/${produtorId}/impostos-por-tipo`,
    params,
  );
}

// ==========================================
// CALCULADORA DE IMPOSTOS
// ==========================================
export async function calcularImpostos(data: {
  valor: number;
  tipo: "entrada" | "saida";
  ncm?: string;
  uf?: string;
  exportacao?: boolean;
}): Promise<CalculoImposto> {
  return api.post<CalculoImposto>("/dashboard/calculadora/impostos", data);
}

export async function simularPreco(data: {
  custoBase: number;
  margemDesejada: number;
  ncm?: string;
  uf?: string;
}): Promise<SimulacaoPreco> {
  return api.post<SimulacaoPreco>("/dashboard/calculadora/simular-preco", data);
}

export async function compararCenarios(data: {
  custoBase: number;
  margens: number[];
  ncm?: string;
  uf?: string;
}): Promise<ComparacaoCenario[]> {
  return api.post<ComparacaoCenario[]>(
    "/dashboard/calculadora/comparar-cenarios",
    data,
  );
}

// ==========================================
// RASCUNHOS DE NOTA FISCAL
// ==========================================
export async function getRascunhos(
  produtorId: string,
  params?: {
    status?: string;
  },
): Promise<RascunhoNota[]> {
  return api.get<RascunhoNota[]>(`/dashboard/rascunhos/${produtorId}`, params);
}

export async function getRascunho(id: string): Promise<RascunhoNota> {
  return api.get<RascunhoNota>(`/dashboard/rascunhos/detalhes/${id}`);
}

export async function createRascunho(
  data: CreateRascunhoDto,
): Promise<RascunhoNota> {
  return api.post<RascunhoNota>("/dashboard/rascunhos", data);
}

export async function updateRascunho(
  id: string,
  data: Partial<CreateRascunhoDto>,
): Promise<RascunhoNota> {
  return api.put<RascunhoNota>(`/dashboard/rascunhos/${id}`, data);
}

export async function enviarRascunhoContador(
  id: string,
): Promise<RascunhoNota> {
  return api.post<RascunhoNota>(`/dashboard/rascunhos/${id}/enviar-contador`);
}

export async function feedbackRascunho(
  id: string,
  data: FeedbackRascunhoDto,
): Promise<RascunhoNota> {
  return api.post<RascunhoNota>(`/dashboard/rascunhos/${id}/feedback`, data);
}

export async function finalizarRascunho(id: string): Promise<NotaFiscal> {
  return api.post<NotaFiscal>(`/dashboard/rascunhos/${id}/finalizar`);
}

export async function getRascunhosPendentesContador(): Promise<RascunhoNota[]> {
  return api.get<RascunhoNota[]>("/dashboard/contador/rascunhos-pendentes");
}
