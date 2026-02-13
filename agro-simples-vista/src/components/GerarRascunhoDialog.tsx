import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { RascunhoNFe, DraftItem } from "@/mocks/drafts";
import { ufsMock, municipiosPorUf } from "@/mocks/drafts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (draft: Omit<RascunhoNFe, "id" | "producerId" | "status" | "data">) => void;
  onSend: (draft: Omit<RascunhoNFe, "id" | "producerId" | "status" | "data">) => void;
}

const emptyItem = (): DraftItem => ({ descricao: "", quantidade: "", unidade: "UN", valor: "" });

export default function GerarRascunhoDialog({ open, onOpenChange, onSave, onSend }: Props) {
  const [tipo, setTipo] = useState<"Entrada" | "Saída">("Saída");
  const [uf, setUf] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [ncm, setNcm] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [itens, setItens] = useState<DraftItem[]>([emptyItem()]);

  const municipios = uf ? (municipiosPorUf[uf] || []) : [];
  const canSubmit = uf && municipio && valorTotal;

  const reset = () => {
    setTipo("Saída");
    setUf("");
    setMunicipio("");
    setNcm("");
    setValorTotal("");
    setItens([emptyItem()]);
  };

  const buildDraft = () => ({
    titulo: `Rascunho NF-e — ${tipo === "Saída" ? "Venda" : "Compra"}`,
    tipo,
    uf,
    municipio,
    ncm,
    valorTotal,
    itens: itens.filter((i) => i.quantidade || i.descricao),
  });

  const handleSave = () => {
    onSave(buildDraft());
    reset();
    onOpenChange(false);
  };

  const handleSend = () => {
    onSend(buildDraft());
    reset();
    onOpenChange(false);
  };

  const updateItem = (idx: number, field: keyof DraftItem, val: string) =>
    setItens((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Rascunho de NF-e</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "Entrada" | "Saída")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Saída">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>UF *</Label>
              <Select value={uf} onValueChange={(v) => { setUf(v); setMunicipio(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ufsMock.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Município *</Label>
              <Select value={municipio} onValueChange={setMunicipio} disabled={!uf}>
                <SelectTrigger><SelectValue placeholder={uf ? "Selecione" : "Escolha UF"} /></SelectTrigger>
                <SelectContent>
                  {municipios.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>NCM (opcional)</Label>
              <Input placeholder="Ex: 12019000" value={ncm} onChange={(e) => setNcm(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor total (R$) *</Label>
              <Input type="number" placeholder="0,00" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
            </div>
          </div>

          {/* Itens */}
          <div className="space-y-2">
            <Label>Itens</Label>
            {itens.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_60px_50px_80px_32px] gap-1.5 items-end">
                <Input placeholder="Descrição" className="h-8 text-sm" value={item.descricao} onChange={(e) => updateItem(idx, "descricao", e.target.value)} />
                <Input placeholder="Qtd" type="number" className="h-8 text-sm" value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", e.target.value)} />
                <Input placeholder="UN" className="h-8 text-sm" value={item.unidade} onChange={(e) => updateItem(idx, "unidade", e.target.value)} />
                <Input placeholder="Valor" type="number" className="h-8 text-sm" value={item.valor} onChange={(e) => updateItem(idx, "valor", e.target.value)} />
                {itens.length > 1 && (
                  <button className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive" onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full" onClick={() => setItens((prev) => [...prev, emptyItem()])}>
              <Plus size={14} className="mr-1" /> Adicionar item
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleSave} disabled={!canSubmit}>Salvar rascunho</Button>
          <Button onClick={handleSend} disabled={!canSubmit}>Enviar ao contador</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
