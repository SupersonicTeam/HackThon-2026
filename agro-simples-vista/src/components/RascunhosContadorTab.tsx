import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Eye,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Plus,
  Save,
  X,
  Trash2,
} from "lucide-react";
import type { RascunhoNFe, DraftItem } from "@/mocks/drafts";
import {
  statusLabels,
  statusStyles,
  ufsMock,
  municipiosPorUf,
} from "@/mocks/drafts";
import { toast } from "sonner";

interface Props {
  drafts: RascunhoNFe[];
  onUpdateDraft: (id: number | string, updates: Partial<RascunhoNFe>) => void;
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

function fmt(v: string) {
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RascunhosContadorTab({ drafts, onUpdateDraft }: Props) {
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackTouched, setFeedbackTouched] = useState(false);
  // Editable fields
  const [editTipo, setEditTipo] = useState<RascunhoNFe["tipo"]>("Saída");
  const [editUf, setEditUf] = useState("");
  const [editMunicipio, setEditMunicipio] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editNcm, setEditNcm] = useState("");
  const [editItens, setEditItens] = useState<DraftItem[]>([]);
  // Checklist
  const [checkCfop, setCheckCfop] = useState(false);
  const [checkNcm, setCheckNcm] = useState(false);
  const [checkValores, setCheckValores] = useState(false);

  const selected = drafts.find((d) => d.id === selectedId) || null;

  const openReview = (d: RascunhoNFe) => {
    setSelectedId(d.id);
    setFeedback(d.feedbackContador || "");
    setFeedbackTouched(false);
    setEditTipo(d.tipo);
    setEditUf(d.uf);
    setEditMunicipio(d.municipio);
    setEditValor(d.valorTotal);
    setEditNcm(d.ncm);
    setEditItens(d.itens.map((i) => ({ ...i })));
    setCheckCfop(false);
    setCheckNcm(false);
    setCheckValores(false);
  };

  const closeReview = () => {
    setSelectedId(null);
    setFeedbackTouched(false);
  };

  const buildChecklist = () => {
    const parts: string[] = [];
    if (checkCfop) parts.push("CFOP precisa revisão");
    if (checkNcm) parts.push("NCM precisa revisão");
    if (checkValores) parts.push("Valores divergentes");
    return parts;
  };

  const getEditedFields = () => ({
    tipo: editTipo,
    uf: editUf,
    municipio: editMunicipio,
    valorTotal: editValor,
    ncm: editNcm,
    itens: editItens,
  });

  const handleSalvar = () => {
    if (!selectedId) return;
    onUpdateDraft(selectedId, getEditedFields());
    toast.success("Alterações salvas");
  };

  const handleDevolver = () => {
    if (!selectedId) return;
    if (!feedback.trim()) {
      setFeedbackTouched(true);
      return;
    }
    const checklist = buildChecklist();
    const fullFeedback =
      checklist.length > 0
        ? `${feedback}\n\n📋 Checklist: ${checklist.join(", ")}`
        : feedback;
    onUpdateDraft(selectedId, {
      status: "devolvido",
      feedbackContador: fullFeedback,
      ...getEditedFields(),
    });
    toast.success("Rascunho devolvido com feedback");
    closeReview();
  };

  const handleAprovar = () => {
    if (!selectedId) return;
    onUpdateDraft(selectedId, {
      status: "aprovado",
      ...getEditedFields(),
    });
    toast.success("Rascunho aprovado para emitir");
    closeReview();
  };

