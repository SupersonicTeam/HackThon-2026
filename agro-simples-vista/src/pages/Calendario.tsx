import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Plus,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ultimosDocumentos } from "@/mocks";
import { useSolicitacoes } from "@/contexts/SolicitacoesContext";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";
import AnexarDocumentoDialog from "@/components/AnexarDocumentoDialog";
import { useVencimentos } from "@/hooks/use-calendario";
import { useNotas } from "@/hooks/use-dashboard";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
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

// Mock documentos com data de anexação (fallback)
const documentosMockFallback = ultimosDocumentos.map((d) => ({
  ...d,
  dataAnexacao: d.data,
}));

// Mock pagamentos (fallback)
const pagamentosMockFallback = [
  {
    id: "pg1",
    titulo: "FUNRURAL",
    tipo: "Imposto",
    valor: 1250,
    data: "2026-02-20",
    status: "a_pagar" as const,
  },
  {
    id: "pg2",
    titulo: "Energia Elétrica",
    tipo: "Taxa",
    valor: 890,
    data: "2026-02-25",
    status: "a_pagar" as const,
  },
  {
    id: "pg3",
    titulo: "Parcela Financiamento",
    tipo: "Contribuição",
    valor: 4500,
    data: "2026-02-15",
    status: "pago" as const,
  },
  {
    id: "pg4",
    titulo: "Seguro Safra",
    tipo: "Contribuição",
    valor: 2100,
    data: "2026-02-10",
    status: "pago" as const,
  },
  {
    id: "pg5",
    titulo: "ITR Parcela 2",
    tipo: "Imposto",
    valor: 3200,
    data: "2026-02-05",
    status: "pago" as const,
  },
];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const days: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function isPagamentoVencido(dataStr: string, status: string) {
  if (status === "pago") return false;
  return new Date(dataStr) < new Date(new Date().toISOString().split("T")[0]);
}

