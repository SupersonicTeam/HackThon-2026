export const usuario = {
  nome: "Luiz",
};

export const pendencias = [
  { id: 1, titulo: "Enviar nota fiscal de insumos", prazo: "2026-02-15" },
  { id: 2, titulo: "Pagar FUNRURAL", prazo: "2026-02-20" },
  { id: 3, titulo: "Renovar licença ambiental", prazo: "2026-02-28" },
  { id: 4, titulo: "Entregar relatório de produção", prazo: "2026-02-25" },
];

export const ultimosDocumentos = [
  {
    id: 1,
    tipo: "Nota Fiscal",
    nome: "NF Sementes Safra",
    data: "2026-02-05",
    status: "validado",
  },
  {
    id: 2,
    tipo: "Recibo",
    nome: "Recibo Frete Grãos",
    data: "2026-02-03",
    status: "validado",
  },
  {
    id: 3,
    tipo: "Contrato",
    nome: "Arrendamento Talhão Sul",
    data: "2026-01-28",
    status: "pendente",
  },
  {
    id: 4,
    tipo: "Nota Fiscal",
    nome: "NF Adubo Fosfatado",
    data: "2026-02-10",
    status: "validado",
  },
  {
    id: 5,
    tipo: "Comprovante",
    nome: "Pagamento Funcionários",
    data: "2026-02-15",
    status: "validado",
  },
  {
    id: 6,
    tipo: "Recibo",
    nome: "Recibo Manutenção Trator",
    data: "2026-02-20",
    status: "pendente",
  },
  {
    id: 7,
    tipo: "Boleto",
    nome: "Boleto Energia Elétrica",
    data: "2026-02-25",
    status: "validado",
  },
];

export const resumoFinanceiro = {
  entradas: 84500,
  saidas: 37200,
  lucro: 47300,
};

export const tiposDocumento = [
  "Nota de venda",
  "Nota de compra",
  "Salário",
  "Frete",
  "Banco",
  "Contrato",
  "Outro",
];

export interface DocumentoBiblioteca {
  id: number;
  nome: string;
  tipo: string;
  data: string;
  mesReferencia: string;
  valor: number;
  enviadoContador: boolean;
}

export const documentosBiblioteca: DocumentoBiblioteca[] = [
  {
    id: 1,
    nome: "NF Venda Soja Lote 12",
    tipo: "Nota de venda",
    data: "2026-02-04",
    mesReferencia: "Fevereiro",
    valor: 48000,
    enviadoContador: true,
  },
  {
    id: 2,
    nome: "NF Compra Adubo Fosfatado",
    tipo: "Nota de compra",
    data: "2026-02-06",
    mesReferencia: "Fevereiro",
    valor: 12300,
    enviadoContador: false,
  },
  {
    id: 3,
    nome: "Folha Pagamento Jan",
    tipo: "Salário",
    data: "2026-02-05",
    mesReferencia: "Janeiro",
    valor: 8500,
    enviadoContador: true,
  },
  {
    id: 4,
    nome: "Frete Grãos Cooperativa",
    tipo: "Frete",
    data: "2026-02-10",
    mesReferencia: "Fevereiro",
    valor: 3200,
    enviadoContador: false,
  },
  {
    id: 5,
    nome: "Extrato Conta Rural",
    tipo: "Banco",
    data: "2026-01-30",
    mesReferencia: "Janeiro",
    valor: 0,
    enviadoContador: true,
  },
  {
    id: 6,
    nome: "Contrato Arrendamento Sul",
    tipo: "Contrato",
    data: "2026-01-20",
    mesReferencia: "Janeiro",
    valor: 24000,
    enviadoContador: true,
  },
  {
    id: 7,
    nome: "NF Venda Milho Safrinha",
    tipo: "Nota de venda",
    data: "2026-02-15",
    mesReferencia: "Fevereiro",
    valor: 31500,
    enviadoContador: false,
  },
  {
    id: 8,
    nome: "Recibo Combustível",
    tipo: "Outro",
    data: "2026-02-18",
    mesReferencia: "Fevereiro",
    valor: 4750,
    enviadoContador: false,
  },
  {
    id: 9,
    nome: "NF Compra Sementes",
    tipo: "Nota de compra",
    data: "2026-02-20",
    mesReferencia: "Fevereiro",
    valor: 9800,
    enviadoContador: false,
  },
  {
    id: 10,
    nome: "Folha Pagamento Fev",
    tipo: "Salário",
    data: "2026-02-25",
    mesReferencia: "Fevereiro",
    valor: 8500,
    enviadoContador: false,
  },
];

export const mesesReferencia = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ── Documentos Unificados (com grupo, classificação e tributação) ──

