import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calculator, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface SimResult {
  base: number;
  cbs: number;
  ibsEstadual: number;
  ibsMunicipal: number;
  total: number;
}

function fmtCur(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const UF_LIST = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const CST_LIST = ["00 - Tributação normal","10 - Com transferência de crédito","20 - Alíquota zero","30 - Isenta","40 - Suspensão","50 - Diferimento","90 - Outros"];
const CLASSIF_LIST = ["Operação padrão","Operação com alíquota reduzida","Regime específico","Imune / Isenta"];
const UNIDADE_LIST = ["UN","KG","TON","LT","M²","M³","SC","CX"];

const MUNICIPIOS_POR_UF: Record<string, string[]> = {
  PR: ["Cascavel", "Toledo", "Londrina", "Maringá", "Curitiba", "Ponta Grossa", "Foz do Iguaçu", "Guarapuava", "Paranaguá", "Umuarama"],
  SP: ["São Paulo", "Campinas", "Ribeirão Preto", "Sorocaba", "Santos", "Piracicaba", "Bauru", "Marília"],
  MG: ["Belo Horizonte", "Uberlândia", "Uberaba", "Montes Claros", "Juiz de Fora", "Poços de Caldas"],
  GO: ["Goiânia", "Anápolis", "Rio Verde", "Jataí", "Catalão", "Itumbiara"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Ponta Porã", "Naviraí"],
  MT: ["Cuiabá", "Rondonópolis", "Sinop", "Sorriso", "Lucas do Rio Verde", "Primavera do Leste"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Santa Maria", "Passo Fundo", "Erechim"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "Chapecó", "Criciúma", "Lages"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Barreiras", "Luís Eduardo Magalhães"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional"],
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function SimuladorTributos({ open, onOpenChange }: Props) {
  const [dataFato, setDataFato] = useState<Date | undefined>();
  const [tipoOp, setTipoOp] = useState<"bem" | "servico">("bem");
  const [uf, setUf] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [municipioOpen, setMunicipioOpen] = useState(false);
  const [ncm, setNcm] = useState("");
  const [cst, setCst] = useState("");
  const [classif, setClassif] = useState("");
  const [baseCalc, setBaseCalc] = useState("");
  const [qtd, setQtd] = useState("1");
  const [unidade, setUnidade] = useState("UN");
  const [result, setResult] = useState<SimResult | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const CBS_RATE = 0.009;
  const IBS_EST_RATE = 0.001;
  const IBS_MUN_RATE = 0.0;

  const municipiosDisponiveis = useMemo(() => {
    if (!uf) return [];
    return MUNICIPIOS_POR_UF[uf] || ["Capital (mock)"];
  }, [uf]);

  const handleClear = () => {
    setDataFato(undefined);
    setTipoOp("bem");
    setUf("");
    setMunicipio("");
    setNcm("");
    setCst("");
    setClassif("");
    setBaseCalc("");
    setQtd("1");
    setUnidade("UN");
    setResult(null);
    setErrors(new Set());
  };

  const handleCalc = () => {
    const missing = new Set<string>();
    if (!dataFato) missing.add("dataFato");
    if (!uf) missing.add("uf");
    if (!municipio) missing.add("municipio");
    if (!cst) missing.add("cst");
    if (!classif) missing.add("classif");
    if (!baseCalc) missing.add("baseCalc");
    if (!unidade) missing.add("unidade");

    if (missing.size > 0) {
      setErrors(missing);
      return;
    }
    setErrors(new Set());
    const base = parseFloat(baseCalc.replace(/\./g, "").replace(",", ".")) || 0;
    const q = parseInt(qtd) || 1;
    const totalBase = base * q;
    const cbs = totalBase * CBS_RATE;
    const ibsE = totalBase * IBS_EST_RATE;
    const ibsM = totalBase * IBS_MUN_RATE;
    setResult({ base: totalBase, cbs, ibsEstadual: ibsE, ibsMunicipal: ibsM, total: cbs + ibsE + ibsM });
  };

  // Reset município when UF changes
  const handleUfChange = (newUf: string) => {
    setUf(newUf);
    setMunicipio("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator size={20} className="text-primary" />
            Simulador de Tributos
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Calculadora manual inspirada no modelo do governo (CBS + IBS)
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Card A — Operação */}
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm font-semibold">Operação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3 sm:px-6">
              {/* Data */}
              <div className="space-y-1">
                <Label className="text-xs">Data do fato gerador</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !dataFato && "text-muted-foreground", errors.has("dataFato") && "ring-2 ring-destructive")}>
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {dataFato ? format(dataFato, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataFato} onSelect={setDataFato} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipo */}
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <RadioGroup value={tipoOp} onValueChange={(v) => setTipoOp(v as "bem" | "servico")} className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="bem" id="bem" />
                    <Label htmlFor="bem" className="text-sm cursor-pointer">Bem</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="servico" id="servico" />
                    <Label htmlFor="servico" className="text-sm cursor-pointer">Serviço</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* UF + Município */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">UF</Label>
                  <Select value={uf} onValueChange={handleUfChange}>
                    <SelectTrigger className={cn(errors.has("uf") && "ring-2 ring-destructive")}><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {UF_LIST.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Município</Label>
                  <Popover open={municipioOpen} onOpenChange={setMunicipioOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={municipioOpen}
                        className={cn("w-full justify-between font-normal text-sm", errors.has("municipio") && "ring-2 ring-destructive")}
                        disabled={!uf}
                      >
                        <span className="truncate">{municipio || (uf ? "Selecionar município" : "Selecione UF primeiro")}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar município..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
                          <CommandGroup>
                            {municipiosDisponiveis.map((m) => (
                              <CommandItem
                                key={m}
                                value={m}
                                onSelect={() => {
                                  setMunicipio(m);
                                  setMunicipioOpen(false);
                                }}
                              >
                                {m}
                                <Check className={cn("ml-auto h-4 w-4", municipio === m ? "opacity-100" : "opacity-0")} />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* NCM (só para Bem) */}
              {tipoOp === "bem" && (
                <div className="space-y-1">
                  <Label className="text-xs">NCM</Label>
                  <Input placeholder="Ex: 12019000" value={ncm} onChange={(e) => setNcm(e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card B — Tributação */}
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm font-semibold">Tributação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3 sm:px-6">
              <div className="space-y-1">
                <Label className="text-xs">CST</Label>
                <Select value={cst} onValueChange={setCst}>
                  <SelectTrigger className={cn(errors.has("cst") && "ring-2 ring-destructive")}><SelectValue placeholder="Selecionar CST" /></SelectTrigger>
                  <SelectContent>
                    {CST_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Classificação tributária</Label>
                <Select value={classif} onValueChange={setClassif}>
                  <SelectTrigger className={cn(errors.has("classif") && "ring-2 ring-destructive")}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {CLASSIF_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Valor da base de cálculo (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={baseCalc}
                  inputMode="numeric"
                  className={cn("text-right", errors.has("baseCalc") && "ring-2 ring-destructive")}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (!raw) { setBaseCalc(""); return; }
                    const cents = parseInt(raw, 10);
                    const formatted = (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    setBaseCalc(formatted);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade</Label>
                  <Input type="number" min="1" value={qtd} onChange={(e) => setQtd(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidade de medida</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger className={cn(errors.has("unidade") && "ring-2 ring-destructive")}><SelectValue placeholder="UN" /></SelectTrigger>
                    <SelectContent>
                      {UNIDADE_LIST.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <Button onClick={handleCalc} className="flex-1">
            <Calculator size={16} className="mr-2" />
            Gerar cálculo
          </Button>
          <Button variant="ghost" onClick={handleClear}>
            <Trash2 size={16} className="mr-2" />
            Limpar
          </Button>
        </div>

        {/* Resultado */}
        {result && (
          <div className="space-y-3 mt-2">
            <Separator />
            <p className="text-sm font-semibold text-foreground">Resultado da simulação</p>

            {/* Desktop: table / Mobile: stacked cards */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Tributo</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Alíquota</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "CBS", rate: CBS_RATE, value: result.cbs },
                    { label: "IBS Estadual", rate: IBS_EST_RATE, value: result.ibsEstadual },
                    { label: "IBS Municipal", rate: IBS_MUN_RATE, value: result.ibsMunicipal },
                  ].map((t) => (
                    <tr key={t.label} className="border-b last:border-0">
                      <td className="py-2 text-foreground">{t.label}</td>
                      <td className="py-2 text-right text-muted-foreground">{(t.rate * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right font-medium text-foreground">{fmtCur(t.value)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold border-t">
                    <td className="py-2 text-foreground">Total</td>
                    <td className="py-2 text-right text-muted-foreground">{((CBS_RATE + IBS_EST_RATE + IBS_MUN_RATE) * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right text-primary">{fmtCur(result.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked */}
            <div className="sm:hidden space-y-2">
              {[
                { label: "CBS", rate: CBS_RATE, value: result.cbs },
                { label: "IBS Estadual", rate: IBS_EST_RATE, value: result.ibsEstadual },
                { label: "IBS Municipal", rate: IBS_MUN_RATE, value: result.ibsMunicipal },
              ].map((t) => (
                <div key={t.label} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/40 text-sm">
                  <span className="text-muted-foreground">{t.label} <span className="text-xs">({(t.rate * 100).toFixed(1)}%)</span></span>
                  <span className="font-medium text-foreground">{fmtCur(t.value)}</span>
                </div>
              ))}
            </div>

            {/* Total card */}
            <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Base de cálculo</p>
                <p className="text-sm font-medium text-foreground">{fmtCur(result.base)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Imposto total</p>
                <p className="text-lg font-heading font-bold text-primary">{fmtCur(result.total)}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
