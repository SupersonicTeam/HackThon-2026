import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SolicitacoesProvider } from "@/contexts/SolicitacoesContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Calendario from "@/pages/Calendario";
import Documentos from "@/pages/Documentos";
import Chat from "@/pages/Chat";
import Contador from "@/pages/Contador";

import NotFound from "./pages/NotFound";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Não retenta se for 404 (endpoint não implementado)
        if (error?.status === 404) return false;
        // Retenta até 3 vezes para outros erros
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Não recarrega ao focar na janela
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SolicitacoesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/contador" element={<Contador />} />
              
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SolicitacoesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
