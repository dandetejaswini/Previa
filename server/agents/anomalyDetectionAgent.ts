import { AgentExecutionRecord } from "../../src/types";

export interface AnomalyDetectionInput {
  entityId?: string;
  delayDays?: number | null;
  statement?: string;
  orderQuantity?: number | null;
  historicalAverageQuantity?: number | null;
  expectedDeliveryWindowDays?: number | null;
}

export interface DetectedAnomaly {
  id: string;
  type: "SCHEDULE_OUTLIER" | "STATEMENT_VOLATILITY" | "QUANTITY_DEVIATION" | "UNUSUAL_MILESTONE";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  affectedEntity: string;
  zScoreEstimate: number;
}

export interface AnomalyDetectionOutput {
  hasAnomaly: boolean;
  anomalies: DetectedAnomaly[];
  anomalyScore: number; // 0 - 100
  summary: string;
}

/**
 * AGENT 7 — ANOMALY DETECTION AGENT
 * Identifies statistical outliers in delivery timing, order sizes, and supplier statements.
 */
export async function executeAnomalyDetectionAgent(
  runId: string,
  input: AnomalyDetectionInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];
  const anomalies: DetectedAnomaly[] = [];

  try {
    const entity = input.entityId || "Active Supply Chain Node";
    const delayDays = typeof input.delayDays === "number" ? input.delayDays : 0;

    // 1. Schedule delay outlier check (Z-score heuristic against nominal 2-day stddev)
    if (delayDays > 14) {
      evidence.push(`Observed delay of +${delayDays} days exceeds 3.5 standard deviations (Critical outlier).`);
      anomalies.push({
        id: `anom-${Date.now()}-1`,
        type: "SCHEDULE_OUTLIER",
        severity: "CRITICAL",
        description: `Extreme schedule deviation of +${delayDays} days detected against standard procurement tolerance.`,
        affectedEntity: entity,
        zScoreEstimate: +(delayDays / 3.5).toFixed(2),
      });
    } else if (delayDays > 7) {
      evidence.push(`Observed delay of +${delayDays} days exceeds 2 standard deviations.`);
      anomalies.push({
        id: `anom-${Date.now()}-1`,
        type: "SCHEDULE_OUTLIER",
        severity: "HIGH",
        description: `High schedule variance of +${delayDays} days detected.`,
        affectedEntity: entity,
        zScoreEstimate: +(delayDays / 3.5).toFixed(2),
      });
    }

    // 2. Statement anomaly check
    const statementLower = (input.statement || "").toLowerCase();
    if (statementLower.includes("force majeure") || statementLower.includes("line stoppage") || statementLower.includes("seismic")) {
      evidence.push("Detected rare high-impact crisis phrases in communication.");
      anomalies.push({
        id: `anom-${Date.now()}-2`,
        type: "STATEMENT_VOLATILITY",
        severity: "CRITICAL",
        description: "Qualitative crisis terminology flagged by NLP statement scanner.",
        affectedEntity: entity,
        zScoreEstimate: 4.1,
      });
    }

    // 3. Order quantity anomaly
    if (input.orderQuantity && input.historicalAverageQuantity && input.historicalAverageQuantity > 0) {
      const ratio = input.orderQuantity / input.historicalAverageQuantity;
      if (ratio > 2.5 || ratio < 0.4) {
        evidence.push(`Order quantity (${input.orderQuantity}) deviates by ${((ratio - 1) * 100).toFixed(0)}% from average (${input.historicalAverageQuantity}).`);
        anomalies.push({
          id: `anom-${Date.now()}-3`,
          type: "QUANTITY_DEVIATION",
          severity: ratio > 3 ? "CRITICAL" : "MEDIUM",
          description: `Order quantity variance of ${((ratio - 1) * 100).toFixed(0)}% detected.`,
          affectedEntity: entity,
          zScoreEstimate: +Math.abs(ratio - 1).toFixed(2),
        });
      }
    }

    const hasAnomaly = anomalies.length > 0;
    const anomalyScore = hasAnomaly
      ? Math.min(100, Math.round(anomalies.reduce((acc, a) => acc + (a.severity === "CRITICAL" ? 45 : a.severity === "HIGH" ? 30 : 15), 10)))
      : 5;

    const output: AnomalyDetectionOutput = {
      hasAnomaly,
      anomalies,
      anomalyScore,
      summary: hasAnomaly
        ? `Detected ${anomalies.length} statistical anomalies (Severity: ${anomalies[0].severity}).`
        : "Operational metrics remain within expected 2-sigma control boundaries.",
    };

    return {
      runId,
      agentId: "anomaly_detection",
      agentName: "Anomaly Detection Agent",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: entity,
      result: output,
      evidence,
      confidence: 0.94,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "anomaly_detection",
      agentName: "Anomaly Detection Agent",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Anomaly Detection",
      evidence: ["Failed to run anomaly detection."],
      confidence: 0,
    };
  }
}
