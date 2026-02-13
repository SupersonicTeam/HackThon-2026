import { createContext, useContext, useState, ReactNode } from "react";

export interface Notificacao {
  id: number;
  tipo: "Solicitação" | "Documento" | "Pagamento";
  titulo: string;
  dataHora: string;
  lida: boolean;
  rota: string;
}

interface NotificacoesContextValue {
  notificacoes: Notificacao[];
  adicionarNotificacao: (notif: Omit<Notificacao, "id" | "dataHora" | "lida">) => void;
  marcarLida: (id: number) => void;
  marcarTodasLidas: () => void;
  limparTodas: () => void;
  naoLidas: number;
}

const NotificacoesContext = createContext<NotificacoesContextValue | null>(null);

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const adicionarNotificacao = (notif: Omit<Notificacao, "id" | "dataHora" | "lida">) => {
    const agora = new Date();
    const dataHora = `${String(agora.getDate()).padStart(2, "0")}/${String(agora.getMonth() + 1).padStart(2, "0")} ${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    
    const novaNotif: Notificacao = {
      ...notif,
      id: Date.now(),
      dataHora,
      lida: false,
    };

    setNotificacoes((prev) => [novaNotif, ...prev]);
  };

  const marcarLida = (id: number) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  };

  const marcarTodasLidas = () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const limparTodas = () => {
    setNotificacoes([]);
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <NotificacoesContext.Provider
      value={{
        notificacoes,
        adicionarNotificacao,
        marcarLida,
        marcarTodasLidas,
        limparTodas,
        naoLidas,
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const context = useContext(NotificacoesContext);
  if (!context) {
    throw new Error("useNotificacoes deve ser usado dentro de NotificacoesProvider");
  }
  return context;
}
