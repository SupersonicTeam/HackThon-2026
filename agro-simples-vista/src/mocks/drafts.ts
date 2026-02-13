export type DraftStatus =
  | "rascunho"
  | "enviado_contador"
  | "devolvido"
  | "aprovado"
  | "enviado"
  | "revisao"
  | "reprovado"
  | "finalizado";

export interface DraftItem {
  descricao: string;
  quantidade: string;
  unidade: string;
  valor: string;
}

export interface RascunhoNFe {
  id: number | string;
  producerId: string;
  titulo: string;
  tipo: "Entrada" | "Saída" | "entrada" | "saida";
  uf: string;
  municipio: string;
  ncm: string;
  valorTotal: string;
  itens: DraftItem[];
  status: DraftStatus;
  data: string;
  feedbackContador?: string;
}

export const statusLabels: Record<DraftStatus, string> = {
  rascunho: "Rascunho",
  enviado_contador: "Enviado ao contador",
  devolvido: "Devolvido com feedback",
  aprovado: "Aprovado para emitir",
  enviado: "Enviado",
  revisao: "Em revisão",
  reprovado: "Reprovado",
  finalizado: "Finalizado",
};

export const statusStyles: Record<DraftStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-0",
  enviado_contador: "bg-amber-500/15 text-amber-700 border-0",
  devolvido: "bg-destructive/15 text-destructive border-0",
  aprovado: "bg-primary/15 text-primary border-0",
  enviado: "bg-blue-100 text-blue-800 border-0",
  revisao: "bg-orange-100 text-orange-800 border-0",
  reprovado: "bg-red-100 text-red-800 border-0",
  finalizado: "bg-green-100 text-green-800 border-0",
};

export const initialDrafts: RascunhoNFe[] = [
  {
    id: 1001,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Rascunho NF-e — Venda Soja",
    tipo: "Saída",
    uf: "MT",
    municipio: "Sapezal",
    ncm: "12019000",
    valorTotal: "60478.50",
    itens: [
      {
        descricao: "Soja em grãos - FOB",
        quantidade: "40319",
        unidade: "KG",
        valor: "60478.50",
      },
    ],
    status: "enviado_contador",
    data: "2026-02-10",
  },
  {
    id: 1002,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Rascunho NF-e — Compra Adubo",
    tipo: "Entrada",
    uf: "PR",
    municipio: "Londrina",
    ncm: "31052000",
    valorTotal: "12300.00",
    itens: [
      {
        descricao: "Adubo fosfatado",
        quantidade: "5000",
        unidade: "KG",
        valor: "12300.00",
      },
    ],
    status: "rascunho",
    data: "2026-02-12",
  },
  {
    id: 1003,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Rascunho NF-e — Venda Milho",
    tipo: "Saída",
    uf: "MT",
    municipio: "Sorriso",
    ncm: "10059010",
    valorTotal: "31500.00",
    itens: [
      {
        descricao: "Milho safrinha",
        quantidade: "21000",
        unidade: "KG",
        valor: "31500.00",
      },
    ],
    status: "devolvido",
    data: "2026-02-08",
    feedbackContador:
      "NCM incorreto para milho safrinha. Verificar classificação e corrigir valor unitário.",
  },
  {
    id: 1004,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Rascunho NF-e — Venda Algodão",
    tipo: "Saída",
    uf: "MT",
    municipio: "Sapezal",
    ncm: "52010010",
    valorTotal: "145000.00",
    itens: [
      {
        descricao: "Algodão em pluma",
        quantidade: "25000",
        unidade: "KG",
        valor: "145000.00",
      },
    ],
    status: "aprovado",
    data: "2026-02-06",
  },
  {
    id: 1005,
    producerId: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    titulo: "Rascunho NF-e — Venda Café",
    tipo: "Saída",
    uf: "MG",
    municipio: "Patrocínio",
    ncm: "09011110",
    valorTotal: "85000.00",
    itens: [
      {
        descricao: "Café arábica tipo 6",
        quantidade: "1200",
        unidade: "KG",
        valor: "85000.00",
      },
    ],
    status: "aprovado",
    data: "2026-02-05",
  },
];

export const ufsMock = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

export const municipiosPorUf: Record<string, string[]> = {
  MT: [
    "Sapezal",
    "Sorriso",
    "Sinop",
    "Cuiabá",
    "Rondonópolis",
    "Lucas do Rio Verde",
  ],
  PR: ["Londrina", "Maringá", "Cascavel", "Curitiba", "Ponta Grossa"],
  MG: ["Patrocínio", "Uberlândia", "Uberaba", "Belo Horizonte", "Lavras"],
  SP: ["Ribeirão Preto", "Campinas", "Piracicaba", "São Paulo"],
  GO: ["Rio Verde", "Jataí", "Goiânia", "Anápolis"],
  MS: ["Dourados", "Campo Grande", "Maracaju"],
  BA: ["Barreiras", "Luís Eduardo Magalhães", "Salvador"],
  RS: ["Passo Fundo", "Cruz Alta", "Porto Alegre"],
};
