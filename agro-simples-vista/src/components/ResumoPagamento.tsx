import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  FileText,
  Download,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Eye,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ResumoMeta {
  valor: number;
  imposto: number;
  dataConclusao: string;
  tipo: string;
  periodo: string;
  titulo: string;
  categoria: string;
  pieData: { name: string; value: number }[];
  barData: { name: string; valor: number }[];
  itens: {
    descricao: string;
    tipo: string;
    vencimento: string;
    valor: number;
    status: "A pagar" | "Pago";
    detalhe: string;
  }[];
  notas: string[];
}

// Mock data for all 3 reports
const resumosMock: Record<number, ResumoMeta> = {
  7: {
    valor: 120000,
    imposto: 10800,
    dataConclusao: "2026-02-10",
    tipo: "Nota Fiscal",
    periodo: "Janeiro/2026",
    titulo: "Notas de venda – Janeiro",
    categoria: "Nota de venda",
    pieData: [
      { name: "CBS", value: 4320 },
      { name: "IBS Estadual", value: 3888 },
      { name: "IBS Municipal", value: 2592 },
    ],
    barData: [
      { name: "Soja", valor: 72000 },
      { name: "Milho", valor: 33600 },
      { name: "Café", valor: 14400 },
    ],
    itens: [
      { descricao: "CBS – Contribuição s/ Bens e Serviços", tipo: "Imposto", vencimento: "2026-02-25", valor: 4320, status: "A pagar", detalhe: "Alíquota de 3,6% sobre a base de cálculo de vendas agrícolas do período." },
      { descricao: "IBS Estadual", tipo: "Imposto", vencimento: "2026-02-25", valor: 3888, status: "A pagar", detalhe: "Alíquota estadual de 3,24% sobre a base de R$ 120.000,00." },
      { descricao: "IBS Municipal", tipo: "Imposto", vencimento: "2026-02-28", valor: 2592, status: "A pagar", detalhe: "Alíquota municipal de 2,16% sobre a base de R$ 120.000,00." },
      { descricao: "FUNRURAL", tipo: "Contribuição", vencimento: "2026-02-20", valor: 1680, status: "Pago", detalhe: "Contribuição de 1,4% sobre receita bruta da produção rural." },
    ],
    notas: [
      "Base calculada considerando 12 notas fiscais de venda anexadas no período.",
      "Revisar NCM em notas de café — possível redução de alíquota.",
      "FUNRURAL já quitado em 15/02/2026.",
    ],
  },
  8: {
    valor: 35000,
    imposto: 3150,
    dataConclusao: "2026-02-18",
    tipo: "Recibo",
    periodo: "Fevereiro/2026",
    titulo: "Comprovantes de frete – Fevereiro",
    categoria: "Frete",
    pieData: [
      { name: "CBS", value: 1260 },
      { name: "IBS Estadual", value: 1134 },
      { name: "IBS Municipal", value: 756 },
    ],
    barData: [
      { name: "Grãos", valor: 21000 },
      { name: "Insumos", valor: 14000 },
    ],
    itens: [
      { descricao: "CBS – Frete", tipo: "Imposto", vencimento: "2026-03-10", valor: 1260, status: "A pagar", detalhe: "CBS sobre serviços de transporte de carga agrícola." },
      { descricao: "IBS Estadual – Frete", tipo: "Imposto", vencimento: "2026-03-10", valor: 1134, status: "A pagar", detalhe: "IBS estadual sobre o valor dos fretes realizados." },
      { descricao: "IBS Municipal – Frete", tipo: "Imposto", vencimento: "2026-03-15", valor: 756, status: "A pagar", detalhe: "IBS municipal sobre o valor dos fretes realizados." },
    ],
    notas: [
      "Base calculada com 8 recibos de frete anexados.",
      "Verificar se há créditos de ICMS a compensar nos fretes interestaduais.",
    ],
  },
  9: {
    valor: 8500,
    imposto: 2200,
    dataConclusao: "2026-02-05",
    tipo: "Folha",
    periodo: "Janeiro/2026",
    titulo: "Folha de pagamento – Janeiro",
    categoria: "Salário",
    pieData: [
      { name: "INSS Patronal", value: 1100 },
      { name: "FGTS", value: 680 },
      { name: "Outros encargos", value: 420 },
    ],
    barData: [
      { name: "Salários", valor: 6800 },
      { name: "Benefícios", valor: 1700 },
    ],
    itens: [
      { descricao: "INSS Patronal", tipo: "Contribuição", vencimento: "2026-02-20", valor: 1100, status: "Pago", detalhe: "Contribuição patronal de ~12,9% sobre a folha bruta." },
      { descricao: "FGTS", tipo: "Contribuição", vencimento: "2026-02-07", valor: 680, status: "Pago", detalhe: "Depósito de 8% sobre a remuneração de cada colaborador." },
      { descricao: "Outros encargos trabalhistas", tipo: "Guia", vencimento: "2026-02-20", valor: 420, status: "A pagar", detalhe: "Inclui seguro acidente de trabalho (SAT) e contribuições ao Sistema S." },
    ],
    notas: [
      "Folha referente a 3 colaboradores registrados.",
      "FGTS e INSS já recolhidos dentro do prazo.",
      "Verificar enquadramento do SAT para a próxima competência.",
    ],
  },
};

