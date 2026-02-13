import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  solicitacoesContador as initialData,
  type SolicitacaoContador,
} from "@/mocks/requests";
import { initialDrafts, type RascunhoNFe } from "@/mocks/drafts";

interface Envio {
  solicitacaoId: number;
  producerId: string;
  arquivoNome: string;
  dataEnvio: string;
}

interface SolicitacoesContextType {
  solicitacoes: SolicitacaoContador[];
  envios: Envio[];
  drafts: RascunhoNFe[];
  addSolicitacao: (s: Omit<SolicitacaoContador, "id" | "status">) => void;
  editarSolicitacao: (
    id: number,
    data: Partial<Omit<SolicitacaoContador, "id" | "status">>,
  ) => void;
  enviarDocumento: (solicitacaoId: number, arquivoNome: string) => void;
  marcarRecebido: (solicitacaoId: number) => void;
  rejeitarEnvio: (solicitacaoId: number, motivo: string) => void;
  marcarConcluido: (solicitacaoId: number) => void;
  cancelarSolicitacao: (solicitacaoId: number, motivo: string) => void;
  reabrirSolicitacao: (solicitacaoId: number) => void;
  addDraft: (draft: Omit<RascunhoNFe, "id" | "data">) => void;
  updateDraft: (id: number | string, updates: Partial<RascunhoNFe>) => void;
}

const SolicitacoesContext = createContext<SolicitacoesContextType | null>(null);

export function SolicitacoesProvider({ children }: { children: ReactNode }) {
  const [solicitacoes, setSolicitacoes] =
    useState<SolicitacaoContador[]>(initialData);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [drafts, setDrafts] = useState<RascunhoNFe[]>(initialDrafts);

  const addSolicitacao = useCallback(
    (s: Omit<SolicitacaoContador, "id" | "status">) => {
      setSolicitacoes((prev) => [
        ...prev,
        { ...s, id: Date.now(), status: "pendente" as const },
      ]);
    },
    [],
  );

  const editarSolicitacao = useCallback(
    (id: number, data: Partial<Omit<SolicitacaoContador, "id" | "status">>) => {
      setSolicitacoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
      );
    },
    [],
  );

  const enviarDocumento = useCallback(
    (solicitacaoId: number, arquivoNome: string) => {
      let producerId = "";
      setSolicitacoes((prev) =>
        prev.map((s) => {
          if (s.id === solicitacaoId) {
            producerId = s.producerId;
            return { ...s, status: "enviado" as const, arquivoNome };
          }
          return s;
        }),
      );
      setEnvios((prev) => [
        ...prev,
        {
          solicitacaoId,
          producerId,
          arquivoNome,
          dataEnvio: new Date().toISOString().slice(0, 10),
        },
      ]);
    },
    [],
  );

  const marcarRecebido = useCallback((solicitacaoId: number) => {
    setSolicitacoes((prev) =>
      prev.map((s) =>
        s.id === solicitacaoId ? { ...s, status: "recebido" as const } : s,
      ),
    );
  }, []);

  const rejeitarEnvio = useCallback((solicitacaoId: number, motivo: string) => {
    setSolicitacoes((prev) =>
      prev.map((s) =>
        s.id === solicitacaoId
          ? {
              ...s,
              status: "pendente" as const,
              motivoRejeicao: motivo,
              arquivoNome: undefined,
            }
          : s,
      ),
    );
  }, []);

  const marcarConcluido = useCallback((solicitacaoId: number) => {
    setSolicitacoes((prev) =>
      prev.map((s) =>
        s.id === solicitacaoId ? { ...s, status: "concluido" as const } : s,
      ),
    );
  }, []);

  const cancelarSolicitacao = useCallback(
    (solicitacaoId: number, motivo: string) => {
      setSolicitacoes((prev) =>
        prev.map((s) =>
          s.id === solicitacaoId
            ? { ...s, status: "cancelado" as const, motivoCancelamento: motivo }
            : s,
        ),
      );
    },
    [],
  );

  const reabrirSolicitacao = useCallback((solicitacaoId: number) => {
    setSolicitacoes((prev) =>
      prev.map((s) =>
        s.id === solicitacaoId
          ? { ...s, status: "pendente" as const, motivoCancelamento: undefined }
          : s,
      ),
    );
  }, []);

  const addDraft = useCallback((draft: Omit<RascunhoNFe, "id" | "data">) => {
    setDrafts((prev) => [
      { ...draft, id: Date.now(), data: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
  }, []);

  const updateDraft = useCallback(
    (id: number | string, updates: Partial<RascunhoNFe>) => {
      setDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      );
    },
    [],
  );

  return (
    <SolicitacoesContext.Provider
      value={{
        solicitacoes,
        envios,
        drafts,
        addSolicitacao,
        editarSolicitacao,
        enviarDocumento,
        marcarRecebido,
        rejeitarEnvio,
        marcarConcluido,
        cancelarSolicitacao,
        reabrirSolicitacao,
        addDraft,
        updateDraft,
      }}
    >
      {children}
    </SolicitacoesContext.Provider>
  );
}

export function useSolicitacoes() {
  const ctx = useContext(SolicitacoesContext);
  if (!ctx)
    throw new Error("useSolicitacoes must be used within SolicitacoesProvider");
  return ctx;
}
