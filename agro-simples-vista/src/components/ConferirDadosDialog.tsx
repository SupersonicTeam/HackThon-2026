import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Image, Sparkles, Save, CheckCircle, Plus, AlertTriangle, Download, Eye } from "lucide-react";
import { tiposDocumento } from "@/mocks";
import { useContador, DocumentoAnexado } from "@/hooks/use-contador";

interface SolicitacaoBase {
  id: string | number;
  titulo: string;
  categoria: string;
  prazo: string;
  observacao?: string;
  arquivoNome?: string;
}

interface Props {
  solicitacao: SolicitacaoBase | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (id: string | number, data: Record<string, string>) => void;
  onApprove: (id: string | number) => void;
}

// ── NF-e types ──
interface ProdutoNFe {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  cst: string;
  un: string;
  quantidade: string;
  valorUnitario: string;
  valorTotal: string;
}

interface DadosGeraisNFe {
  chaveAcesso: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  uf: string;
  municipio: string;
  natureza: string;
  valorTotalNota: string;
  valorTotalProdutos: string;
  frete: string;
  desconto: string;
  outrasDespesas: string;
}

interface TributosNFe {
  cfop: string;
  cstIcms: string;
  baseIcms: string;
  valorIcms: string;
  baseSt: string;
  valorSt: string;
  pisAliquota: string;
  pisValor: string;
  cofinsAliquota: string;
  cofinsValor: string;
  ipiAliquota: string;
  ipiValor: string;
  totalTributos: string;
}

interface TransporteNFe {
  transportadora: string;
  placa: string;
  ufPlaca: string;
  pesoBruto: string;
  pesoLiquido: string;
}

// ── Mock NF-e data (simulating AI extraction) ──
const nfeMockDadosGerais: DadosGeraisNFe = {
  chaveAcesso: "5123010350741500578558900026805611131092342",
  numero: "2680561",
  serie: "890",
  dataEmissao: "2023-01-26",
  uf: "MT",
  municipio: "Sapezal",
  natureza: "35 - SAÍDA COM DIFERIMENTO",
  valorTotalNota: "60478.50",
  valorTotalProdutos: "60478.50",
  frete: "0.00",
  desconto: "0.00",
  outrasDespesas: "0.00",
};

const nfeMockTributos: TributosNFe = {
  cfop: "5101",
  cstIcms: "051",
  baseIcms: "60478.50",
  valorIcms: "0.00",
  baseSt: "0.00",
  valorSt: "0.00",
  pisAliquota: "0.65",
  pisValor: "0.00",
  cofinsAliquota: "3.00",
  cofinsValor: "0.00",
  ipiAliquota: "",
  ipiValor: "",
  totalTributos: "0.00",
};

const nfeMockProdutos: ProdutoNFe[] = [
  {
    codigo: "0001",
    descricao: "Soja em grãos - Preço FOB",
    ncm: "12019000",
    cfop: "5101",
    cst: "051",
    un: "KG",
    quantidade: "40319.00",
    valorUnitario: "1.50",
    valorTotal: "60478.50",
  },
];

const nfeMockTransporte: TransporteNFe = {
  transportadora: "Transportes Sapezal Ltda",
  placa: "ABC-1D23",
  ufPlaca: "MT",
  pesoBruto: "41000.00",
  pesoLiquido: "40319.00",
};

// Simple generic mock for non-NF-e docs
const genericSuggested: Record<string, { tipo: string; data: string; valor: string; uf: string; municipio: string; ncm: string; observacao: string }> = {
  "3": { tipo: "Salário", data: "2026-01-31", valor: "8500", uf: "PR", municipio: "Londrina", ncm: "", observacao: "Folha de pagamento referente a janeiro/2026" },
};

const cstOptions = ["000", "010", "020", "030", "040", "041", "050", "051", "060", "070", "090"];

function isNFeCategoria(cat: string) {
  const lower = cat.toLowerCase();
  return lower.includes("nota") && (lower.includes("venda") || lower.includes("compra") || lower.includes("fiscal"));
}

