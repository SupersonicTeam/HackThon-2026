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
    id: "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    nome: "João Silva",
    cidade: "Cascavel",
    uf: "PR",
    propriedade: "Fazenda Boa Vista",
    contatos: [
      {
        nome: "João Silva",
        funcao: "Proprietário",
        telefone: "(44) 99999-8888",
        whatsapp: "5544999998888",
        email: "joao.silva@fazenda.com",
      },
    ],
  },
];

/** ID do produtor "logado" na visão do produtor */
export const LOGGED_PRODUCER_ID = "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f";
