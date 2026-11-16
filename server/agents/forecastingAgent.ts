import { AgentExecutionRecord } from "../../src/types";

export interface ForecastingInput {
  leadTimeDays?: number | null;
  currentBufferDays?: number | null;
  dailyBurnUnits?: number;
  historicalDeliveries?: Array<{ date: string; delayDays: number }>;
  projectedDriftDays?: number | null;
}

export interface ForecastingOutput {
  hasSufficientHistory: boolean;
  forecastNotice: string;
  predictedLeadTimeDays: number | null;
  stockoutHorizonDays: number | null;
  stockoutDateEstimate: string | null;
  supplierTrend: "STABLE" | "DEGRADING" | "IMPROVING" | "INSUFFICIENT_DATA";
  confidenceInterval: {
    lowerBoundDays: number | null;
    upperBoundDays: number | null;
  };
}

/**
 * AGENT 5 — FORECASTING AGENT
 * Predicts future supply-chain conditions, inventory depletion horizons, and supplier trend variance.
 * If insufficient history exists: returns "Insufficient historical data for reliable forecast."
 */
export async function executeForecastingAgent(
  runId: string,
  input: ForecastingInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const historical = input.historicalDeliveries || [];
    const hasHistory = historical.length >= 3;
    const hasProjectedDrift = typeof input.projectedDriftDays === "number";
    const hasBuffer = typeof input.currentBufferDays === "number";

    if (!hasHistory && !hasProjectedDrift && !hasBuffer) {
      return {
        runId,
        agentId: "forecasting_agent",
        agentName: "Forecasting Agent",
        timestamp,
        status: "COMPLETE",
        durationMs: Date.now() - startTime,
        result: {
          hasSufficientHistory: false,
          forecastNotice: "Insufficient historical data for reliable forecast.",
          predictedLeadTimeDays: null,
          stockoutHorizonDays: null,
          stockoutDateEstimate: null,
          supplierTrend: "INSUFFICIENT_DATA",
          confidenceInterval: { lowerBoundDays: null, upperBoundDays: null },
        } as ForecastingOutput,
        evidence: ["Insufficient historical time-series data: Fewer than 3 delivery milestones on record."],
        confidence: 0,
      };
    }

    let supplierTrend: ForecastingOutput["supplierTrend"] = "STABLE";
    let predictedLeadTimeDays: number | null = input.leadTimeDays || 45; // baseline

    if (hasHistory) {
      evidence.push(`Evaluated ${historical.length} historical delivery records.`);
      const delays = historical.map((h) => h.delayDays);
      const recent = delays.slice(-3);
      const early = delays.slice(0, 3);
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgEarly = early.reduce((a, b) => a + b, 0) / early.length;

      if (avgRecent > avgEarly + 2) {
        supplierTrend = "DEGRADING";
      } else if (avgRecent < avgEarly - 2) {
        supplierTrend = "IMPROVING";
      }

      predictedLeadTimeDays = (input.leadTimeDays || 45) + Math.round(avgRecent);
    } else {
      evidence.push("Historical time-series is limited; projecting forward using current incident schedule drift.");
      if (hasProjectedDrift) {
        predictedLeadTimeDays = (input.leadTimeDays || 45) + input.projectedDriftDays!;
      }
    }

    // Stockout horizon calculation
    let stockoutHorizonDays: number | null = null;
    let stockoutDateEstimate: string | null = null;

    if (hasBuffer) {
      stockoutHorizonDays = input.currentBufferDays!;
      evidence.push(`Current Factory Safety Buffer: ${input.currentBufferDays} operating days.`);
    } else if (hasProjectedDrift && input.projectedDriftDays! > 0) {
      // Nominal standard safety stock benchmark is 10-14 days
      const nominalBuffer = 12;
      stockoutHorizonDays = Math.max(0, nominalBuffer - input.projectedDriftDays!);
      evidence.push(`Simulated buffer depletion based on +${input.projectedDriftDays}d delay against 12d nominal stock: ${stockoutHorizonDays}d remaining.`);
    }

    if (stockoutHorizonDays !== null) {
      const targetDate = new Date(Date.now() + stockoutHorizonDays * 24 * 60 * 60 * 1000);
      stockoutDateEstimate = targetDate.toISOString().split("T")[0];
    }

    const driftVariance = hasProjectedDrift ? Math.max(2, Math.round(input.projectedDriftDays! * 0.2)) : 3;
    const lowerBoundDays = predictedLeadTimeDays !== null ? Math.max(0, predictedLeadTimeDays - driftVariance) : null;
    const upperBoundDays = predictedLeadTimeDays !== null ? predictedLeadTimeDays + driftVariance : null;

    const output: ForecastingOutput = {
      hasSufficientHistory: hasHistory,
      forecastNotice: hasHistory
        ? `Statistical forecast generated across ${historical.length} delivery points.`
        : "Forecast generated from single-incident drift parameters. Insufficient historical data for deep multi-year regression.",
      predictedLeadTimeDays,
      stockoutHorizonDays,
      stockoutDateEstimate,
      supplierTrend,
      confidenceInterval: {
        lowerBoundDays,
        upperBoundDays,
      },
    };

    return {
      runId,
      agentId: "forecasting_agent",
      agentName: "Forecasting Agent",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      result: output,
      evidence,
      confidence: hasHistory ? 0.91 : 0.81,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "forecasting_agent",
      agentName: "Forecasting Agent",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Forecasting Agent",
      evidence: ["Failed to generate forecast."],
      confidence: 0,
    };
  }
}