function formatDateLabel(day: number, month: number, year: number) {
  return new Date(year, month, day).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function Calendario() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachPreSelectedId, setAttachPreSelectedId] = useState<
    number | undefined
  >(undefined);
  const { solicitacoes } = useSolicitacoes();

  // API Integration
  const { data: vencimentosApi, isLoading: loadingVencimentos } =
    useVencimentos(LOGGED_PRODUCER_ID, 90);
  const { data: notasApi, isLoading: loadingNotas } =
    useNotas(LOGGED_PRODUCER_ID);

  // Documents: use API or fallback to mock
  const documentosMock = useMemo(() => {
    if (notasApi && notasApi.length > 0) {
      return notasApi.map((nota) => ({
        id: nota.id,
        nome: `NF ${nota.numero || nota.id}`,
        tipo: nota.tipo || "NF-e",
        data: nota.dataEmissao?.split("T")[0] || "",
        dataAnexacao:
          nota.createdAt?.split("T")[0] ||
          nota.dataEmissao?.split("T")[0] ||
          "",
      }));
    }
    return documentosMockFallback;
  }, [notasApi]);

  // Payments: use API or fallback to mock
  const pagamentosMock = useMemo(() => {
    if (vencimentosApi && vencimentosApi.length > 0) {
      return vencimentosApi.map((v, index) => ({
        id: `venc-${index}`,
        titulo: v.evento,
        tipo: v.descricao?.split(" - ")[0] || "Obrigação",
        valor: v.valor || 0,
        data: v.dataVencimento.split("T")[0],
        status: v.status === "pago" ? ("pago" as const) : ("a_pagar" as const),
      }));
    }
    return pagamentosMockFallback;
  }, [vencimentosApi]);

  const days = getCalendarDays(viewYear, viewMonth);
  const todayKey = toDateKey(today);

  function getDocsForDateLocal(dateKey: string) {
    return documentosMock.filter((d: { data: string }) => d.data === dateKey);
  }

  function getPagamentosForDateLocal(dateKey: string) {
    return pagamentosMock.filter((p: { data: string }) => p.data === dateKey);
  }

  function getSolicitacoesForDate(dateKey: string) {
    return solicitacoes.filter(
      (s) => s.producerId === LOGGED_PRODUCER_ID && s.prazo === dateKey,
    );
  }

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const selectedDateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const selectedDocs = getDocsForDateLocal(selectedDateKey);
  const selectedSolic = getSolicitacoesForDate(selectedDateKey);
  const selectedPagamentos = getPagamentosForDateLocal(selectedDateKey);
  const hasItems =
    selectedDocs.length > 0 ||
    selectedSolic.length > 0 ||
    selectedPagamentos.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalIcon className="text-primary" size={28} />
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Calendário
        </h1>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* Left: Calendar */}
        <div className="space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between bg-card rounded-xl border p-3 shadow-sm">
            <Button variant="ghost" size="icon" onClick={goPrev}>
              <ChevronLeft size={20} />
            </Button>
            <span className="font-heading font-semibold text-lg">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="icon" onClick={goNext}>
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="text-center text-[10px] sm:text-xs md:text-sm font-semibold text-muted-foreground py-2 sm:py-3"
                >
                  <span className="sm:hidden">{w.charAt(0)}</span>
                  <span className="hidden sm:inline">{w}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="h-12 sm:h-16 md:h-20 border-b border-r last:border-r-0"
                    />
                  );
                }
                const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const docs = getDocsForDateLocal(dateKey);
                const solic = getSolicitacoesForDate(dateKey);
                const pags = getPagamentosForDateLocal(dateKey);
                const isToday = dateKey === todayKey;

                const hasPendenteSolic = solic.some(
                  (s) => s.status === "pendente" || s.status === "enviado",
                );
                const hasPagVencido = pags.some((p) =>
                  isPagamentoVencido(p.data, p.status),
                );
                const hasPagPendente = pags.some(
                  (p) =>
                    p.status === "a_pagar" &&
                    !isPagamentoVencido(p.data, p.status),
                );

                const totalItems = docs.length + solic.length + pags.length;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "h-12 sm:h-16 md:h-20 border-b border-r flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-colors relative",
                      "hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
                      isToday && "bg-primary/8",
                      selectedDay === day &&
                        "ring-2 ring-primary ring-inset bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs sm:text-sm md:text-base font-medium leading-none",
                        isToday &&
                          "bg-primary text-primary-foreground rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center text-[10px] sm:text-xs md:text-sm",
                      )}
                    >
                      {day}
                    </span>
                    {totalItems > 0 && (
                      <div className="flex items-center gap-0.5">
                        {docs.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}
                        {hasPendenteSolic && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )}
                        {hasPagPendente && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {hasPagVencido && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                        {totalItems > 1 && (
                          <span className="text-[9px] font-semibold text-muted-foreground ml-0.5">
                            +{totalItems}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Documento
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Solicitação
              pendente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Pagamento
              a vencer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Pagamento
              vencido
            </span>
          </div>
        </div>

        {/* Right: Agenda panel */}
        <div className="bg-card rounded-xl border shadow-sm p-5 space-y-5 h-fit lg:sticky lg:top-4">
          <div>
            <h2 className="font-heading font-semibold text-base text-muted-foreground">
              Agenda do dia
            </h2>
            <p className="font-heading font-bold text-lg capitalize">
              {formatDateLabel(selectedDay, viewMonth, viewYear)}
            </p>
          </div>

          {!hasItems && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum item neste dia.
            </p>
          )}

          {/* 1️⃣ Solicitações */}
          {selectedSolic.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-500" />
                Solicitações ({selectedSolic.length})
              </h3>
              <ul className="space-y-2">
                {selectedSolic.map((s) => {
                  const isConcluido =
                    s.status === "concluido" || s.status === "recebido";
                  const isEncaminhado = s.status === "enviado";
                  const isCancelado = s.status === "cancelado";
                  return (
                    <li
                      key={s.id}
                      className="rounded-lg border p-3 bg-background space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {s.titulo}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {s.categoria}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                s.prioridade === "alta"
                                  ? "bg-red-500/15 text-red-700 border-red-300 hover:bg-red-500/15"
                                  : s.prioridade === "media"
                                    ? "bg-amber-500/15 text-amber-700 border-amber-300 hover:bg-amber-500/15"
                                    : "bg-muted text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {s.prioridade}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                isConcluido
                                  ? "bg-emerald-500/15 text-emerald-700 border-emerald-300 hover:bg-emerald-500/15"
                                  : isCancelado
                                    ? "bg-red-500/15 text-red-700 border-red-300 hover:bg-red-500/15"
                                    : isEncaminhado
                                      ? "bg-amber-500/15 text-amber-700 border-amber-300 hover:bg-amber-500/15"
                                      : "bg-amber-500/15 text-amber-700 border-amber-300 hover:bg-amber-500/15",
                              )}
                            >
                              {isConcluido
                                ? "Concluído"
                                : isCancelado
                                  ? "Cancelado"
                                  : isEncaminhado
                                    ? "Encaminhado"
                                    : "Pendente"}
                            </Badge>
                          </div>
                          {s.prazo && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Vencimento: {formatDateBR(s.prazo)}
                            </p>
                          )}
                        </div>
                        {!isConcluido && !isCancelado && !isEncaminhado && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 text-xs"
                            onClick={() => {
                              setAttachPreSelectedId(s.id);
                              setAttachDialogOpen(true);
                            }}
                          >
                            <Plus size={14} className="mr-1" />
                            Anexar
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* 2️⃣ Documentos (histórico, sem status) */}
          {selectedDocs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={14} className="text-blue-500" />
                Documentos ({selectedDocs.length})
              </h3>
              <ul className="space-y-2">
                {selectedDocs.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-lg border p-3 bg-background"
                  >
                    <p className="text-sm font-medium truncate">{doc.nome}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {doc.tipo}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span>📅 Emissão: {formatDateBR(doc.data)}</span>
                      <span>📎 Anexação: {formatDateBR(doc.dataAnexacao)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3️⃣ Pagamentos */}
          {selectedPagamentos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard size={14} className="text-emerald-500" />
                Pagamentos ({selectedPagamentos.length})
              </h3>
              <ul className="space-y-2">
                {selectedPagamentos.map((p) => {
                  const vencido = isPagamentoVencido(p.data, p.status);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-lg border p-3 bg-background"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.titulo}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {p.tipo}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              p.status === "pago"
                                ? "bg-emerald-500/15 text-emerald-700 border-emerald-300 hover:bg-emerald-500/15"
                                : vencido
                                  ? "bg-red-500/15 text-red-700 border-red-300 hover:bg-red-500/15"
                                  : "bg-amber-500/15 text-amber-700 border-amber-300 hover:bg-amber-500/15",
                            )}
                          >
                            {p.status === "pago"
                              ? "Pago"
                              : vencido
                                ? "Vencido"
                                : "A pagar"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          📅 Vencimento: {formatDateBR(p.data)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground shrink-0">
                        R$ {p.valor.toLocaleString("pt-BR")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <AnexarDocumentoDialog
        open={attachDialogOpen}
        onOpenChange={(v) => {
          setAttachDialogOpen(v);
          if (!v) setAttachPreSelectedId(undefined);
        }}
        preSelectedRequestId={attachPreSelectedId}
      />
    </div>
  );
}
