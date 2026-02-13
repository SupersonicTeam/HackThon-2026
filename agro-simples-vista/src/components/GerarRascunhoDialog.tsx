import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { RascunhoNFe, DraftItem } from "@/mocks/drafts";
import { ufsMock } from "@/mocks/drafts";
import { useCreateRascunho } from "@/hooks/use-dashboard";
import { toast } from "sonner";
import type { CreateRascunhoDto } from "@/services/types";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (
    draft: Omit<RascunhoNFe, "id" | "producerId" | "status" | "data">,
  ) => void;
  onSend: (
    draft: Omit<RascunhoNFe, "id" | "producerId" | "status" | "data">,
  ) => void;
}

interface ItemForm {
  descricao: string;
  codigoProduto: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  valorTotal: string;
}

const emptyItem = (): ItemForm => ({
  descricao: "",
  codigoProduto: "",
  ncm: "",
  cfop: "",
  quantidade: "",
  unidade: "UN",
  valorUnitario: "",
  valorTotal: "",
});

// Função para formatar CPF/CNPJ
const formatarCpfCnpj = (valor: string): string => {
  const numeros = valor.replace(/\D/g, "");

  if (numeros.length <= 11) {
    // Formato CPF: XXX.XXX.XXX-XX
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // Formato CNPJ: XX.XXX.XXX/XXXX-XX
    return numeros
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
};

export default function GerarRascunhoDialog({
  open,
  onOpenChange,
  onSave,
  onSend,
}: Props) {
  const [tipo, setTipo] = useState<"Entrada" | "Saída">("Saída");
  const [nomeDestinatario, setNomeDestinatario] = useState("");
  const [cpfCnpjDestinatario, setCpfCnpjDestinatario] = useState("");
  const [ufDestino, setUfDestino] = useState("");
  const [cfop, setCfop] = useState("");
  const [naturezaOperacao, setNaturezaOperacao] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([emptyItem()]);

  const createRascunhoMutation = useCreateRascunho();

  const canSubmit =
    nomeDestinatario &&
    dataEmissao &&
    valorTotal &&
    itens.some((i) => i.descricao && i.quantidade);

  const reset = () => {
    setTipo("Saída");
    setNomeDestinatario("");
    setCpfCnpjDestinatario("");
    setUfDestino("");
    setCfop("");
    setNaturezaOperacao("");
    setDataEmissao("");
    setValorTotal("");
    setObservacoes("");
    setItens([emptyItem()]);
  };

  const buildDraft = () => ({
    titulo: `Rascunho NF-e — ${tipo === "Saída" ? "Venda" : "Compra"}`,
    tipo,
    nomeDestinatario,
    cpfCnpjDestinatario: cpfCnpjDestinatario.replace(/\D/g, ""), // Remove formatação
    uf: ufDestino, // Mantém compatibilidade com tipo RascunhoNFe
    ufDestino,
    cfop,
    naturezaOperacao,
    dataEmissao,
    valorTotal,
    observacoes,
    itens: itens
      .filter((i) => i.descricao && i.quantidade)
      .map((item) => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor: item.valorTotal || item.valorUnitario, // Mantém compatibilidade com DraftItem
        // Campos adicionais que serão enviados ao backend
        codigoProduto: item.codigoProduto,
        ncm: item.ncm,
        cfop: item.cfop,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
      })),
    municipio: "", // Campo removido mas mantido para compatibilidade
    ncm: "", // Movido para os itens
  });

  const handleSave = async () => {
    try {
      const dtoData: CreateRascunhoDto = {
        produtorId: LOGGED_PRODUCER_ID,
        tipo: tipo === "Entrada" ? "entrada" : "saida",
        cfop: cfop || undefined,
        naturezaOperacao: naturezaOperacao || undefined,
        nomeDestinatario: nomeDestinatario,
        cpfCnpjDestinatario:
          cpfCnpjDestinatario.replace(/\D/g, "") || undefined,
        ufDestino: ufDestino || undefined,
        dataEmissao: dataEmissao,
        observacoes: observacoes || undefined,
        itens: itens
          .filter((i) => i.descricao && i.quantidade)
          .map((item, idx) => ({
            numeroItem: idx + 1,
            codigoProduto: item.codigoProduto || undefined,
            descricao: item.descricao,
            ncm: item.ncm || undefined,
            cfop: item.cfop || undefined,
            unidade: item.unidade || undefined,
            quantidade: parseFloat(item.quantidade),
            valorUnitario: parseFloat(item.valorUnitario) || 0,
            valorTotal: parseFloat(item.valorTotal) || 0,
          })),
      };

      await createRascunhoMutation.mutateAsync(dtoData);
      toast.success("Rascunho salvo com sucesso!");

      // Ainda chama o callback para compatibilidade
      onSave(buildDraft());
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      toast.error("Erro ao salvar rascunho. Tente novamente.");
    }
  };

  const handleSend = async () => {
    try {
      const dtoData: CreateRascunhoDto = {
        produtorId: LOGGED_PRODUCER_ID,
        tipo: tipo === "Entrada" ? "entrada" : "saida",
        cfop: cfop || undefined,
        naturezaOperacao: naturezaOperacao || undefined,
        nomeDestinatario: nomeDestinatario,
        cpfCnpjDestinatario:
          cpfCnpjDestinatario.replace(/\D/g, "") || undefined,
        ufDestino: ufDestino || undefined,
        dataEmissao: dataEmissao,
        observacoes: observacoes || undefined,
        itens: itens
          .filter((i) => i.descricao && i.quantidade)
          .map((item, idx) => ({
            numeroItem: idx + 1,
            codigoProduto: item.codigoProduto || undefined,
            descricao: item.descricao,
            ncm: item.ncm || undefined,
            cfop: item.cfop || undefined,
            unidade: item.unidade || undefined,
            quantidade: parseFloat(item.quantidade),
            valorUnitario: parseFloat(item.valorUnitario) || 0,
            valorTotal: parseFloat(item.valorTotal) || 0,
          })),
      };

      const rascunho = await createRascunhoMutation.mutateAsync(dtoData);

      // TODO: Implementar envio ao contador (endpoint separado)
      // Por enquanto, apenas cria o rascunho
      toast.success("Rascunho criado! Envio ao contador em desenvolvimento.");

      // Ainda chama o callback para compatibilidade
      onSend(buildDraft());
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao enviar rascunho:", error);
      toast.error("Erro ao criar rascunho. Tente novamente.");
    }
  };

  const updateItem = (idx: number, field: keyof ItemForm, val: string) => {
    setItens((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)),
    );
  };

  const calcularValorTotal = (idx: number) => {
    const item = itens[idx];
    if (item.quantidade && item.valorUnitario) {
      const total =
        parseFloat(item.quantidade) * parseFloat(item.valorUnitario);
      updateItem(idx, "valorTotal", total.toFixed(2));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Rascunho de NF-e</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as "Entrada" | "Saída")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Saída">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados do Destinatário */}
          <div className="space-y-1.5">
            <Label>Nome/Razão Social do Destinatário *</Label>
            <Input
              placeholder="Ex: Cooperativa Agrícola ABC Ltda"
              value={nomeDestinatario}
              onChange={(e) => setNomeDestinatario(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CPF/CNPJ do Destinatário</Label>
              <Input
                placeholder="Ex: 12.345.678/0001-00"
                value={cpfCnpjDestinatario}
                onChange={(e) => {
                  const valorFormatado = formatarCpfCnpj(e.target.value);
                  setCpfCnpjDestinatario(valorFormatado);
                }}
                maxLength={18}
              />
            </div>
            <div className="space-y-1.5">
              <Label>UF Destino</Label>
              <Select value={ufDestino} onValueChange={setUfDestino}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ufsMock.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dados da Operação */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CFOP</Label>
              <Input
                placeholder="Ex: 5102"
                value={cfop}
                onChange={(e) => setCfop(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Emissão *</Label>
              <Input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Natureza da Operação</Label>
            <Input
              placeholder="Ex: Venda de produtos agrícolas"
              value={naturezaOperacao}
              onChange={(e) => setNaturezaOperacao(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Valor Total (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
            />
          </div>

          {/* Itens */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Itens da Nota</Label>
            {itens.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-3 space-y-2 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item {idx + 1}
                  </span>
                  {itens.length > 1 && (
                    <button
                      className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive rounded"
                      onClick={() =>
                        setItens((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Descrição do produto *"
                    className="h-9"
                    value={item.descricao}
                    onChange={(e) =>
                      updateItem(idx, "descricao", e.target.value)
                    }
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Código do produto"
                      className="h-9"
                      value={item.codigoProduto}
                      onChange={(e) =>
                        updateItem(idx, "codigoProduto", e.target.value)
                      }
                    />
                    <Input
                      placeholder="NCM"
                      className="h-9"
                      value={item.ncm}
                      onChange={(e) => updateItem(idx, "ncm", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Quantidade *"
                      type="number"
                      step="0.01"
                      className="h-9"
                      value={item.quantidade}
                      onChange={(e) => {
                        updateItem(idx, "quantidade", e.target.value);
                        calcularValorTotal(idx);
                      }}
                    />
                    <Input
                      placeholder="Unidade"
                      className="h-9"
                      value={item.unidade}
                      onChange={(e) =>
                        updateItem(idx, "unidade", e.target.value)
                      }
                    />
                    <Input
                      placeholder="CFOP"
                      className="h-9"
                      value={item.cfop}
                      onChange={(e) => updateItem(idx, "cfop", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Valor unitário *"
                      type="number"
                      step="0.01"
                      className="h-9"
                      value={item.valorUnitario}
                      onChange={(e) => {
                        updateItem(idx, "valorUnitario", e.target.value);
                        calcularValorTotal(idx);
                      }}
                    />
                    <Input
                      placeholder="Valor total"
                      type="number"
                      step="0.01"
                      className="h-9 bg-muted"
                      value={item.valorTotal}
                      onChange={(e) =>
                        updateItem(idx, "valorTotal", e.target.value)
                      }
                      readOnly={!!item.quantidade && !!item.valorUnitario}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setItens((prev) => [...prev, emptyItem()])}
            >
              <Plus size={14} className="mr-1" /> Adicionar item
            </Button>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre a nota fiscal..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!canSubmit || createRascunhoMutation.isPending}
          >
            {createRascunhoMutation.isPending
              ? "Salvando..."
              : "Salvar rascunho"}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSubmit || createRascunhoMutation.isPending}
          >
            {createRascunhoMutation.isPending
              ? "Criando..."
              : "Enviar ao contador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
