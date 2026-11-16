import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AgentExecutionRecord, PreviaAgentId } from "../../types";

interface AgentIntelligenceSectionProps {
  agentResults?: Record<string, AgentExecutionRecord> | null;
  isOrchestrating?: boolean;
  onNavigateControlTower?: () => void;
  runId?: string;
}

// Human-readable descriptions and staged order for all 12 Previa core agents
const AGENT_CATALOG: {
  id: PreviaAgentId;
  name: string;
  stage: string;
  stageNum: 1 | 2 | 3;
  taskDescription: string;
}[] = [
  {
    id: "shipment_tracker",
    name: "Shipment Tracker",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Tracking real-time milestone & AIS telemetry",
  },
  {
    id: "disruption_intelligence",
    name: "Disruption Intelligence",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Assessing maritime and port corridor disruptions",
  },
  {
    id: "risk_sentinel",
    name: "Risk Sentinel",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Evaluating supplier and milestone risk",
  },
  {
    id: "impact_analyzer",
    name: "Impact & Financial Analyzer",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Calculating financial exposure and production buffer drift",
  },
  {
    id: "forecasting_agent",
    name: "Forecasting Agent",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Projecting delivery timelines and inventory horizons",
  },
  {
    id: "supplier_intelligence",
    name: "Supplier Intelligence Agent",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Analyzing supplier fulfillment reliability",
  },
  {
    id: "anomaly_detection",
    name: "Anomaly Detection Agent",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Detecting statistical schedule and rate variances",
  },
  {
    id: "document_vision",
    name: "Document & Vision Intelligence",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Analyzing manifests, contracts, and supplier communications",
  },
  {
    id: "graph_intelligence",
    name: "Graph & Dependency Intelligence",
    stage: "Stage 1",
    stageNum: 1,
    taskDescription: "Tracing multi-tier topological dependencies",
  },
  {
    id: "scenario_optimization",
    name: "Scenario, Optimization & Mitigation Agent",
    stage: "Stage 2",
    stageNum: 2,
    taskDescription: "Synthesizing and ranking mitigation playbooks",
  },
  {
    id: "user_activity",
    name: "User Activity Agent",
    stage: "Stage 3",
    stageNum: 3,
    taskDescription: "Tracking operator decisions and audit verification",
  },
  {
    id: "supply_chain_query",
    name: "Supply Chain Query Agent",
    stage: "Stage 3",
    stageNum: 3,
    taskDescription: "Grounded conversational query execution",
  },
];

