import { useCallback, useState } from "react";
import { api } from "@/lib/api"; // <-- aponta pro teu ApiClient

export type Pendencia = {
  id: string;
  produtorId: string;

  titulo: string;
  descricao: string;
  dataLimite: string; // ISO
  prioridade: "baixa" | "media" | "alta" | "urgente";
  status: "pendente" | "enviado" | "concluida" | "cancelada";

  tiposDocumentos: string; // JSON string no banco
  observacoes?: string | null;

  motivoCancelamento?: string | null;
  motivoRejeicao?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type CreatePendenciaPayload = {
  produtorId: string;
  titulo: string;
  descricao?: string;
  dataLimite: string; // "YYYY-MM-DD"
  prioridade: "baixa" | "media" | "alta" | "urgente";
  tiposDocumentos: string[];
  observacoes?: string | null;
};

export type UpdatePendenciaPayload = Partial<Omit<CreatePendenciaPayload, "produtorId">>;

export type DocumentoAnexado = {
  id: string;
  pendenciaId: string;
  nomeArquivo: string;
  tipoDocumento: string;
  tamanho: number;
  caminhoArquivo: string;
  dataUpload: string;
};

export type AnexarDocumentoPayload = {
  pendenciaId: string;
  nomeArquivo: string;
  tipoDocumento: string;
  tamanho?: number;
  caminhoArquivo?: string;
};

export type PendenciaComDocumentos = Pendencia & {
  documentos: DocumentoAnexado[];
};

export function useContador() {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listar = useCallback(async (produtorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Pendencia[]>("/contador/pendencias", { produtorId });
      setPendencias(data);
      return data;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao listar pendências");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const criar = useCallback(async (payload: CreatePendenciaPayload) => {
    setLoading(true);
    setError(null);
    try {
      const created = await api.post<Pendencia>("/contador/pendencias", payload);
      setPendencias((prev) => [created, ...prev]);
      return created;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao criar pendência");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizar = useCallback(async (id: string, payload: UpdatePendenciaPayload) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.put<Pendencia>(`/contador/pendencias/${id}`, payload);
      setPendencias((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao atualizar pendência");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const concluir = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.patch<Pendencia>(`/contador/pendencias/${id}/concluir`);
      setPendencias((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao concluir pendência");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelar = useCallback(async (id: string, motivo: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.patch<Pendencia>(`/contador/pendencias/${id}/cancelar`, { motivo });
      setPendencias((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao cancelar pendência");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reabrir = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.patch<Pendencia>(`/contador/pendencias/${id}/reabrir`);
      setPendencias((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao reabrir pendência");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejeitar = useCallback(async (id: string, motivo: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.patch<Pendencia>(`/contador/pendencias/${id}/rejeitar`, { motivo });
      setPendencias((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao rejeitar pendência");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const anexarDocumento = useCallback(async (payload: AnexarDocumentoPayload, file?: File) => {
    setLoading(true);
    setError(null);
    try {
      let documento: DocumentoAnexado;
      
      // Se tiver arquivo, usar FormData para upload real
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pendenciaId', payload.pendenciaId);
        formData.append('tipoDocumento', payload.tipoDocumento);
        formData.append('nomeArquivo', payload.nomeArquivo);
        if (payload.tamanho) formData.append('tamanho', String(payload.tamanho));

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/contador/documentos/anexar`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erro ao anexar documento');
        }

        documento = await response.json();
      } else {
        // Fallback: sem arquivo físico
        documento = await api.post<DocumentoAnexado>("/contador/documentos/anexar", payload);
      }
      
      // Atualizar status da pendência localmente
      setPendencias((prev) =>
        prev.map((p) =>
          p.id === payload.pendenciaId ? { ...p, status: "enviado" as const } : p
        )
      );
      return documento;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao anexar documento");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const listarDocumentos = useCallback(async (pendenciaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const docs = await api.get<DocumentoAnexado[]>(`/contador/pendencias/${pendenciaId}/documentos`);
      return docs;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao listar documentos");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const extrairDadosDocumento = useCallback(async (documentoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await api.post<any>(`/contador/documentos/${documentoId}/extrair-dados`);
      return dados;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao extrair dados do documento");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const listarRecebidos = useCallback(async (produtorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PendenciaComDocumentos[]>("/contador/pendencias-recebidos", { produtorId });
      return data;
    } catch (e: any) {
      setError(e?.message ?? "Erro ao listar recebidos");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
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
    anexarDocumento,
    listarDocumentos,
    extrairDadosDocumento,
    listarRecebidos,
  };
}
