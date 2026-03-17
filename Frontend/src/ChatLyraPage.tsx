import { useState, useRef, useEffect } from "react";

import ChatSideBarContent from "./chat-components/ChatSideBarContent";
import ChatHeaderContent from "./chat-components/ChatHeaderContent";
import ChatInputArea from "./chat-components/ChatInputArea";
import AssistantGradientPreview from "./chat-components/AssistantGradientPreview";
import TypewriterMessage from "./chat-components/TypewriterMessage";

import LyraAssistantIcon from "./components/LyraAssistantIcon";
import { llmGenTitle } from "./llm-fns/llmGenTitle";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ConversationSummary {
  conversation_id: string;
  title: string;
  preview: string;
  message_count: number;
  updated_at: string | null;
}

const LLM_CHAT_API_BASE = "http://localhost:8000/llmchat";

export function ChatLyraPage() {
  const [currentLLM, setCurrentLLM] = useState<string>("detecting ...");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingTitleConversationId, setPendingTitleConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState<boolean>(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleGeneratedConversationsRef = useRef<Set<string>>(new Set());

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${LLM_CHAT_API_BASE}/conversations/`);
      if (!response.ok) return;

      const data = await response.json();
      setConversations(data.conversations ?? []);
    } catch {
      // Ignore sidebar list fetch errors to avoid breaking chat flow.
    }
  };

  const loadConversation = async (targetConversationId: string) => {
    setIsLoadingConversation(true);
    setPendingTitleConversationId(null);
    setError(null);

    try {
      const response = await fetch(
        `${LLM_CHAT_API_BASE}/conversations/${targetConversationId}/`
      );
      if (!response.ok) throw new Error("Failed to load conversation");

      const data = await response.json();
      const loadedMessages: ChatMessage[] = (data.messages ?? []).map(
        (item: { id: string; role: ChatRole; content: string }) => ({
          id: String(item.id),
          role: item.role,
          content: item.content,
        })
      );

      setConversationId(targetConversationId);
      setMessages(loadedMessages);
    } catch {
      setError("Conversation load failed");
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleDeleteConversation = async (targetConversationId: string) => {
    if (isDeletingConversation) return;

    setIsDeletingConversation(targetConversationId);
    setError(null);

    try {
      const response = await fetch(
        `${LLM_CHAT_API_BASE}/conversations/${targetConversationId}/`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete conversation");

      setConversations((prev) =>
        prev.filter((item) => item.conversation_id !== targetConversationId)
      );

      if (conversationId === targetConversationId) {
        setConversationId(null);
        setPendingTitleConversationId(null);
        setMessages([]);
      }
    } catch {
      setError("Delete conversation failed");
    } finally {
      setIsDeletingConversation(null);
    }
  };

  useEffect(() => {
    void fetchConversations();
  }, []);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isSending]);

  // LLM generate Chat Title
  useEffect(() => {
    if (!conversationId || isLoadingConversation) return;
    if (pendingTitleConversationId !== conversationId) return;
    if (messages.length !== 4) return;
    if (titleGeneratedConversationsRef.current.has(conversationId)) return;

    titleGeneratedConversationsRef.current.add(conversationId);
    const previousTalk = messages.map((msg) => msg.content);

    void llmGenTitle(
      `${LLM_CHAT_API_BASE}/chat/`,
      conversationId,
      previousTalk
    ).catch(() => {
      // Ignore title generation errors to keep chat flow stable.
    });
    setPendingTitleConversationId(null);
  }, [conversationId, messages, isLoadingConversation, pendingTitleConversationId]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(`${LLM_CHAT_API_BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: conversationId ?? undefined,
        }),
      });

      if (!response.ok) throw new Error("Service temporarily unavailable");

      const data = await response.json();
      setConversationId(data.conversation_id);
      setPendingTitleConversationId(data.conversation_id ?? null);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const currentModel = data.model;

      setCurrentLLM(currentModel);

      await fetchConversations();
    } catch (err) {
      setError("Connection failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative flex">
      {/* Side Bar */}
      <div
        className={`h-screen w-full lg:w-1/4 bg-gradient-to-r from-white to-slate-50 font-lyra overflow-y-auto pb-6 lg:block max-lg:absolute max-lg:top-0 max-lg:z-20 max-lg:duration-250 ${
          isMobileSidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        }`}
      >
        <ChatSideBarContent
          currentLLM={currentLLM}
          conversations={conversations}
          loadConversation={loadConversation}
          isLoadingConversation={isLoadingConversation}
          isDeletingConversation={isDeletingConversation}
          handleDeleteConversation={handleDeleteConversation}
          conversationId={conversationId}
          onCloseSidebar={() => setIsMobileSidebarOpen(false)}
        />
      </div>
      <div className="h-screen w-full lg:w-3/4 font-lyra flex flex-col bg-white text-slate-900 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-50">
          <ChatHeaderContent onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
        </header>

        {/* Message Display Area */}
        <main className="flex-1 overflow-y-auto pt-10 pb-32" ref={scrollRef}>
          <div className="max-w-210 mx-auto px-6 space-y-10">
            {messages.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center opacity-85">
                <div className="mr-6 h-60 w-60">
                <LyraAssistantIcon
                  className="w-full h-full"
                  gradientStart='oklch(0.9499 0.0719 176.5)'
                  gradientMid='oklch(0.9375 0.06 201.99)'
                  gradientEnd='oklch(0.9136 0.0808 339)'
                />
                </div>
                <p className="mt-10 text-xs sm:text-lg text-gray-300">Explore the place We've Never Been .</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Assistant Icon */}
                  {msg.role === "assistant" && (
                    <div className="w-16 h-16 pb-7 text-gray-400 rounded-full flex items-center justify-center flex-shrink-0 scale-75">
                      <LyraAssistantIcon />
                    </div>
                  )}
                  
                  <div className={`group relative max-w-85/100 px-1 py-1`}>
                    <div className={`text-chat-lyra leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-slate-900 text-white px-5 py-3 rounded-3xl rounded-tr-none shadow-sm" 
                        : "text-slate-700 pt-2 max-w-160"
                    }`}>
                      {msg.role === "assistant" && idx === messages.length - 1 ? (
                        <TypewriterMessage content={msg.content} />
                      ) : (
                        msg.content
                      )}
                      {msg.role === "assistant" && (
                        <AssistantGradientPreview content={msg.content} />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 pb-2 rounded-full text-gray-400 flex items-center justify-center animate-pulse scale-75">
                  <LyraAssistantIcon />
                </div>
                <div className="flex gap-1">
                  <span className="reply-loading-dot" style={{ animationDelay: '0ms' }}></span>
                  <span className="reply-loading-dot" style={{ animationDelay: '150ms' }}></span>
                  <span className="reply-loading-dot" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <footer className="fixed bottom-0 right-0 w-full lg:w-3/4 mask-scrolling-faded pb-8 pt-8">
          <ChatInputArea
            handleSubmit={handleSubmit}
            input={input}
            setInput={setInput}
            isSending={isSending}
            error={error}
          />
        </footer>
      </div>
    </div>
  );
}

export default ChatLyraPage;
