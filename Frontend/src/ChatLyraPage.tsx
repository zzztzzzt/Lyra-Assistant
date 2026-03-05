import { useState, useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";

import LyraAssistantIcon from "./components/LyraAssistantIcon";
import CancelBtn from "./components/CancelBtn";
import { llmGenTitle } from "./llm-fns/llmGenTitle";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface ConversationSummary {
  conversation_id: string;
  title: string;
  preview: string;
  message_count: number;
  updated_at: string | null;
}

const GEMMA_CHAT_API_BASE = "http://localhost:8000/gemmachat";

// Handles smooth typing effects
const TypewriterMessage = memo(({ content }: { content: string }) => {
  const [visibleChars, setVisibleChars] = useState<string[]>([]);
  const index = useRef(0);

  useEffect(() => {
    setVisibleChars([]);
    index.current = 0;

    const timer = setInterval(() => {
      if (index.current < content.length) {
        const nextChar = content.charAt(index.current);
        setVisibleChars((prev) => [...prev, nextChar]);
        index.current += 1;
      } else {
        clearInterval(timer);
      }
    }, 5);

    return () => clearInterval(timer);
  }, [content]);

  return (
    <span>
      {visibleChars.map((char, i) => (
        <span 
          key={i} 
          className="animate-char"
        >
          {char === "\n" ? <br /> : char}
        </span>
      ))}
    </span>
  );
});

export function ChatLyraPage() {
  const [currentLLM, setCurrentLLM] = useState<string>("detecting ...");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingTitleConversationId, setPendingTitleConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleGeneratedConversationsRef = useRef<Set<string>>(new Set());

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${GEMMA_CHAT_API_BASE}/conversations/`);
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
        `${GEMMA_CHAT_API_BASE}/conversations/${targetConversationId}/`
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
        `${GEMMA_CHAT_API_BASE}/conversations/${targetConversationId}/`,
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
      `${GEMMA_CHAT_API_BASE}/chat/`,
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
      const response = await fetch(`${GEMMA_CHAT_API_BASE}/chat/`, {
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
    <div className="flex">
      {/* Side Bar */}
      <div className="h-screen w-1/4 bg-gradient-to-r from-white to-slate-50 font-lyra overflow-y-auto pb-6">
        <div className="h-20 mx-5 mt-5 chat-side-bar-btn-style">
          <span>Current Model :&nbsp;</span>{ currentLLM }
        </div>
        {conversations.map((conversation) => (
          <div
            key={conversation.conversation_id}
            className="group relative h-20 w-[calc(100%-2.5rem)] mx-5 mt-5"
          >
            <button
              type="button"
              onClick={() => void loadConversation(conversation.conversation_id)}
              disabled={isLoadingConversation || Boolean(isDeletingConversation)}
              className={`h-full w-full px-5 group-hover:pr-17 chat-side-bar-btn-style flex-col space-y-0.5 duration-800 ${
                conversationId === conversation.conversation_id
                  ? "ring ring-slate-400 shadow-md"
                  : ""
              } ${isLoadingConversation || isDeletingConversation ? "opacity-70" : "cursor-pointer"}`}
            >
              <span className="w-full truncate">{conversation.title || "Untitled chat"}</span>
              <span className="w-full truncate text-xs text-slate-500">
                {conversation.preview || "No preview"}
              </span>
            </button>

            <CancelBtn
              cancelAction={() => void handleDeleteConversation(conversation.conversation_id)}
              customClasses={`absolute top-1/2 right-2 -translate-y-1/2 scale-75 transition-all duration-600 ${
                isDeletingConversation === conversation.conversation_id
                  ? "opacity-60 pointer-events-none"
                  : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="h-screen w-3/4 font-lyra flex flex-col bg-white text-slate-900 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <LyraAssistantIcon className="w-full h-full" />
            </div>
            <span className="font-semibold text-lg text-slate-700">Lyra 2 + Gemma 3</span>
          </div>
          <Link 
            to="/"
            className="flex font-semibold text-lg text-slate-700 hover:text-slate-500 duration-400 cursor-pointer"
          >
            Home &nbsp;
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
            </svg>
          </Link>
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
                <p className="mt-10 text-lg text-gray-300">Explore the place We've Never Been .</p>
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
                        ? "bg-slate-900 text-white px-5 py-3 rounded-full rounded-tr-none shadow-sm" 
                        : "text-slate-700 pt-2"
                    }`}>
                      {msg.role === "assistant" && idx === messages.length - 1 ? (
                        <TypewriterMessage content={msg.content} />
                      ) : (
                        msg.content
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
        <footer className="fixed bottom-0 right-0 w-3/4 mask-scrolling-faded pb-8 pt-8">
          <div className="max-w-210 mx-auto px-6">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-full py-1.5 px-2.5 focus-within:border-slate-400 transition-all"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Lyra anything ..."
                className="flex-1 bg-transparent pl-5 pr-2 py-3 outline-none text-chat-lyra"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="bg-slate-900 text-white p-3 rounded-full disabled:bg-slate-100 disabled:text-slate-300 transition-all hover:scale-105 active:scale-95"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="3">
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
            {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ChatLyraPage;