  // Item editing helpers
  const updateItem = (idx: number, field: keyof DraftItem, value: string) => {
    setEditItens((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );
  };
  const addItem = () => {
    setEditItens((prev) => [
      ...prev,
      { descricao: "", quantidade: "", unidade: "KG", valor: "" },
    ]);
  };
  const removeItem = (idx: number) => {
    setEditItens((prev) => prev.filter((_, i) => i !== idx));
  };

  if (drafts.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhum rascunho recebido deste produtor.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {drafts.map((d) => (
          <Card key={d.id} className="shadow-sm">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate">{d.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.tipo} · {d.uf}/{d.municipio} · {formatDate(d.data)}
                  </p>
                  <p className="text-xs font-medium">{fmt(d.valorTotal)}</p>
                </div>
                <Badge
                  className={statusStyles[d.status] + " text-[10px] shrink-0"}
                >
                  {statusLabels[d.status]}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => openReview(d)}
              >
                <Eye size={14} className="mr-1" /> Abrir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review dialog with tabs */}
      <Dialog
        open={selectedId !== null}
        onOpenChange={(v) => {
          if (!v) closeReview();
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
            <DialogTitle className="font-heading text-lg">
              Analisar rascunho NF-e
            </DialogTitle>
            {selected && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {selected.titulo}
                </p>
                <Badge
                  className={statusStyles[selected.status] + " text-[10px]"}
                >
                  {statusLabels[selected.status]}
                </Badge>
              </div>
            )}
          </DialogHeader>

          {selected && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 sm:gap-4 px-4 pb-4 sm:px-6 sm:pb-6">
              {/* LEFT — Preview & summary (2 cols) */}
              <div className="sm:col-span-2 space-y-3 mb-4 sm:mb-0">
                <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/40 p-4 min-h-[140px]">
                  <FileText size={48} className="text-muted-foreground" />
                  <p className="text-sm font-medium mt-2">Anexo do rascunho</p>
                  <p className="text-xs text-muted-foreground">
                    Preview indisponível no MVP
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium">{selected.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      UF / Município
                    </span>
                    <span className="font-medium">
                      {selected.uf} / {selected.municipio}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {formatDate(selected.data)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NCM</span>
                    <span className="font-medium">{selected.ncm || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor total</span>
                    <span className="font-semibold">
                      {fmt(selected.valorTotal)}
                    </span>
                  </div>
                  {selected.itens.length > 0 && (
                    <div className="pt-1 border-t space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        Itens ({selected.itens.length})
                      </p>
                      {selected.itens.map((item, i) => (
                        <p key={i} className="text-xs">
                          {item.quantidade} {item.unidade} —{" "}
                          {item.descricao || "Item"} ({fmt(item.valor)})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT — Tabs (3 cols) */}
              <div className="sm:col-span-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-500/10 rounded-md px-3 py-2">
                  <Sparkles size={14} className="shrink-0" />
                  Rascunho do produtor — revise antes de aprovar
                </div>

                <Tabs defaultValue="dados" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="dados" className="text-xs sm:text-sm">
                      Dados
                    </TabsTrigger>
                    <TabsTrigger value="itens" className="text-xs sm:text-sm">
                      Itens
                    </TabsTrigger>
                    <TabsTrigger
                      value="feedback"
                      className="text-xs sm:text-sm"
                    >
                      Feedback
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB DADOS */}
                  <TabsContent value="dados" className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={editTipo}
                        onValueChange={(v) =>
                          setEditTipo(v as "Entrada" | "Saída")
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Entrada">Entrada</SelectItem>
                          <SelectItem value="Saída">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">UF</Label>
                        <Select
                          value={editUf}
                          onValueChange={(v) => {
                            setEditUf(v);
                            setEditMunicipio("");
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ufsMock.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Município</Label>
                        <Select
                          value={editMunicipio}
                          onValueChange={setEditMunicipio}
                          disabled={!editUf || !municipiosPorUf[editUf]}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {(municipiosPorUf[editUf] || []).map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">NCM (opcional)</Label>
                      <Input
                        className="h-8 text-sm"
                        value={editNcm}
                        onChange={(e) => setEditNcm(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Valor total (R$)</Label>
                      <Input
                        className="h-8 text-sm"
                        value={editValor}
                        onChange={(e) => setEditValor(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB ITENS */}
                  <TabsContent value="itens" className="space-y-3 mt-3">
                    {editItens.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum item adicionado.
                      </p>
                    )}
                    {editItens.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border p-3 space-y-2 relative"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 size={12} />
                        </Button>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Descrição</Label>
                          <Input
                            className="h-8 text-sm"
                            value={item.descricao}
                            onChange={(e) =>
                              updateItem(idx, "descricao", e.target.value)
                            }
                            placeholder="Ex: Soja em grãos"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Qtde</Label>
                            <Input
                              className="h-8 text-sm"
                              value={item.quantidade}
                              onChange={(e) =>
                                updateItem(idx, "quantidade", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Unidade</Label>
                            <Input
                              className="h-8 text-sm"
                              value={item.unidade}
                              onChange={(e) =>
                                updateItem(idx, "unidade", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Valor (R$)</Label>
                            <Input
                              className="h-8 text-sm"
                              value={item.valor}
                              onChange={(e) =>
                                updateItem(idx, "valor", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={addItem}
                    >
                      <Plus size={14} className="mr-1" /> Adicionar item
                    </Button>
                  </TabsContent>

                  {/* TAB FEEDBACK */}
                  <TabsContent value="feedback" className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Feedback do contador</Label>
                      <Textarea
                        rows={4}
                        className={`text-sm ${feedbackTouched && !feedback.trim() ? "border-destructive ring-destructive" : ""}`}
                        placeholder="Informe correções necessárias..."
                        value={feedback}
                        onChange={(e) => {
                          setFeedback(e.target.value);
                          setFeedbackTouched(true);
                        }}
                      />
                      {feedbackTouched && !feedback.trim() && (
                        <p className="text-xs text-destructive">
                          Feedback obrigatório para devolver.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 rounded-lg border p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Checklist rápida
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="chk-cfop"
                          checked={checkCfop}
                          onCheckedChange={(v) => setCheckCfop(!!v)}
                        />
                        <label htmlFor="chk-cfop" className="text-sm">
                          CFOP precisa revisão
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="chk-ncm"
                          checked={checkNcm}
                          onCheckedChange={(v) => setCheckNcm(!!v)}
                        />
                        <label htmlFor="chk-ncm" className="text-sm">
                          NCM precisa revisão
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="chk-valores"
                          checked={checkValores}
                          onCheckedChange={(v) => setCheckValores(!!v)}
                        />
                        <label htmlFor="chk-valores" className="text-sm">
                          Valores divergentes
                        </label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={handleDevolver}>
                    <RotateCcw size={14} className="mr-1" /> Devolver com
                    feedback
                  </Button>
                  <Button onClick={handleAprovar}>
                    <CheckCircle size={14} className="mr-1" /> Aprovar para
                    emitir
                  </Button>
                  <Button variant="secondary" onClick={handleSalvar}>
                    <Save size={14} className="mr-1" /> Salvar alterações
                  </Button>
                  <Button variant="ghost" onClick={closeReview}>
                    <X size={14} className="mr-1" /> Fechar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
