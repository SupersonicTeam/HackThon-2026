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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Eye,
  Briefcase,
  Loader2,
  File,
  Download,
  MessageCircle,
} from "lucide-react";
import {
  usuario,
} from "@/mocks";
import SimuladorInteligente from "@/components/SimuladorInteligente";
import { useFluxoCaixa, useNotas, useNota, useProdutor } from "@/hooks/use-dashboard";
import { useNotificarProximasObrigacoes } from "@/services/notificacao.service";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";
import { toast } from "sonner";

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
  const [previewDoc, setPreviewDoc] = useState<{
    id: number;
    nome: string;
    tipo: string;
    data: string;
    status?: string;
    notaId?: string; // ID da nota na API para buscar detalhes
    valor?: number;
  } | null>(null);

  // Integração com API (com fallback para mocks)
  const {
    data: fluxoCaixa,
    isLoading: loadingFluxo,
    error: errorFluxo,
  } = useFluxoCaixa(LOGGED_PRODUCER_ID);
  const { data: notas, isLoading: loadingNotas } = useNotas(LOGGED_PRODUCER_ID);
  const { data: produtor } = useProdutor(LOGGED_PRODUCER_ID);
  const { data: notaDetalhada, isLoading: loadingNotaDetalhada } = useNota(
    previewDoc?.notaId || ""
  );

  // Hook para enviar notificação WhatsApp
  const { mutate: notificarWhatsApp, isPending: enviandoNotificacao } =
    useNotificarProximasObrigacoes();

  const handleNotificarWhatsApp = () => {
    notificarWhatsApp(LOGGED_PRODUCER_ID, {
      onSuccess: (data) => {
        if (data.enviados > 0) {
          toast.success(`✅ ${data.enviados} notificação(ões) enviada(s) via WhatsApp!`);
        } else {
          toast.info("Nenhuma obrigação pendente para notificar.");
        }
      },
      onError: () => {
        toast.error("Erro ao enviar notificações");
      },
    });
  };

  // Debug: log API response
  console.log("FluxoCaixa API:", { fluxoCaixa, loadingFluxo, errorFluxo });

  // Usa SOMENTE dados da API (sem fallback para mocks)
  const resumoFinanceiro = {
    entradas: fluxoCaixa?.totalEntradas ?? 0,
    saidas: fluxoCaixa?.totalSaidas ?? 0,
    lucro: fluxoCaixa?.saldo ?? 0,
    impostos: fluxoCaixa?.totalImpostos ?? 0,
  };

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
        notaId: nota.id, // Guardar ID para buscar detalhes
        valor: nota.valorTotal || 0,
      })) || [];

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
          <div className="flex items-center justify-between">
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
              onClick={handleNotificarWhatsApp}
              disabled={enviandoNotificacao}
            >
              {enviandoNotificacao ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MessageCircle size={16} />
              )}
              <span className="hidden sm:inline">Notificar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/60 text-center sm:text-left">
              <TrendingDown size={20} className="text-destructive shrink-0 hidden sm:block" />
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Entradas</p>
                {loadingFluxo ? (
                  <Skeleton className="h-5 sm:h-7 w-16 sm:w-24" />
                ) : (
                  <p className="text-sm sm:text-lg font-heading font-bold text-foreground">
                    {formatCurrency(resumoFinanceiro.entradas)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/60 text-center sm:text-left">
              <TrendingUp size={20} className="text-primary shrink-0 hidden sm:block" />
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Saídas</p>
                {loadingFluxo ? (
                  <Skeleton className="h-5 sm:h-7 w-16 sm:w-24" />
                ) : (
                  <p className="text-sm sm:text-lg font-heading font-bold text-foreground">
                    {formatCurrency(resumoFinanceiro.saidas)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 p-2 sm:p-3 rounded-lg bg-primary/10 text-center sm:text-left">
              <DollarSign size={20} className="text-primary shrink-0 hidden sm:block" />
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Lucro</p>
                {loadingFluxo ? (
                  <Skeleton className="h-5 sm:h-7 w-16 sm:w-24" />
                ) : (
                  <p className="text-sm sm:text-lg font-heading font-bold text-primary">
                    {formatCurrency(resumoFinanceiro.lucro)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Indicadores percentuais */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-muted/80 text-xs sm:text-sm">
              <DollarSign size={12} className="text-destructive shrink-0" />
              <span className="text-muted-foreground hidden sm:inline">Imposto:</span>
              <span className="font-semibold text-foreground truncate">
                {loadingFluxo
                  ? "..."
                  : formatCurrency(fluxoCaixa?.totalImpostos ?? 6850)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-primary/10 text-xs sm:text-sm">
              <TrendingUp size={12} className="text-primary shrink-0" />
              <span className="text-muted-foreground hidden sm:inline">Alíquota:</span>
              <span className="font-semibold text-primary">
                {loadingFluxo
                  ? "..."
                  : `${(((fluxoCaixa?.totalImpostos ?? 6850) / ((resumoFinanceiro.entradas || 1) + (fluxoCaixa?.totalImpostos ?? 6850))) * 100).toFixed(1)}%`}
              </span>
            </div>
          </div>

          {/* Explicação do imposto - escondida no mobile */}
          {!loadingFluxo && fluxoCaixa && (
            <div className="pt-3 border-t border-border hidden sm:block">
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
                        {doc.valor > 0 && (
                          <span className="text-xs font-medium text-primary">
                            {formatCurrency(doc.valor)}
                          </span>
                        )}
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

      {/* Modal preview documento detalhado */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              {previewDoc?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {previewDoc && (
            <div className="space-y-4 pt-1">
              {loadingNotaDetalhada && previewDoc.notaId ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-sm text-muted-foreground">
                    Carregando detalhes...
                  </p>
                </div>
              ) : notaDetalhada && previewDoc.notaId ? (
                /* NF-e detalhada da API */
                <div className="space-y-4">
                  {/* File preview */}
                  <div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[140px]">
                    <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
                      <File size={40} strokeWidth={1.5} />
                      <span className="text-sm font-medium">NF-e {notaDetalhada.numero}</span>
                      <span className="text-xs">{notaDetalhada.tipo === "entrada" ? "Nota de Entrada" : "Nota de Saída"}</span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Número</dt>
                      <dd className="font-medium">{notaDetalhada.numero || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Série</dt>
                      <dd className="font-medium">{notaDetalhada.serie || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tipo</dt>
                      <dd className="font-medium">{notaDetalhada.tipo === "entrada" ? "Entrada" : "Saída"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Data Emissão</dt>
                      <dd className="font-medium">
                        {notaDetalhada.dataEmissao ? formatDate(notaDetalhada.dataEmissao.split("T")[0]) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Valor Total</dt>
                      <dd className="font-semibold text-lg text-primary">
                        {formatCurrency(notaDetalhada.valorTotal || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getStatusStyle(notaDetalhada.status).color}`}
                        >
                          {getStatusStyle(notaDetalhada.status).label}
                        </Badge>
                      </dd>
                    </div>
                    {notaDetalhada.cfop && (
                      <div>
                        <dt className="text-muted-foreground">CFOP</dt>
                        <dd className="font-medium">{notaDetalhada.cfop}</dd>
                      </div>
                    )}
                    {notaDetalhada.naturezaOperacao && (
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Natureza da Operação</dt>
                        <dd className="font-medium">{notaDetalhada.naturezaOperacao}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Impostos */}
                  {(notaDetalhada.valorCbs || notaDetalhada.valorIbs || notaDetalhada.valorFunrural || notaDetalhada.valorIcms || notaDetalhada.valorIpi) && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold mb-2">Impostos</h4>
                      <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                        {notaDetalhada.valorCbs > 0 && (
                          <>
                            <dt className="text-muted-foreground">CBS</dt>
                            <dd className="font-medium text-right">{formatCurrency(notaDetalhada.valorCbs)}</dd>
                          </>
                        )}
                        {notaDetalhada.valorIbs > 0 && (
                          <>
                            <dt className="text-muted-foreground">IBS</dt>
                            <dd className="font-medium text-right">{formatCurrency(notaDetalhada.valorIbs)}</dd>
                          </>
                        )}
                        {notaDetalhada.valorFunrural > 0 && (
                          <>
                            <dt className="text-muted-foreground">FUNRURAL</dt>
                            <dd className="font-medium text-right">{formatCurrency(notaDetalhada.valorFunrural)}</dd>
                          </>
                        )}
                        {notaDetalhada.valorIcms > 0 && (
                          <>
                            <dt className="text-muted-foreground">ICMS</dt>
                            <dd className="font-medium text-right">{formatCurrency(notaDetalhada.valorIcms)}</dd>
                          </>
                        )}
                        {notaDetalhada.valorIpi > 0 && (
                          <>
                            <dt className="text-muted-foreground">IPI</dt>
                            <dd className="font-medium text-right">{formatCurrency(notaDetalhada.valorIpi)}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Itens */}
                  {notaDetalhada.itens && notaDetalhada.itens.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold mb-2">Itens da Nota</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {notaDetalhada.itens.map((item, idx) => (
                          <div key={idx} className="bg-muted/30 rounded-md p-3 text-xs">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">{item.descricao}</span>
                              <span className="font-semibold">{formatCurrency(item.valorTotal || 0)}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {item.quantidade} {item.unidade} × {formatCurrency(item.valorUnitario || 0)}
                              {item.ncm && <span className="ml-2">• NCM {item.ncm}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {notaDetalhada.observacoes && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold mb-1">Observações</h4>
                      <p className="text-xs text-muted-foreground">{notaDetalhada.observacoes}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Preview genérico (quando não tem dados da API) */
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[120px]">
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <File size={40} strokeWidth={1.5} />
                      <span className="text-sm font-medium">Documento PDF</span>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Tipo</dt>
                      <dd className="font-medium">{previewDoc.tipo}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Data</dt>
                      <dd className="font-medium">{formatDate(previewDoc.data)}</dd>
                    </div>
                    {previewDoc.valor && previewDoc.valor > 0 && (
                      <div>
                        <dt className="text-muted-foreground">Valor</dt>
                        <dd className="font-semibold text-primary">{formatCurrency(previewDoc.valor)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getStatusStyle(previewDoc.status).color}`}
                        >
                          {getStatusStyle(previewDoc.status).label}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreviewDoc(null)}
                >
                  Fechar
                </Button>
                <Button className="flex-1" onClick={() => {}}>
                  <Download size={16} className="mr-2" />
                  Baixar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}