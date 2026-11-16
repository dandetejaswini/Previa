import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  X,
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
} from "lucide-react";
import {
  SupplyChainGraphNode,
  SupplyChainQueryResponse,
  ShipmentRecord,
  RiskRecord,
} from "../../types";

export interface ContextualEntity {
  type: "shipment" | "risk" | "supplier" | "node";
  shipment?: ShipmentRecord | null;
  risk?: RiskRecord | null;
  supplierName?: string | null;
  node?: SupplyChainGraphNode | null;
}

interface SupplyChainQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ContextualEntity | null;
  initialNode?: SupplyChainGraphNode | null;
}

export const SupplyChainQueryModal: React.FC<SupplyChainQueryModalProps> = ({
  isOpen,
  onClose,
  context,
  initialNode,
}) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      question: string;
      response: SupplyChainQueryResponse;
      timestamp: string;
      contextSummary?: string;
    }>
  >([]);

  // Automatically formulate contextual suggestion when context arrives
  useEffect(() => {
    if (!isOpen) return;

    if (context?.shipment) {
      setQuestion(`Why is shipment ${context.shipment.shipmentId} at risk and what caused this delay?`);
    } else if (context?.risk) {
      setQuestion(`Explain risk: "${context.risk.title}" and recommend next actions.`);
    } else if (context?.supplierName) {
      setQuestion(`Which purchase orders and shipments are affected by supplier ${context.supplierName}?`);
    } else if (initialNode) {
      setQuestion(`Why is ${initialNode.label} at risk and what downstream operations are affected?`);
    }
  }, [isOpen, context, initialNode]);

  if (!isOpen) return null;

  const handleSubmit = async (overrideQ?: string) => {
    const q = (overrideQ || question).trim();
    if (!q) return;

    setLoading(true);
    try {
      const activeNode = context?.node || initialNode;
      const res = await fetch("/api/agents/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          selectedNode: activeNode,
          contextData: {
            shipment: context?.shipment,
            risk: context?.risk,
            supplier: context?.supplierName,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.execution?.result) {
        setHistory((prev) => [
          {
            question: q,
            response: data.execution.result as SupplyChainQueryResponse,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            contextSummary:
              context?.shipment?.shipmentId ||
              context?.risk?.title ||
              context?.supplierName ||
              initialNode?.label,
          },
          ...prev,
        ]);
        setQuestion("");
      }
    } catch (err) {
      console.error("[AskPrevia Error]:", err);
    } finally {
      setLoading(false);
    }
  };

  // Section 12 explicit sample questions
  const samplePrompts = [
    "Why is this shipment at risk?",
    "What caused this delay?",
    "Which suppliers are affected?",
    "What should I do next?",
    "Explain this risk.",
    "What changed today?",
    "Which decisions require my attention?",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-charcoal/60 backdrop-blur-xs flex justify-end">
      {/* Slide-in Right Assistant Drawer */}
      <div className="bg-white border-l border-graphite w-full max-w-xl h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-graphite bg-[#211A27] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2F6F6D] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#D9A441]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-editorial font-bold text-white tracking-tight">
                  Ask Previa
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B86F52] text-white font-bold">
                  Supply Chain Query Agent
                </span>
              </div>
              <p className="text-[11px] text-[#D8D0C3] font-mono">
                Contextual supply chain intelligence assistant
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#D8D0C3] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Context Banner if user selected a shipment, risk, or supplier */}
        {(context?.shipment || context?.risk || context?.supplierName || initialNode) && (
          <div className="p-3.5 bg-[#FAF8F4] border-b border-graphite shrink-0 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px] font-bold text-charcoal">
              <span className="flex items-center gap-1.5 text-[#2F6F6D] uppercase">
                <Layers className="w-3.5 h-3.5" />
                <span>Active Context Detected</span>
              </span>
              <span className="text-[10px] text-charcoal-muted">Auto-grounded</span>
            </div>

            {/* Shipment Context */}
            {context?.shipment && (
              <div className="p-2.5 bg-white border border-graphite/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal flex items-center gap-1">
                    <Ship className="w-3 h-3 text-[#B86F52]" />
                    <span>Shipment: {context.shipment.shipmentId}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                    {context.shipment.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-charcoal-muted">
                  <span>Route: {context.shipment.origin || "Origin"} &rarr; {context.shipment.destination || "Destination"}</span>
                  <span>ETA: {context.shipment.eta || "Pending"}</span>
                  <span>Risk: {context.shipment.severity || "Normal"}</span>
                  <span>PO: {context.shipment.poNumber || "Contracted"}</span>
                </div>
              </div>
            )}

            {/* Risk Context */}
            {context?.risk && (
              <div className="p-2.5 bg-white border border-graphite/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-[#B86F52]" />
                    <span>Risk: {context.risk.title}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    {context.risk.severity}
                  </span>
                </div>
                <div className="text-[11px] text-charcoal-muted">
                  Category: {context.risk.category} &bull; Supplier: {context.risk.supplierId || "Multi-entity"}
                </div>
              </div>
            )}

            {/* Supplier Context */}
            {context?.supplierName && !context.shipment && !context.risk && (
              <div className="p-2.5 bg-white border border-graphite/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#2F6F6D]" />
                    <span>Supplier: {context.supplierName}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    Active Vendor
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Feed / History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 pr-3">
          {history.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-mist/60 border border-graphite mx-auto flex items-center justify-center text-[#B86F52]">
                <MessageSquare className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-charcoal">
                  Ask Previa anything about your supply chain
                </h4>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  The query agent checks verified operational ledger records, calculated drift, and multi-tier network dependencies without fabricating facts.
                </p>
              </div>

              {/* Sample Quick Questions */}
              <div className="pt-2 space-y-2 text-left">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-muted block">
                  Suggested Contextual Queries:
                </span>
                <div className="flex flex-col gap-1.5">
                  {samplePrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSubmit(p)}
                      className="text-left text-xs font-mono p-2.5 bg-[#FAF8F4] hover:bg-stone-mist border border-graphite/70 rounded-xl text-charcoal transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span>&ldquo;{p}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-[#B86F52] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="space-y-3">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-[#211A27] text-white p-3.5 rounded-2xl rounded-tr-xs text-xs font-mono space-y-1 shadow-xs">
                    <p>{h.question}</p>
                    <span className="text-[9px] text-[#A39CA8] block text-right">
                      {h.timestamp}
                    </span>
                  </div>
                </div>

                {/* Agent Answer */}
                <div className="flex justify-start">
                  <div className="max-w-[95%] bg-[#FAF8F4] border border-graphite p-4 rounded-2xl rounded-tl-xs text-xs space-y-3 shadow-xs font-mono">
                    <div className="flex items-center justify-between border-b border-graphite/60 pb-2">
                      <span className="font-bold text-[#2F6F6D] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#B86F52]" />
                        <span>Previa Verified Intelligence</span>
                      </span>
                      <span className="text-[10px] text-charcoal-muted">Supply Chain Query Agent</span>
                    </div>

                    <div className="text-charcoal leading-relaxed whitespace-pre-wrap font-sans text-xs">
                      {h.response.answer}
                    </div>

                    {h.response.recommendations && h.response.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-graphite/40 space-y-1">
                        <span className="font-bold text-charcoal text-[11px]">Recommended Actions:</span>
                        <ul className="list-disc pl-4 space-y-1 text-charcoal-muted text-[11px] font-sans">
                          {h.response.recommendations.map((rec, rIdx) => (
                            <li key={rIdx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="p-4 bg-[#FAF8F4] border border-graphite rounded-2xl flex items-center gap-3 text-xs font-mono text-charcoal-muted">
              <Clock className="w-4 h-4 animate-spin text-[#B86F52]" />
              <span>Checking operational ledger, active risks, and carrier telemetry...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-graphite bg-white shrink-0 space-y-2">
          {/* Quick chips if history exists */}
          {history.length > 0 && (
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
              {samplePrompts.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSubmit(p)}
                  className="px-2 py-0.5 rounded-lg bg-stone-mist/50 hover:bg-stone-mist text-charcoal border border-graphite/60 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about risks, shipments, or suppliers..."
              className="flex-1 px-4 py-2.5 bg-stone-mist/30 border border-graphite rounded-xl text-xs font-mono text-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:border-[#B86F52]"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="p-2.5 bg-[#211A27] hover:bg-[#3A3043] disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4 text-[#B86F52]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
