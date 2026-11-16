import { GoogleGenAI } from "@google/genai";

export interface OrchestratorInput {
  sourceEngine: "disruption" | "drift";
  originalResult: any; // DisruptionRun or DeliveryDriftRun
  additionalContext?: {
    uploadedDocText?: string;
    uploadedDocName?: string;
    customScenarioOverride?: string;
  };
}

export interface AgentExecutionContext {
  runId: string;
  sourceEngine: "disruption" | "drift";
  originalResult: any;
  ai: GoogleGenAI | null;
  knowledgeBaseContext?: string;
  additionalContext?: {
    uploadedDocText?: string;
    uploadedDocName?: string;
  };
}

export function extractCommonMetadata(context: AgentExecutionContext) {
  const isDisruption = context.sourceEngine === "disruption";
  const run = context.originalResult || {};

  const title = isDisruption
    ? run.title || "Disruption Scenario"
    : `${run.poNumber || "PO"} - ${run.supplier || "Supplier"}`;
  const industry = isDisruption ? run.industry || "MANUFACTURING" : run.riskCategory || "SUPPLIER SOURCING";
  const severity = isDisruption ? run.severity || "HIGH" : run.riskLevel || "MEDIUM RISK";
  const statement = isDisruption ? run.narrative || run.summary || "" : run.latestCommunication || "";
  const financialExposure = isDisruption
    ? run.keyMetrics?.financialExposure?.value || "Insufficient data"
    : "Contract value under review";
  const leadTimeDrift = isDisruption
    ? run.keyMetrics?.leadTimeDrift?.value || "Variance under review"
    : run.driftComparison?.driftDisplay || "0 days";
  const starvationHorizon = isDisruption
    ? run.keyMetrics?.starvationHorizon?.value || "Buffer depletion within 10-14 days"
    : "Safety buffer adequate";
  const supplierName = isDisruption ? run.sectorParameters?.primarySupplier || "Tier-1 Corridors" : run.supplier || "Vendor";
  const material = isDisruption ? run.sectorParameters?.componentFamily || "Critical Subcomponents" : run.material || "Components";

  return {
    isDisruption,
    title,
    industry,
    severity,
    statement,
    financialExposure,
    leadTimeDrift,
    starvationHorizon,
    supplierName,
    material,
    originalResult: run,
  };
}
