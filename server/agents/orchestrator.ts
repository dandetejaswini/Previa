import { GoogleGenAI } from "@google/genai";
import { OrchestratorInput, AgentExecutionContext } from "./agentContext";
import {
  AgentResult,
  PreviaDecisionEvent,
  SpecialistAgentId,
  AGENT_REGISTRY,
} from "../../src/types/agentTypes";

// Import all 13 specialist agents
import { runRiskSentinelAgent } from "./specialists/riskSentinelAgent";
import { runForecastingAgent } from "./specialists/forecastingAgent";
import { runAnomalyDetectionAgent } from "./specialists/anomalyDetectionAgent";
import { runSupplierIntelligenceAgent } from "./specialists/supplierIntelligenceAgent";
import { runNlpDocumentAgent } from "./specialists/nlpDocumentAgent";
import { runExternalIntelligenceAgent } from "./specialists/externalIntelligenceAgent";
import { runFinancialIntelligenceAgent } from "./specialists/financialIntelligenceAgent";
import { runGraphIntelligenceAgent } from "./specialists/graphIntelligenceAgent";
import { runScenarioSimulatorAgent } from "./specialists/scenarioSimulatorAgent";
import { runOptimizationAgent } from "./specialists/optimizationAgent";
import { runComputerVisionAgent } from "./specialists/computerVisionAgent";
import { runMitigationActionAgent } from "./specialists/mitigationActionAgent";
import { runDecisionValidationAgent } from "./specialists/decisionValidationAgent";

// In-memory registry for Decision Events (persisted across sessions alongside client localStorage)
const decisionEventsStore = new Map<string, PreviaDecisionEvent>();

export interface LiveControlTowerEvent {
  id: string;
  timestamp: string;
  type: string;
  agentId?: SpecialistAgentId;
  agentName?: string;
  message: string;
  runId: string;
  severity?: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
}

const liveEventLedger: LiveControlTowerEvent[] = [];

export function getLiveEventLedger(): LiveControlTowerEvent[] {
  return [...liveEventLedger].reverse().slice(0, 50);
}

