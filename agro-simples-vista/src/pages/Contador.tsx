import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  FileText,
  AlertTriangle,
  Users,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  RotateCcw,
  Ban,
  Pencil,
  Eye,
} from "lucide-react";
import { useSolicitacoes } from "@/contexts/SolicitacoesContext";
import { useContador } from "@/hooks/use-contador";
import { mesesReferencia, tiposDocumento } from "@/mocks";
import { produtores } from "@/mocks/producers";
import DocsOficiaisTab from "@/components/DocsOficiaisTab";
import ResumoPagamento from "@/components/ResumoPagamento";
import ConferirDadosDialog from "@/components/ConferirDadosDialog";
import RascunhosContadorTab from "@/components/RascunhosContadorTab";

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

const prioridadeBadge = (p: string) => {
  if (p === "urgente") return <Badge variant="destructive" className="text-[10px]">Urgente</Badge>;
  if (p === "alta") return <Badge variant="destructive" className="text-[10px]">Alta</Badge>;
  if (p === "media") return <Badge variant="secondary" className="text-[10px]">Média</Badge>;
  return <Badge variant="outline" className="text-[10px]">Baixa</Badge>;
};

const statusBadge = (s: string) => {
  if (s === "pendente") return <Badge variant="outline" className="text-muted-foreground text-[10px]"><Clock size={10} className="mr-1" />Pendente</Badge>;
  if (s === "enviado") return <Badge className="bg-amber-500/15 text-amber-700 border-0 text-[10px]"><Send size={10} className="mr-1" />Encaminhado</Badge>;
  if (s === "concluido") return <Badge className="bg-primary/15 text-primary border-0 text-[10px]"><CheckCircle size={10} className="mr-1" />Concluído</Badge>;
  if (s === "cancelado") return <Badge variant="destructive" className="text-[10px]"><Ban size={10} className="mr-1" />Cancelado</Badge>;
  if (s === "recebido") return <Badge className="bg-primary/15 text-primary border-0 text-[10px]"><CheckCircle size={10} className="mr-1" />Recebido</Badge>;
  return <Badge variant="destructive" className="text-[10px]"><XCircle size={10} className="mr-1" />Rejeitado</Badge>;
};

type SolicitacaoUi = {
  id: string;
  producerId: string;
  titulo: string;
  descricaoCurta: string;
  categoria: string;
  mesReferencia: string;
  prioridade: "alta" | "media" | "baixa" | "urgente";
  status: "pendente" | "concluido" | "cancelado" | "enviado" | "recebido" | "rejeitado";
  prazo: string;
  observacao?: string;
  motivoRejeicao?: string;
  motivoCancelamento?: string;
  arquivoNome?: string;
};

