import { AgentExecutionRecord } from "../../src/types";

export interface SupplierIntelligenceInput {
  supplierId?: string;
  supplierName?: string;
  delayDays?: number | null;
  historicalDeliveriesCount?: number;
  totalOrdersCount?: number;
  onTimeDeliveriesCount?: number;
  knownAlternateSuppliers?: string[];
}

export interface SupplierIntelligenceOutput {
  supplierId: string;
  reliabilityScore: number | "Insufficient data";
  segmentation: "STRATEGIC" | "PREFERRED" | "WATCHLIST" | "CRITICAL_RISK" | "NEW_VENDOR";
  concentrationRisk: "HIGH" | "MEDIUM" | "LOW";
  alternateSupplierAvailability: string[];
  historicalMetricsSummary: string;
  hasStoredHistory: boolean;
}

/**
 * AGENT 6 — SUPPLIER INTELLIGENCE AGENT
 * Analyzes supplier performance, delivery reliability, concentration, and alternate sourcing.
 * Never invents supplier history; uses actual provided and stored supplier data.
 */
export async function executeSupplierIntelligenceAgent(
  runId: string,
  input: SupplierIntelligenceInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const supplierId = input.supplierId || input.supplierName || "Unassigned Supplier";
    evidence.push(`Supplier Entity: ${supplierId}`);

    const hasCounts = typeof input.totalOrdersCount === "number" && input.totalOrdersCount > 0;
    const hasDelay = typeof input.delayDays === "number";

    let reliabilityScore: number | "Insufficient data" = "Insufficient data";
    let segmentation: SupplierIntelligenceOutput["segmentation"] = "WATCHLIST";
    let hasStoredHistory = false;

    if (hasCounts) {
      hasStoredHistory = true;
      const onTime = input.onTimeDeliveriesCount || 0;
      const rate = Math.round((onTime / input.totalOrdersCount!) * 100);
      reliabilityScore = rate;
      evidence.push(`Recorded Deliveries: ${input.totalOrdersCount} | On-Time Rate: ${rate}%`);

      if (rate >= 95) segmentation = "STRATEGIC";
      else if (rate >= 85) segmentation = "PREFERRED";
      else if (rate >= 70) segmentation = "WATCHLIST";
      else segmentation = "CRITICAL_RISK";
    } else if (hasDelay) {
      if (input.delayDays! === 0) {
        reliabilityScore = 95;
        segmentation = "PREFERRED";
        evidence.push("Current contractual commitment is strictly on-schedule (0 days drift).");
      } else if (input.delayDays! > 14) {
        reliabilityScore = 45;
        segmentation = "CRITICAL_RISK";
        evidence.push(`Current incident displays severe schedule drift of +${input.delayDays} days.`);
      } else if (input.delayDays! > 7) {
        reliabilityScore = 65;
        segmentation = "WATCHLIST";
        evidence.push(`Current incident displays moderate schedule drift of +${input.delayDays} days.`);
      } else {
        reliabilityScore = 80;
        segmentation = "WATCHLIST";
        evidence.push(`Minor delivery variance of +${input.delayDays} days.`);
      }
    } else {
      segmentation = "NEW_VENDOR";
      evidence.push("No historical PO ledger or fulfillment history found in current database.");
    }

    // Evaluate concentration risk
    const concentrationRisk = (
      input.knownAlternateSuppliers && input.knownAlternateSuppliers.length >= 2
        ? "LOW"
        : input.knownAlternateSuppliers && input.knownAlternateSuppliers.length === 1
        ? "MEDIUM"
        : "HIGH"
    ) as SupplierIntelligenceOutput["concentrationRisk"];

    const alternates = input.knownAlternateSuppliers && input.knownAlternateSuppliers.length > 0
      ? input.knownAlternateSuppliers
      : ["Secondary qualified vendor qualification required under emergency sourcing playbook"];

    const output: SupplierIntelligenceOutput = {
      supplierId,
      reliabilityScore,
      segmentation,
      concentrationRisk,
      alternateSupplierAvailability: alternates,
      historicalMetricsSummary: hasStoredHistory
        ? `Supplier historical fulfillment rate is ${reliabilityScore}%.`
        : "Evaluation grounded on active incident commitment; deep longitudinal history unavailable.",
      hasStoredHistory,
    };

    return {
      runId,
      agentId: "supplier_intelligence",
      agentName: "Supplier Intelligence Agent",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: supplierId,
      result: output,
      evidence,
      confidence: hasStoredHistory ? 0.95 : 0.85,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "supplier_intelligence",
      agentName: "Supplier Intelligence Agent",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Supplier Intelligence",
      evidence: ["Failed to analyze supplier."],
      confidence: 0,
    };
  }
}