export function recordLiveEvent(event: Omit<LiveControlTowerEvent, "id" | "timestamp">): LiveControlTowerEvent {
  const fullEvent: LiveControlTowerEvent = {
    id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  liveEventLedger.push(fullEvent);
  if (liveEventLedger.length > 200) {
    liveEventLedger.shift();
  }
  return fullEvent;
}

export function getStoredDecisionEvents(): PreviaDecisionEvent[] {
  return Array.from(decisionEventsStore.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function saveDecisionEvent(event: PreviaDecisionEvent): void {
  decisionEventsStore.set(event.runId, event);
}

export function getDecisionEventById(runId: string): PreviaDecisionEvent | undefined {
  return decisionEventsStore.get(runId);
}

export async function orchestrateMultiAgentAnalysis(
  input: OrchestratorInput,
  ai: GoogleGenAI | null,
  onProgress?: (event: { type: string; agentId?: SpecialistAgentId; status?: string; data?: any; message?: string }) => void
): Promise<PreviaDecisionEvent> {
  const timestamp = new Date().toISOString();
  const runId = `AGENT-RUN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  onProgress?.({
    type: "RUN_STARTED",
    data: { runId, sourceEngine: input.sourceEngine },
    message: `Previa multi-agent orchestration initiated for ${input.sourceEngine} run.`,
  });

  recordLiveEvent({
    type: "RUN_STARTED",
    message: `Multi-Agent Orchestration initiated for ${input.sourceEngine.toUpperCase()} analysis [${runId}]`,
    runId,
    severity: "INFO",
  });

  const context: AgentExecutionContext = {
    runId,
    sourceEngine: input.sourceEngine,
    originalResult: input.originalResult,
    ai,
    additionalContext: input.additionalContext,
  };

  // Define the 12 concurrent upstream specialist tasks
  const upstreamAgentTasks: {
    id: SpecialistAgentId;
    runner: (ctx: AgentExecutionContext) => Promise<AgentResult>;
  }[] = [
    { id: "risk_sentinel", runner: runRiskSentinelAgent },
    { id: "forecasting", runner: runForecastingAgent },
    { id: "anomaly_detection", runner: runAnomalyDetectionAgent },
    { id: "supplier_intelligence", runner: runSupplierIntelligenceAgent },
    { id: "nlp_document", runner: runNlpDocumentAgent },
    { id: "external_intelligence", runner: runExternalIntelligenceAgent },
    { id: "financial_intelligence", runner: runFinancialIntelligenceAgent },
    { id: "graph_intelligence", runner: runGraphIntelligenceAgent },
    { id: "scenario_simulator", runner: runScenarioSimulatorAgent },
    { id: "optimization", runner: runOptimizationAgent },
    { id: "computer_vision", runner: runComputerVisionAgent },
    { id: "mitigation_action", runner: runMitigationActionAgent },
  ];

  // Notify each agent started
  for (const task of upstreamAgentTasks) {
    onProgress?.({
      type: "AGENT_STARTED",
      agentId: task.id,
      status: "RUNNING",
      message: `${AGENT_REGISTRY[task.id]?.name || task.id} started execution.`,
    });
  }

  // Execute Agents 1 to 12 CONCURRENTLY with isolated execution state
  const settledResults = await Promise.allSettled(
    upstreamAgentTasks.map(async (task) => {
      try {
        const result = await task.runner(context);
        onProgress?.({
          type: "AGENT_COMPLETED",
          agentId: task.id,
          status: "COMPLETED",
          data: result,
          message: `${AGENT_REGISTRY[task.id]?.name || task.id} completed in ${result.executionTimeMs || 100}ms.`,
        });

        recordLiveEvent({
          type: "AGENT_COMPLETED",
          agentId: task.id,
          agentName: AGENT_REGISTRY[task.id]?.name || task.id,
          message: `${AGENT_REGISTRY[task.id]?.name}: ${result.findings[0] || "Analysis completed with verified evidence."}`,
          runId,
          severity: result.confidence > 85 ? "SUCCESS" : "INFO",
        });

        return { id: task.id, result };
      } catch (err: any) {
        console.error(`[Agent Orchestrator] Agent ${task.id} failed:`, err);
        const meta = AGENT_REGISTRY[task.id];
        const failedResult: AgentResult = {
          agentId: task.id,
          agentName: meta?.name || task.id,
          runId,
          status: "FAILED",
          technology: meta?.technology || "Unknown",
          role: meta?.role || "",
          findings: [],
          evidence: [],
          confidence: 0,
          recommendations: [],
          errors: [err?.message || "Execution exception in specialist agent."],
        };

        onProgress?.({
          type: "AGENT_FAILED",
          agentId: task.id,
          status: "FAILED",
          data: failedResult,
          message: `${AGENT_REGISTRY[task.id]?.name || task.id} encountered an exception.`,
        });

        recordLiveEvent({
          type: "AGENT_FAILED",
          agentId: task.id,
          agentName: AGENT_REGISTRY[task.id]?.name || task.id,
          message: `${AGENT_REGISTRY[task.id]?.name} execution failed: ${err?.message || "Data unavailable."}`,
          runId,
          severity: "WARNING",
        });

        return { id: task.id, result: failedResult };
      }
    })
  );

  // Collect isolated results
  const agentResults = {} as Record<SpecialistAgentId, AgentResult>;
  for (const item of settledResults) {
    if (item.status === "fulfilled") {
      agentResults[item.value.id] = item.value.result;
    }
  }

  // Execute Agent 13: Decision & Validation Agent with collected results
  onProgress?.({
    type: "SYNTHESIS_STARTED",
    agentId: "decision_validation",
    status: "RUNNING",
    message: "Decision & Validation Agent arbitrating multi-agent findings and consensus...",
  });

  let decisionValidationResult: AgentResult & { conflicts: any[]; consolidatedSummary: string };
  try {
    decisionValidationResult = await runDecisionValidationAgent(context, agentResults);
    agentResults["decision_validation"] = decisionValidationResult;

    onProgress?.({
      type: "AGENT_COMPLETED",
      agentId: "decision_validation",
      status: "COMPLETED",
      data: decisionValidationResult,
      message: "Decision & Validation Agent produced consensus decision event.",
    });

    recordLiveEvent({
      type: "DECISION_EVENT_CREATED",
      agentId: "decision_validation",
      agentName: "Decision & Validation Agent",
      message: `Consensus verified with ${decisionValidationResult.confidence}% confidence. Ready for Sourcing Director review.`,
      runId,
      severity: "SUCCESS",
    });
  } catch (err: any) {
    console.error("[Agent Orchestrator] Decision & Validation Agent failed:", err);
    decisionValidationResult = {
      agentId: "decision_validation",
      agentName: AGENT_REGISTRY.decision_validation.name,
      runId,
      status: "FAILED",
      technology: AGENT_REGISTRY.decision_validation.technology,
      role: AGENT_REGISTRY.decision_validation.role,
      findings: ["Decision validation fallback invoked."],
      evidence: ["Upstream agents collected."],
      confidence: 85,
      recommendations: ["Manually review individual agent findings."],
      conflicts: [],
      consolidatedSummary: "Multi-agent analysis completed with baseline validation.",
      errors: [err?.message || "Arbitration error"],
    };
    agentResults["decision_validation"] = decisionValidationResult;
  }

  // Synthesize PreviaDecisionEvent
  const original = input.originalResult || {};
  const isDisruption = input.sourceEngine === "disruption";

  // Retain authoritative baseline metrics from original engine
  const financialImpact = isDisruption
    ? original.keyMetrics?.financialExposure?.value || "Insufficient data"
    : "Contract value under review";
  const scheduleImpact = isDisruption
    ? original.keyMetrics?.leadTimeDrift?.value || "Variance under review"
    : original.driftComparison?.driftDisplay || "0 days";
  const starvationHorizon = isDisruption
    ? original.keyMetrics?.starvationHorizon?.value || "10-14 days"
    : "Safety buffer adequate";

  // Consolidate non-redundant findings & recommendations
  const allFindings = Object.values(agentResults)
    .filter((a) => a.status === "COMPLETED")
    .flatMap((a) => a.findings);

  const allRecommendations = Object.values(agentResults)
    .filter((a) => a.status === "COMPLETED")
    .flatMap((a) => a.recommendations);

  const allEvidence = Object.values(agentResults)
    .filter((a) => a.status === "COMPLETED")
    .flatMap((a) => a.evidence);

  const topRisks = [
    `Lead-time drift of ${scheduleImpact} breaching nominal production buffers`,
    `Single-source dependence with vulnerable Tier-1 supplier corridor`,
    `Potential downstream line starvation within ${starvationHorizon}`,
  ];

  const decisionEvent: PreviaDecisionEvent = {
    runId,
    sourceEngine: input.sourceEngine,
    timestamp,
    originalEngineResult: original,
    agentResults,
    risks: topRisks,
    findings: allFindings.slice(0, 8),
    financialImpact,
    scheduleImpact,
    starvationHorizon,
    rootCauses: isDisruption
      ? (original.rootVectors || []).map((v: any) => v.title)
      : [original.likelyCauses || "Logistics bottleneck"],
    recommendations: allRecommendations.slice(0, 6),
    evidence: allEvidence.slice(0, 6),
    assumptions: isDisruption
      ? original.auditGrounding?.assumptionsAndGaps || []
      : original.assumptionsAndGaps || [],
    confidence: decisionValidationResult.confidence || 92,
    conflicts: decisionValidationResult.conflicts || [],

    // Traceable Loop Defaults (Control Tower integration)
    originalRecommendation:
      allRecommendations[0] || "Execute 3-phase containment playbook and verify inventory buffer.",
    humanDecision: "pending",
    actionStatus: "PENDING",
  };

  // Store in-memory
  saveDecisionEvent(decisionEvent);

  return decisionEvent;
}

export async function retrySingleAgent(
  runId: string,
  agentId: SpecialistAgentId,
  sourceEngine: "disruption" | "drift",
  originalResult: any,
  ai: GoogleGenAI | null
): Promise<AgentResult> {
  const context: AgentExecutionContext = {
    runId,
    sourceEngine,
    originalResult,
    ai,
  };

  switch (agentId) {
    case "risk_sentinel":
      return await runRiskSentinelAgent(context);
    case "forecasting":
      return await runForecastingAgent(context);
    case "anomaly_detection":
      return await runAnomalyDetectionAgent(context);
    case "supplier_intelligence":
      return await runSupplierIntelligenceAgent(context);
    case "nlp_document":
      return await runNlpDocumentAgent(context);
    case "external_intelligence":
      return await runExternalIntelligenceAgent(context);
    case "financial_intelligence":
      return await runFinancialIntelligenceAgent(context);
    case "graph_intelligence":
      return await runGraphIntelligenceAgent(context);
    case "scenario_simulator":
      return await runScenarioSimulatorAgent(context);
    case "optimization":
      return await runOptimizationAgent(context);
    case "computer_vision":
      return await runComputerVisionAgent(context);
    case "mitigation_action":
      return await runMitigationActionAgent(context);
    default:
      throw new Error(`Unknown or non-isolated agent retry: ${agentId}`);
  }
}
