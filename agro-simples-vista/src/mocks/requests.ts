export interface SolicitacaoContador {
  id: number;
  producerId: string;
  titulo: string;
  descricaoCurta: string;
  categoria: string;
  mesReferencia: string;
  prioridade: "alta" | "media" | "baixa";
  status:
    | "pendente"
    | "enviado"
    | "recebido"
    | "rejeitado"
    | "concluido"
    | "cancelado";
  prazo: string;
  observacao?: string;
  motivoRejeicao?: string;
  motivoCancelamento?: string;
  arquivoNome?: string;
}

export const solicitacoesContador: SolicitacaoContador[] = [
  {
    id: 1,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Notas de venda - Fevereiro",
    descricaoCurta: "Envie todas as notas de venda do mês",
    categoria: "Nota de venda",
    mesReferencia: "Fevereiro",
    prioridade: "alta",
    status: "pendente",
    prazo: "2026-02-15",
  },
  {
    id: 2,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Comprovantes de frete",
    descricaoCurta: "Recibos de frete de grãos e insumos",
    categoria: "Frete",
    mesReferencia: "Fevereiro",
    prioridade: "media",
    status: "pendente",
    prazo: "2026-02-20",
  },
  {
    id: 3,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Folha de pagamento - Janeiro",
    descricaoCurta: "Holerites e comprovantes de pagamento",
    categoria: "Salário",
    mesReferencia: "Janeiro",
    prioridade: "alta",
    status: "enviado",
    prazo: "2026-02-10",
  },
  {
    id: 4,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Notas de compra de insumos",
    descricaoCurta: "NFs de adubo, sementes e defensivos",
    categoria: "Nota de compra",
    mesReferencia: "Fevereiro",
    prioridade: "media",
    status: "pendente",
    prazo: "2026-02-25",
  },
  {
    id: 5,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Extrato bancário - Fevereiro",
    descricaoCurta: "Extrato completo da conta rural",
    categoria: "Banco",
    mesReferencia: "Fevereiro",
    prioridade: "baixa",
    status: "pendente",
    prazo: "2026-02-28",
  },
  {
    id: 6,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Contrato de arrendamento",
    descricaoCurta: "Renovação do contrato do Talhão Sul",
    categoria: "Contrato",
    mesReferencia: "Fevereiro",
    prioridade: "alta",
    status: "pendente",
    prazo: "2026-02-18",
  },
  {
    id: 7,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Notas de venda – Janeiro",
    descricaoCurta: "Notas fiscais de venda de soja e milho",
    categoria: "Nota de venda",
    mesReferencia: "Janeiro",
    prioridade: "alta",
    status: "concluido",
    prazo: "2026-02-10",
    arquivoNome: "NFs_venda_jan2026.pdf",
  },
  {
    id: 8,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Comprovantes de frete – Fevereiro",
    descricaoCurta: "Recibos de frete de grãos para cooperativa",
    categoria: "Frete",
    mesReferencia: "Fevereiro",
    prioridade: "media",
    status: "concluido",
    prazo: "2026-02-18",
    arquivoNome: "Recibos_frete_fev2026.pdf",
  },
  {
    id: 9,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Folha de pagamento – Janeiro",
    descricaoCurta: "Holerites e encargos trabalhistas",
    categoria: "Salário",
    mesReferencia: "Janeiro",
    prioridade: "alta",
    status: "concluido",
    prazo: "2026-02-05",
    arquivoNome: "Folha_pgto_jan2026.pdf",
  },
];

export const extractedPreviewPlaceholder = {
  dataDocumento: null as string | null,
  valor: null as number | null,
  observacao: null as string | null,
};
