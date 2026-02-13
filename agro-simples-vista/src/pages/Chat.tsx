import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MessageSquare, Send, Bot, User, Headset } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { LOGGED_PRODUCER_ID } from "@/mocks/producers";

function horaAtual() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const perguntasRapidas = [
  "Como está minha situação financeira?",
  "Quais impostos devo pagar?",
  "Resumo do mês",
  "Como funciona o CBS?",
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [showHumano, setShowHumano] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Integração com API de Chat
  const { messages, isTyping, sendMessage, isLoading } = useChat({
    produtorId: LOGGED_PRODUCER_ID,
    estado: "PR",
    culturas: ["Soja", "Milho"],
    regimeTributario: "Simples Nacional",
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const enviar = (texto: string) => {
    if (!texto.trim() || isLoading) return;
    sendMessage(texto.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-0 max-w-2xl mx-auto px-0 md:px-0">
      {/* Header + chips */}
      <div className="shrink-0">
        <div className="flex items-center gap-3 pb-3">
          <MessageSquare className="text-primary" size={28} />
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Chat</h1>
        </div>
        <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-none">
          {perguntasRapidas.map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className="whitespace-nowrap shrink-0 text-xs"
              onClick={() => enviar(p)}
              disabled={isLoading}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            className="whitespace-nowrap shrink-0 text-xs gap-1"
            onClick={() => setShowHumano(true)}
          >
            <Headset size={14} />
            Solicitar atendimento humano
          </Button>
        </div>

        <Dialog open={showHumano} onOpenChange={setShowHumano}>
          <DialogContent className="w-[95vw] max-w-sm">
            <DialogHeader>
              <DialogTitle>Atendimento humano</DialogTitle>
              <DialogDescription>
                Funcionalidade disponível na versão futura do sistema.
              </DialogDescription>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              Em breve você poderá falar diretamente com seu contador ou
              suporte.
            </p>
            <DialogFooter>
              <Button onClick={() => setShowHumano(false)}>Entendi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages — only this scrolls */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-0 sm:pr-1 min-h-0 pb-2">
        {/* Mensagem inicial do assistente */}
        {messages.length === 0 && (
          <div className="flex gap-2 max-w-[90%] md:max-w-[85%]">
            <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 bg-primary/15 text-primary">
              <Bot size={16} />
            </div>
            <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line break-words bg-card border shadow-sm rounded-tl-md">
              Olá! Sou o João, seu contador virtual. 🌾
              {"\n\n"}Posso te ajudar com:
              {"\n"}• Dúvidas sobre impostos (CBS, IBS, FUNRURAL)
              {"\n"}• Simulações tributárias
              {"\n"}• Análise de notas fiscais
              {"\n"}• Dicas para aumentar seu lucro
              {"\n\n"}Como posso ajudar?
              <span className="block text-[10px] mt-1 text-muted-foreground">
                {horaAtual()}
              </span>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex gap-2 max-w-[90%] md:max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "",
            )}
          >
            <div
              className={cn(
                "shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1",
                msg.role === "assistant"
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {msg.role === "assistant" ? (
                <Bot size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line break-words",
                msg.role === "assistant"
                  ? "bg-card border shadow-sm rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md",
              )}
            >
              {msg.content}
              <span
                className={cn(
                  "block text-[10px] mt-1",
                  msg.role === "assistant"
                    ? "text-muted-foreground"
                    : "text-primary-foreground/70",
                )}
              >
                {horaAtual()}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 max-w-[90%] md:max-w-[85%]">
            <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 bg-primary/15 text-primary">
              <Bot size={16} />
            </div>
            <div className="bg-card border shadow-sm rounded-2xl rounded-tl-md px-4 py-3 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0ms" }}
                >
                  ●
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "150ms" }}
                >
                  ●
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "300ms" }}
                >
                  ●
                </span>
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input — sticky at bottom */}
      <div className="shrink-0 border-t bg-background pt-3 pb-[env(safe-area-inset-bottom,0.5rem)] flex gap-2 sticky bottom-0">
        <Input
          placeholder="Digite sua mensagem..."
          className="flex-1 text-base min-h-[44px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(input);
            }
          }}
          disabled={isLoading}
        />
        <Button
          size="icon"
          className="h-[44px] w-[44px] shrink-0"
          onClick={() => enviar(input)}
          disabled={!input.trim() || isLoading}
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
