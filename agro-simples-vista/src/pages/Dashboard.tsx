import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Eye,
  Briefcase,
  Loader2,
} from "lucide-react";
import {
  ultimosDocumentos,
  resumoFinanceiro as mockResumo,
  usuario,
} from "@/mocks";
import SimuladorInteligente from "@/components/SimuladorInteligente";
import { useFluxoCaixa, useNotas, useProdutor } from "@/hooks/use-dashboard";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";

const mesAtual = new Date().toLocaleDateString("pt-BR", {
  month: "long",
  year: "numeric",
});
const mesCapitalizado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

const docStatusMap: Record<number, { label: string; color: string }> = {
  1: {
    label: "Encaminhado",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  2: {
    label: "Validado",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  3: {
    label: "Validado",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  4: {
    label: "Encaminhado",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  5: { label: "Rejeitado", color: "bg-red-100 text-red-800 border-red-200" },
  6: {
    label: "Encaminhado",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  7: {
    label: "Validado",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

function getStatusStyle(status?: string): { label: string; color: string } {
  switch (status) {
    case "validada":
      return {
        label: "Validado",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case "pendente":
      return {
        label: "Pendente",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    case "erro":
      return { label: "Erro", color: "bg-red-100 text-red-800 border-red-200" };
    default:
      return {
        label: "Encaminhado",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
  }
}

const previsaoSalarial = 8500;

export default function Dashboard() {
  const [previewDoc, setPreviewDoc] = useState<
    (typeof ultimosDocumentos)[0] | null
  >(null);

  // Integração com API (com fallback para mocks)
  const {
    data: fluxoCaixa,
    isLoading: loadingFluxo,
    error: errorFluxo,
  } = useFluxoCaixa(LOGGED_PRODUCER_ID);
  const { data: notas, isLoading: loadingNotas } = useNotas(LOGGED_PRODUCER_ID);
  const { data: produtor } = useProdutor(LOGGED_PRODUCER_ID);

  // Debug: log API response
  console.log("FluxoCaixa API:", { fluxoCaixa, loadingFluxo, errorFluxo });

  // Usa dados da API ou fallback para mocks
  const resumoFinanceiro = fluxoCaixa
    ? {
        entradas: fluxoCaixa.totalEntradas ?? 0,
        saidas: fluxoCaixa.totalSaidas ?? 0,
        lucro: fluxoCaixa.saldo ?? 0,
        impostos: fluxoCaixa.totalImpostos ?? 0,
      }
    : mockResumo;

  const documentos =
    notas
      ?.sort((a, b) => {
        // Ordena do mais recente para o mais antigo
        const dateA = new Date(a.dataEmissao || "1970-01-01").getTime();
        const dateB = new Date(b.dataEmissao || "1970-01-01").getTime();
        return dateB - dateA; // Retorna negativo se B é anterior, positivo se B é posterior
      })
      .slice(0, 7)
      .map((nota, idx) => ({
        id: idx + 1,
        nome: nota.naturezaOperacao || `NF ${nota.numero}`,
        tipo: nota.tipo === "entrada" ? "Nota de Entrada" : "Nota de Saída",
        data:
          nota.dataEmissao?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        status: nota.status,
      })) || ultimosDocumentos;

  const nomeUsuario = produtor?.nome || usuario.nome;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
          Olá, {nomeUsuario} 👋
        </h1>
        <p className="text-muted-foreground text-base mt-1">
          {mesCapitalizado}
        </p>
      </div>

      {/* Card 1 — Resumo financeiro */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign size={20} className="text-primary" />
            Resumo rápido
            {loadingFluxo && (
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground"
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60">
              <TrendingUp size={22} className="text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                {loadingFluxo ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-lg font-heading font-bold text-foreground">
                    {formatCurrency(resumoFinanceiro.entradas)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60">
              <TrendingDown size={22} className="text-destructive shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                {loadingFluxo ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-lg font-heading font-bold text-foreground">
                    {formatCurrency(resumoFinanceiro.saidas)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
              <DollarSign size={22} className="text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Lucro parcial</p>
                {loadingFluxo ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-lg font-heading font-bold text-primary">
                    {formatCurrency(resumoFinanceiro.lucro)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Indicadores percentuais */}
          <div className="flex flex-wrap gap-2 sm:gap-3 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 text-sm">
              <DollarSign size={14} className="text-destructive" />
              <span className="text-muted-foreground">Imposto previsto:</span>
              <span className="font-semibold text-foreground">
                {loadingFluxo
                  ? "..."
                  : formatCurrency(fluxoCaixa?.totalImpostos ?? 6850)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm">
              <TrendingUp size={14} className="text-primary" />
              <span className="text-muted-foreground">Alíquota estimada:</span>
              <span className="font-semibold text-primary">
                {loadingFluxo
                  ? "..."
                  : `${(((fluxoCaixa?.totalImpostos ?? 6850) / (resumoFinanceiro.entradas || 1)) * 100).toFixed(1)}%`}
              </span>
            </div>
          </div>

          {/* Explicação do imposto */}
          {!loadingFluxo && fluxoCaixa && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">💡 De onde vem o imposto previsto?</span>
                <br />
                Este valor é a soma de todos os impostos cobrados nas suas notas (compras e vendas): 
                <span className="font-medium"> CBS, IBS, FUNRURAL, ICMS e IPI</span>. 
                No agronegócio, você tem <span className="font-medium text-primary">60% de redução</span> nas 
                alíquotas de CBS (8,8% → 3,5%) e IBS (17,7% → 7,1%), totalizando cerca de{" "}
                <span className="font-medium text-primary">10,6%</span> ao invés dos 26,5% do regime comum.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2 — Relatório Inteligente (ex-Simulador) */}
      <SimuladorInteligente />

      {/* Card 3 — Últimos documentos */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Últimos documentos enviados
            {loadingNotas && (
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground"
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingNotas ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {documentos.map((doc) => {
                const statusStyle = getStatusStyle(doc.status);
                return (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {doc.tipo}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${statusStyle.color}`}
                        >
                          {statusStyle.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {formatDate(doc.data)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Modal preview documento */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewDoc?.nome}</DialogTitle>
            <DialogDescription>
              {previewDoc?.tipo} —{" "}
              {previewDoc ? formatDate(previewDoc.data) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/60 flex items-center justify-center h-48 text-muted-foreground text-sm">
            Pré-visualização do documento (mock)
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
