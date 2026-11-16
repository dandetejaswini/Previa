import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Network,
  Scale,
  ScanLine,
  SlidersHorizontal,
  Flame,
  FileSearch,
  Sparkles,
  ArrowRight,
  Send,
  Layers,
} from "lucide-react";
import {
  AgentResult,
  PreviaDecisionEvent,
  SpecialistAgentId,
  AGENT_REGISTRY,
  AgentConflict,
  MonteCarloScenarioResult,
} from "../../types/agentTypes";
import { DisruptionRun, DeliveryDriftRun } from "../../types";

interface MultiAgentIntelligencePanelProps {
  sourceEngine: "disruption" | "drift";
  currentRun: DisruptionRun | DeliveryDriftRun | null;
  onNavigateToControlTower?: () => void;
}

export const MultiAgentIntelligencePanel: React.FC<MultiAgentIntelligencePanelProps> = ({
  sourceEngine,
  currentRun,
  onNavigateToControlTower,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [decisionEvent, setDecisionEvent] = useState<PreviaDecisionEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"consolidated" | "scenarios" | "graph" | "agents" | "conflicts">("consolidated");
  const [selectedAgentId, setSelectedAgentId] = useState<SpecialistAgentId>("risk_sentinel");
  const [retryingAgentId, setRetryingAgentId] = useState<SpecialistAgentId | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSavedToControlTower, setIsSavedToControlTower] = useState<boolean>(false);
  const [liveAgentStatuses, setLiveAgentStatuses] = useState<Record<SpecialistAgentId, "WAITING" | "RUNNING" | "COMPLETED" | "FAILED">>({
    risk_sentinel: "WAITING",
    forecasting: "WAITING",
    anomaly_detection: "WAITING",
    supplier_intelligence: "WAITING",
    nlp_document: "WAITING",
    external_intelligence: "WAITING",
    financial_intelligence: "WAITING",
    graph_intelligence: "WAITING",
    scenario_simulator: "WAITING",
    optimization: "WAITING",
    computer_vision: "WAITING",
    mitigation_action: "WAITING",
    decision_validation: "WAITING",
  });
  const [liveLogMessages, setLiveLogMessages] = useState<string[]>([]);

  // Function to execute multi-agent analysis with SSE streaming
  const executeOrchestration = async () => {
    if (!currentRun) return;
    setIsRunning(true);
    setErrorMsg(null);
    setLiveLogMessages([`Initiating concurrent orchestration for run ${currentRun.id}...`]);

    // Reset initial statuses
    setLiveAgentStatuses({
      risk_sentinel: "RUNNING",
      forecasting: "RUNNING",
      anomaly_detection: "RUNNING",
      supplier_intelligence: "RUNNING",
      nlp_document: "RUNNING",
      external_intelligence: "RUNNING",
      financial_intelligence: "RUNNING",
      graph_intelligence: "RUNNING",
      scenario_simulator: "RUNNING",
      optimization: "RUNNING",
      computer_vision: "RUNNING",
      mitigation_action: "RUNNING",
      decision_validation: "WAITING",
    });

    try {
      const response = await fetch("/api/agents/orchestrate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceEngine,
          originalResult: currentRun,
        }),
      });

      if (!response.ok || !response.body) {
        // Fallback to non-streaming POST
        const fallbackRes = await fetch("/api/agents/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceEngine,
            originalResult: currentRun,
          }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.decisionEvent) {
          const evt: PreviaDecisionEvent = fallbackData.decisionEvent;
          setDecisionEvent(evt);
          setIsSavedToControlTower(true);
          persistEventLocally(evt);
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.replace("data: ", "").trim();

          if (dataStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.message) {
              setLiveLogMessages((prev) => [parsed.message, ...prev.slice(0, 15)]);
            }

            if (parsed.type === "AGENT_STARTED" && parsed.agentId) {
              setLiveAgentStatuses((prev) => ({ ...prev, [parsed.agentId]: "RUNNING" }));
            } else if (parsed.type === "AGENT_COMPLETED" && parsed.agentId) {
              setLiveAgentStatuses((prev) => ({ ...prev, [parsed.agentId]: "COMPLETED" }));
            } else if (parsed.type === "AGENT_FAILED" && parsed.agentId) {
              setLiveAgentStatuses((prev) => ({ ...prev, [parsed.agentId]: "FAILED" }));
            } else if (parsed.type === "SYNTHESIS_STARTED") {
              setLiveAgentStatuses((prev) => ({ ...prev, decision_validation: "RUNNING" }));
            } else if (parsed.type === "DECISION_EVENT_CREATED" && parsed.data) {
              const evt: PreviaDecisionEvent = parsed.data;
              setDecisionEvent(evt);
              setIsSavedToControlTower(true);
              persistEventLocally(evt);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      console.error("[Multi-Agent UI] Error running orchestrator:", err);
      setErrorMsg(err.message || "Execution exception occurred during multi-agent run.");
    } finally {
      setIsRunning(false);
    }
  };

  const persistEventLocally = (evt: PreviaDecisionEvent) => {
    try {
      const savedEventsRaw = localStorage.getItem("previa_decision_events");
      const existing: PreviaDecisionEvent[] = savedEventsRaw ? JSON.parse(savedEventsRaw) : [];
      const filtered = existing.filter((e) => e.runId !== evt.runId);
      const updated = [evt, ...filtered];
      localStorage.setItem("previa_decision_events", JSON.stringify(updated));
    } catch (storageErr) {
      console.warn("Could not save to localStorage:", storageErr);
    }
  };

  // Sync / check for existing decision event from localStorage when run changes, or auto-launch
  useEffect(() => {
    if (!currentRun) {
      setDecisionEvent(null);
      return;
    }

    try {
      const savedEventsRaw = localStorage.getItem("previa_decision_events");
      let found: PreviaDecisionEvent | null = null;
      if (savedEventsRaw) {
        const parsed: PreviaDecisionEvent[] = JSON.parse(savedEventsRaw);
        found = parsed.find(
          (e) =>
            e.originalEngineResult?.id === currentRun.id ||
            e.runId === currentRun.id
        ) || null;
      }

      if (found) {
        setDecisionEvent(found);
        setIsSavedToControlTower(true);
      } else {
        setDecisionEvent(null);
        setIsSavedToControlTower(false);
        // Automatic execution trigger for new runs!
        executeOrchestration();
      }
    } catch {
      executeOrchestration();
    }
  }, [currentRun?.id]);

  if (!currentRun) return null;

  const handleLaunchMultiAgent = () => {
    executeOrchestration();
  };

  const handleRetryAgent = async (agentId: SpecialistAgentId) => {
    if (!decisionEvent) return;
    setRetryingAgentId(agentId);

    try {
      const response = await fetch("/api/agents/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: decisionEvent.runId,
          agentId,
          sourceEngine,
          originalResult: currentRun,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to retry ${agentId}`);
      }

      const updatedAgent: AgentResult = data.agentResult;
      const updatedEvent: PreviaDecisionEvent = {
        ...decisionEvent,
        agentResults: {
          ...decisionEvent.agentResults,
          [agentId]: updatedAgent,
        },
      };

      setDecisionEvent(updatedEvent);

      // Update in localStorage
      try {
        const savedEventsRaw = localStorage.getItem("previa_decision_events");
        const existing: PreviaDecisionEvent[] = savedEventsRaw ? JSON.parse(savedEventsRaw) : [];
        const updated = existing.map((e) => (e.runId === updatedEvent.runId ? updatedEvent : e));
        localStorage.setItem("previa_decision_events", JSON.stringify(updated));
      } catch {}
    } catch (err: any) {
      console.error(`[Multi-Agent UI] Error retrying agent ${agentId}:`, err);
      setErrorMsg(err.message || `Failed to retry agent ${agentId}`);
    } finally {
      setRetryingAgentId(null);
    }
  };

  const agentKeys = Object.keys(AGENT_REGISTRY) as SpecialistAgentId[];
  const completedCount = decisionEvent
    ? Object.values(decisionEvent.agentResults || {}).filter((a) => a?.status === "COMPLETED").length
    : 0;

  return (
    <div className="mt-8 border border-[#211A27]/20 rounded-2xl bg-white shadow-md overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="bg-[#211A27] text-white px-6 py-5 border-b border-[#3A3043] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-copper/90 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D8D0C3] bg-white/10 px-2 py-0.5 rounded-sm">
                Multi-Agent Layer • 13 Specialist Agents
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#617A61]" />
              <span className="text-[10px] font-mono text-[#617A61] font-semibold">Concurrent Execution</span>
            </div>
            <h3 className="text-base sm:text-lg font-editorial font-bold text-white tracking-tight mt-0.5">
              Previa Multi-Agent Intelligence Layer
            </h3>
            <p className="text-xs text-[#D8D0C3] font-mono">
              Deterministic engines remain authoritative baseline • Specialized cognitive agents extend containment modeling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={handleLaunchMultiAgent}
            disabled={isRunning}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              isRunning
                ? "bg-[#3A3043] text-stone-mist cursor-wait"
                : decisionEvent
                ? "bg-stone-mist hover:bg-stone-mist/80 text-charcoal border border-graphite"
                : "bg-copper hover:bg-copper/90 text-white border border-copper/30"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin text-white" : ""}`} />
            <span>
              {isRunning
                ? "Orchestrating 13 Agents..."
                : decisionEvent
                ? "Re-Run Multi-Agent Analysis"
                : "Launch Multi-Agent Intelligence"}
            </span>
          </button>

          {decisionEvent && onNavigateToControlTower && (
            <button
              onClick={onNavigateToControlTower}
              className="px-3 py-2.5 rounded-xl font-mono text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Control Tower</span>
              <ExternalLink className="w-3.5 h-3.5 text-copper" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#F8EBEA] border-b border-[#EFCBC9] text-[#8C3A35] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-6 space-y-6 bg-parchment/40">
        {/* If no analysis has been run yet */}
        {!decisionEvent && !isRunning && (
          <div className="text-center py-10 px-4 space-y-3 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-white border border-graphite shadow-xs flex items-center justify-center mx-auto text-copper">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-editorial font-bold text-charcoal">
              Execute Multi-Agent Intelligence on this Operational Baseline
            </h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Launch 13 autonomous specialist agents concurrently (Risk Sentinel, Forecasting, Anomaly Detection, Supplier Intel, Graph Topology, Monte Carlo Scenario Simulator, and Optimization).
            </p>
            <div className="pt-2">
              <button
                onClick={handleLaunchMultiAgent}
                className="px-5 py-2.5 bg-copper hover:bg-copper/90 text-white font-mono text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Concurrent Multi-Agent Run</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Running State Indicator with 13 Agent Status Matrix */}
        {isRunning && (
          <div className="space-y-6">
            <div className="bg-[#211A27] text-white p-5 rounded-2xl border border-[#3A3043] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-copper text-white flex items-center justify-center animate-spin">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-copper animate-ping" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-copper">
                      Concurrent Execution Active
                    </span>
                  </div>
                  <h4 className="text-sm font-editorial font-bold text-white tracking-tight">
                    Orchestrating 13 Specialist Agents in Real Time
                  </h4>
                  <p className="text-xs text-[#D8D0C3] font-mono mt-0.5">
                    Isolated execution environments • Processing multi-tier signals & stochastic models
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-[#D8D0C3]">
                <span className="block text-[10px] uppercase text-stone-mist">Active Target</span>
                <span className="font-bold text-white">{currentRun.id}</span>
              </div>
            </div>

            {/* 13 Agents Live Execution Status Board */}
            <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-graphite pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal">
                  AI INTELLIGENCE STATUS BOARD
                </span>
                <span className="text-[10px] font-mono text-charcoal-muted">
                  Stage 1: 12 Parallel Agents • Stage 2: Arbitration
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {agentKeys.map((agentId) => {
                  const meta = AGENT_REGISTRY[agentId];
                  const status = liveAgentStatuses[agentId] || "WAITING";
                  return (
                    <div
                      key={agentId}
                      className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                        status === "RUNNING"
                          ? "bg-[#F9EFE5] border-[#EEDBC7] text-charcoal"
                          : status === "COMPLETED"
                          ? "bg-[#F3F6F3] border-[#D4E0D4] text-charcoal"
                          : status === "FAILED"
                          ? "bg-[#F8EBEA] border-[#EFCBC9] text-charcoal"
                          : "bg-stone-mist/30 border-graphite text-charcoal-muted"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-[11px] font-bold truncate">
                          {meta.name.replace(" Agent", "")}
                        </div>
                        <div className="text-[9px] font-mono text-charcoal-muted truncate">
                          {meta.technology}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {status === "RUNNING" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-copper px-2 py-0.5 rounded-sm bg-copper/10 border border-copper/30 animate-pulse">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            RUNNING
                          </span>
                        )}
                        {status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#617A61] px-2 py-0.5 rounded-sm bg-[#617A61]/10 border border-[#617A61]/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            COMPLETE
                          </span>
                        )}
                        {status === "FAILED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#A94B45] px-2 py-0.5 rounded-sm bg-[#A94B45]/10 border border-[#A94B45]/30">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            FAILED
                          </span>
                        )}
                        {status === "WAITING" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-charcoal-muted px-2 py-0.5 rounded-sm bg-stone-mist border border-graphite">
                            <Clock className="w-2.5 h-2.5" />
                            WAITING
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Streaming Logs */}
              {liveLogMessages.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-[#211A27] text-stone-mist text-[11px] font-mono space-y-1 max-h-36 overflow-y-auto">
                  <div className="text-[9px] uppercase tracking-wider text-copper font-bold mb-1">
                    Live Agent Activity Stream
                  </div>
                  {liveLogMessages.map((msg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-copper">›</span>
                      <span className="text-white/90">{msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completed Decision Event Layout */}
        {decisionEvent && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Run Metadata & Verification Badge */}
            <div className="bg-white border border-graphite rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#617A61]/10 text-[#617A61] border border-[#617A61]/30 px-2 py-0.5 rounded-sm uppercase">
                    Validated Decision Event
                  </span>
                  <span className="text-[11px] font-mono text-charcoal-muted">
                    Run ID: <strong className="text-charcoal">{decisionEvent.runId}</strong>
                  </span>
                </div>
                <p className="text-xs text-charcoal font-medium">
                  Authoritative Baseline: <span className="font-mono text-copper font-bold">{sourceEngine === "disruption" ? "Disruption Engine" : "Delivery Drift Analyzer"}</span> • {completedCount} / 13 Specialist Agents Active
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-charcoal-muted block uppercase">Composite Confidence</span>
                  <span className="text-sm font-bold text-[#617A61]">{decisionEvent.confidence}%</span>
                </div>
                <div className="text-right border-l border-graphite pl-4">
                  <span className="text-[10px] text-charcoal-muted block uppercase">Control Tower Status</span>
                  <span className="text-xs font-bold text-[#2F6F6D]">
                    {decisionEvent.humanDecision === "approved"
                      ? "Approved by Operator"
                      : decisionEvent.humanDecision === "rejected"
                      ? "Rejected by Operator"
                      : decisionEvent.humanDecision === "modified"
                      ? "Modified by Operator"
                      : "Pending Operator Action"}
                  </span>
                </div>
              </div>
            </div>

            {/* 13 Specialist Agents Status Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-charcoal-subtle">
                  Specialist Agents Execution Grid ({completedCount} / 13 Completed)
                </span>
                <span className="text-[10px] font-mono text-charcoal-muted">
                  Click any agent to inspect isolated findings
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {agentKeys.map((agentId) => {
                  const meta = AGENT_REGISTRY[agentId];
                  const result = decisionEvent.agentResults?.[agentId];
                  const isCompleted = result?.status === "COMPLETED";
                  const isFailed = result?.status === "FAILED";
                  const isRetrying = retryingAgentId === agentId;
                  const isSelected = selectedAgentId === agentId;

                  return (
                    <div
                      key={agentId}
                      onClick={() => {
                        setSelectedAgentId(agentId);
                        setActiveTab("agents");
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white border-copper shadow-sm ring-1 ring-copper"
                          : isFailed
                          ? "bg-[#F8EBEA] border-[#EFCBC9] hover:border-[#A94B45]"
                          : "bg-white border-graphite hover:border-charcoal-subtle"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-mono font-bold text-charcoal-subtle uppercase truncate">
                          {meta.category}
                        </span>
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#617A61] shrink-0" />}
                        {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-[#A94B45] shrink-0" />}
                        {isRetrying && <RefreshCw className="w-3.5 h-3.5 text-copper animate-spin shrink-0" />}
                      </div>

                      <h5 className="text-[11px] font-bold text-charcoal truncate">
                        {meta.name.replace(" Agent", "")}
                      </h5>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-charcoal-muted">
                        <span>{result?.executionTimeMs ? `${result.executionTimeMs}ms` : "Active"}</span>
                        {isCompleted && <span className="font-bold text-[#617A61]">{result.confidence}%</span>}
                        {isFailed && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryAgent(agentId);
                            }}
                            className="text-[#A94B45] hover:underline font-bold"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-graphite pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("consolidated")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === "consolidated"
                    ? "bg-[#211A27] text-white"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-white"
                }`}
              >
                Consolidated Intelligence
              </button>

              <button
                onClick={() => setActiveTab("scenarios")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === "scenarios"
                    ? "bg-[#211A27] text-white"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-white"
                }`}
              >
                Scenario Simulator (Monte Carlo)
              </button>

              <button
                onClick={() => setActiveTab("graph")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === "graph"
                    ? "bg-[#211A27] text-white"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-white"
                }`}
              >
                Graph Topology & Bottlenecks
              </button>

              <button
                onClick={() => setActiveTab("conflicts")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === "conflicts"
                    ? "bg-[#211A27] text-white"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-white"
                }`}
              >
                <span>Conflicts & Arbitration</span>
                {decisionEvent.conflicts?.length > 0 && (
                  <span className="bg-copper text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                    {decisionEvent.conflicts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("agents")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === "agents"
                    ? "bg-[#211A27] text-white"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-white"
                }`}
              >
                Agent Inspector
              </button>
            </div>

            {/* TAB 1: CONSOLIDATED INTELLIGENCE */}
            {activeTab === "consolidated" && (
              <div className="space-y-4">
                {/* Executive Multi-Agent Summary */}
                <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-charcoal">
                    <Sparkles className="w-4 h-4 text-copper" />
                    <h4 className="text-sm font-editorial font-bold">
                      Decision & Validation Agent Consensus Brief
                    </h4>
                  </div>
                  <p className="text-xs text-charcoal leading-relaxed">
                    {decisionEvent.agentResults?.decision_validation?.details?.consolidatedSummary ||
                      "All 13 autonomous specialist models have evaluated the disruption scenario across risk velocity, inventory trajectory, graph bottlenecks, and Monte Carlo simulations. The consolidated consensus validates baseline schedule drift and prescribes targeted containment actions."}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-stone-mist/40 border border-graphite space-y-1">
                      <span className="text-[10px] font-mono text-charcoal-subtle uppercase block">
                        Schedule Impact
                      </span>
                      <span className="text-sm font-bold font-mono text-charcoal">
                        {decisionEvent.scheduleImpact}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-mist/40 border border-graphite space-y-1">
                      <span className="text-[10px] font-mono text-charcoal-subtle uppercase block">
                        Financial Impact
                      </span>
                      <span className="text-sm font-bold font-mono text-charcoal">
                        {decisionEvent.financialImpact}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-mist/40 border border-graphite space-y-1">
                      <span className="text-[10px] font-mono text-charcoal-subtle uppercase block">
                        Starvation Horizon
                      </span>
                      <span className="text-sm font-bold font-mono text-charcoal">
                        {decisionEvent.starvationHorizon}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consolidated Findings & Priority Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-3">
                    <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                      Cross-Agent Validated Findings
                    </span>
                    <ul className="space-y-2">
                      {decisionEvent.findings.slice(0, 5).map((f, i) => (
                        <li key={i} className="text-xs text-charcoal flex items-start gap-2">
                          <span className="text-[#2F6F6D] font-bold font-mono mt-0.5">•</span>
                          <span className="leading-relaxed">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-3">
                    <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                      Prioritized Operational Recommendations
                    </span>
                    <ul className="space-y-2">
                      {decisionEvent.recommendations.slice(0, 5).map((r, i) => (
                        <li key={i} className="text-xs text-charcoal flex items-start gap-2">
                          <span className="text-copper font-bold font-mono mt-0.5">#{i + 1}</span>
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Control Tower Connection Banner */}
                <div className="p-4 rounded-xl bg-[#211A27] text-white border border-[#3A3043] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#617A61]" />
                      <span className="text-[10px] font-mono uppercase font-bold text-copper">
                        Control Tower Traceable Loop Active
                      </span>
                    </div>
                    <p className="text-xs text-[#D8D0C3]">
                      This Decision Event has been transmitted to the Enterprise Control Tower. Operators can approve, reject, or modify action recommendations without overwriting AI baselines.
                    </p>
                  </div>

                  {onNavigateToControlTower && (
                    <button
                      onClick={onNavigateToControlTower}
                      className="px-4 py-2 bg-copper hover:bg-copper/90 text-white font-mono text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Open in Control Tower</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SCENARIO SIMULATOR (MONTE CARLO) */}
            {activeTab === "scenarios" && (
              <div className="space-y-4">
                <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-editorial font-bold text-charcoal">
                        Monte Carlo Stochastic Simulation Matrix
                      </h4>
                      <p className="text-xs text-charcoal-muted font-mono">
                        1,000 parameter iterations evaluating supplier delay variations, capacity cut, and mitigation switches.
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-stone-mist px-2.5 py-1 rounded-md border border-graphite font-semibold text-charcoal">
                      N = 1,000 Runs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                    {(decisionEvent.agentResults?.scenario_simulator?.details?.scenarios || []).map(
                      (sim: MonteCarloScenarioResult) => (
                        <div
                          key={sim.id}
                          className="p-4 rounded-xl border border-graphite bg-stone-mist/20 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-bold text-charcoal">{sim.name}</h5>
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase ${
                                sim.bufferStatus === "SAFE"
                                  ? "bg-[#617A61]/10 text-[#617A61] border border-[#617A61]/30"
                                  : sim.bufferStatus === "DEPLETED"
                                  ? "bg-[#F9EFE5] text-[#975F24] border border-[#EEDBC7]"
                                  : "bg-[#F8EBEA] text-[#8C3A35] border border-[#EFCBC9]"
                              }`}
                            >
                              Buffer: {sim.bufferStatus}
                            </span>
                          </div>

                          <p className="text-xs text-charcoal-muted leading-relaxed">
                            {sim.narrative}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-graphite text-[11px] font-mono">
                            <div>
                              <span className="text-[9px] text-charcoal-subtle uppercase block">
                                Probability
                              </span>
                              <span className="font-bold text-charcoal">{sim.probability}%</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-charcoal-subtle uppercase block">
                                Delay Slip
                              </span>
                              <span className="font-bold text-copper">+{sim.expectedDelayDays}d</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-charcoal-subtle uppercase block">
                                Recovery
                              </span>
                              <span className="font-bold text-charcoal">{sim.recoveryWindowDays}d</span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GRAPH TOPOLOGY */}
            {activeTab === "graph" && (
              <div className="space-y-4">
                <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-sm font-editorial font-bold text-charcoal">
                      Multi-Tier Dependency Topology & Bottleneck Path
                    </h4>
                    <p className="text-xs text-charcoal-muted font-mono">
                      End-to-end component corridor from Tier-2 raw feedstock to final assembly plant.
                    </p>
                  </div>

                  {/* Visual Node Chain */}
                  <div className="space-y-3 pt-2">
                    {(decisionEvent.agentResults?.graph_intelligence?.details?.nodes || []).map(
                      (node: any, idx: number) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-graphite bg-stone-mist/30"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-white shrink-0 ${
                              node.status === "DISRUPTED"
                                ? "bg-[#A94B45]"
                                : node.status === "BOTTLENECK"
                                ? "bg-[#B77935]"
                                : node.status === "AT_RISK"
                                ? "bg-[#B86F52]"
                                : "bg-[#617A61]"
                            }`}
                          >
                            T{idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-charcoal truncate">{node.label}</h5>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs border border-graphite bg-white uppercase">
                                {node.type.replace("_", " ")}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-charcoal-muted">
                              Status: <strong className="uppercase">{node.status}</strong> • Criticality: {node.criticality}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONFLICTS & ARBITRATION */}
            {activeTab === "conflicts" && (
              <div className="space-y-4">
                <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-editorial font-bold text-charcoal">
                        Cross-Agent Conflict Detection & Consensus Arbitration
                      </h4>
                      <p className="text-xs text-charcoal-muted font-mono">
                        Identifies when independent specialist models reach divergent conclusions and resolves via weighted evidence.
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-copper/10 text-copper px-2.5 py-1 rounded-md border border-copper/30 font-semibold">
                      {decisionEvent.conflicts?.length || 0} Conflicts Reconciled
                    </span>
                  </div>

                  {decisionEvent.conflicts?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-charcoal-muted font-mono bg-stone-mist/30 rounded-xl border border-graphite">
                      Zero conflicting claims detected across all 13 models. All agents reached unified consensus.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {decisionEvent.conflicts.map((conflict: AgentConflict) => (
                        <div
                          key={conflict.id}
                          className="p-4 rounded-xl border border-graphite bg-stone-mist/20 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold bg-[#F9EFE5] text-[#975F24] border border-[#EEDBC7] px-2 py-0.5 rounded-sm uppercase">
                              {conflict.discrepancyType}
                            </span>
                            <span className="text-[10px] font-mono text-charcoal-muted">
                              Resolved Confidence: <strong className="text-[#617A61]">{conflict.resolvedConfidence}%</strong>
                            </span>
                          </div>

                          <p className="text-xs font-bold text-charcoal">
                            {conflict.description}
                          </p>

                          {/* Side-by-side Claims */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                            <div className="p-3 bg-white rounded-lg border border-graphite space-y-1">
                              <span className="text-[9px] text-charcoal-subtle uppercase block font-bold">
                                {conflict.agentA.name}
                              </span>
                              <p className="text-charcoal leading-relaxed">
                                "{conflict.agentA.claim}"
                              </p>
                            </div>

                            <div className="p-3 bg-white rounded-lg border border-graphite space-y-1">
                              <span className="text-[9px] text-charcoal-subtle uppercase block font-bold">
                                {conflict.agentB.name}
                              </span>
                              <p className="text-charcoal leading-relaxed">
                                "{conflict.agentB.claim}"
                              </p>
                            </div>
                          </div>

                          {/* Arbitration Resolution */}
                          <div className="p-3 bg-[#617A61]/10 rounded-lg border border-[#617A61]/30 space-y-1 text-xs">
                            <span className="text-[9px] font-mono uppercase font-bold text-[#617A61] block">
                              Arbitrated Resolution (Decision & Validation Agent)
                            </span>
                            <p className="text-charcoal leading-relaxed">
                              {conflict.resolution}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: INDIVIDUAL AGENT INSPECTOR */}
            {activeTab === "agents" && (
              <div className="space-y-4">
                {(() => {
                  const currentAgent = decisionEvent.agentResults?.[selectedAgentId];
                  const meta = AGENT_REGISTRY[selectedAgentId];

                  if (!currentAgent) return null;

                  return (
                    <div className="bg-white border border-graphite rounded-xl p-5 shadow-xs space-y-4">
                      {/* Agent Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-copper/10 text-copper border border-copper/30 px-2 py-0.5 rounded-sm uppercase">
                              {meta.category}
                            </span>
                            <span className="text-xs font-mono text-charcoal-muted">
                              Tech: {meta.technology}
                            </span>
                          </div>
                          <h4 className="text-base font-editorial font-bold text-charcoal mt-1">
                            {meta.name}
                          </h4>
                          <p className="text-xs text-charcoal-muted">
                            {meta.role}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRetryAgent(selectedAgentId)}
                            disabled={retryingAgentId === selectedAgentId}
                            className="px-3 py-1.5 bg-stone-mist hover:bg-stone-mist/80 text-charcoal font-mono text-xs font-semibold rounded-lg border border-graphite flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${retryingAgentId === selectedAgentId ? "animate-spin" : ""}`} />
                            <span>Retry This Agent</span>
                          </button>
                        </div>
                      </div>

                      {/* Agent Metrics */}
                      {currentAgent.metrics && Object.keys(currentAgent.metrics).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {Object.entries(currentAgent.metrics).map(([key, val]) => (
                            <div key={key} className="p-3 bg-stone-mist/30 rounded-lg border border-graphite space-y-1">
                              <span className="text-[9px] font-mono text-charcoal-subtle uppercase block">
                                {key}
                              </span>
                              <span className="text-xs font-bold font-mono text-charcoal block">
                                {String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Findings */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                          Agent Findings
                        </span>
                        <ul className="space-y-1.5">
                          {currentAgent.findings.map((f, idx) => (
                            <li key={idx} className="text-xs text-charcoal flex items-start gap-2">
                              <span className="text-[#2F6F6D] font-bold font-mono mt-0.5">•</span>
                              <span className="leading-relaxed">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Evidence & Grounding */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                          Supporting Evidence & Operational Grounding
                        </span>
                        <ul className="space-y-1.5">
                          {currentAgent.evidence.map((ev, idx) => (
                            <li key={idx} className="text-xs text-charcoal-muted font-mono flex items-start gap-2">
                              <span className="text-copper font-bold mt-0.5">✓</span>
                              <span className="leading-relaxed">{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      {currentAgent.recommendations?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                            Specific Agent Recommendations
                          </span>
                          <ul className="space-y-1.5">
                            {currentAgent.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-xs text-charcoal flex items-start gap-2">
                                <span className="text-copper font-bold font-mono mt-0.5">#{idx + 1}</span>
                                <span className="leading-relaxed">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
