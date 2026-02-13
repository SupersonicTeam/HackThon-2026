import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { useContador } from "@/hooks/use-contador";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedRequestId?: number | string;
}

export default function AnexarDocumentoDialog({ open, onOpenChange, preSelectedRequestId }: Props) {
  const { pendencias, anexarDocumento, listar } = useContador();
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPreSelected = preSelectedRequestId != null;

  // Load pendências on mount
  useEffect(() => {
    if (open) {
      listar(LOGGED_PRODUCER_ID).catch(() => {});
    }
  }, [open, listar]);

  useEffect(() => {
    if (open && preSelectedRequestId != null) {
      setSelectedRequestId(String(preSelectedRequestId));
    }
  }, [open, preSelectedRequestId]);

  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const pendentes = pendencias.filter((p) => p.status === "pendente" && p.produtorId === LOGGED_PRODUCER_ID);
  const selected = pendencias.find((p) => String(p.id) === selectedRequestId);

  function handleFile(f: File | null) {
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function reset() {
    setSelectedRequestId("");
    setFile(null);
    setPreview(null);
  }

  async function handleSave() {
    if (!selectedRequestId || !file) return;

    setSaving(true);
    try {
      // Determinar tipo do documento a partir dos tiposDocumentos da pendência
      let tipoDocumento = "documento-geral";
      try {
        const tipos = JSON.parse(selected?.tiposDocumentos || "[]");
        if (Array.isArray(tipos) && tipos.length > 0) {
          tipoDocumento = tipos[0];
        }
      } catch {
        // Fallback
      }

      await anexarDocumento({
        pendenciaId: selectedRequestId,
        nomeArquivo: file.name,
        tipoDocumento,
        tamanho: file.size,
      });

      toast.success("Documento anexado com sucesso!");
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao anexar documento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Anexar documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Solicitação do contador */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Solicitação do contador
            </label>
            {isPreSelected && selected ? (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm font-medium">{selected.titulo}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{selected.prioridade}</Badge>
                </div>
              </div>
            ) : pendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhuma solicitação pendente.</p>
            ) : (
              <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a solicitação" />
                </SelectTrigger>
                <SelectContent>
                  {pendentes.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <span className="flex items-center gap-2">
                        {s.titulo}
                        {(s.prioridade === "alta" || s.prioridade === "urgente") && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Urgente
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Auto-filled info (only for select mode) */}
          {!isPreSelected && selected && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">Prioridade:</span>{" "}
                <span className="font-medium">{selected.prioridade}</span>
              </p>
              <p className="text-muted-foreground text-xs">{selected.descricao}</p>
            </div>
          )}

          {/* Pre-selected description */}
          {isPreSelected && selected && selected.descricao && (
            <p className="text-xs text-muted-foreground">{selected.descricao}</p>
          )}

          {/* Upload buttons */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Arquivo</label>

            {!file ? (
              <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                {isMobile && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-20 flex flex-col gap-1.5"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera size={24} className="text-primary" />
                    <span className="text-xs font-medium">Tirar foto</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="h-20 flex flex-col gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={24} className="text-primary" />
                  <span className="text-xs font-medium">Escolher da galeria</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/40">
                {preview && (
                  <img src={preview} alt="Preview" className="h-14 w-14 rounded-md object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => { setFile(null); setPreview(null); }}>
                  <X size={16} />
                </Button>
              </div>
            )}

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
          </div>

          {/* AI placeholder */}
          {file && (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles size={16} />
                Leitura automática (IA)
              </div>
              <p className="text-xs text-muted-foreground">Em breve: vamos extrair automaticamente valores e datas da imagem.</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded bg-muted/60 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Data</p>
                  <p className="text-xs font-medium text-muted-foreground/60">—</p>
                </div>
                <div className="rounded bg-muted/60 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Obs.</p>
                  <p className="text-xs font-medium text-muted-foreground/60">—</p>
                </div>
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleSave} disabled={!selectedRequestId || !file || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
