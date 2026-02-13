import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SolicitacoesProvider } from "./contexts/SolicitacoesContext";
import { NotificacoesProvider } from "./contexts/NotificacoesContext";

createRoot(document.getElementById("root")!).render(
  <NotificacoesProvider>
    <SolicitacoesProvider>
      <App />
    </SolicitacoesProvider>
  </NotificacoesProvider>
);