const fmt = (v: string) => {
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function ConferirDadosDialog({ solicitacao, open, onOpenChange, onSave, onApprove }: Props) {
  const { listarDocumentos } = useContador();
  
  // Generic fields
  const [tipo, setTipo] = useState("");
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [uf, setUf] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [ncm, setNcm] = useState("");
  const [observacao, setObservacao] = useState("");

  // Documentos anexados
  const [documentos, setDocumentos] = useState<DocumentoAnexado[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // NF-e fields
  const [dadosGerais, setDadosGerais] = useState<DadosGeraisNFe>({ ...nfeMockDadosGerais });
  const [tributos, setTributos] = useState<TributosNFe>({ ...nfeMockTributos });
  const [produtos, setProdutos] = useState<ProdutoNFe[]>([...nfeMockProdutos]);
  const [transporte, setTransporte] = useState<TransporteNFe>({ ...nfeMockTransporte });

  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [validationError, setValidationError] = useState("");

  const isNFe = useMemo(() => solicitacao ? isNFeCategoria(solicitacao.categoria) : false, [solicitacao]);

  useEffect(() => {
    if (!solicitacao) return;
    setValidationError("");

    // Carregar documentos anexados
    if (open && solicitacao.id) {
      setLoadingDocs(true);
      listarDocumentos(String(solicitacao.id))
        .then((docs) => {
          setDocumentos(docs);
          
          // Se há documentos com dados extraídos, usa-os para preencher o formulário
          const docComDados = docs.find((d: any) => d.dadosExtraidos);
          if (docComDados && docComDados.dadosExtraidos) {
            const dados = docComDados.dadosExtraidos as any;
            
            if (isNFe) {
              // Se for NF-e e os dados extraídos contêm informações de nota fiscal
              if (dados.chaveAcesso || dados.numero || dados.valorTotal) {
                setDadosGerais({
                  chaveAcesso: dados.chaveAcesso || "",
                  numero: dados.numeroNota || dados.numero || "",
                  serie: dados.serie || "",
                  dataEmissao: dados.dataReferencia || dados.dataEmissao || "",
                  uf: dados.destino || "",
                  municipio: "",
                  natureza: dados.naturezaOperacao || "",
                  valorTotalNota: String(dados.valorTotal || dados.valor || 0),
                  valorTotalProdutos: String(dados.valorProdutos || dados.valor || 0),
                  frete: String(dados.valorFrete || 0),
                  desconto: String(dados.valorDesconto || 0),
                  outrasDespesas: String(dados.valorOutros || 0),
                });
                
                setTributos({
                  cfop: dados.cfop || "",
                  cstIcms: "",
                  baseIcms: String(dados.valorProdutos || 0),
                  valorIcms: String(dados.valorIcms || 0),
                  baseSt: "0.00",
                  valorSt: "0.00",
                  pisAliquota: "",
                  pisValor: String(dados.valorCbs || 0),
                  cofinsAliquota: "",
                  cofinsValor: String(dados.valorIbs || 0),
                  ipiAliquota: "",
                  ipiValor: String(dados.valorIpi || 0),
                  totalTributos: String((dados.valorCbs || 0) + (dados.valorIbs || 0) + (dados.valorIcms || 0) + (dados.valorIpi || 0) + (dados.valorFunrural || 0)),
                });
                
                if (dados.itens && Array.isArray(dados.itens)) {
                  setProdutos(dados.itens.map((item: any) => ({
                    codigo: item.codigoProduto || "",
                    descricao: item.descricao || "",
                    ncm: item.ncm || "",
                    cfop: item.cfop || "",
                    cst: "",
                    un: item.unidade || "",
                    quantidade: String(item.quantidade || 0),
                    valorUnitario: String(item.valorUnitario || 0),
                    valorTotal: String(item.valorTotal || 0),
                  })));
                } else {
                  setProdutos([...nfeMockProdutos]);
                }
                
                setTransporte({ ...nfeMockTransporte });
                setHasSuggestion(true);
              } else {
                // Fallback para mock se não tiver dados completos
                setDadosGerais({ ...nfeMockDadosGerais });
                setTributos({ ...nfeMockTributos });
                setProdutos([...nfeMockProdutos]);
                setTransporte({ ...nfeMockTransporte });
                setHasSuggestion(true);
              }
            } else {
              // Documento genérico
              setTipo(solicitacao.categoria || "");
              setData(dados.dataReferencia || solicitacao.prazo || "");
              setValor(String(dados.valor || ""));
              setUf("");
              setMunicipio("");
              setNcm("");
              setObservacao(dados.observacao || solicitacao.observacao || "");
              setHasSuggestion(true);
            }
          } else {
            // Não há dados extraídos, usa mock/sugestões
            if (isNFe) {
              setDadosGerais({ ...nfeMockDadosGerais });
              setTributos({ ...nfeMockTributos });
              setProdutos([...nfeMockProdutos]);
              setTransporte({ ...nfeMockTransporte });
              setHasSuggestion(true);
            } else {
              const suggested = genericSuggested[String(solicitacao.id)];
              if (suggested) {
                setTipo(suggested.tipo);
                setData(suggested.data);
                setValor(suggested.valor);
                setUf(suggested.uf);
                setMunicipio(suggested.municipio);
                setNcm(suggested.ncm);
                setObservacao(suggested.observacao);
                setHasSuggestion(true);
              } else {
                setTipo(solicitacao.categoria || "");
                setData(solicitacao.prazo || "");
                setValor("");
                setUf("");
                setMunicipio("");
                setNcm("");
                setObservacao(solicitacao.observacao || "");
                setHasSuggestion(false);
              }
            }
          }
        })
        .catch(() => {
          setDocumentos([]);
          // Fallback para dados padrão
          if (isNFe) {
            setDadosGerais({ ...nfeMockDadosGerais });
            setTributos({ ...nfeMockTributos });
            setProdutos([...nfeMockProdutos]);
            setTransporte({ ...nfeMockTransporte });
          }
        })
        .finally(() => setLoadingDocs(false));
    }
  }, [solicitacao, isNFe, open, listarDocumentos]);

  // Validation for NF-e (must be before early return)
  const missingNFeFields = useMemo(() => {
    if (!isNFe) return [];
    const missing: string[] = [];
    if (!dadosGerais.chaveAcesso.trim()) missing.push("chaveAcesso");
    if (!dadosGerais.numero.trim()) missing.push("numero");
    if (!dadosGerais.dataEmissao.trim()) missing.push("dataEmissao");
    if (!dadosGerais.valorTotalNota.trim()) missing.push("valorTotalNota");
    return missing;
  }, [isNFe, dadosGerais]);

  const canApprove = isNFe ? missingNFeFields.length === 0 : true;

  if (!solicitacao) return null;

  const isPdf = solicitacao.arquivoNome?.toLowerCase().endsWith(".pdf");

  const updateDG = (field: keyof DadosGeraisNFe, val: string) =>
    setDadosGerais((prev) => ({ ...prev, [field]: val }));
  const updateTrib = (field: keyof TributosNFe, val: string) =>
    setTributos((prev) => ({ ...prev, [field]: val }));
  const updateTransp = (field: keyof TransporteNFe, val: string) =>
    setTransporte((prev) => ({ ...prev, [field]: val }));
  const updateProduto = (idx: number, field: keyof ProdutoNFe, val: string) =>
    setProdutos((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));
  const addProduto = () =>
    setProdutos((prev) => [...prev, { codigo: "", descricao: "", ncm: "", cfop: "", cst: "", un: "", quantidade: "", valorUnitario: "", valorTotal: "" }]);

  const handleSave = () => {
    if (isNFe) {
      onSave(solicitacao.id, { tipo: "Nota Fiscal", observacao: "", ...dadosGerais });
    } else {
      onSave(solicitacao.id, { tipo, data, valor, uf, municipio, ncm, observacao });
    }
  };

  const handleApprove = () => {
    if (!canApprove) {
      setValidationError("Preencha os campos obrigatórios: Chave de acesso, Número, Data de emissão e Valor total.");
      return;
    }
    setValidationError("");
    onApprove(solicitacao.id);
    onOpenChange(false);
  };

  const fieldError = (field: string) => missingNFeFields.includes(field) && validationError;

  // ── Preview section with attached documents ──
  const previewSection = (
    <div className="space-y-3">
      {/* Documentos anexados pelo produtor */}
      {documentos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Documentos Anexados ({documentos.length})
          </h3>
          <div className="space-y-2">
            {documentos.map((doc) => {
              const isPdf = doc.nomeArquivo.toLowerCase().endsWith('.pdf');
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.nomeArquivo);
              
              return (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                  {isPdf ? (
                    <FileText size={24} className="text-red-500 shrink-0" />
                  ) : isImage ? (
                    <Image size={24} className="text-primary shrink-0" />
                  ) : (
                    <FileText size={24} className="text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.nomeArquivo}</p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.tamanho / 1024).toFixed(0)} KB · {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => {
                      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/contador/documentos/${doc.id}/download`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Download size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {loadingDocs && (
        <p className="text-xs text-muted-foreground text-center py-2">Carregando documentos...</p>
      )}
      
      {!loadingDocs && documentos.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum documento anexado ainda.</p>
      )}
    </div>
  );

  // ── NF-e Form ──
  const nfeForm = (
    <div className="space-y-3">
      {hasSuggestion && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-500/10 rounded-md px-3 py-2">
          <Sparkles size={14} className="shrink-0" />
          Dados sugeridos pela IA — confira antes de aprovar
        </div>
      )}

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="geral" className="text-[10px] sm:text-xs px-1 py-1.5">Dados gerais</TabsTrigger>
          <TabsTrigger value="tributos" className="text-[10px] sm:text-xs px-1 py-1.5">Tributos</TabsTrigger>
          <TabsTrigger value="produtos" className="text-[10px] sm:text-xs px-1 py-1.5">Produtos</TabsTrigger>
          <TabsTrigger value="transporte" className="text-[10px] sm:text-xs px-1 py-1.5">Transporte</TabsTrigger>
        </TabsList>

        {/* ── Dados Gerais ── */}
        <TabsContent value="geral" className="space-y-2.5 mt-3">
          <Field label="Chave de acesso *" error={fieldError("chaveAcesso")}>
            <Input className="h-8 text-xs font-mono" value={dadosGerais.chaveAcesso} onChange={(e) => updateDG("chaveAcesso", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Número da NF *" error={fieldError("numero")}>
              <Input className="h-8 text-sm" value={dadosGerais.numero} onChange={(e) => updateDG("numero", e.target.value)} />
            </Field>
            <Field label="Série">
              <Input className="h-8 text-sm" value={dadosGerais.serie} onChange={(e) => updateDG("serie", e.target.value)} />
            </Field>
          </div>
          <Field label="Data de emissão *" error={fieldError("dataEmissao")}>
            <Input type="date" className="h-8 text-sm" value={dadosGerais.dataEmissao} onChange={(e) => updateDG("dataEmissao", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="UF">
              <Input className="h-8 text-sm" maxLength={2} value={dadosGerais.uf} onChange={(e) => updateDG("uf", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Município">
              <Input className="h-8 text-sm" value={dadosGerais.municipio} onChange={(e) => updateDG("municipio", e.target.value)} />
            </Field>
          </div>
          <Field label="Natureza da operação">
            <Input className="h-8 text-sm" value={dadosGerais.natureza} onChange={(e) => updateDG("natureza", e.target.value)} />
          </Field>
          <Field label="Valor total da nota *" error={fieldError("valorTotalNota")}>
            <Input className="h-8 text-sm" value={dadosGerais.valorTotalNota} onChange={(e) => updateDG("valorTotalNota", e.target.value)} />
          </Field>
          <Field label="Valor total dos produtos">
            <Input className="h-8 text-sm" value={dadosGerais.valorTotalProdutos} onChange={(e) => updateDG("valorTotalProdutos", e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Frete">
              <Input className="h-8 text-sm" value={dadosGerais.frete} onChange={(e) => updateDG("frete", e.target.value)} />
            </Field>
            <Field label="Desconto">
              <Input className="h-8 text-sm" value={dadosGerais.desconto} onChange={(e) => updateDG("desconto", e.target.value)} />
            </Field>
            <Field label="Outras desp.">
              <Input className="h-8 text-sm" value={dadosGerais.outrasDespesas} onChange={(e) => updateDG("outrasDespesas", e.target.value)} />
            </Field>
          </div>
        </TabsContent>

        {/* ── Tributos ── */}
        <TabsContent value="tributos" className="space-y-2.5 mt-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="CFOP">
              <Input className="h-8 text-sm" value={tributos.cfop} onChange={(e) => updateTrib("cfop", e.target.value)} />
            </Field>
            <Field label="CST (ICMS)">
              <Select value={tributos.cstIcms} onValueChange={(v) => updateTrib("cstIcms", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {cstOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Base de cálculo ICMS">
              <Input className="h-8 text-sm" value={tributos.baseIcms} onChange={(e) => updateTrib("baseIcms", e.target.value)} />
            </Field>
            <Field label="Valor ICMS">
              <Input className="h-8 text-sm" value={tributos.valorIcms} onChange={(e) => updateTrib("valorIcms", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Base ICMS ST">
              <Input className="h-8 text-sm" value={tributos.baseSt} onChange={(e) => updateTrib("baseSt", e.target.value)} />
            </Field>
            <Field label="Valor ICMS ST">
              <Input className="h-8 text-sm" value={tributos.valorSt} onChange={(e) => updateTrib("valorSt", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="PIS alíquota (%)">
              <Input className="h-8 text-sm" value={tributos.pisAliquota} onChange={(e) => updateTrib("pisAliquota", e.target.value)} />
            </Field>
            <Field label="PIS valor">
              <Input className="h-8 text-sm" value={tributos.pisValor} onChange={(e) => updateTrib("pisValor", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="COFINS alíquota (%)">
              <Input className="h-8 text-sm" value={tributos.cofinsAliquota} onChange={(e) => updateTrib("cofinsAliquota", e.target.value)} />
            </Field>
            <Field label="COFINS valor">
              <Input className="h-8 text-sm" value={tributos.cofinsValor} onChange={(e) => updateTrib("cofinsValor", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="IPI alíquota (%)">
              <Input className="h-8 text-sm" placeholder="Se aplicável" value={tributos.ipiAliquota} onChange={(e) => updateTrib("ipiAliquota", e.target.value)} />
            </Field>
            <Field label="IPI valor">
              <Input className="h-8 text-sm" placeholder="—" value={tributos.ipiValor} onChange={(e) => updateTrib("ipiValor", e.target.value)} />
            </Field>
          </div>
          <Field label="Total de tributos estimado">
            <Input className="h-8 text-sm font-semibold" value={tributos.totalTributos} onChange={(e) => updateTrib("totalTributos", e.target.value)} />
          </Field>
        </TabsContent>

        {/* ── Produtos ── */}
        <TabsContent value="produtos" className="mt-3">
          <div className="overflow-x-auto -mx-1">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Código</TableHead>
                  <TableHead className="min-w-[140px]">Descrição</TableHead>
                  <TableHead className="w-24">NCM</TableHead>
                  <TableHead className="w-16">CFOP</TableHead>
                  <TableHead className="w-16">CST</TableHead>
                  <TableHead className="w-14">UN</TableHead>
                  <TableHead className="w-20">Qtd</TableHead>
                  <TableHead className="w-20">Vl. unit.</TableHead>
                  <TableHead className="w-24">Vl. total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.codigo} onChange={(e) => updateProduto(idx, "codigo", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.descricao} onChange={(e) => updateProduto(idx, "descricao", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.ncm} onChange={(e) => updateProduto(idx, "ncm", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.cfop} onChange={(e) => updateProduto(idx, "cfop", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.cst} onChange={(e) => updateProduto(idx, "cst", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.un} onChange={(e) => updateProduto(idx, "un", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.quantidade} onChange={(e) => updateProduto(idx, "quantidade", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1" value={p.valorUnitario} onChange={(e) => updateProduto(idx, "valorUnitario", e.target.value)} /></TableCell>
                    <TableCell><Input className="h-7 text-xs px-1 font-medium" value={p.valorTotal} onChange={(e) => updateProduto(idx, "valorTotal", e.target.value)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button size="sm" variant="outline" className="mt-2 w-full" onClick={addProduto}>
            <Plus size={14} className="mr-1" /> Adicionar item
          </Button>
        </TabsContent>

        {/* ── Transporte ── */}
        <TabsContent value="transporte" className="space-y-2.5 mt-3">
          <Field label="Transportadora">
            <Input className="h-8 text-sm" value={transporte.transportadora} onChange={(e) => updateTransp("transportadora", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Placa">
              <Input className="h-8 text-sm" value={transporte.placa} onChange={(e) => updateTransp("placa", e.target.value)} />
            </Field>
            <Field label="UF placa">
              <Input className="h-8 text-sm" maxLength={2} value={transporte.ufPlaca} onChange={(e) => updateTransp("ufPlaca", e.target.value.toUpperCase())} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Peso bruto (kg)">
              <Input className="h-8 text-sm" value={transporte.pesoBruto} onChange={(e) => updateTransp("pesoBruto", e.target.value)} />
            </Field>
            <Field label="Peso líquido (kg)">
              <Input className="h-8 text-sm" value={transporte.pesoLiquido} onChange={(e) => updateTransp("pesoLiquido", e.target.value)} />
            </Field>
          </div>
        </TabsContent>
      </Tabs>

      {/* Validation message */}
      {validationError && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertTriangle size={12} /> {validationError}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={handleSave}>
          <Save size={14} className="mr-1" /> Salvar alterações
        </Button>
        <Button className="flex-1" onClick={handleApprove} disabled={false}>
          <CheckCircle size={14} className="mr-1" /> Aprovar e concluir
        </Button>
      </div>
    </div>
  );

  // ── Generic (non-NF-e) form ──
  const genericForm = (
    <div className="space-y-3">
      {hasSuggestion && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-500/10 rounded-md px-3 py-2">
          <Sparkles size={14} className="shrink-0" />
          Dados sugeridos pela IA — confira antes de aprovar
        </div>
      )}

      <Field label="Tipo do documento">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {tiposDocumento.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Data do documento">
        <Input type="date" className="h-9 text-sm" value={data} onChange={(e) => setData(e.target.value)} />
      </Field>
      <Field label="Valor (R$)">
        <Input type="number" className="h-9 text-sm" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="UF">
          <Input className="h-9 text-sm" placeholder="PR" maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} />
        </Field>
        <Field label="Município">
          <Input className="h-9 text-sm" placeholder="Londrina" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
        </Field>
      </div>
      <Field label="NCM (quando aplicável)">
        <Input className="h-9 text-sm" placeholder="Ex: 12010090" value={ncm} onChange={(e) => setNcm(e.target.value)} />
      </Field>
      <Field label="Observação">
        <Textarea className="text-sm" rows={2} placeholder="Notas adicionais..." value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </Field>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={handleSave}>
          <Save size={14} className="mr-1" /> Salvar alterações
        </Button>
        <Button className="flex-1" onClick={handleApprove}>
          <CheckCircle size={14} className="mr-1" /> Aprovar e concluir
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
          <DialogTitle className="font-heading text-lg">Conferir / Editar dados</DialogTitle>
          <p className="text-xs text-muted-foreground">{solicitacao.titulo} · {solicitacao.mesReferencia}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-4 px-4 pb-4 sm:px-6 sm:pb-6">
          {/* LEFT — Preview */}
          <div className="mb-4 sm:mb-0">{previewSection}</div>
          {/* RIGHT — Form */}
          {isNFe ? nfeForm : genericForm}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Reusable field wrapper ──
function Field({ label, error, children }: { label: string; error?: string | false; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className={error ? "ring-1 ring-destructive rounded-md" : ""}>{children}</div>
    </div>
  );
}
