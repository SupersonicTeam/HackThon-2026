import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  ClipboardList,
  FileCheck,
  CreditCard,
  TrendingUp,
  Eye,
  Download,
  FileImage,
  File,
  Plus,
  Upload,
  FileOutput,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  documentosUnificados,
  type DocumentoUnificado,
  type GrupoDocumento,
} from "@/mocks";
import { useSolicitacoes } from "@/contexts/SolicitacoesContext";
import { statusLabels, statusStyles, type RascunhoNFe } from "@/mocks/drafts";
import GerarRascunhoDialog from "@/components/GerarRascunhoDialog";
import { toast } from "sonner";
import {
  useNotas,
  useNota,
  useRascunhos,
  useEnviarRascunhoContador,
  useFeedbackRascunho,
  useFinalizarRascunho,
  useGerarNotaDireta,
} from "@/hooks/use-dashboard";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";

// Helper to check if ID is a UUID (API draft) vs numeric (local/mock draft)
function isUUID(id: string | number): boolean {
  if (typeof id === 'number') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

const periodoOptions = [
  { value: "todos", label: "Todos" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "mes", label: "Este mês" },
  { value: "mesAnterior", label: "Mês anterior" },
];

const grupoLabels: Record<GrupoDocumento, string> = {
  SOLICITACAO: "Solicitações",
  DOCUMENTO: "Documentos Oficiais",
  PAGAMENTO: "Pagamentos",
};

const grupoIcons: Record<GrupoDocumento, typeof FileText> = {
  SOLICITACAO: ClipboardList,
  DOCUMENTO: FileCheck,
  PAGAMENTO: CreditCard,
};

const grupoBadgeStyles: Record<GrupoDocumento, string> = {
  SOLICITACAO: "bg-accent/15 text-accent border-0",
  DOCUMENTO: "bg-primary/15 text-primary border-0",
  PAGAMENTO: "bg-destructive/15 text-destructive border-0",
};

function getStatusStyle(status: string) {
  switch (status) {
    case "Pendente":
    case "A pagar":
      return "bg-accent/15 text-accent border-0";
    case "Encaminhado":
    case "Emitido":
      return "bg-primary/15 text-primary border-0";
    case "Concluído":
    case "Pago":
    case "Anexado":
      return "bg-primary/20 text-primary border-0";
    case "Cancelado":
      return "bg-destructive/15 text-destructive border-0";
    default:
      return "bg-muted text-muted-foreground border-0";
  }
}

function filterByPeriodo(docs: DocumentoUnificado[], periodo: string) {
  if (periodo === "todos") return docs;
  const now = new Date("2026-02-12");
  return docs.filter((d) => {
    const date = new Date(d.data + "T12:00:00");
    if (periodo === "7") {
      const diff = (now.getTime() - date.getTime()) / 86400000;
      return diff >= 0 && diff <= 7;
    }
    if (periodo === "30") {
      const diff = (now.getTime() - date.getTime()) / 86400000;
      return diff >= 0 && diff <= 30;
    }
    if (periodo === "mes") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    if (periodo === "mesAnterior") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        date.getMonth() === prev.getMonth() &&
        date.getFullYear() === prev.getFullYear()
      );
    }
    return true;
  });
}

