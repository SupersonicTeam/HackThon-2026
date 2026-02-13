export interface Contato {
  nome: string;
  funcao: string;
  telefone: string;
  whatsapp: string;
  email: string;
}

export interface Produtor {
  id: string;
  nome: string;
  cidade?: string;
  uf?: string;
  propriedade?: string;
  contatos: Contato[];
}

export const produtores: Produtor[] = [
  {
    id: "p1",
    nome: "Luiz",
    cidade: "Londrina",
    uf: "PR",
    propriedade: "Fazenda Boa Vista",
    contatos: [
      { nome: "Luiz Ferreira", funcao: "Proprietário", telefone: "(43) 3321-1010", whatsapp: "5543991001010", email: "luiz@boavista.agr.br" },
      { nome: "Ana Paula", funcao: "Administrativo", telefone: "(43) 3321-1011", whatsapp: "5543991001011", email: "ana@boavista.agr.br" },
    ],
  },
  {
    id: "p2",
    nome: "Maria",
    cidade: "Maringá",
    uf: "PR",
    propriedade: "Sítio Santa Clara",
    contatos: [
      { nome: "Maria Souza", funcao: "Proprietária", telefone: "(44) 3025-2020", whatsapp: "5544992002020", email: "maria@santaclara.agr.br" },
    ],
  },
  {
    id: "p3",
    nome: "Carlos",
    cidade: "Cascavel",
    uf: "PR",
    propriedade: "Fazenda São Jorge",
    contatos: [
      { nome: "Carlos Mendes", funcao: "Proprietário", telefone: "(45) 3038-3030", whatsapp: "5545993003030", email: "carlos@saojorge.agr.br" },
      { nome: "Roberto Lima", funcao: "Gerente de campo", telefone: "(45) 3038-3031", whatsapp: "5545993003031", email: "roberto@saojorge.agr.br" },
      { nome: "Juliana Alves", funcao: "Financeiro", telefone: "(45) 3038-3032", whatsapp: "5545993003032", email: "juliana@saojorge.agr.br" },
    ],
  },
];

/** ID do produtor "logado" na visão do produtor */
export const LOGGED_PRODUCER_ID = "p1";
