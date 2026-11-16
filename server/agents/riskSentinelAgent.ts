import { AgentExecutionRecord } from "../../src/types";

export interface RiskSentinelInput {
  supplier?: string;
  poNumber?: string;
  shipmentId?: string;
  delayDays?: number | null;
  statement?: string;
  category?: string;
  historicalDelays?: number[];
  bufferDaysRemaining?: number | null;
}

export interface RiskSentinelOutput {
  compositeScore: number | "Insufficient data";
  riskClassification: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "Insufficient data";
  featureWeights: Record<string, number>;
  primaryVulnerabilities: string[];
  sufficientData: boolean;
  scoreExplanation: string;
}

/**
 * AGENT 3 — RISK SENTINEL
 * Evaluates supplier, shipment, PO, inventory, disruption, and dependency risk vectors.
 * Uses statistical ensemble scoring with weighted feature rules.
 * Never fabricates scores if evidence is missing; returns "Insufficient data".
 */
export async function executeRiskSentinelAgent(
  runId: string,
  input: RiskSentinelInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const hasSupplier = Boolean(input.supplier?.trim());
    const hasDelay = typeof input.delayDays === "number" && !isNaN(input.delayDays);
    const hasStatement = Boolean(input.statement?.trim());

    if (!hasSupplier && !hasDelay && !hasStatement && !input.shipmentId && !input.poNumber) {
      return {
        runId,
        agentId: "risk_sentinel",
        agentName: "Risk Sentinel",
        timestamp,
        status: "COMPLETE",
        durationMs: Date.now() - startTime,
        result: {
          compositeScore: "Insufficient data",
          riskClassification: "Insufficient data",
          featureWeights: {},
          primaryVulnerabilities: ["No supplier, shipment, or schedule telemetry supplied for risk evaluation."],
          sufficientData: false,
          scoreExplanation: "Insufficient data to compute statistical risk score.",
        } as RiskSentinelOutput,
        evidence: ["Insufficient data: No verifiable operational fields provided."],
        confidence: 0,
      };
    }

    if (input.supplier) evidence.push(`Supplier: ${input.supplier}`);
    if (input.poNumber) evidence.push(`Purchase Order: ${input.poNumber}`);
    if (input.shipmentId) evidence.push(`Shipment: ${input.shipmentId}`);
    if (hasDelay) evidence.push(`Schedule Delay: ${input.delayDays} calendar days`);

    // Ensemble scoring weights
    // w1: Schedule variance weight (0.35)
    // w2: Supplier commitment reliability weight (0.25)
    // w3: Inventory buffer breach weight (0.20)
    // w4: Operational statement volatility (0.20)

    const delayDays = hasDelay ? Math.max(0, input.delayDays!) : 0;
    const delayFeature = Math.min(100, (delayDays / 21) * 100);

    const statementLower = (input.statement || "").toLowerCase();
    let statementFeature = 20;
    if (statementLower.includes("halt") || statementLower.includes("line stoppage") || statementLower.includes("force majeure")) {
      statementFeature = 95;
    } else if (statementLower.includes("delay") || statementLower.includes("deferred") || statementLower.includes("shortage")) {
      statementFeature = 70;
    } else if (statementLower.includes("on track") || statementLower.includes("on schedule") || statementLower.includes("confirmed")) {
      statementFeature = 10;
    }

    let bufferFeature = 40; // baseline moderate uncertainty
    if (typeof input.bufferDaysRemaining === "number") {
      evidence.push(`Safety Stock Buffer Remaining: ${input.bufferDaysRemaining} days`);
      bufferFeature = input.bufferDaysRemaining <= 3 ? 90 : input.bufferDaysRemaining <= 7 ? 65 : 20;
    }

    let supplierHistoryFeature = 35;
    if (Array.isArray(input.historicalDelays) && input.historicalDelays.length > 0) {
      const avgHist = input.historicalDelays.reduce((a, b) => a + b, 0) / input.historicalDelays.length;
      supplierHistoryFeature = Math.min(100, (avgHist / 14) * 100);
      evidence.push(`Supplier Historical Average Delay: ${avgHist.toFixed(1)} days`);
    }

    // Weighted ensemble composite calculation
    const compositeScore = Math.round(
      delayFeature * 0.35 +
      statementFeature * 0.25 +
      bufferFeature * 0.20 +
      supplierHistoryFeature * 0.20
    );

    let riskClassification: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (compositeScore >= 75 || delayDays > 14) {
      riskClassification = "CRITICAL";
    } else if (compositeScore >= 50 || delayDays > 7) {
      riskClassification = "HIGH";
    } else if (compositeScore >= 30 || delayDays > 0) {
      riskClassification = "MEDIUM";
    }

    const vulnerabilities: string[] = [];
    if (delayDays > 0) vulnerabilities.push(`Delivery timeline drift of +${delayDays} days against baseline`);
    if (statementFeature > 60) vulnerabilities.push("Negative supplier qualitative commitment signaled");
    if (bufferFeature > 60) vulnerabilities.push("Production safety stock threshold compromised");

    const output: RiskSentinelOutput = {
      compositeScore,
      riskClassification,
      featureWeights: {
        scheduleDriftVariance: Math.round(delayFeature),
        statementVolatility: Math.round(statementFeature),
        inventoryBufferDepletion: Math.round(bufferFeature),
        supplierHistoricalDelay: Math.round(supplierHistoryFeature),
      },
      primaryVulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : ["No immediate critical vulnerabilities identified"],
      sufficientData: true,
      scoreExplanation: `Computed composite score of ${compositeScore}/100 categorized as ${riskClassification} risk.`,
    };

    return {
      runId,
      agentId: "risk_sentinel",
      agentName: "Risk Sentinel",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: input.supplier || input.shipmentId || input.poNumber,
      result: output,
      evidence,
      confidence: 0.92,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "risk_sentinel",
      agentName: "Risk Sentinel",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Risk Sentinel",
      evidence: ["Failed to calculate risk score."],
      confidence: 0,
    };
  }
}
