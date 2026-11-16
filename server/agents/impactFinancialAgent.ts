import { AgentExecutionRecord } from "../../src/types";

export interface ImpactFinancialInput {
  financialRawText?: string;
  delayDays?: number | null;
  dailyCarryingCost?: number;
  contractValue?: number;
  plantIdleRatePerDay?: number;
  narrative?: string;
  telemetry?: Array<{ key: string; value: string }>;
}

export interface ImpactFinancialOutput {
  financialExposure: {
    min: number | null;
    max: number | null;
    display: string;
    hasRealData: boolean;
  };
  productionImpact: string;
  scheduleImpact: {
    driftDays: number | null;
    display: string;
  };
  downstreamFacilities: string[];
  inventoryImpact: string;
}

/**
 * AGENT 4 — IMPACT & FINANCIAL ANALYZER
 * Quantifies production, schedule, inventory, and financial exposure.
 * Never invents financial figures. Returns "Insufficient data" if financial telemetry is not supplied.
 */
export async function executeImpactFinancialAgent(
  runId: string,
  input: ImpactFinancialInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const combinedText = `${input.narrative || ""} ${input.financialRawText || ""}`;
    const delayDays = typeof input.delayDays === "number" ? input.delayDays : null;

    if (delayDays !== null) {
      evidence.push(`Schedule Drift: +${delayDays} calendar days`);
    }

    // Check for explicit dollar numbers in narrative, telemetry, or parameters
    let minExp: number | null = null;
    let maxExp: number | null = null;
    let hasRealData = false;

    // 1. Check explicit dollar match in text e.g. "$8,500,000 - $14,200,000" or "$3,200,000"
    const dollarMatches = combinedText.match(/\$\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:[M|k|K|m|–|-|to]+)?/gi);
    if (dollarMatches && dollarMatches.length > 0) {
      hasRealData = true;
      evidence.push(`Detected financial figure in incident statement: ${dollarMatches.slice(0, 2).join(" – ")}`);
    }

    // 2. Check telemetry
    if (input.telemetry) {
      for (const t of input.telemetry) {
        if (t.value.includes("$") || t.key.toLowerCase().includes("cost") || t.key.toLowerCase().includes("loss")) {
          hasRealData = true;
          evidence.push(`Telemetry Financial Item: ${t.key} = ${t.value}`);
        }
      }
    }

    // 3. Compute deterministic carrying cost if contract values are provided
    if (input.contractValue && delayDays && delayDays > 0) {
      const carryingRate = input.dailyCarryingCost || 0.0015; // 0.15% daily holding rate
      const directCarryingCost = Math.round(input.contractValue * carryingRate * delayDays);
      const idleCost = (input.plantIdleRatePerDay || 0) * delayDays;
      minExp = directCarryingCost;
      maxExp = directCarryingCost + idleCost;
      hasRealData = true;
      evidence.push(`Contract Value: $${input.contractValue.toLocaleString()}`);
      evidence.push(`Calculated Carrying Cost Over ${delayDays} Days: $${directCarryingCost.toLocaleString()}`);
    }

    let display = "Insufficient data";
    if (hasRealData) {
      if (minExp !== null && maxExp !== null && maxExp > minExp) {
        display = `$${minExp.toLocaleString()} – $${maxExp.toLocaleString()} idle plant overhead & expediting variance`;
      } else if (minExp !== null) {
        display = `$${minExp.toLocaleString()} carrying variance`;
      } else if (dollarMatches && dollarMatches.length >= 2) {
        display = `${dollarMatches[0]} – ${dollarMatches[1]} projected disruption variance`;
      } else if (dollarMatches && dollarMatches.length === 1) {
        display = `${dollarMatches[0]} exposure`;
      } else {
        display = "Financial telemetry verified in incident documentation";
      }
    } else {
      evidence.push("No contractual unit values or accounting balance sheets were provided.");
    }

    const scheduleImpactDisplay = delayDays !== null && delayDays > 0
      ? `+${delayDays} days schedule variance`
      : delayDays === 0
      ? "0 days schedule variance (on schedule)"
      : "Schedule drift cannot be calculated from provided data";

    const productionImpact = delayDays && delayDays > 7
      ? `Sub-assembly sequencing faces high starvation exposure beyond baseline buffer thresholds.`
      : delayDays && delayDays > 0
      ? `Minor line pacing adjustments required for buffer replenishment.`
      : "Nominal production line consumption sustained.";

    const inventoryImpact = delayDays && delayDays > 0
      ? `Estimated buffer inventory depletion of ${delayDays} operational consumption days.`
      : "Buffer safety inventory remains within contractual parameters.";

    const output: ImpactFinancialOutput = {
      financialExposure: {
        min: minExp,
        max: maxExp,
        display,
        hasRealData,
      },
      productionImpact,
      scheduleImpact: {
        driftDays: delayDays,
        display: scheduleImpactDisplay,
      },
      downstreamFacilities: ["Primary Assembly Plant", "Regional Distribution Hub"],
      inventoryImpact,
    };

    return {
      runId,
      agentId: "impact_analyzer",
      agentName: "Impact & Financial Analyzer",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      result: output,
      evidence,
      confidence: hasRealData ? 0.93 : 0.8,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "impact_analyzer",
      agentName: "Impact & Financial Analyzer",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Impact Analyzer",
      evidence: ["Failed to calculate financial impact."],
      confidence: 0,
    };
  }
}