const PIE_COLORS = [
  "hsl(142, 44%, 32%)",
  "hsl(33, 55%, 52%)",
  "hsl(33, 30%, 65%)",
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

interface Props {
  solicitacaoId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResumoPagamento({ solicitacaoId, open, onOpenChange }: Props) {
  const [detalheIdx, setDetalheIdx] = useState<number | null>(null);
  const resumo = solicitacaoId ? resumosMock[solicitacaoId] : null;

  if (!resumo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Resumo indisponível</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center py-4">
            Dados de resumo não disponíveis para esta solicitação.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  const vencProximos = resumo.itens.filter((i) => {
    const diff = (new Date(i.vencimento).getTime() - new Date(resumo.dataConclusao).getTime()) / 86400000;
    return diff <= 7 && i.status === "A pagar";
  }).length;

  const emAberto = resumo.itens.filter((i) => i.status === "A pagar").length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-heading font-bold truncate">Resumo para pagamento</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Relatório do período e documentos usados</p>
            </div>
            <Button variant="outline" size="sm" disabled className="shrink-0 text-xs gap-1.5">
              <Download size={14} /> Exportar PDF
              <Badge variant="secondary" className="text-[9px] ml-1">Em breve</Badge>
            </Button>
          </div>

          <div className="px-4 sm:px-6 pb-6 space-y-5">
            {/* A) Cabeçalho do relatório */}
            <Card className="shadow-sm">
              <CardContent className="py-4 px-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Solicitação</span>
                  <p className="font-medium text-xs sm:text-sm">{resumo.titulo}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Tipo</span>
                  <p className="font-medium text-xs sm:text-sm">{resumo.tipo}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Período</span>
                  <p className="font-medium text-xs sm:text-sm">{resumo.periodo}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Conclusão</span>
                  <p className="font-medium text-xs sm:text-sm">{formatDate(resumo.dataConclusao)}</p>
                </div>
              </CardContent>
            </Card>

            {/* B) KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="shadow-sm">
                <CardContent className="py-3 px-3 text-center">
                  <DollarSign size={18} className="mx-auto text-primary mb-1" />
                  <p className="text-[10px] text-muted-foreground">Base de cálculo</p>
                  <p className="font-bold text-sm sm:text-base">{fmt(resumo.valor)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="py-3 px-3 text-center">
                  <TrendingUp size={18} className="mx-auto text-accent mb-1" />
                  <p className="text-[10px] text-muted-foreground">Imposto estimado</p>
                  <p className="font-bold text-sm sm:text-base">{fmt(resumo.imposto)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="py-3 px-3 text-center">
                  <Clock size={18} className="mx-auto text-amber-600 mb-1" />
                  <p className="text-[10px] text-muted-foreground">Venc. próximos (7d)</p>
                  <p className="font-bold text-sm sm:text-base">{vencProximos}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="py-3 px-3 text-center">
                  <AlertCircle size={18} className="mx-auto text-destructive mb-1" />
                  <p className="text-[10px] text-muted-foreground">Itens em aberto</p>
                  <p className="font-bold text-sm sm:text-base">{emAberto}</p>
                </CardContent>
              </Card>
            </div>

            {/* C) Gráficos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Donut */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-heading">Distribuição do imposto</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={resumo.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {resumo.pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                          border: "1px solid hsl(33, 20%, 86%)",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-heading">Valores por categoria</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={resumo.barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(33, 20%, 86%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                          border: "1px solid hsl(33, 20%, 86%)",
                        }}
                      />
                      <Bar dataKey="valor" fill="hsl(142, 44%, 32%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* D) Tabela "Itens para pagamento" */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-heading">Itens para pagamento</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                {/* Desktop table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Descrição</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                        <TableHead className="text-xs">Vencimento</TableHead>
                        <TableHead className="text-xs text-right">Valor</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumo.itens.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{item.descricao}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.tipo}</TableCell>
                          <TableCell className="text-xs">{formatDate(item.vencimento)}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmt(item.valor)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={item.status === "Pago" ? "default" : "outline"}
                              className={`text-[10px] ${item.status === "Pago" ? "bg-primary/15 text-primary border-0" : "text-amber-700 border-amber-300 bg-amber-50"}`}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetalheIdx(idx)}>
                              <Eye size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2 px-4">
                  {resumo.itens.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium flex-1">{item.descricao}</p>
                        <Badge
                          variant={item.status === "Pago" ? "default" : "outline"}
                          className={`text-[9px] shrink-0 ${item.status === "Pago" ? "bg-primary/15 text-primary border-0" : "text-amber-700 border-amber-300 bg-amber-50"}`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{item.tipo} · {formatDate(item.vencimento)}</span>
                        <span className="font-mono font-medium text-foreground">{fmt(item.valor)}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => setDetalheIdx(idx)}>
                        <Eye size={12} className="mr-1" /> Ver detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* E) Observações do contador */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-heading flex items-center gap-1.5">
                  <FileText size={14} /> Notas do contador
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  {resumo.notas.map((nota, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {nota}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini-modal detalhe do item */}
      <Dialog open={detalheIdx !== null} onOpenChange={(v) => { if (!v) setDetalheIdx(null); }}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-sm">Detalhes do item</DialogTitle>
          </DialogHeader>
          {detalheIdx !== null && resumo.itens[detalheIdx] && (
            <div className="space-y-3 text-sm">
              <p className="font-medium">{resumo.itens[detalheIdx].descricao}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">Tipo</span>
                  <p>{resumo.itens[detalheIdx].tipo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block">Vencimento</span>
                  <p>{formatDate(resumo.itens[detalheIdx].vencimento)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block">Valor</span>
                  <p className="font-mono">{fmt(resumo.itens[detalheIdx].valor)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <p>{resumo.itens[detalheIdx].status}</p>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{resumo.itens[detalheIdx].detalhe}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
