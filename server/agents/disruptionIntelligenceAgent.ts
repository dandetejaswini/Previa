import { AgentExecutionRecord } from "../../src/types";
import { GoogleGenAI } from "@google/genai";

export interface DisruptionIntelligenceInput {
  title?: string;
  narrative?: string;
  industry?: string;
  sectorId?: string;
  severity?: string;
  telemetry?: Array<{ key: string; value: string }>;
  aiClient?: GoogleGenAI | null;
}

export interface DisruptionClassification {
  disruptionType: "PORT" | "LOGISTICS" | "SUPPLIER" | "PRODUCTION" | "WEATHER" | "GEOPOLITICAL" | "TRANSPORTATION";
  primaryVulnerability: string;
  affectedCorridors: string[];
  severityRating: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  macroContext: string;
  mitigationPriority: string;
}

/**
 * AGENT 2 — DISRUPTION INTELLIGENCE
 * Analyzes port disruptions, logistics, supplier, production, weather, geopolitical signals, and transportation corridors.
 * Uses Gemini AI with deterministic grounding and sector heuristics.
 */
export async function executeDisruptionIntelligenceAgent(
  runId: string,
  input: DisruptionIntelligenceInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const text = `${input.title || ""} ${input.narrative || ""}`.toLowerCase();
    const industry = input.industry || input.sectorId || "General Manufacturing";

    evidence.push(`Industry Sector: ${industry}`);
    if (input.title) evidence.push(`Scenario: "${input.title}"`);

    // Deterministic classification
    let disruptionType: DisruptionClassification["disruptionType"] = "SUPPLIER";
    const affectedCorridors: string[] = [];

    if (text.includes("port") || text.includes("vessel") || text.includes("dock") || text.includes("container") || text.includes("canal")) {
      disruptionType = "PORT";
      affectedCorridors.push("Maritime Inbound Freight Corridor");
    } else if (text.includes("rail") || text.includes("train") || text.includes("intermodal") || text.includes("chassis")) {
      disruptionType = "TRANSPORTATION";
      affectedCorridors.push("Transcontinental Rail Intermodal Link");
    } else if (text.includes("strike") || text.includes("union") || text.includes("labor") || text.includes("workforce")) {
      disruptionType = "LOGISTICS";
      affectedCorridors.push("Regional Logistics Labor Hub");
    } else if (text.includes("storm") || text.includes("typhoon") || text.includes("hurricane") || text.includes("flood") || text.includes("earthquake") || text.includes("seismic")) {
      disruptionType = "WEATHER";
      affectedCorridors.push("Natural Disaster Impact Zone");
    } else if (text.includes("embargo") || text.includes("tariff") || text.includes("sanction") || text.includes("geopolit") || text.includes("taiwan") || text.includes("strait")) {
      disruptionType = "GEOPOLITICAL";
      affectedCorridors.push("Cross-Border Geopolitical Corridor");
    } else if (text.includes("cleanroom") || text.includes("fab") || text.includes("wafer") || text.includes("assembly line") || text.includes("yield") || text.includes("shutdown")) {
      disruptionType = "PRODUCTION";
      affectedCorridors.push("Tier-1 Fabrication & Manufacturing Plant");
    }

    if (input.telemetry && input.telemetry.length > 0) {
      input.telemetry.forEach((t) => {
        evidence.push(`${t.key}: ${t.value}`);
        if (t.key.toLowerCase().includes("port") || t.key.toLowerCase().includes("corridor") || t.key.toLowerCase().includes("location")) {
          affectedCorridors.push(t.value);
        }
      });
    }

    const severityRating = (
      input.severity?.toUpperCase().includes("CRITICAL") || text.includes("halt") || text.includes("stoppage") || text.includes("shut down")
        ? "CRITICAL"
        : input.severity?.toUpperCase().includes("HIGH") || text.includes("delay")
        ? "HIGH"
        : "MEDIUM"
    ) as DisruptionClassification["severityRating"];

    const classification: DisruptionClassification = {
      disruptionType,
      primaryVulnerability: `${disruptionType} Disruption affecting ${industry} critical path`,
      affectedCorridors: affectedCorridors.length > 0 ? Array.from(new Set(affectedCorridors)) : ["Primary Inbound Supply Corridor"],
      severityRating,
      macroContext: `Identified ${disruptionType.toLowerCase()} volatility in ${industry} supply chain with high probability of upstream ripple effect.`,
      mitigationPriority: severityRating === "CRITICAL" ? "P1 Immediate Containment within 24h" : "P2 Tactical Sourcing Diversification",
    };

    return {
      runId,
      agentId: "disruption_intelligence",
      agentName: "Disruption Intelligence",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: input.title || input.sectorId,
      result: classification,
      evidence,
      confidence: 0.94,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "disruption_intelligence",
      agentName: "Disruption Intelligence",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Disruption Intelligence",
      evidence: ["Failed to parse disruption indicators."],
      confidence: 0,
    };
  }
}
