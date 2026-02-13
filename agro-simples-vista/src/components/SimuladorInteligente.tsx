import { useState, useMemo } from "react";
import SimuladorTributos from "@/components/SimuladorTributos";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calculator, Info, FileText } from "lucide-react";
import { useFluxoCaixa } from "@/hooks/use-dashboard";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";

// --- Mock data ---
interface DocMock {
  id: number;
  titulo: string;
  categoria: string;
  data: string;
  valor: number;
  classificacao: "PRODUTO" | "SERVICO";
  ncm?: string;
  uf: string;
  municipio: string;
}

const documentsMock: DocMock[] = [
  {
    id: 1,
    titulo: "NF Venda Soja Lote 12",
    categoria: "Nota de venda",
    data: "2026-02-04",
    valor: 48000,
    classificacao: "PRODUTO",
    ncm: "12019000",
    uf: "PR",
    municipio: "Cascavel",
  },
  {
    id: 2,
    titulo: "NF Compra Adubo Fosfatado",
    categoria: "Nota de compra",
    data: "2026-02-06",
    valor: 12300,
    classificacao: "PRODUTO",
    ncm: "31031900",
    uf: "PR",
    municipio: "Cascavel",
  },
  {
    id: 3,
    titulo: "Consultoria Agronômica",
    categoria: "Serviço",
    data: "2026-02-08",
    valor: 4500,
    classificacao: "SERVICO",
    uf: "PR",
    municipio: "Cascavel",
  },
  {
    id: 4,
    titulo: "Frete Grãos Cooperativa",
    categoria: "Frete",
    data: "2026-02-10",
    valor: 3200,
    classificacao: "SERVICO",
    uf: "PR",
    municipio: "Toledo",
  },
  {
    id: 5,
    titulo: "NF Venda Milho Safrinha",
    categoria: "Nota de venda",
    data: "2026-02-15",
    valor: 31500,
    classificacao: "PRODUTO",
    ncm: "10059010",
    uf: "PR",
    municipio: "Cascavel",
  },
  {
    id: 6,
    titulo: "Manutenção Maquinário",
    categoria: "Serviço",
    data: "2026-01-28",
    valor: 6800,
    classificacao: "SERVICO",
    uf: "PR",
    municipio: "Cascavel",
  },
  {
    id: 7,
    titulo: "NF Compra Sementes",
    categoria: "Nota de compra",
    data: "2026-01-20",
    valor: 9800,
    classificacao: "PRODUTO",
    ncm: "12099100",
    uf: "PR",
    municipio: "Maringá",
  },
  {
    id: 8,
    titulo: "NF Venda Trigo",
    categoria: "Nota de venda",
    data: "2026-02-12",
    valor: 22000,
    classificacao: "PRODUTO",
    ncm: "10019900",
    uf: "PR",
    municipio: "Cascavel",
  },
];

const taxRates = {
  cbsRate: 0.088,
  ibsStateRate: 0.065,
  ibsCityRate: 0.035,
};

type Periodo = "hoje" | "7dias" | "30dias" | "este_mes" | "mes_anterior";
type Tipo = "todos" | "produtos" | "servicos";

function filterByPeriodo(docs: DocMock[], periodo: Periodo): DocMock[] {
  const now = new Date("2026-02-12");
  const start = new Date(now);

  switch (periodo) {
    case "hoje":
      return docs.filter((d) => d.data === "2026-02-12");
    case "7dias":
      start.setDate(now.getDate() - 7);
      return docs.filter(
        (d) => new Date(d.data) >= start && new Date(d.data) <= now,
      );
    case "30dias":
      start.setDate(now.getDate() - 30);
      return docs.filter(
        (d) => new Date(d.data) >= start && new Date(d.data) <= now,
      );
    case "este_mes":
      return docs.filter((d) => d.data.startsWith("2026-02"));
    case "mes_anterior":
      return docs.filter((d) => d.data.startsWith("2026-01"));
    default:
      return docs;
  }
}

