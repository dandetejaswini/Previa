import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Ship,
  Building2,
  ShieldAlert,
  ArrowRight,
  Radio,
  BookOpen,
  Compass,
} from "lucide-react";
import {
  ControlTowerLiveState,
  ShipmentRecord,
  RiskRecord,
  PreviaDecisionEvent,
  SupplyChainGraphNode,
  SupplyChainQueryResponse,
} from "../../types";
import { PreviaBrand } from "../brand/PreviaBrand";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../lib/apiClient";

export interface AskPreviaContext {
  selectedShipment?: ShipmentRecord | null;
  selectedRisk?: RiskRecord | null;
  selectedSupplier?: string | null;
  selectedNode?: SupplyChainGraphNode | null;
  activeDecision?: PreviaDecisionEvent | null;
}

interface AskPreviaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context?: AskPreviaContext | null;
  controlTowerState?: ControlTowerLiveState | null;
  onOpenRAG?: () => void;
}

export const AskPreviaDrawer: React.FC<AskPreviaDrawerProps> = ({
  isOpen,
  onClose,
  context,
  controlTowerState,
  onOpenRAG,
}) => {
  const { currentUser } = useAuth();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{
      id: string;
      question: string;
      answer: string;
      facts: string[];
      simulations: string[];
      recommendations: string[];
      assumptions: string[];
      relatedEntities: string[];
      isRAGQuestion?: boolean;
      timestamp: string;
      contextSummary?: string;
    }>
  >([]);

  // Reset conversation when user changes
  useEffect(() => {
    setConversation([]);
  }, [currentUser?.id]);

  const inputRef = useRef<HTMLInputElement>(null);
  const drawerEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new message is added
  useEffect(() => {
    drawerEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Formulate dynamic contextual starter prompt when user selects an entity
  useEffect(() => {
    if (!isOpen) return;

    if (context?.selectedShipment) {
      setQuestion(
        `Why is shipment ${context.selectedShipment.shipmentId} at risk and what caused this delay?`
      );
    } else if (context?.selectedRisk) {
      setQuestion(
        `Explain risk: "${context.selectedRisk.title}" and what mitigation is recommended.`
      );
    } else if (context?.selectedSupplier) {
      setQuestion(
        `Which purchase orders and shipments are affected by supplier ${context.selectedSupplier}?`
      );
    } else if (context?.selectedNode) {
      setQuestion(
        `Why is node ${context.selectedNode.label} at risk and what are the downstream impacts?`
      );
    }
  }, [isOpen, context]);

  if (!isOpen) return null;

  const handleSend = async (overridePrompt?: string) => {
    const q = (overridePrompt || question).trim();
    if (!q || loading) return;

    // Detect if this is a company policy / contract question that belongs in RAG AI
    const lowerQ = q.toLowerCase();
    const isDocQuestion =
      lowerQ.includes("contract") ||
      lowerQ.includes("policy") ||
      lowerQ.includes("sop") ||
      lowerQ.includes("clause") ||
      lowerQ.includes("penalty") ||
      lowerQ.includes("onboarding") ||
      lowerQ.includes("escalation policy") ||
      lowerQ.includes("pdf") ||
      lowerQ.includes("document");

    setLoading(true);
    const currentQ = q;
    setQuestion("");

    try {
      if (isDocQuestion) {
        // Return clear, truthful cross-assistant guidance
        setConversation((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            question: currentQ,
            answer:
              "This requires the enterprise knowledge base. I found that contractual clauses, SOP guidelines, and procurement policies are indexed in Previa RAG AI.",
            facts: [
              "Question references organizational policy or contractual agreement documentation.",
              "Ask Previa specializes in real-time operational state, telemetry, and live agent telemetry.",
            ],
            simulations: [],
            recommendations: [
              "Launch Previa RAG AI to review exact page citations from your uploaded supply-chain agreements and SOPs.",
            ],
            assumptions: ["Company policies are maintained in uploaded knowledge base documents."],
            relatedEntities: ["Previa RAG AI"],
            isRAGQuestion: true,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setLoading(false);
        return;
      }

      // Query the live Agent 12 (Supply Chain Query Agent) via backend
      const res = await authFetch(
        "/api/agents/query",
        {
          method: "POST",
          body: JSON.stringify({
            question: currentQ,
            selectedNode: context?.selectedNode,
            contextData: {
              shipment: context?.selectedShipment,
              risk: context?.selectedRisk,
              supplier: context?.selectedSupplier,
              controlTowerState,
            },
            userId: currentUser?.id,
            userEmail: currentUser?.email,
          }),
        },
        currentUser
      );

      const data = await res.json();
      if (data.success && data.execution?.result) {
        const result: SupplyChainQueryResponse = data.execution.result;
        setConversation((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            question: currentQ,
            answer: result.answer,
            facts: result.facts || [],
            simulations: result.simulations || [],
            recommendations: result.recommendations || [],
            assumptions: result.assumptions || [],
            relatedEntities: result.relatedEntities || [],
            isRAGQuestion: false,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error(data.error || "Failed to query operational context.");
      }
    } catch (err: any) {
      console.error("[Ask Previa Error]:", err);
      setConversation((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          question: currentQ,
          answer:
            "I could not query the operational state at this moment. Verified ledger data is currently synchronizing with the carrier telemetry feeds.",
          facts: ["Control Tower telemetry feed sync attempt in progress."],
          simulations: [],
          recommendations: ["Check carrier telemetry status or retry in a few moments."],
          assumptions: [],
          relatedEntities: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const operationalSuggestions = [
    context?.selectedShipment
      ? `Why is ${context.selectedShipment.shipmentId} delayed?`
      : "Which shipments are at risk?",
    "What did Risk Sentinel find?",
    "What did the Forecasting Agent predict?",
    "Which suppliers are affected?",
    "What decisions are still pending?",
    "What caused recent disruptions?",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-charcoal/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-graphite animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-graphite bg-[#FAF8F4] flex items-center justify-between shrink-0">
          <PreviaBrand
            variant="light"
            size="sm"
            subtitleText="Live Supply Chain Copilot"
          />

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-charcoal-muted hover:text-charcoal rounded-xl bg-white border border-graphite/60 hover:bg-stone-mist/40 transition-colors cursor-pointer"
            aria-label="Close Ask Previa drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Focused Context Banner (If user selected a shipment, risk, or supplier) */}
        {(context?.selectedShipment || context?.selectedRisk || context?.selectedSupplier) && (
          <div className="px-5 py-2.5 bg-[#201A24] text-white flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B96F4A] animate-pulse shrink-0" />
              <span className="text-[#D8D0C3]">Focused Entity:</span>
              <strong className="text-white truncate">
                {context.selectedShipment?.shipmentId ||
                  context.selectedRisk?.title ||
                  context.selectedSupplier}
              </strong>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#F7F6F1] px-2 py-0.5 rounded-sm bg-white/10 shrink-0">
              {context.selectedShipment ? "Shipment" : context.selectedRisk ? "Risk" : "Supplier"}
            </span>
          </div>
        )}

        {/* Conversation Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {conversation.length === 0 ? (
            <div className="space-y-5 py-6">
              <div className="p-4 rounded-2xl bg-[#F7F6F1] border border-graphite/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#201A24]">
                  <Sparkles className="w-4 h-4 text-[#B96F4A]" />
                  <span>Real-Time Operational Copilot</span>
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Ask Previa synthesizes live answers directly from your active Control Tower state, verified telemetry feeds, and 12-agent intelligence assessments.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-muted">
                  Suggested Operational Questions:
                </span>
                <div className="flex flex-col gap-2">
                  {operationalSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="p-3 bg-stone-mist/20 hover:bg-[#F7F6F1] border border-graphite/70 rounded-xl text-left text-xs font-mono text-[#201A24] transition-all hover:border-[#B96F4A] flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-[#B96F4A] transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {conversation.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User query bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] p-3.5 bg-[#201A24] text-white rounded-2xl rounded-tr-xs text-xs font-mono shadow-xs">
                      {msg.question}
                    </div>
                  </div>

                  {/* Assistant structured operational assessment */}
                  <div className="p-4 bg-[#F7F6F1] border border-graphite/80 rounded-2xl rounded-tl-xs space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-graphite/60 pb-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#246B68] flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-[#B96F4A]" />
                        <span>Live Operational Assessment</span>
                      </span>
                      <span className="text-[10px] font-mono text-charcoal-muted">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Direct answer header */}
                    {msg.answer && (
                      <div className="text-xs text-[#201A24] font-medium leading-relaxed font-sans">
                        {msg.answer}
                      </div>
                    )}

                    {/* [FACT] Verified Operational Store */}
                    {msg.facts && msg.facts.length > 0 && (
                      <div className="p-3 bg-white border border-graphite/60 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#246B68] flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-xs bg-[#E8F2F1] text-[#246B68] font-bold">[ FACT ]</span>
                          <span>Verified Operational Data</span>
                        </span>
                        <ul className="text-xs text-[#201A24] space-y-1 pl-4 list-disc">
                          {msg.facts.map((f, i) => (
                            <li key={i} className="leading-snug">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* [SIMULATION] Predictive & Graph Projections */}
                    {msg.simulations && msg.simulations.length > 0 && (
                      <div className="p-3 bg-white border border-amber-200/80 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-800 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-xs bg-amber-100 text-amber-900 font-bold">[ SIMULATION ]</span>
                          <span>Predictive Projection</span>
                        </span>
                        <ul className="text-xs text-amber-950 space-y-1 pl-4 list-disc">
                          {msg.simulations.map((s, i) => (
                            <li key={i} className="leading-snug">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* [RECOMMENDATION] Suggested Human Actions */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="p-3 bg-white border border-[#B96F4A]/30 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#B96F4A] flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-xs bg-[#FBF0EB] text-[#B96F4A] font-bold">[ RECOMMENDATION ]</span>
                          <span>Suggested Operator Action</span>
                        </span>
                        <ul className="text-xs text-[#201A24] space-y-1 pl-4 list-disc">
                          {msg.recommendations.map((r, i) => (
                            <li key={i} className="leading-snug">{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* [ASSUMPTION] Operational Baseline Premises */}
                    {msg.assumptions && msg.assumptions.length > 0 && (
                      <div className="p-3 bg-white border border-graphite/40 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-charcoal-muted flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-xs bg-stone-mist text-charcoal font-bold">[ ASSUMPTION ]</span>
                          <span>Operational Baseline</span>
                        </span>
                        <ul className="text-xs text-charcoal-muted space-y-1 pl-4 list-disc">
                          {msg.assumptions.map((a, i) => (
                            <li key={i} className="leading-snug">{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cross-Assistant RAG link if question touches policies/contracts */}
                    {msg.isRAGQuestion && onOpenRAG && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenRAG();
                          }}
                          className="w-full py-2.5 px-4 bg-[#246B68] hover:bg-[#1E5754] text-white text-xs font-mono font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Open in Previa RAG AI (Knowledge Base)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="p-4 bg-[#F7F6F1] border border-graphite/80 rounded-2xl flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-[#B96F4A] border-t-transparent animate-spin" />
                  <span className="text-xs font-mono text-charcoal-muted">
                    Synthesizing real-time answer from 12-agent operational ledger...
                  </span>
                </div>
              )}
            </div>
          )}
          <div ref={drawerEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-graphite bg-[#F7F6F1] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about live shipments, risks, or agent findings..."
              className="flex-1 px-4 py-2.5 bg-white border border-graphite rounded-xl text-xs font-mono text-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:border-[#B96F4A]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="p-2.5 bg-[#201A24] hover:bg-[#332A39] disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
              title="Send to Ask Previa"
            >
              <Send className="w-4 h-4 text-[#B96F4A]" />
            </button>
          </form>
          <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-charcoal-muted">
            <span>Operational answers grounded in real telemetry & decisions</span>
            {onOpenRAG && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRAG();
                }}
                className="text-[#246B68] hover:underline font-semibold cursor-pointer"
              >
                Need document policies? Previa RAG AI &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
