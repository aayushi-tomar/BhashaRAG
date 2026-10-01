import { useState, useEffect, useRef } from "react";
import { api, ApiError } from "./api/client";
import { ChatMessageItem, ToastMessage, QueryRequest } from "./types";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { EmptyState } from "./components/EmptyState";
import { ToastContainer } from "./components/Toast";
import { Loader2 } from "lucide-react";

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem("bhasharag_theme") === "dark" ||
      (!localStorage.getItem("bhasharag_theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Backend status & document state
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedCount, setIndexedCount] = useState<number | null>(null);

  // Chat & Query Settings state
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [useExpansion, setUseExpansion] = useState(true);
  const [useReranker, setUseReranker] = useState(true);
  const [voice, setVoice] = useState(false);
  const [voiceLang, setVoiceLang] = useState("hi-IN");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Dark mode class sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bhasharag_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bhasharag_theme", "light");
    }
  }, [isDarkMode]);

  // Toast helpers
  const addToast = (
    type: ToastMessage["type"],
    title: string,
    message?: string,
    duration: number = 4000,
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check Backend Health & Fetch Documents
  const checkHealthAndDocs = async () => {
    try {
      const health = await api.getHealth();
      setBackendOnline(health?.status === "ok");
    } catch {
      setBackendOnline(false);
    }

    try {
      setIsLoadingDocs(true);
      const res = await api.getDocuments();
      if (res && Array.isArray(res.documents)) {
        setDocuments(res.documents);
      }
    } catch (err) {
      console.warn("Could not fetch documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    checkHealthAndDocs();
    const interval = setInterval(checkHealthAndDocs, 25000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuerying]);

  // Handle PDF file uploads
  const handleUploadFiles = async (files: File[]) => {
    try {
      setIsUploading(true);
      await api.uploadFiles(files);
      addToast(
        "success",
        "Upload Successful",
        `Uploaded ${files.length} document${files.length > 1 ? "s" : ""}. Remember to index them to update the knowledge base.`,
      );
      await checkHealthAndDocs();
    } catch (err: any) {
      console.error("Upload failed:", err);
      addToast(
        "error",
        "Upload Failed",
        err.detail || err.message || "Could not upload PDF files.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Document Indexing
  const handleIndexDocuments = async (reset: boolean) => {
    try {
      setIsIndexing(true);
      const res = await api.indexDocuments(reset);
      setIndexedCount(res.files_indexed);
      addToast(
        "success",
        "Knowledge Base Indexed",
        `Successfully indexed ${res.files_indexed} document${
          res.files_indexed !== 1 ? "s" : ""
        }.`,
      );
    } catch (err: any) {
      console.error("Indexing failed:", err);
      addToast(
        "error",
        "Indexing Failed",
        err.detail || err.message || "Failed to index documents.",
      );
    } finally {
      setIsIndexing(false);
    }
  };

  // Handle Question Asking
  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessageId = Math.random().toString(36).substring(2, 9);
    const userMsg: ChatMessageItem = {
      id: userMessageId,
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsQuerying(true);

    const queryPayload: QueryRequest = {
      question,
      use_expansion: useExpansion,
      use_reranker: useReranker,
      voice,
      voice_lang: voiceLang,
    };

    try {
      const response = await api.query(queryPayload);

      const assistantMsg: ChatMessageItem = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
        audioUrl: response.audio_url,
        timestamp: new Date(),
        queryConfig: {
          use_expansion: useExpansion,
          use_reranker: useReranker,
          voice,
          voice_lang: voiceLang,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Query failed:", err);
      const is404 = err instanceof ApiError && err.status === 404;

      const errorMsg: ChatMessageItem = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: is404
          ? "No indexed documents found in the system. Please upload PDFs and index them first."
          : err.detail ||
            err.message ||
            "An error occurred while generating the answer.",
        timestamp: new Date(),
        isError: !is404,
        is404NotIndexed: is404,
      };

      setMessages((prev) => [...prev, errorMsg]);

      if (!is404) {
        addToast(
          "error",
          "Query Failed",
          err.detail || err.message || "Failed to retrieve grounded answer.",
        );
      }
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-zinc-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        documents={documents}
        isLoadingDocs={isLoadingDocs}
        onRefreshDocs={checkHealthAndDocs}
        onUploadFiles={handleUploadFiles}
        isUploading={isUploading}
        onIndexDocuments={handleIndexDocuments}
        isIndexing={isIndexing}
        indexedCount={indexedCount}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/50 dark:bg-[#090a0f]">
        {/* Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onClearChat={handleClearChat}
          hasMessages={messages.length > 0}
          backendOnline={backendOnline}
          documentCount={documents.length}
        />

        {/* Chat / Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col">
          {messages.length === 0 ? (
            <EmptyState
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              documentCount={documents.length}
              onOpenUpload={() => setIsSidebarOpen(true)}
            />
          ) : (
            <div className="max-w-3xl w-full mx-auto flex-1">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onOpenUpload={() => setIsSidebarOpen(true)}
                />
              ))}

              {/* Thinking / Retrieval Status */}
              {isQuerying && (
                <div className="flex items-center gap-2.5 py-4 text-xs font-mono text-zinc-400 animate-fade-in">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>
                    Searching document vectors & synthesizing Indic response...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Bottom Input Area */}
        <footer className="shrink-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-[#090a0f] dark:via-[#090a0f] dark:to-transparent pt-2">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isQuerying}
            useExpansion={useExpansion}
            setUseExpansion={setUseExpansion}
            useReranker={useReranker}
            setUseReranker={setUseReranker}
            voice={voice}
            setVoice={setVoice}
            voiceLang={voiceLang}
            setVoiceLang={setVoiceLang}
          />
        </footer>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
