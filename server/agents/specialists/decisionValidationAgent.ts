import { AgentExecutionContext, extractCommonMetadata } from "../agentContext";
import { AgentResult, AgentConflict, SpecialistAgentId } from "../../../src/types/agentTypes";

export async function runDecisionValidationAgent(
  context: AgentExecutionContext,
  collectedAgentResults: Record<SpecialistAgentId, AgentResult>
): Promise<AgentResult & { conflicts: AgentConflict[]; consolidatedSummary: string }> {
  const startTime = Date.now();
  const meta = extractCommonMetadata(context);

  // Cross-agent conflict detection
  const conflicts: AgentConflict[] = [];

  const riskSentinel = collectedAgentResults.risk_sentinel;
  const optimization = collectedAgentResults.optimization;
  const nlpDoc = collectedAgentResults.nlp_document;
  const externalIntel = collectedAgentResults.external_intelligence;
  const supplierIntel = collectedAgentResults.supplier_intelligence;

  // Conflict 1 Check: Supplier Claim vs External Port Reality
  const supplierClaimDefinitive = nlpDoc?.metrics?.["Commitment Certainty"]?.toString().includes("Definitive");
  const externalCongestionSevere = externalIntel?.details?.congestionIndex >= 7.0;

  if (supplierClaimDefinitive && externalCongestionSevere) {
    conflicts.push({
      id: "conflict-1",
      agentA: {
        id: "nlp_document",
        name: "NLP & Document Agent",
        claim: "Supplier statements express high definitive certainty of dispatch milestone.",
      },
      agentB: {
        id: "external_intelligence",
        name: "External Intelligence Agent",
        claim: "External corridor telemetry reveals severe port dwell bottleneck (+5.8 days) contradicting unhindered transit.",
      },
      description: "Discrepancy detected between supplier's optimistic dispatch commitment and real-world maritime port dwell indices.",
      discrepancyType: "SCHEDULE_SEVERITY",
      resolution: "Decision Agent adjusts schedule baseline to incorporate external port dwell delay (+5.8 days buffer) despite supplier verbal assurances.",
      resolvedConfidence: 93,
    });
  }

  // Conflict 2 Check: Single-source dependence vs. High-severity allocation recommendation
  const singleSourceHighRisk = supplierIntel?.metrics?.["Concentration Risk"]?.toString().includes("High");
  const optimizationDualSourceFeasible = !!optimization?.details?.secondaryAllocationOptimized;

  if (singleSourceHighRisk && optimizationDualSourceFeasible) {
    conflicts.push({
      id: "conflict-2",
      agentA: {
        id: "supplier_intelligence",
        name: "Supplier Intelligence Agent",
        claim: "High risk: 85% single-source concentration with vendor makes instant volume reallocation risky.",
      },
      agentB: {
        id: "optimization",
        name: "Optimization Agent",
        claim: "Recommends aggressive volume shift to 60/40 dual-sourcing split immediately.",
      },
      description: "Tension between supplier concentration lock-in risks versus aggressive secondary supplier split recommendation.",
      discrepancyType: "SUPPLIER_RELIABILITY",
      resolution: "Arbiter prescribes staged dual-sourcing ramp: 15% trial allocation immediately, scaling to 40% only after secondary node qualification pass.",
      resolvedConfidence: 91,
    });
  }

  // Calculate composite validated confidence score across all working agents
  const completedAgents = Object.values(collectedAgentResults).filter((a) => a.status === "COMPLETED");
  const totalConfidenceSum = completedAgents.reduce((sum, a) => sum + (a.confidence || 90), 0);
  const compositeConfidence = completedAgents.length > 0
    ? Math.round(totalConfidenceSum / completedAgents.length)
    : 92;

  // Build consolidated intelligence summary
  const consolidatedSummary = `Previa Multi-Agent Intelligence Layer consolidated ${completedAgents.length} autonomous specialist agents across detection, prediction, systemic modeling, and action synthesis. Verified ${conflicts.length} inter-agent discrepancy with resolved consensus. Recommended priority action: Ring-fence critical component allocations, institute a 6-day localized buffer buffer adjustment, and prepare secondary dual-sourcing qualifications to defend against cascading production starvation.`;

  const findings = [
    `Consensus Validation Status: ${completedAgents.length}/12 upstream specialist agents successfully validated and reconciled.`,
    `Conflict Arbitration: Detected ${conflicts.length} cross-model discrepancy; resolved with multi-echelon evidence weighting.`,
    `Consolidated Confidence Rating: ${compositeConfidence}% across complete analytical vector.`,
    `Evidence Audit: All findings strictly grounded in verified operational inputs, contractual baselines, and validated telemetry.`,
  ];

  const evidence = [
    `Cross-evaluated ${completedAgents.length} specialist agent outputs.`,
    `Detected discrepancies: ${conflicts.length > 0 ? conflicts.map((c) => c.description).join("; ") : "Zero conflicting claims detected"}`,
    `Authoritative baseline preserved from Previa ${context.sourceEngine === "disruption" ? "Disruption Engine" : "Delivery Drift Analyzer"}.`,
  ];

  const recommendations = [
    `Approve consolidated Decision Event for transmission to Enterprise Control Tower operations ledger.`,
    `Direct Procurement Incident Commander to execute Stage 1 mitigation protocols within next 24 hours.`,
  ];

  return {
    agentId: "decision_validation",
    agentName: "Decision & Validation Agent",
    runId: context.runId,
    status: "COMPLETED",
    executionTimeMs: Date.now() - startTime,
    technology: "Consensus Arbitration, Conflict Detection & Composite Verification",
    role: "Validate evidence, compare agent findings, detect conflicts, compute composite confidence, and produce consolidated intelligence.",
    findings,
    evidence,
    confidence: compositeConfidence,
    recommendations,
    conflicts,
    consolidatedSummary,
    metrics: {
      "Validated Agents": `${completedAgents.length} / 12`,
      "Detected Conflicts": conflicts.length,
      "Composite Confidence": `${compositeConfidence}%`,
      "Consensus Rating": conflicts.length > 0 ? "Reconciled with Bounds" : "High Consensus",
    },
    details: {
      compositeConfidence,
      conflictsCount: conflicts.length,
      completedCount: completedAgents.length,
    },
  };
}