export const AgentIntelligenceSection: React.FC<AgentIntelligenceSectionProps> = ({
  agentResults,
  isOrchestrating = false,
  onNavigateControlTower,
  runId,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentExecutionRecord | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!agentResults && !isOrchestrating) {
    return null;
  }

  const results = agentResults || {};

  // Compute accurate execution breakdown
  const stats = React.useMemo(() => {
    let running = 0;
    let complete = 0;
    let waiting = 0;
    let failed = 0;

    AGENT_CATALOG.forEach(({ id, stageNum }) => {
      const record = results[id];
      if (record) {
        if (record.status === "COMPLETE") complete++;
        else if (record.status === "FAILED") failed++;
        else if (record.status === "RUNNING") running++;
        else waiting++;
      } else if (isOrchestrating) {
        if (stageNum === 1) running++;
        else if (stageNum === 2) waiting++;
        else waiting++;
      } else {
        waiting++;
      }
    });

    return { running, complete, waiting, failed, total: AGENT_CATALOG.length };
  }, [results, isOrchestrating]);

  return (
    <div className="bg-white border border-[#211A27]/20 rounded-2xl p-6 shadow-xs space-y-5 transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-graphite/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#211A27] text-white flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#B86F52]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-editorial font-bold text-charcoal tracking-tight">
                  AI INTELLIGENCE LAYER
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#E8F2F1] text-[#2F6F6D] font-bold border border-[#CDE2E1]">
                  12 Agents
                </span>
              </div>
              <p className="text-xs text-charcoal-muted">
                12 agents analyzing this scenario across Staged Concurrency
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateControlTower && (
            <button
              type="button"
              onClick={onNavigateControlTower}
              className="px-3.5 py-1.5 bg-[#B86F52] hover:bg-[#A25E43] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Control Tower</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-charcoal-muted hover:text-charcoal bg-stone-mist/30 rounded-lg transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Honest Execution Counter Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-stone-mist/30 border border-graphite/60 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-charcoal-muted font-bold">Execution Fleet:</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              Running: {stats.running}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              Complete: {stats.complete}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
              Waiting: {stats.waiting}
            </span>
            {stats.failed > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                Failed: {stats.failed}
              </span>
            )}
          </div>
        </div>
        {runId && <span className="text-charcoal-muted text-[11px]">Run ID: {runId}</span>}
      </div>

      {/* Grid of Compact Agent Execution Cards */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENT_CATALOG.map(({ id, name, stage, stageNum, taskDescription }) => {
            const record = results[id];
            const isComplete = record?.status === "COMPLETE";
            const isFailed = record?.status === "FAILED";
            const isRunning = isOrchestrating && !record && stageNum === 1;
            const isWaiting = (!record && isOrchestrating && stageNum > 1) || (!record && !isOrchestrating);

            const statusLabel = isComplete
              ? "Complete"
              : isRunning
              ? "Running"
              : isFailed
              ? "Failed"
              : "Waiting";

            return (
              <div
                key={id}
                onClick={() => record && setSelectedAgent(record)}
                className={`p-3.5 bg-stone-mist/20 hover:bg-stone-mist/40 border border-graphite/70 rounded-xl flex flex-col justify-between text-xs transition-colors ${
                  record ? "cursor-pointer" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-charcoal truncate">{name}</span>
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isComplete
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isRunning
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : isFailed
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isComplete
                            ? "bg-emerald-500"
                            : isRunning
                            ? "bg-amber-500 animate-pulse"
                            : isFailed
                            ? "bg-rose-500"
                            : "bg-blue-400"
                        }`}
                      />
                      {statusLabel}
                    </span>
                  </div>

                  {/* Simple human-readable description */}
                  <p className="text-[11px] text-charcoal-muted leading-relaxed line-clamp-2">
                    &ldquo;{taskDescription}&rdquo;
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-graphite/40 flex items-center justify-between text-[10px] font-mono text-charcoal-muted">
                  <span>{stage}</span>
                  <span>
                    {record
                      ? record.durationMs !== undefined
                        ? `${record.durationMs}ms duration`
                        : "Verified"
                      : isRunning
                      ? "Analyzing..."
                      : "Standing by"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Inspector Modal if an agent card is clicked */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
          <div className="bg-white border border-graphite rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-graphite pb-3">
              <div>
                <h4 className="text-sm font-bold text-charcoal">{selectedAgent.agentName}</h4>
                <p className="text-xs text-charcoal-muted font-mono">Agent ID: {selectedAgent.agentId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="p-1 text-charcoal-muted hover:text-charcoal cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="p-3 bg-stone-mist/30 rounded-xl space-y-1">
                <span className="font-bold text-charcoal block">Input Reference</span>
                <p className="font-mono text-charcoal-muted text-[11px]">{selectedAgent.inputReference || "Scenario Payload"}</p>
              </div>

              {selectedAgent.evidence && selectedAgent.evidence.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-charcoal block">Evidence & Grounding</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-charcoal-muted text-[11px]">
                    {selectedAgent.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAgent.result && (
                <div className="space-y-1">
                  <span className="font-bold text-charcoal block">Findings</span>
                  <pre className="p-3 bg-stone-mist/30 border border-graphite rounded-xl font-mono text-[10px] text-charcoal overflow-x-auto max-h-48">
                    {JSON.stringify(selectedAgent.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