function parseTiposDocumentos(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

function decodeCategoriaMes(raw?: string) {
  const tipos = parseTiposDocumentos(raw);
  const mesToken = tipos.find((t) => t.startsWith("mes:")) || "";
  const mesReferencia = mesToken.replace("mes:", "").trim();
  const categoria = tipos.find((t) => t !== mesToken) || "Documento";
  return { categoria, mesReferencia };
}

function buildTiposDocumentos(categoria: string, mesReferencia: string) {
  return [categoria, mesReferencia ? `mes:${mesReferencia}` : ""].filter(Boolean);
}

// Sort: pendente first, then by closest deadline
function sortSolicitacoes(a: SolicitacaoUi, b: SolicitacaoUi) {
  const statusOrder: Record<string, number> = { pendente: 0, enviado: 1, concluido: 2, cancelado: 3, recebido: 2, rejeitado: 3 };
  const sa = statusOrder[a.status] ?? 4;
  const sb = statusOrder[b.status] ?? 4;
  if (sa !== sb) return sa - sb;
  return a.prazo.localeCompare(b.prazo);
}

export default function Contador() {
  const { drafts, updateDraft } = useSolicitacoes();
  const {
    pendencias,
    loading,
    error,
    listar,
    criar,
    atualizar,
    concluir,
    cancelar,
    reabrir,
    rejeitar,
  } = useContador();
  const [selectedProducerId, setSelectedProducerId] = useState(produtores[0].id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [editingSolicitacao, setEditingSolicitacao] = useState<SolicitacaoUi | null>(null);
  const [viewEnvioId, setViewEnvioId] = useState<string | null>(null);
  const [viewDocId, setViewDocId] = useState<string | null>(null);
  const [conferirId, setConferirId] = useState<string | null>(null);
  const [resumoSolId, setResumoSolId] = useState<string | null>(null);


  // form state
  const [formTitulo, setFormTitulo] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formMes, setFormMes] = useState("");
  const [formPrioridade, setFormPrioridade] = useState("");
  const [formPrazo, setFormPrazo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");

  const selectedProducer = produtores.find((p) => p.id === selectedProducerId);
  const solicitacoes = useMemo<SolicitacaoUi[]>(() => {
    return pendencias.map((p) => {
      const { categoria, mesReferencia } = decodeCategoriaMes(p.tiposDocumentos);
      const status =
        p.status === "concluida"
          ? "concluido"
          : p.status === "cancelada"
          ? "cancelado"
          : "pendente";
      return {
        id: p.id,
        producerId: p.produtorId,
        titulo: p.titulo,
        descricaoCurta: p.descricao || p.titulo,
        categoria,
        mesReferencia,
        prioridade: p.prioridade,
        status,
        prazo: p.dataLimite?.slice(0, 10) || "",
        observacao: p.observacoes ?? undefined,
        motivoRejeicao: p.motivoRejeicao ?? undefined,
        motivoCancelamento: p.motivoCancelamento ?? undefined,
      };
    });
  }, [pendencias]);

  const filtered = solicitacoes.filter((s) => s.producerId === selectedProducerId).sort(sortSolicitacoes);
  const enviados = solicitacoes.filter((s) => s.producerId === selectedProducerId && s.status === "enviado").sort(sortSolicitacoes);
  const concluidos = solicitacoes.filter((s) => s.producerId === selectedProducerId && s.status === "concluido");
  const filteredDrafts = drafts.filter((d) => d.producerId === selectedProducerId);

  const openEdit = (s: SolicitacaoUi) => {
    setEditingSolicitacao(s);
    setFormTitulo(s.titulo);
    setFormCategoria(s.categoria);
    setFormMes(s.mesReferencia);
    setFormPrioridade(s.prioridade);
    setFormPrazo(s.prazo);
    setFormDescricao(s.observacao || s.descricaoCurta || "");
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormTitulo("");
    setFormCategoria("");
    setFormMes("");
    setFormPrioridade("");
    setFormPrazo("");
    setFormDescricao("");
    setEditingSolicitacao(null);
    setDialogOpen(false);
  };

  const salvar = async () => {
    if (!formTitulo || !formCategoria || !formMes || !formPrioridade || !formPrazo) return;
    const tiposDocumentos = buildTiposDocumentos(formCategoria, formMes);
    const payload = {
      titulo: formTitulo,
      descricao: formDescricao || formTitulo,
      dataLimite: formPrazo,
      prioridade: formPrioridade as "alta" | "media" | "baixa" | "urgente",
      tiposDocumentos,
      observacoes: formDescricao || undefined,
    };
    try {
      if (editingSolicitacao) {
        await atualizar(editingSolicitacao.id, payload);
        toast.success("Solicitação atualizada");
      } else {
        await criar({ ...payload, produtorId: selectedProducerId });
        toast.success("Solicitação criada");
      }
      resetForm();
    } catch (e) {
      toast.error("Falha ao salvar a solicitação");
    }
  };

  const handleReject = async () => {
    if (rejectId === null || !rejectMotivo.trim()) return;
    try {
      await rejeitar(rejectId, rejectMotivo);
      setRejectId(null);
      setRejectMotivo("");
      toast.success("Solicitação rejeitada");
    } catch (e) {
      toast.error("Falha ao rejeitar a solicitação");
    }
  };

  const handleCancel = async () => {
    if (cancelId === null || !cancelMotivo.trim()) return;
    try {
      await cancelar(cancelId, cancelMotivo);
      setCancelId(null);
      setCancelMotivo("");
      toast.success("Solicitação cancelada");
    } catch (e) {
      toast.error("Falha ao cancelar a solicitação");
    }
  };

  useEffect(() => {
    listar(selectedProducerId).catch(() => {
      toast.error("Falha ao carregar solicitações");
    });
  }, [listar, selectedProducerId]);

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="text-primary" size={28} />
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Contador</h1>
          <p className="text-sm text-muted-foreground">Gestão de produtores</p>
        </div>
      </div>

      {/* Producer selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Users size={14} /> Produtor
        </label>
        <Select value={selectedProducerId} onValueChange={setSelectedProducerId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {produtores.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}{p.propriedade ? ` — ${p.propriedade}` : ""}{p.cidade ? ` (${p.cidade})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="contatos">
        <TabsList className="w-full grid grid-cols-6 h-auto overflow-x-auto">
          <TabsTrigger value="contatos" className="text-[10px] sm:text-sm px-0.5 sm:px-3 py-2">Contatos</TabsTrigger>
          <TabsTrigger value="solicitacoes" className="text-[10px] sm:text-sm px-0.5 sm:px-3 py-2">Solicitações</TabsTrigger>
          <TabsTrigger value="recebidos" className="text-[10px] sm:text-sm px-0.5 sm:px-3 py-2">Recebidos</TabsTrigger>
          <TabsTrigger value="rascunhos" className="text-[10px] sm:text-sm px-0.5 sm:px-3 py-2">Rascunhos</TabsTrigger>
          <TabsTrigger value="concluidos" className="text-[10px] sm:text-sm px-0.5 sm:px-3 py-2">Concluídos</TabsTrigger>
          <TabsTrigger value="documentos" className="text-[10px] sm:text-sm px-0.5 sm:px-3 py-2">Docs Oficiais</TabsTrigger>
        </TabsList>

        {/* === TAB CONTATOS === */}
        <TabsContent value="contatos" className="space-y-4 mt-4">
          {selectedProducer && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Dados do produtor</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Fazenda / Produtor</span>
                  <p className="font-medium">{selectedProducer.propriedade || selectedProducer.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><MapPin size={12} /> Cidade/UF</span>
                  <p className="font-medium">{selectedProducer.cidade || "—"}{selectedProducer.uf ? `/${selectedProducer.uf}` : ""}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Código</span>
                  <p className="font-medium font-mono">{selectedProducer.id.toUpperCase()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedProducer && selectedProducer.contatos.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Users size={14} /> Contatos / Colaboradores
              </h2>
              <div className="grid gap-2">
                {selectedProducer.contatos.map((c, i) => (
                  <Card key={i} className="shadow-sm">
                    <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">{c.funcao}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground"><Phone size={12} />{c.telefone}</span>
                        <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-muted-foreground hover:underline">
                          <Mail size={12} /> {c.email}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* === TAB SOLICITAÇÕES === */}
        <TabsContent value="solicitacoes" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filtered.length} solicitações</p>
            <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setEditingSolicitacao(null); setDialogOpen(true); }}><Plus size={16} className="mr-1" /> Nova solicitação</Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading">{editingSolicitacao ? "Editar solicitação" : `Nova solicitação para ${selectedProducer?.nome}`}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Título *</label>
                    <Input value={formTitulo} onChange={(e) => setFormTitulo(e.target.value)} placeholder="Ex: Notas de venda - Março" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Categoria *</label>
                    <Select value={formCategoria} onValueChange={setFormCategoria}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {tiposDocumento.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Mês de referência *</label>
                    <Select value={formMes} onValueChange={setFormMes}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {mesesReferencia.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Prioridade *</label>
                    <Select value={formPrioridade} onValueChange={setFormPrioridade}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Data limite *</label>
                    <Input type="date" value={formPrazo} onChange={(e) => setFormPrazo(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Observação (opcional)</label>
                    <Textarea value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Descrição curta..." rows={2} />
                  </div>
                  <Button className="w-full" size="lg" onClick={salvar}>{editingSolicitacao ? "Salvar alterações" : "Salvar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <Card className="shadow-sm">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">Carregando solicitações...</CardContent>
            </Card>
          ) : error ? (
            <Card className="shadow-sm">
              <CardContent className="py-8 text-center text-sm text-destructive">Erro ao carregar solicitações.</CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhuma solicitação para este produtor.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <Card key={s.id} className="shadow-sm">
                  <CardContent className="py-3 px-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">{s.titulo}</p>
                        <p className="text-xs text-muted-foreground">{s.categoria} · {s.mesReferencia} · {formatDate(s.prazo)}</p>
                        {s.status === "cancelado" && s.motivoCancelamento && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle size={12} /> {s.motivoCancelamento}
                          </p>
                        )}
                        {s.status === "pendente" && s.motivoRejeicao && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle size={12} /> Rejeitado: {s.motivoRejeicao}
                          </p>
                        )}
                        {s.status === "enviado" && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <Send size={12} /> Documento enviado pelo produtor
                          </p>
                        )}
                        {s.status === "concluido" && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <CheckCircle size={12} /> Concluída — edição bloqueada
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap mt-1 sm:mt-0">
                        {prioridadeBadge(s.prioridade)}
                        {statusBadge(s.status)}
                      </div>
                    </div>

                    {/* Actions */}
                    {s.status === "pendente" && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button size="sm" variant="outline" className="flex-1 w-full" onClick={() => openEdit(s)}>
                          <Pencil size={14} className="mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 w-full text-destructive hover:text-destructive" onClick={() => setCancelId(s.id)}>
                          <Ban size={14} className="mr-1" /> Cancelar
                        </Button>
                      </div>
                    )}
                    {s.status === "cancelado" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => reabrir(s.id)}>
                          <RotateCcw size={14} className="mr-1" /> Reabrir
                        </Button>
                      </div>
                    )}
                    {s.status === "concluido" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => reabrir(s.id)}>
                          <RotateCcw size={14} className="mr-1" /> Reabrir
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Cancel dialog */}
          <Dialog open={cancelId !== null} onOpenChange={(v) => { if (!v) { setCancelId(null); setCancelMotivo(""); } }}>
             <DialogContent className="w-[95vw] max-w-sm max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Cancelar solicitação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                  <Textarea value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} placeholder="Informe o motivo do cancelamento..." rows={3} />
                </div>
                <Button className="w-full" variant="destructive" onClick={handleCancel}>Confirmar cancelamento</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* View envio dialog */}
          <Dialog open={viewEnvioId !== null} onOpenChange={(v) => { if (!v) setViewEnvioId(null); }}>
             <DialogContent className="w-[95vw] max-w-sm max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Documento enviado</DialogTitle>
              </DialogHeader>
              {(() => {
                const sol = solicitacoes.find((s) => s.id === viewEnvioId);
                return (
                  <div className="space-y-3 pt-2 text-sm">
                    <div><span className="text-muted-foreground">Solicitação:</span> <span className="font-medium">{sol?.titulo}</span></div>
                    {sol?.arquivoNome && <div className="flex items-center gap-1"><FileText size={14} /> <span>{sol.arquivoNome}</span></div>}
                    <p className="text-xs text-muted-foreground">Valide este documento na aba "Recebidos".</p>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* === TAB RECEBIDOS === */}
        <TabsContent value="recebidos" className="space-y-4 mt-4">
          {enviados.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum documento recebido deste produtor.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {enviados.map((s) => {
                return (
                  <Card key={s.id} className="shadow-sm">
                    <CardContent className="py-3 px-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium truncate">{s.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            Prioridade: {s.prioridade}
                          </p>
                        </div>
                        <div className="shrink-0">{statusBadge(s.status)}</div>
                      </div>

                      {s.status === "enviado" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Button size="sm" variant="outline" className="w-full" onClick={() => setViewDocId(s.id)}>
                            <Eye size={14} className="mr-1" /> Ver anexo
                          </Button>
                          <Button size="sm" variant="outline" className="w-full" onClick={() => setConferirId(s.id)}>
                            <Pencil size={14} className="mr-1" /> Conferir/Editar
                          </Button>
                          <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setRejectId(s.id)}>
                            <XCircle size={14} className="mr-1" /> Rejeitar
                          </Button>
                        </div>
                      )}
                      {s.status === "recebido" && (
                        <p className="text-xs text-primary flex items-center gap-1"><CheckCircle size={12} /> Documento validado</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* View document dialog */}
          <Dialog open={viewDocId !== null} onOpenChange={(v) => { if (!v) setViewDocId(null); }}>
            <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Documento enviado</DialogTitle>
              </DialogHeader>
              {(() => {
                const sol = solicitacoes.find((s) => s.id === viewDocId);
                return (
                  <div className="space-y-3 pt-2 text-sm">
                    <div><span className="text-muted-foreground">Solicitação:</span> <span className="font-medium">{sol?.titulo}</span></div>
                    <div><span className="text-muted-foreground">Prioridade:</span> {sol?.prioridade}</div>
                    {sol?.observacao && (
                      <div className="text-xs text-muted-foreground">{sol.observacao}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Preview do arquivo indisponível no MVP.</p>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Reject dialog */}
          <Dialog open={rejectId !== null} onOpenChange={(v) => { if (!v) { setRejectId(null); setRejectMotivo(""); } }}>
            <DialogContent className="w-[95vw] max-w-sm max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Rejeitar documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">O documento será rejeitado e a solicitação voltará ao status Pendente para reenvio.</p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                  <Textarea value={rejectMotivo} onChange={(e) => setRejectMotivo(e.target.value)} placeholder="Informe o motivo da rejeição..." rows={3} />
                </div>
                <Button className="w-full" variant="destructive" onClick={handleReject}>Confirmar rejeição</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Conferir/Editar dados dialog */}
          <ConferirDadosDialog
            solicitacao={solicitacoes.find((s) => s.id === conferirId) || null}
            open={conferirId !== null}
            onOpenChange={(v) => { if (!v) setConferirId(null); }}
            onSave={(id, formData) => {
              atualizar(String(id), {
                tiposDocumentos: buildTiposDocumentos(formData.tipo, ""),
                observacoes: formData.observacao,
              });
              toast.success("Dados salvos com sucesso");
            }}
            onApprove={(id) => {
              concluir(String(id));
              setConferirId(null);
              toast.success("Documento aprovado e concluído");
            }}
          />
        </TabsContent>

        {/* === TAB RASCUNHOS NF-e === */}
        <TabsContent value="rascunhos" className="space-y-4 mt-4">
          <RascunhosContadorTab
            drafts={filteredDrafts}
            onUpdateDraft={updateDraft}
          />
        </TabsContent>

        {/* === TAB CONCLUÍDOS === */}
        <TabsContent value="concluidos" className="space-y-4 mt-4">
          {(() => {
            const metaConcluidos: Record<string, { valor: number; imposto: number; dataConclusao: string }> = {
              "7": { valor: 120000, imposto: 10800, dataConclusao: "2026-02-10" },
              "8": { valor: 35000, imposto: 3150, dataConclusao: "2026-02-18" },
              "9": { valor: 8500, imposto: 2200, dataConclusao: "2026-02-05" },
            };
            const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

            return concluidos.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhuma solicitação concluída para este produtor.</CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {concluidos.map((s) => {
                  const producer = produtores.find((p) => p.id === s.producerId);
                  const meta = metaConcluidos[String(s.id)];
                  return (
                    <Card key={s.id} className="shadow-sm">
                      <CardContent className="py-3 px-4 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium truncate">{s.titulo}</p>
                            <p className="text-xs text-muted-foreground">{s.categoria} · {s.mesReferencia}</p>
                            <p className="text-xs text-muted-foreground">Produtor: {producer?.nome || s.producerId}</p>
                            {meta && (
                              <>
                                <p className="text-xs text-muted-foreground">Valor base: {fmt(meta.valor)}</p>
                                <p className="text-xs text-muted-foreground">Imposto estimado: {fmt(meta.imposto)}</p>
                                <p className="text-xs text-muted-foreground">Concluído em: {formatDate(meta.dataConclusao)}</p>
                              </>
                            )}
                            {!meta && <p className="text-xs text-muted-foreground">Prazo: {formatDate(s.prazo)}</p>}
                          </div>
                          <Badge className="bg-primary/15 text-primary border-0 text-[10px] shrink-0">
                            <CheckCircle size={10} className="mr-1" /> Concluído
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setResumoSolId(s.id)}>
                          <FileText size={14} className="mr-1" /> Visualizar resumo
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}

          <ResumoPagamento
            solicitacaoId={resumoSolId}
            open={resumoSolId !== null}
            onOpenChange={(v) => { if (!v) setResumoSolId(null); }}
          />
        </TabsContent>

        {/* === TAB DOCUMENTOS OFICIAIS === */}
        <TabsContent value="documentos" className="space-y-4 mt-4">
          <DocsOficiaisTab producerId={selectedProducerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
