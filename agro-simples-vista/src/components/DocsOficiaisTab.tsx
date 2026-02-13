import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  FileText,
  Eye,
  CheckCircle,
  Trash2,
  Upload,
  DollarSign,
} from "lucide-react";
import { mesesReferencia } from "@/mocks";

const tiposDocOficial = ["DARF", "FUNRURAL", "GPS", "DCTF", "Guia Estadual", "Outro"];

interface DocOficial {
  id: number;
  producerId: string;
  tipo: string;
  mesReferencia: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  arquivoNome: string;
  observacao?: string;
  status: "emitido" | "pago";
  dataAnexacao: string;
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DocsOficiaisTab({ producerId }: { producerId: string }) {
  const [docs, setDocs] = useState<DocOficial[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocOficial | null>(null);

  // form
  const [tipo, setTipo] = useState("");
  const [mes, setMes] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [valor, setValor] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [obs, setObs] = useState("");

  const filtered = docs.filter((d) => d.producerId === producerId);

  const resetForm = () => {
    setTipo("");
    setMes("");
    setDataEmissao("");
    setDataVencimento("");
    setValor("");
    setArquivo(null);
    setObs("");
    setDialogOpen(false);
  };

  const salvar = () => {
    if (!tipo || !mes || !dataEmissao || !dataVencimento || !valor || !arquivo) return;
    const newDoc: DocOficial = {
      id: Date.now(),
      producerId,
      tipo,
      mesReferencia: mes,
      dataEmissao,
      dataVencimento,
      valor: parseFloat(valor.replace(",", ".")),
      arquivoNome: arquivo.name,
      observacao: obs || undefined,
      status: "emitido",
      dataAnexacao: new Date().toISOString().slice(0, 10),
    };
    setDocs((prev) => [...prev, newDoc]);
    resetForm();
  };

  const marcarPago = (id: number) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "pago" as const } : d)));
  };

  const excluir = (id: number) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} documentos</p>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} className="mr-1" /> Novo documento oficial</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Novo documento oficial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Tipo *</label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tiposDocOficial.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Mês referência *</label>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {mesesReferencia.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Data emissão *</label>
                  <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Data vencimento *</label>
                  <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Valor (R$) *</label>
                <Input type="text" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Arquivo (PDF ou XML) *</label>
                <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <Upload size={16} />
                  {arquivo ? arquivo.name : "Selecionar arquivo..."}
                  <input
                    type="file"
                    accept=".pdf,.xml"
                    className="hidden"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Observação (opcional)</label>
                <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observação..." rows={2} />
              </div>
              <Button className="w-full" size="lg" onClick={salvar}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center text-sm text-muted-foreground space-y-2">
            <FileText size={32} className="mx-auto text-muted-foreground/50" />
            <p>Nenhum documento oficial anexado para este produtor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <Card key={d.id} className="shadow-sm">
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{d.tipo} — {d.mesReferencia}</p>
                      <Badge
                        variant={d.status === "pago" ? "default" : "outline"}
                        className={
                          d.status === "pago"
                            ? "bg-emerald-500/15 text-emerald-700 border-0 text-[10px]"
                            : "text-muted-foreground text-[10px]"
                        }
                      >
                        {d.status === "pago" ? (
                          <><CheckCircle size={10} className="mr-1" />Pago</>
                        ) : (
                          <><FileText size={10} className="mr-1" />Emitido</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Venc. {formatDate(d.dataVencimento)} · Emitido {formatDate(d.dataEmissao)} · Anexado {formatDate(d.dataAnexacao)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText size={12} /> {d.arquivoNome}
                    </p>
                    {d.observacao && (
                      <p className="text-xs text-muted-foreground italic">{d.observacao}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <DollarSign size={14} className="text-muted-foreground" />
                      {formatCurrency(d.valor)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewDoc(d)}>
                    <Eye size={14} className="mr-1" /> Ver documento
                  </Button>
                  {d.status === "emitido" && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => marcarPago(d.id)}>
                      <CheckCircle size={14} className="mr-1" /> Marcar como Pago
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => excluir(d.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View document dialog */}
      <Dialog open={viewDoc !== null} onOpenChange={(v) => { if (!v) setViewDoc(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Documento oficial</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="space-y-3 pt-2 text-sm">
              <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{viewDoc.tipo}</span></div>
              <div><span className="text-muted-foreground">Mês referência:</span> {viewDoc.mesReferencia}</div>
              <div><span className="text-muted-foreground">Data emissão:</span> {formatDate(viewDoc.dataEmissao)}</div>
              <div><span className="text-muted-foreground">Vencimento:</span> {formatDate(viewDoc.dataVencimento)}</div>
              <div><span className="text-muted-foreground">Valor:</span> <span className="font-semibold">{formatCurrency(viewDoc.valor)}</span></div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                <FileText size={20} className="text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{viewDoc.arquivoNome}</p>
                  <p className="text-xs text-muted-foreground">Anexado em {formatDate(viewDoc.dataAnexacao)}</p>
                </div>
              </div>
              {viewDoc.observacao && (
                <div><span className="text-muted-foreground">Observação:</span> {viewDoc.observacao}</div>
              )}
              <p className="text-xs text-muted-foreground">Preview do arquivo indisponível no MVP.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