export type GrupoDocumento = "SOLICITACAO" | "DOCUMENTO" | "PAGAMENTO";
export type ClassificacaoDocumento = "PRODUTO" | "SERVICO";

export interface DocumentoUnificado {
  id: number;
  titulo: string;
  grupo: GrupoDocumento;
  categoria: string;
  classificacao: ClassificacaoDocumento;
  ncm?: string;
  valor: number;
  data: string;
  status: string;
  impactoTributario?: number;
  fileType: "image" | "pdf";
  fileUrl: string;
}

export const documentosUnificados: DocumentoUnificado[] = [
  // SOLICITAÇÕES
  {
    id: 101,
    titulo: "Enviar NF Insumos Safra",
    grupo: "SOLICITACAO",
    categoria: "Nota Fiscal",
    classificacao: "PRODUTO",
    ncm: "31052000",
    valor: 12300,
    data: "2026-02-06",
    status: "Pendente",
    impactoTributario: 2312,
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 102,
    titulo: "Enviar recibo de frete",
    grupo: "SOLICITACAO",
    categoria: "Frete",
    classificacao: "SERVICO",
    valor: 3200,
    data: "2026-02-10",
    status: "Encaminhado",
    impactoTributario: 602,
    fileType: "image",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 103,
    titulo: "Contrato de arrendamento",
    grupo: "SOLICITACAO",
    categoria: "Contrato",
    classificacao: "SERVICO",
    valor: 24000,
    data: "2026-01-20",
    status: "Concluído",
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 104,
    titulo: "Comprovante de seguro agrícola",
    grupo: "SOLICITACAO",
    categoria: "Seguro",
    classificacao: "SERVICO",
    valor: 5600,
    data: "2026-02-12",
    status: "Pendente",
    impactoTributario: 1054,
    fileType: "image",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 105,
    titulo: "NF Defensivos cancelada",
    grupo: "SOLICITACAO",
    categoria: "Nota Fiscal",
    classificacao: "PRODUTO",
    ncm: "38089199",
    valor: 7800,
    data: "2026-02-01",
    status: "Cancelado",
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },

  // DOCUMENTOS OFICIAIS
  {
    id: 201,
    titulo: "NF Venda Soja Lote 12",
    grupo: "DOCUMENTO",
    categoria: "Nota de Venda",
    classificacao: "PRODUTO",
    ncm: "12010090",
    valor: 48000,
    data: "2026-02-04",
    status: "Emitido",
    impactoTributario: 9024,
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 202,
    titulo: "NF Venda Milho Safrinha",
    grupo: "DOCUMENTO",
    categoria: "Nota de Venda",
    classificacao: "PRODUTO",
    ncm: "10059010",
    valor: 31500,
    data: "2026-02-15",
    status: "Emitido",
    impactoTributario: 5922,
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 203,
    titulo: "NF Compra Sementes",
    grupo: "DOCUMENTO",
    categoria: "Nota de Compra",
    classificacao: "PRODUTO",
    ncm: "12011000",
    valor: 9800,
    data: "2026-02-20",
    status: "Anexado",
    impactoTributario: 1842,
    fileType: "image",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 204,
    titulo: "Extrato Conta Rural Jan",
    grupo: "DOCUMENTO",
    categoria: "Extrato",
    classificacao: "SERVICO",
    valor: 0,
    data: "2026-01-30",
    status: "Anexado",
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },

  // PAGAMENTOS
  {
    id: 301,
    titulo: "FUNRURAL Fevereiro",
    grupo: "PAGAMENTO",
    categoria: "Imposto",
    classificacao: "PRODUTO",
    valor: 2850,
    data: "2026-02-20",
    status: "A pagar",
    impactoTributario: 2850,
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 302,
    titulo: "Folha Pagamento Fev",
    grupo: "PAGAMENTO",
    categoria: "Salário",
    classificacao: "SERVICO",
    valor: 8500,
    data: "2026-02-25",
    status: "Pago",
    fileType: "pdf",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 303,
    titulo: "Energia Elétrica Rural",
    grupo: "PAGAMENTO",
    categoria: "Utilidade",
    classificacao: "SERVICO",
    valor: 1420,
    data: "2026-02-18",
    status: "A pagar",
    impactoTributario: 267,
    fileType: "image",
    fileUrl: "/placeholder.svg",
  },
  {
    id: 304,
    titulo: "Combustível Maquinário",
    grupo: "PAGAMENTO",
    categoria: "Insumo",
    classificacao: "PRODUTO",
    ncm: "27101259",
    valor: 4750,
    data: "2026-02-18",
    status: "Pago",
    impactoTributario: 893,
    fileType: "image",
    fileUrl: "/placeholder.svg",
  },
];