export default function Documentos() {
  const [periodo, setPeriodo] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [grupo, setGrupo] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<DocumentoUnificado | null>(null);
  const [selectedNotaId, setSelectedNotaId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState("");

  const [novoArquivo, setNovoArquivo] = useState<string | null>(null);
  const [localDocs, setLocalDocs] = useState<DocumentoUnificado[]>([]);
  const [draftOpen, setDraftOpen] = useState(false);
  const [viewDraft, setViewDraft] = useState<RascunhoNFe | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<RascunhoNFe | null>(null);
  const [emitirOpen, setEmitirOpen] = useState(false);
  const [emitirDraft, setEmitirDraft] = useState<RascunhoNFe | null>(null);

  // API Integration
  const { data: notasApi, isLoading: loadingNotas } =
    useNotas(LOGGED_PRODUCER_ID);
  const { data: notaDetalhada, isLoading: loadingNotaDetalhada } = useNota(
    selectedNotaId || "",
  );
  const { data: rascunhosApi, isLoading: loadingRascunhos } =
    useRascunhos(LOGGED_PRODUCER_ID);
  const enviarRascunhoMutation = useEnviarRascunhoContador();
  const finalizarRascunhoMutation = useFinalizarRascunho();
  const gerarNotaDiretaMutation = useGerarNotaDireta();

  const {
    solicitacoes,
    enviarDocumento,
    drafts: allDrafts,
    addDraft,
    updateDraft,
  } = useSolicitacoes();

  // Combine API rascunhos with local drafts
  const drafts = useMemo(() => {
    const localDrafts = allDrafts.filter(
      (d) => d.producerId === LOGGED_PRODUCER_ID,
    );
    if (rascunhosApi && rascunhosApi.length > 0) {
      // Map API rascunhos to the local format
      const apiDrafts: RascunhoNFe[] = rascunhosApi.map((r) => ({
        id: r.id,
        producerId: LOGGED_PRODUCER_ID,
        titulo: r.titulo || `Rascunho #${r.id}`,
        tipo: (r.tipo === "entrada"
          ? "entrada"
          : "saida") as RascunhoNFe["tipo"],
        data:
          r.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
        uf: r.uf || "PR",
        municipio: r.municipio || "",
        ncm: r.cfop || "",
        valorTotal: String(r.valorTotal || 0),
        itens: (r.itens || []).map((item) => ({
          descricao: item.descricao,
          quantidade: String(item.quantidade),
          unidade: item.unidade || "UN",
          valor: String(item.valorUnitario || 0),
        })),
        status: r.status as RascunhoNFe["status"],
        feedbackContador: r.feedbackContador,
      }));
      return [...apiDrafts, ...localDrafts];
    }
    return localDrafts;
  }, [allDrafts, rascunhosApi]);

  const pendentes = useMemo(
    () => solicitacoes.filter((s) => s.status === "pendente"),
    [solicitacoes],
  );
  const solicitacaoSelecionada = useMemo(
    () => solicitacoes.find((s) => String(s.id) === selectedSolicitacao),
    [solicitacoes, selectedSolicitacao],
  );

  // Combine API notas with local docs and mock docs
  const apiDocsAsUnified: DocumentoUnificado[] = useMemo(() => {
    if (!notasApi || notasApi.length === 0) return [];
    return notasApi.map((nota, index) => ({
      id: parseInt(nota.id, 10) || 1000 + index,
      titulo: `NF ${nota.numero || nota.id}`,
      grupo: "DOCUMENTO" as GrupoDocumento,
      categoria: nota.tipo || "NF-e",
      classificacao: "PRODUTO" as const,
      valor: nota.valorTotal || 0,
      data: nota.dataEmissao?.split("T")[0] || "",
      status:
        nota.status === "processado"
          ? "Emitido"
          : nota.status === "enviado_contador"
            ? "Encaminhado"
            : "Pendente",
      fileType: "pdf" as const,
      fileUrl: nota.arquivoUrl || "/placeholder.svg",
      notaId: nota.id, // Store original nota ID for fetching details
    }));
  }, [notasApi]);

  const allDocs = useMemo(
    () => [...apiDocsAsUnified, ...localDocs, ...documentosUnificados],
    [localDocs],
  );

  const allStatuses = useMemo(() => {
    const set = new Set(allDocs.map((d) => d.status));
    return Array.from(set).sort();
  }, [allDocs]);

  const filtered = useMemo(() => {
    let docs = [...allDocs];
    docs = filterByPeriodo(docs, periodo);
    if (tipo !== "todos") docs = docs.filter((d) => d.classificacao === tipo);
    if (grupo !== "todos") docs = docs.filter((d) => d.grupo === grupo);
    if (statusFilter !== "todos")
      docs = docs.filter((d) => d.status === statusFilter);
    if (busca)
      docs = docs.filter((d) =>
        d.titulo.toLowerCase().includes(busca.toLowerCase()),
      );
    return docs;
  }, [periodo, tipo, grupo, statusFilter, busca, allDocs]);

  const grouped = useMemo(() => {
    const groups: Record<GrupoDocumento, DocumentoUnificado[]> = {
      SOLICITACAO: [],
      DOCUMENTO: [],
      PAGAMENTO: [],
    };
    filtered.forEach((d) => groups[d.grupo].push(d));
    return groups;
  }, [filtered]);

  const displayGroups: GrupoDocumento[] =
    grupo !== "todos"
      ? [grupo as GrupoDocumento]
      : ["SOLICITACAO", "DOCUMENTO", "PAGAMENTO"];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="text-primary" size={28} />
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Documentos
        </h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 sm:flex-wrap">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="text-xs sm:text-sm sm:w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodoOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="text-xs sm:text-sm sm:w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="PRODUTO">Produtos</SelectItem>
            <SelectItem value="SERVICO">Serviços</SelectItem>
          </SelectContent>
        </Select>

        <Select value={grupo} onValueChange={setGrupo}>
          <SelectTrigger className="text-xs sm:text-sm sm:w-44">
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os grupos</SelectItem>
            <SelectItem value="SOLICITACAO">Solicitações</SelectItem>
            <SelectItem value="DOCUMENTO">Documentos Oficiais</SelectItem>
            <SelectItem value="PAGAMENTO">Pagamentos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="text-xs sm:text-sm sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar documento..."
            className="pl-10"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Grouped cards */}
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Nenhum documento encontrado.
        </p>
      )}

      {displayGroups.map((g) => {
        const docs = grouped[g];
        if (docs.length === 0) return null;
        const Icon = grupoIcons[g];
        return (
          <div key={g} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon size={18} className="text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                {grupoLabels[g]}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {docs.length}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {docs.map((doc) => (
                <Card
                  key={doc.id}
                  className="shadow-sm hover:ring-2 hover:ring-primary/20 transition-shadow"
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground leading-tight truncate">
                          {doc.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.categoria} ·{" "}
                          {doc.classificacao === "PRODUTO"
                            ? "Produto"
                            : "Serviço"}
                          {doc.ncm && (
                            <span className="ml-1 text-muted-foreground/70">
                              · NCM {doc.ncm}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={getStatusStyle(doc.status)}>
                          {doc.status}
                        </Badge>
                        <button
                          onClick={() => {
                            setSelected(doc);
                            setSelectedNotaId((doc as any).notaId || null);
                          }}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          aria-label="Ver documento"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDate(doc.data)}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(doc.valor)}
                      </span>
                    </div>
                    {doc.impactoTributario && doc.impactoTributario > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                        <TrendingUp size={12} className="text-accent" />
                        <span>
                          Impacto tributário:{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(doc.impactoTributario)}
                          </span>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Rascunhos gerados ── */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              Rascunhos gerados
            </h2>
            <Badge variant="secondary" className="text-xs">
              {drafts.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {drafts.map((d) => (
              <Card
                key={d.id}
                className="shadow-sm hover:ring-2 hover:ring-primary/20 transition-shadow"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground leading-tight truncate">
                        {d.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.tipo} · {formatDate(d.data)}
                      </p>
                    </div>
                    <Badge
                      className={
                        statusStyles[d.status] + " text-[10px] shrink-0"
                      }
                    >
                      {statusLabels[d.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {d.uf}/{d.municipio}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(parseFloat(d.valorTotal) || 0)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {d.status === "aprovado" ? (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEmitirDraft(d);
                            setEmitirOpen(true);
                          }}
                        >
                          <FileOutput size={14} className="mr-1" /> Emitir NF-e
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setViewDraft(d)}
                        >
                          <Eye size={14} className="mr-1" /> Ver
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setViewDraft(d)}
                        >
                          <Eye size={14} className="mr-1" /> Ver
                        </Button>
                        {d.status === "rascunho" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => setViewDraft(d)}
                            >
                              <FileText size={14} className="mr-1" /> Editar
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                updateDraft(d.id, {
                                  status: "enviado_contador",
                                });
                                toast.success("Rascunho enviado ao contador");
                              }}
                            >
                              Enviar ao contador
                            </Button>
                          </>
                        )}
                        {d.status === "devolvido" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-destructive"
                            onClick={() => setFeedbackDraft(d)}
                          >
                            <FileText size={14} className="mr-1" /> Ver feedback
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* View draft dialog */}
      <Dialog
        open={viewDraft !== null}
        onOpenChange={(v) => {
          if (!v) setViewDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Detalhes do rascunho
            </DialogTitle>
          </DialogHeader>
          {viewDraft && (
            <div className="space-y-3 text-sm">
              <Badge className={statusStyles[viewDraft.status] + " text-xs"}>
                {statusLabels[viewDraft.status]}
              </Badge>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium">{viewDraft.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UF / Município</span>
                <span className="font-medium">
                  {viewDraft.uf} / {viewDraft.municipio}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NCM</span>
                <span className="font-medium">{viewDraft.ncm || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor total</span>
                <span className="font-semibold">
                  {formatCurrency(parseFloat(viewDraft.valorTotal) || 0)}
                </span>
              </div>
              {viewDraft.itens.length > 0 && (
                <div className="border-t pt-2 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Itens
                  </p>
                  {viewDraft.itens.map((item, i) => (
                    <p key={i} className="text-xs">
                      {item.quantidade} {item.unidade} —{" "}
                      {item.descricao || "Item"} (
                      {formatCurrency(parseFloat(item.valor) || 0)})
                    </p>
                  ))}
                </div>
              )}
              {viewDraft.feedbackContador && (
                <div className="border-t pt-2 space-y-1">
                  <p className="text-xs font-medium text-destructive">
                    Feedback do contador
                  </p>
                  <div className="bg-destructive/10 rounded-md p-3 text-destructive text-sm">
                    {viewDraft.feedbackContador}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback dialog */}
      <Dialog
        open={feedbackDraft !== null}
        onOpenChange={(v) => {
          if (!v) setFeedbackDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Feedback do contador
            </DialogTitle>
          </DialogHeader>
          {feedbackDraft && (
            <div className="space-y-3 text-sm">
              <p className="font-medium">{feedbackDraft.titulo}</p>
              <div className="bg-destructive/10 rounded-md p-3 text-destructive text-sm">
                {feedbackDraft.feedbackContador}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Emitir NF-e modal */}
      <Dialog open={emitirOpen} onOpenChange={setEmitirOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-heading">Emissão de NF-e</DialogTitle>
          </DialogHeader>
          {emitirDraft && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <FileOutput size={24} className="text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {emitirDraft.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {emitirDraft.tipo} · {emitirDraft.uf}/{emitirDraft.municipio}
                  </p>
                </div>
              </div>
              
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-semibold">
                    {parseFloat(emitirDraft.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens</span>
                  <span className="font-medium">{emitirDraft.itens.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">{formatDate(emitirDraft.data)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
                <TrendingUp size={16} className="shrink-0 mt-0.5" />
                <p>
                  Ao emitir, este rascunho será convertido em uma NF-e oficial e aparecerá em seus documentos fiscais.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEmitirOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEmitirOpen(false);
                if (emitirDraft) setViewDraft(emitirDraft);
              }}
            >
              <Eye size={14} className="mr-1" /> Ver detalhes
            </Button>
            <Button
              disabled={finalizarRascunhoMutation.isPending || gerarNotaDiretaMutation.isPending}
              onClick={async () => {
                if (!emitirDraft) return;
                try {
                  // Check if this is an API draft (UUID) or local/mock draft (numeric)
                  if (isUUID(emitirDraft.id)) {
                    // API draft - use finalizar endpoint
                    await finalizarRascunhoMutation.mutateAsync(String(emitirDraft.id));
                  } else {
                    // Local/mock draft - use gerar-direta to create NF-e directly
                    const tipoNota = emitirDraft.tipo === "entrada" || emitirDraft.tipo === "Entrada" ? "entrada" : "saida";
                    await gerarNotaDiretaMutation.mutateAsync({
                      produtorId: LOGGED_PRODUCER_ID,
                      tipo: tipoNota,
                      cfop: tipoNota === "saida" ? "5102" : "1102", // CFOP padrão para venda/compra
                      naturezaOperacao: tipoNota === "saida" ? "Venda de produtos agrícolas" : "Compra de insumos",
                      nomeDestinatario: "Cooperativa Agrícola",
                      cpfCnpjDestinatario: "00.000.000/0001-00",
                      ufDestino: emitirDraft.uf || "PR",
                      dataEmissao: new Date().toISOString().split("T")[0],
                      itens: emitirDraft.itens.map((item, idx) => ({
                        numeroItem: idx + 1,
                        descricao: item.descricao || "Item",
                        quantidade: parseFloat(item.quantidade) || 1,
                        valorUnitario: parseFloat(item.valor) || 0,
                        valorTotal: (parseFloat(item.quantidade) || 1) * (parseFloat(item.valor) || 0),
                      })),
                    });
                    // Remove from local drafts
                    updateDraft(emitirDraft.id, { status: "finalizado" as any });
                  }
                  toast.success("NF-e emitida com sucesso!");
                  setEmitirOpen(false);
                  setEmitirDraft(null);
                } catch (error) {
                  console.error("Erro ao emitir:", error);
                  toast.error("Erro ao emitir NF-e. Tente novamente.");
                }
              }}
            >
              {(finalizarRascunhoMutation.isPending || gerarNotaDiretaMutation.isPending) ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <FileOutput size={14} className="mr-1" />
              )}
              {(finalizarRascunhoMutation.isPending || gerarNotaDiretaMutation.isPending) ? "Emitindo..." : "Emitir NF-e"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document viewer dialog */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setSelectedNotaId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              {selected?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-1">
              {loadingNotaDetalhada && selectedNotaId ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-sm text-muted-foreground">
                    Carregando detalhes...
                  </p>
                </div>
              ) : notaDetalhada && selectedNotaId ? (
                /* NF-e detalhada da API */
                <div className="space-y-4">
                  {/* File preview */}
                  <div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[160px]">
                    <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                      <File size={48} strokeWidth={1.5} />
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
                      <dd className="font-semibold text-lg">
                        {formatCurrency(notaDetalhada.valorTotal || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>
                        <Badge className={getStatusStyle(
                          notaDetalhada.status === "processado"
                            ? "Emitido"
                            : notaDetalhada.status === "enviado_contador"
                              ? "Encaminhado"
                              : "Pendente"
                        )}>
                          {notaDetalhada.status === "processado"
                            ? "Emitido"
                            : notaDetalhada.status === "enviado_contador"
                              ? "Encaminhado"
                              : "Pendente"}
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
                      <div className="space-y-2">
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
                /* Documento genérico (mock ou documento local) */
                <div className="space-y-4">
                  {/* File preview */}
                  <div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[200px]">
                {selected.fileType === "image" ? (
                  <img
                    src={selected.fileUrl}
                    alt={selected.titulo}
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                    <File size={48} strokeWidth={1.5} />
                    <span className="text-sm font-medium">Documento PDF</span>
                    <span className="text-xs">{selected.titulo}.pdf</span>
                  </div>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Categoria</dt>
                  <dd className="font-medium">{selected.categoria}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Data</dt>
                  <dd className="font-medium">{formatDate(selected.data)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Valor</dt>
                  <dd className="font-medium">
                    {formatCurrency(selected.valor)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge className={getStatusStyle(selected.status)}>
                      {selected.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Classificação</dt>
                  <dd className="font-medium">
                    {selected.classificacao === "PRODUTO"
                      ? "Produto"
                      : "Serviço"}
                  </dd>
                </div>
                {selected.ncm && (
                  <div>
                    <dt className="text-muted-foreground">NCM</dt>
                    <dd className="font-medium">{selected.ncm}</dd>
                  </div>
                )}
                {selected.impactoTributario &&
                  selected.impactoTributario > 0 && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">
                        Impacto tributário
                      </dt>
                      <dd className="font-medium text-accent">
                        {formatCurrency(selected.impactoTributario)}
                      </dd>
                    </div>
                  )}
              </dl>
              </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelected(null);
                    setSelectedNotaId(null);
                  }}
                >
                  Fechar
                </Button>
                <Button className="flex-1" onClick={() => {}}>
                  <Download size={16} className="mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FABs */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-50 flex flex-col gap-3 items-end">
        <button
          onClick={() => setDraftOpen(true)}
          className="h-12 px-4 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center gap-2 hover:scale-105 transition-all text-sm font-medium"
          aria-label="Gerar rascunho NF-e"
        >
          <FileText size={20} />
          <span className="hidden sm:inline">Gerar rascunho NF-e</span>
        </button>
        <button
          onClick={() => setAddOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 hover:bg-primary/90 transition-all"
          aria-label="Adicionar documento"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Gerar rascunho dialog */}
      <GerarRascunhoDialog
        open={draftOpen}
        onOpenChange={setDraftOpen}
        onSave={(draft) => {
          addDraft({
            ...draft,
            producerId: LOGGED_PRODUCER_ID,
            status: "rascunho",
          });
          toast.success("Rascunho salvo");
        }}
        onSend={(draft) => {
          addDraft({
            ...draft,
            producerId: LOGGED_PRODUCER_ID,
            status: "enviado_contador",
          });
          toast.success("Rascunho enviado ao contador");
        }}
      />

      {/* Add document dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-heading">Anexar documento</DialogTitle>
          </DialogHeader>
          {pendentes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma solicitação pendente do contador no momento.
            </p>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Solicitação do contador</Label>
                <Select
                  value={selectedSolicitacao}
                  onValueChange={setSelectedSolicitacao}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a solicitação" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendentes.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {solicitacaoSelecionada && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria</span>
                    <span className="font-medium">
                      {solicitacaoSelecionada.categoria}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Mês referência
                    </span>
                    <span className="font-medium">
                      {solicitacaoSelecionada.mesReferencia}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prazo</span>
                    <span className="font-medium">
                      {new Date(
                        solicitacaoSelecionada.prazo + "T12:00:00",
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {solicitacaoSelecionada.descricaoCurta && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {solicitacaoSelecionada.descricaoCurta}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Arquivo</Label>
                <div className="space-y-2">
                  {/* Botão de tirar foto - apenas mobile */}
                  <label className="sm:hidden flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 py-4 cursor-pointer hover:bg-primary/10 transition-colors">
                    <FileImage size={24} className="text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Tirar Foto
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        setNovoArquivo(e.target.files?.[0]?.name || null)
                      }
                    />
                  </label>
                  {/* Upload normal */}
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 py-6 sm:py-8 cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload size={28} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center px-2">
                      {novoArquivo || "Clique para enviar arquivo"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setNovoArquivo(e.target.files?.[0]?.name || null)
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setSelectedSolicitacao("");
                setNovoArquivo(null);
              }}
            >
              Cancelar
            </Button>
            {pendentes.length > 0 && (
              <Button
                onClick={() => {
                  const sol = solicitacaoSelecionada!;
                  const fileName = novoArquivo || sol.titulo;
                  enviarDocumento(sol.id, fileName);
                  const novo: DocumentoUnificado = {
                    id: Date.now(),
                    titulo: fileName,
                    grupo: "DOCUMENTO",
                    categoria: sol.categoria,
                    classificacao: "PRODUTO",
                    valor: 0,
                    data: new Date().toISOString().slice(0, 10),
                    status: "Encaminhado",
                    fileType: "pdf",
                    fileUrl: "/placeholder.svg",
                  };
                  setLocalDocs((prev) => [novo, ...prev]);
                  setSelectedSolicitacao("");
                  setNovoArquivo(null);
                  setAddOpen(false);
                }}
                disabled={!selectedSolicitacao}
              >
                Salvar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
