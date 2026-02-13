import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import * as chatService from "@/services/chat.service";
import type {
  ChatMessage,
  ChatContext,
  ChatResponse,
} from "@/services/chat.service";

// ==========================================
// CHAT HOOK COM HISTÓRICO
// ==========================================
export function useChat(initialContext?: ChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<ChatContext>(initialContext || {});
  const [isTyping, setIsTyping] = useState(false);

  const sendMessageMutation = useMutation<ChatResponse, Error, string>({
    mutationFn: (message: string) =>
      chatService.enviarMensagem(message, {
        ...context,
        history: messages,
      }),
    onMutate: (message: string) => {
      // Adiciona mensagem do usuário imediatamente
      setMessages((prev: ChatMessage[]) => [
        ...prev,
        { role: "user", content: message },
      ]);
      setIsTyping(true);
    },
    onSuccess: (response: ChatResponse) => {
      // Adiciona resposta do assistente
      setMessages((prev: ChatMessage[]) => [
        ...prev,
        { role: "assistant", content: response.response },
      ]);
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
      // Adiciona mensagem de erro
      setMessages((prev: ChatMessage[]) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        },
      ]);
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      sendMessageMutation.mutate(message);
    },
    [sendMessageMutation],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const updateContext = useCallback((newContext: Partial<ChatContext>) => {
    setContext((prev: ChatContext) => ({ ...prev, ...newContext }));
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    updateContext,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}

// ==========================================
// ANÁLISE DE NOTA HOOK
// ==========================================
export function useAnalisarNota() {
  return useMutation({
    mutationFn: chatService.analisarNota,
  });
}

// ==========================================
// CÁLCULO DE IMPOSTOS VIA CHAT HOOK
// ==========================================
export function useCalcularImpostosChat() {
  return useMutation({
    mutationFn: chatService.calcularImpostosChat,
  });
}

// ==========================================
// SIMULAÇÃO DE PREÇO VIA CHAT HOOK
// ==========================================
export function useSimularPrecoChat() {
  return useMutation({
    mutationFn: chatService.simularPrecoChat,
  });
}

// ==========================================
// DICAS DE LUCRO HOOK
// ==========================================
export function useDicasLucro() {
  return useMutation({
    mutationFn: (produtorId: string) => chatService.getDicasLucro(produtorId),
  });
}