function filterByTipo(docs: DocMock[], tipo: Tipo): DocMock[] {
  if (tipo === "produtos")
    return docs.filter((d) => d.classificacao === "PRODUTO");
  if (tipo === "servicos")
    return docs.filter((d) => d.classificacao === "SERVICO");
  return docs;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default function SimuladorInteligente() {
  const [periodo, setPeriodo] = useState<Periodo>("este_mes");
  const [tipo, setTipo] = useState<Tipo>("todos");
  const [detailOpen, setDetailOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);

  // Busca dados reais da API
  const { data: fluxoCaixa, isLoading: loadingFluxo } =
    useFluxoCaixa(LOGGED_PRODUCER_ID);

  const filtered = useMemo(() => {
    return filterByTipo(filterByPeriodo(documentsMock, periodo), tipo);
  }, [periodo, tipo]);

  // Usa dados reais da API ou fallback para cálculo mock
  const base =
    fluxoCaixa?.saldo ?? filtered.reduce((sum, d) => sum + d.valor, 0);
  const totalTax =
    fluxoCaixa?.totalImpostos ??
    base * (taxRates.cbsRate + taxRates.ibsStateRate + taxRates.ibsCityRate);

  // Calcula proporções aproximadas (baseado nas alíquotas padrão)
  const totalRate =
    taxRates.cbsRate + taxRates.ibsStateRate + taxRates.ibsCityRate;
  const cbs = fluxoCaixa
    ? totalTax * (taxRates.cbsRate / totalRate)
    : base * taxRates.cbsRate;
  const ibsState = fluxoCaixa
    ? totalTax * (taxRates.ibsStateRate / totalRate)
    : base * taxRates.ibsStateRate;
  const ibsCity = fluxoCaixa
    ? totalTax * (taxRates.ibsCityRate / totalRate)
    : base * taxRates.ibsCityRate;

  const prodCount = filtered.filter(
    (d) => d.classificacao === "PRODUTO",
  ).length;
  const servCount = filtered.filter(
    (d) => d.classificacao === "SERVICO",
  ).length;
  const comNcm = filtered.filter((d) => d.ncm).length;
  const semNcm = filtered.filter((d) => !d.ncm).length;

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator size={20} className="text-primary" />
            Relatório inteligente
          </CardTitle>
          <CardDescription className="text-sm">
            Estimativa automática com base nos documentos anexados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select
              value={periodo}
              onValueChange={(v) => setPeriodo(v as Periodo)}
            >
              <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="este_mes">Este mês</SelectItem>
                <SelectItem value="mes_anterior">Mês anterior</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
              <SelectTrigger className="w-[100px] sm:w-[140px] text-xs sm:text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="produtos">Produtos</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultado principal */}
          <div className="p-4 rounded-lg bg-primary/10 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Imposto estimado</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="gap-1 text-xs cursor-help"
                    >
                      <Info size={12} />
                      {fluxoCaixa ? "Dados aproximados" : "Estimativa automática"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {fluxoCaixa
                        ? "Valores calculados com base nas suas notas fiscais"
                        : "Valores obtidos a partir dos documentos anexados"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {loadingFluxo ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-heading font-bold text-primary">
                {formatCurrency(totalTax)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Base de cálculo (lucro):{" "}
              {loadingFluxo ? "..." : formatCurrency(base)}
            </p>
          </div>

          {/* Quebra por tributo */}
          <div className="space-y-2">
            {[
              { label: "CBS", rate: taxRates.cbsRate, value: cbs },
              {
                label: "IBS Estadual",
                rate: taxRates.ibsStateRate,
                value: ibsState,
              },
              {
                label: "IBS Municipal",
                rate: taxRates.ibsCityRate,
                value: ibsCity,
              },
            ].map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between text-sm py-1.5 px-3 rounded-md bg-muted/40"
              >
                <span className="text-muted-foreground">{t.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {(t.rate * 100).toFixed(1)}%
                  </span>
                  {loadingFluxo ? (
                    <Skeleton className="h-5 w-28" />
                  ) : (
                    <span className="font-semibold text-foreground w-28 text-right">
                      {formatCurrency(t.value)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm py-1.5 px-3 rounded-md bg-primary/10 font-semibold">
              <span className="text-foreground">Total</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {(
                    (taxRates.cbsRate +
                      taxRates.ibsStateRate +
                      taxRates.ibsCityRate) *
                    100
                  ).toFixed(1)}
                  %
                </span>
                {loadingFluxo ? (
                  <Skeleton className="h-5 w-28" />
                ) : (
                  <span className="text-primary w-28 text-right">
                    {formatCurrency(totalTax)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detalhamento */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-xs sm:text-sm px-2 sm:px-4"
              onClick={() => setDetailOpen(true)}
            >
              <FileText size={16} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ver </span>Detalhes
            </Button>
            <Button className="flex-1 text-xs sm:text-sm px-2 sm:px-4" onClick={() => setSimOpen(true)}>
              <Calculator size={16} className="mr-1 sm:mr-2" />
              Simulador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal detalhamento */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos considerados no período</DialogTitle>
            <DialogDescription>
              {filtered.length} documento{filtered.length !== 1 ? "s" : ""}{" "}
              encontrado{filtered.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          {/* Contadores */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Produtos: {prodCount}</Badge>
            <Badge variant="secondary">Serviços: {servCount}</Badge>
            <Badge variant="outline">Com NCM: {comNcm}</Badge>
            <Badge variant="outline">Sem NCM: {semNcm}</Badge>
          </div>

          {/* Lista */}
          <ul className="divide-y divide-border">
            {filtered.map((doc) => (
              <li key={doc.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {doc.titulo}
                  </p>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(doc.valor)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{doc.categoria}</span>
                  <span>•</span>
                  <span>
                    {doc.classificacao === "PRODUTO" ? "Produto" : "Serviço"}
                  </span>
                  <span>•</span>
                  <span>{doc.ncm ? `NCM ${doc.ncm}` : "Serviço"}</span>
                  <span>•</span>
                  <span>{formatDate(doc.data)}</span>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nenhum documento encontrado no período selecionado.
              </li>
            )}
          </ul>
        </DialogContent>
      </Dialog>

      <SimuladorTributos open={simOpen} onOpenChange={setSimOpen} />
    </>
  );
}
