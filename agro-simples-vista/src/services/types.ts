// Tipos do Dashboard
export interface Produtor {
  id: string;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  estado?: string;
  cidade?: string;
  regime: string;
  culturas: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemNotaFiscal {
  id: string;
  numeroItem: number;
  codigoProduto?: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorDesconto?: number;
  valorFrete?: number;
  baseCalculoIcms?: number;
  valorIcms?: number;
  aliquotaIcms?: number;
  valorCbs?: number;
  valorIbs?: number;
  valorFunrural?: number;
}

export interface NotaFiscal {
  id: string;
  produtorId: string;
  chaveAcesso: string;
  tipo: "entrada" | "saida";
  numero?: string;
  serie?: string;
  cfop?: string;
  naturezaOperacao?: string;
  nomeEmitente?: string;
  cpfCnpjEmitente?: string;
  destino?: string;
  exportacao?: boolean;
  valorTotal: number;
  valorProdutos?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorDesconto?: number;
  arquivoUrl?: string;
  arquivoTipo?: string;
  status?: string;
  valorCbs?: number;
  valorIbs?: number;
  valorFunrural?: number;
  valorIcms?: number;
  valorIpi?: number;
  observacoes?: string;
  dataEmissao?: string;
  createdAt?: string;
  itens: ItemNotaFiscal[];
}

export interface FluxoCaixa {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  totalImpostos: number;
  lucroEstimado: number;
  qtdNotasEntrada: number;
  qtdNotasSaida: number;
}

export interface ImpostosPorTipo {
  tipo: string;
  total: number;
  detalhes: {
    cbs: number;
    ibs: number;
    funrural: number;
  };
}

export interface CalculoImposto {
  valorBase: number;
  cbs: {
    aliquota: number;
    valor: number;
  };
  ibs: {
    aliquota: number;
    valor: number;
  };
  funrural: {
    aliquota: number;
    valor: number;
  };
  totalImpostos: number;
  valorLiquido: number;
}

export interface SimulacaoPreco {
  valorBase: number;
  margemDesejada: number;
  precoSugerido: number;
  impostos: CalculoImposto;
}

export interface ComparacaoCenario {
  margem: number;
  precoVenda: number;
  impostos: number;
  lucroLiquido: number;
}

// Tipos de Rascunho NF-e
export interface ItemRascunhoNota {
  id?: string;
  numeroItem: number;
  descricao: string;
  ncm?: string;
  unidade?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export type StatusRascunho =
  | "rascunho"
  | "enviado"
  | "revisao"
  | "aprovado"
  | "reprovado"
  | "finalizado";

export interface RascunhoNota {
  id: string;
  produtorId: string;
  titulo?: string;
  tipo: "entrada" | "saida";
  naturezaOperacao?: string;
  cfop?: string;
  destinatarioNome?: string;
  destinatarioCpfCnpj?: string;
  uf?: string;
  municipio?: string;
  valorTotal: number;
  observacoes?: string;
  status: StatusRascunho;
  feedbackContador?: string;
  dataEnvio?: string;
  dataFeedback?: string;
  createdAt: string;
  updatedAt: string;
  itens: ItemRascunhoNota[];
}

export interface CreateRascunhoDto {
  produtorId: string;
  contadorId?: string;
  tipo: "entrada" | "saida";
  cfop?: string;
  naturezaOperacao?: string;
  nomeDestinatario: string;
  cpfCnpjDestinatario?: string;
  ufDestino?: string;
  dataEmissao: string; // Data prevista para emissão (required)
  observacoes?: string;
  itens: CreateItemNotaFiscalDto[];
}

export interface FeedbackRascunhoDto {
  status: "aprovado" | "revisao" | "reprovado";
  feedback: string;
}

// Tipos de Geração de Nota Direta
export interface CreateItemNotaFiscalDto {
  numeroItem: number;
  codigoProduto?: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface GerarNotaDiretaDto {
  produtorId: string;
  tipo: "entrada" | "saida";
  cfop: string;
  naturezaOperacao: string;
  nomeDestinatario: string;
  cpfCnpjDestinatario: string;
  ufDestino: string;
  dataEmissao: string; // ISO date string
  observacoes?: string;
  itens: CreateItemNotaFiscalDto[];
}

// Tipos de Upload/OCR
export interface OcrResult {
  nota: Partial<NotaFiscal>;
  confianca: number;
  camposExtraidos: string[];
}
