import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { askRAGChatbot, getKnowledgeBaseDocuments } from "../lib/knowledgeBaseService";
import { RAGChatMessage, RAGSourceCitation, KnowledgeBaseDocument } from "../types";
import ReactMarkdown from "react-markdown";
import { PreviaBrand } from "./brand/PreviaBrand";

interface RAGChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RAGChatbotModal: React.FC<RAGChatbotModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, isLoadingAuth, openAuthModal, currentUser } = useAuth();
  const [messages, setMessages] = useState<RAGChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am the Previa Enterprise Knowledge Base Assistant. I provide strictly grounded answers synthesized directly from your organization's uploaded supply chain agreements, standard operating procedures, customs schedules, and operational documents.\n\nHow can I assist your logistics and procurement analysis today?",
      timestamp: Date.now(),
      groundedChunkCount: 0,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeDocuments, setActiveDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<RAGSourceCitation | null>(null);
  const [expandedCitationsMsgId, setExpandedCitationsMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load document count for status indicator ONLY when authentication is initialized and user is authenticated
  useEffect(() => {
    if (isOpen && !isLoadingAuth && isAuthenticated && currentUser) {
      getKnowledgeBaseDocuments()
        .then((docs) => setActiveDocuments(docs))
        .catch((err) => console.warn("[Previa RAG] Could not load KB docs for status:", err));
    } else if (!isAuthenticated) {
      setActiveDocuments([]);
    }
  }, [isOpen, isLoadingAuth, isAuthenticated, currentUser]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputValue).trim();
    if (!question || isLoading) return;

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const userMessage: RAGChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: question,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("model" as const),
          content: m.content,
        }));

      const response = await askRAGChatbot(question, history);

      const assistantMessage: RAGChatMessage = {
        id: `assist_${Date.now()}`,
        role: "assistant",
        content: response.answer,
        timestamp: Date.now(),
        citations: response.citations,
        groundedChunkCount: response.groundedChunkCount,
        isInsufficientKnowledge: response.isInsufficientKnowledge,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (response.citations && response.citations.length > 0) {
        setExpandedCitationsMsgId(assistantMessage.id);
      }
    } catch (error: any) {
      console.error("[Previa RAG UI] Query error:", error);
      const rawMsg = error?.message || "";
      let userDisplayMsg = "Previa AI could not synthesize the answer right now. Please try again.";

      if (
        rawMsg.includes("temporarily unavailable") ||
        rawMsg.includes("GEMINI_UNAVAILABLE") ||
        rawMsg.includes("503") ||
        rawMsg.includes("high demand")
      ) {
        userDisplayMsg =
          "Previa AI is temporarily unavailable while synthesizing the grounded answer. Please try again in a moment.";
      } else if (
        rawMsg &&
        !rawMsg.includes("<") &&
        !rawMsg.includes("token") &&
        !rawMsg.includes("JSON") &&
        !rawMsg.includes("fetch") &&
        !rawMsg.includes("backend service is reachable")
      ) {
        userDisplayMsg = rawMsg;
      }

      const errorMessage: RAGChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: userDisplayMsg,
        timestamp: Date.now(),
        groundedChunkCount: 0,
        isInsufficientKnowledge: false, // Do not falsely claim the Knowledge Base is missing if Gemini generation failed
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: "assistant",
        content:
          "Conversation history cleared. Ask any question grounded in the organization's Knowledge Base documentation.",
        timestamp: Date.now(),
        groundedChunkCount: 0,
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#16111B]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="rag-chatbot-modal-container"
        className="bg-white border border-graphite rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] max-h-[750px] flex flex-col overflow-hidden text-charcoal"
      >
        {/* Modal Header */}
        <div className="bg-[#201A24] text-white px-5 py-4 border-b border-[#362C3E] flex items-center justify-between">
          <PreviaBrand
            variant="dark"
            size="sm"
            subtitleText="Knowledge-Grounded Enterprise Assistant"
          />

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white border border-white/20">
              Documents grounded: {activeDocuments.length}
            </span>
            <button
              id="rag-clear-history-btn"
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-1.5 rounded-lg text-[#A39CA8] hover:text-white hover:bg-[#32273C] transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] font-medium">Reset</span>
            </button>
            <button
              id="rag-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A39CA8] hover:text-white hover:bg-[#32273C] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpus Status Bar */}
        <div className="bg-[#FAF8F4] border-b border-[#E8E2D7] px-5 py-2 flex items-center justify-between text-xs text-charcoal-muted">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isAuthenticated ? "bg-forest animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-[11px] font-medium">
              Knowledge Source:{" "}
              <strong className="text-charcoal font-semibold">
                {!isAuthenticated
                  ? "Sign in required to access enterprise corpus"
                  : activeDocuments.length > 0
                  ? `${activeDocuments.length} enterprise documents`
                  : "Empty corpus (Admin may ingest docs in Knowledge Base)"}
              </strong>
            </span>
          </div>
          <span className="text-[10px] font-mono text-charcoal-muted">
            Model: Gemini 3.6 Flash
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-parchment/40">
          {!isAuthenticated ? (
            <div className="my-auto py-10 px-4 text-center max-w-sm mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold font-editorial text-charcoal">
                  Sign in to use the Previa Knowledge Assistant
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Access to verified enterprise knowledge documents and grounded RAG synthesis requires an authenticated operator session.
                </p>
              </div>
              <button
                onClick={() => openAuthModal()}
                className="w-full py-2.5 px-4 bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In with Google
              </button>
            </div>
          ) : (
            messages.map((msg) => {
            const isUser = msg.role === "user";
            const isExpanded = expandedCitationsMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#211A27] text-[#B86F52] flex items-center justify-center shrink-0 border border-[#3A3043] mt-1 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-[#D9A441]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? "bg-[#211A27] text-white rounded-tr-xs shadow-sm font-medium"
                      : "bg-white border border-graphite text-charcoal rounded-tl-xs shadow-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="rag-markdown-body text-xs text-charcoal leading-relaxed">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-sm sm:text-base font-bold text-charcoal font-editorial mt-3.5 mb-1.5 first:mt-0 tracking-tight">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xs sm:text-sm font-bold text-charcoal font-editorial mt-3 mb-1.5 first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs sm:text-sm font-bold text-charcoal font-editorial mt-2.5 mb-1 first:mt-0">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-xs font-bold text-charcoal mt-2 mb-1 first:mt-0">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="leading-relaxed mb-2.5 last:mb-0">
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-charcoal">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-charcoal">
                              {children}
                            </em>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 space-y-1 mb-2.5">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 space-y-1 mb-2.5">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed pl-0.5">
                              {children}
                            </li>
                          ),
                          hr: () => (
                            <hr className="my-3 border-t border-[#EAE3D8]" />
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-copper/60 pl-3 my-2 text-charcoal-muted italic">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="px-1.5 py-0.5 bg-[#FAF8F4] border border-[#EAE3D8] rounded text-[11px] font-mono text-charcoal">
                              {children}
                            </code>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2.5">
                              <table className="w-full text-left border-collapse text-[11px] border border-graphite">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-graphite bg-[#FAF8F4] px-2.5 py-1.5 font-bold text-charcoal">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-graphite px-2.5 py-1 text-charcoal">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Citations block for Assistant */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#EAE3D8]">
                      <button
                        onClick={() =>
                          setExpandedCitationsMsgId(isExpanded ? null : msg.id)
                        }
                        className="flex items-center justify-between w-full text-[11px] font-bold text-copper hover:text-[#975338] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            Grounded in {msg.citations.length} Verified Excerpt
                            {msg.citations.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                          {msg.citations.map((cit: RAGSourceCitation, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedCitation(cit)}
                              className="p-2 rounded-lg bg-[#F8F5F0] border border-[#E4DCCE] hover:border-copper/40 transition-colors cursor-pointer text-[10px]"
                            >
                              <div className="flex items-center justify-between font-mono font-bold text-charcoal">
                                <span className="truncate max-w-[200px] text-copper">
                                  {cit.fileName}
                                </span>
                                <span className="text-charcoal-muted">
                                  {cit.pageNumber ? `Page ${cit.pageNumber}` : ""}
                                  {cit.section && cit.section !== "undefined" ? ` • ${cit.section}` : ""}
                                </span>
                              </div>
                              {cit.excerpt && (
                                <p className="text-charcoal-muted mt-1 italic line-clamp-2">
                                  "{cit.excerpt}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!isUser && msg.isInsufficientKnowledge && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                      <span>
                        The system prioritized factual safety over guessing. If you believe this documentation exists, verify that an Admin has uploaded the document into the Knowledge Base.
                      </span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#B86F52] text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs font-mono font-bold text-xs">
                    {(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#211A27] text-[#B86F52] flex items-center justify-center shrink-0 border border-[#3A3043]">
                <Sparkles className="w-4 h-4 text-[#D9A441] animate-spin" />
              </div>
              <div className="bg-white border border-graphite rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-copper animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-copper animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-copper animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-xs text-charcoal-muted font-medium">
                  Retrieving chunks & synthesizing grounded response...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        {isAuthenticated && messages.length <= 2 && (
          <div className="px-5 py-2 bg-[#FAF8F4] border-t border-[#EAE3D8] flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-charcoal-muted text-[10px] font-mono shrink-0">
              Suggestions:
            </span>
            <button
              onClick={() =>
                handleSendMessage("What are our primary supplier SLA terms and delivery thresholds?")
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-graphite hover:border-copper text-charcoal font-medium shrink-0 transition-colors cursor-pointer"
            >
              Supplier SLA terms
            </button>
            <button
              onClick={() =>
                handleSendMessage("What is the demurrage grace period and detention fee protocol?")
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-graphite hover:border-copper text-charcoal font-medium shrink-0 transition-colors cursor-pointer"
            >
              Demurrage grace period
            </button>
            <button
              onClick={() =>
                handleSendMessage("What are the standard contingency rerouting procedures for port congestion?")
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-graphite hover:border-copper text-charcoal font-medium shrink-0 transition-colors cursor-pointer"
            >
              Port congestion contingency
            </button>
          </div>
        )}

        {/* Modal Input Footer */}
        {!isAuthenticated ? (
          <div className="p-4 bg-white border-t border-graphite flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-charcoal-muted">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Authentication required to query the Knowledge Base</span>
            </div>
            <button
              onClick={() => openAuthModal()}
              className="px-4 py-2 bg-[#211A27] hover:bg-[#2F2437] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="p-4 bg-white border-t border-graphite">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  id="rag-chat-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask any question grounded in the Knowledge Base..."
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#FAF8F4] border border-graphite rounded-xl text-xs text-charcoal placeholder:text-charcoal-muted focus:outline-hidden focus:border-copper focus:ring-1 focus:ring-copper/20"
                />
              </div>

              <button
                id="rag-chat-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2.5 bg-copper hover:bg-[#A25E43] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-charcoal-muted mt-2 px-1">
              <span>
                Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[9px] font-mono">Enter</kbd> to send
              </span>
              <span className="flex items-center gap-1 text-forest font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Factual Grounding Active
              </span>
            </div>
          </div>
        )}

        {/* Citation Detail Inspector Drawer */}
        {selectedCitation && (
          <div className="absolute inset-0 bg-[#16111B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white border border-graphite rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-graphite pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-copper" />
                  <h3 className="text-xs font-bold text-charcoal">
                    Verified Citation Excerpt
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="p-1 text-charcoal-muted hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#FAF8F4] p-3 rounded-lg border border-[#EAE3D8] text-[11px] font-mono space-y-1">
                <div>
                  <strong className="text-charcoal">Source Document:</strong>{" "}
                  <span className="text-copper">{selectedCitation.fileName}</span>
                </div>
                {selectedCitation.pageNumber && (
                  <div>
                    <strong className="text-charcoal">Page:</strong> {selectedCitation.pageNumber}
                  </div>
                )}
                {selectedCitation.section && selectedCitation.section !== "undefined" && (
                  <div>
                    <strong className="text-charcoal">Section:</strong> {selectedCitation.section}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted mb-1">
                  Extracted Context Text:
                </p>
                <div className="p-3 bg-white border border-graphite rounded-lg max-h-48 overflow-y-auto text-xs text-charcoal leading-relaxed whitespace-pre-wrap">
                  {selectedCitation.excerpt}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="px-3 py-1.5 bg-charcoal text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close Excerpt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
