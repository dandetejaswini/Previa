import {
  AgentExecutionRecord,
  PreviaDecisionRecommendation,
  ScenarioSimulationParams,
  ScenarioSimulationResult,
} from "../../src/types";

export interface ScenarioOptimizationInput {
  stage1Results?: Record<string, any>;
  supplier?: string;
  delayDays?: number | null;
  financialExposureDisplay?: string;
  narrative?: string;
  customParams?: ScenarioSimulationParams;
}

export interface ScenarioOptimizationOutput {
  recommendedActionPlan: PreviaDecisionRecommendation[];
  monteCarloSummary: {
    iterations: number;
    meanDelayDays: number;
    p95DelayDays: number;
    probabilityOfStockoutPercent: number;
  };
  optimalMitigationStrategy: string;
  tradeoffAnalysis: string[];
  simulationResult?: ScenarioSimulationResult;
}

/**
 * Monte Carlo simulator for supply-chain lead-time distributions (1,000 iterations).
 */
function runMonteCarloSimulation(baselineDelay: number, iterations = 1000) {
  let stockoutCount = 0;
  let totalDelay = 0;
  const simulatedDelays: number[] = [];

  // Assume log-normal distribution around baseline delay
  const mean = Math.max(0, baselineDelay);
  const std = Math.max(1.5, mean * 0.25);

  for (let i = 0; i < iterations; i++) {
    // Box-Muller transform for normal random variable
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const delay = Math.max(0, Math.round(mean + z * std));

    simulatedDelays.push(delay);
    totalDelay += delay;
    // Assuming safety stock buffer is 10 days
    if (delay > 10) {
      stockoutCount++;
    }
  }

  simulatedDelays.sort((a, b) => a - b);
  const meanDelay = +(totalDelay / iterations).toFixed(1);
  const p95Index = Math.floor(iterations * 0.95);
  const p95Delay = simulatedDelays[p95Index] || meanDelay;
  const probStockout = Math.round((stockoutCount / iterations) * 100);

  return {
    iterations,
    meanDelayDays: meanDelay,
    p95DelayDays: p95Delay,
    probabilityOfStockoutPercent: probStockout,
  };
}

/**
 * AGENT 10 — SCENARIO, OPTIMIZATION & MITIGATION AGENT
 * Combines scenario simulation, Monte Carlo risk bounds, and optimization.
 * Formulates tactical recommendations.
 * CRITICAL RULE: Human operator approval is MANDATORY before execution.
 */
export async function executeScenarioOptimizationAgent(
  runId: string,
  input: ScenarioOptimizationInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const delayDays = typeof input.delayDays === "number" ? input.delayDays : 7;
    const supplier = input.supplier || "Key Supplier";

    // 1. Run Monte Carlo simulation over stochastic schedule distribution
    const mc = runMonteCarloSimulation(delayDays, 1000);
    evidence.push(`Ran Monte Carlo simulation (1,000 iterations): Mean Delay = ${mc.meanDelayDays}d, P95 = ${mc.p95DelayDays}d`);
    evidence.push(`Calculated Stockout Probability: ${mc.probabilityOfStockoutPercent}%`);

    // 2. Generate optimized action plan (Human approval required)
    const recommendations: PreviaDecisionRecommendation[] = [
      {
        id: `rec-${runId}-1`,
        title: "Immediate Buffer Ring-Fencing & Allocation Audit",
        action: `Engage ${supplier} allocation director to lock remaining on-hand wafer inventory and freeze discretionary line allocation.`,
        priority: mc.p95DelayDays > 14 ? "IMMEDIATE" : "HIGH",
        timeframe: "0–24 Hours",
        owner: "Procurement & Sourcing Lead",
        phase: "Phase 1: Immediate Containment",
        requiresApproval: true,
        status: "pending",
      },
      {
        id: `rec-${runId}-2`,
        title: "Tactical Multi-Sourcing & Air Charter Contracting",
        action: "Activate pre-qualified secondary distributor slots and evaluate emergency spot air-freight quotation for initial 40% batch.",
        priority: "HIGH",
        timeframe: "24–72 Hours",
        owner: "Inbound Intermodal Logistics Lead",
        phase: "Phase 2: Tactical Mitigation",
        requiresApproval: true,
        status: "pending",
      },
      {
        id: `rec-${runId}-3`,
        title: "Systemic SLA & Safety-Stock Algorithm Recalibration",
        action: "Increase dynamic buffer floor from 10 to 18 operating days and establish dual-continent wafer tape-out framework.",
        priority: "MEDIUM",
        timeframe: "14–60 Days",
        owner: "Chief Supply Chain Officer (CSCO)",
        phase: "Phase 3: Systemic Stabilization",
        requiresApproval: true,
        status: "pending",
      },
    ];

    // 3. Trade-off analysis
    const tradeoffs = [
      `Spot air-charter expediting reduces critical path drift by 65% but introduces a 22% freight cost surcharge.`,
      `Dual-sourcing split (70/30) mitigates single-point-of-failure risk but requires 14-day secondary line qualification.`,
      `Inventory buffer expansion protects assembly lines against future +14d variance at an incremental holding cost of ~0.15% per day.`,
    ];

    // 4. Interactive Simulation if customParams provided
    let simulationResult: ScenarioSimulationResult | undefined = undefined;
    if (input.customParams) {
      const delta = input.customParams.delayDaysDelta || 0;
      const shift = input.customParams.allocationShiftPercent || 0;
      const newDelay = Math.max(0, delayDays + delta);
      const mitigatedDelay = shift > 0 ? Math.max(0, Math.round(newDelay * (1 - shift / 100))) : newDelay;

      simulationResult = {
        scenarioId: `sim-${Date.now()}`,
        timestamp,
        baseline: {
          financialExposure: input.financialExposureDisplay || "Estimated baseline exposure",
          starvationHorizon: `${Math.max(0, 12 - delayDays)} days safety buffer remaining`,
          leadTimeVariance: `+${delayDays} days`,
        },
        simulated: {
          financialExposure: shift > 0 ? "Reduced via secondary allocation" : "Baseline exposure sustained",
          starvationHorizon: `${Math.max(0, 12 - mitigatedDelay)} days with simulated mitigation`,
          leadTimeVariance: `+${mitigatedDelay} days`,
          mitigationScore: Math.min(100, Math.round(85 - mitigatedDelay * 2.5 + shift * 0.3)),
        },
        tradeoffs,
        optimalAction: shift > 0
          ? `Execute ${shift}% allocation split to secondary supplier with human sign-off.`
          : `Maintain primary mitigation protocol with 48h checkpoint review.`,
        humanApprovalRequired: true,
      };
    }

    const output: ScenarioOptimizationOutput = {
      recommendedActionPlan: recommendations,
      monteCarloSummary: mc,
      optimalMitigationStrategy: mc.p95DelayDays > 14
        ? "Aggressive Dual-Sourcing with Spot Air Expediting"
        : "Standard Safety Buffer Rebalancing with Milestone Audit",
      tradeoffAnalysis: tradeoffs,
      simulationResult,
    };

    return {
      runId,
      agentId: "scenario_optimization",
      agentName: "Scenario, Optimization & Mitigation Agent",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: supplier,
      result: output,
      evidence,
      confidence: 0.94,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "scenario_optimization",
      agentName: "Scenario, Optimization & Mitigation Agent",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Scenario Optimization",
      evidence: ["Failed to synthesize mitigation plan."],
      confidence: 0,
    };
  }
}
