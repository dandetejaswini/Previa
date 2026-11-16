import { DisruptionRun, DeliveryDriftRun } from "../types";

export type SpecialistAgentId =
  | "risk_sentinel"
  | "forecasting"
  | "anomaly_detection"
  | "supplier_intelligence"
  | "nlp_document"
  | "external_intelligence"
  | "financial_intelligence"
  | "graph_intelligence"
  | "scenario_simulator"
  | "optimization"
  | "computer_vision"
  | "mitigation_action"
  | "decision_validation";

export interface SpecialistAgentMeta {
  id: SpecialistAgentId;
  name: string;
  role: string;
  technology: string;
  category: "DETECTION" | "PREDICTION" | "SYSTEMIC" | "ACTION_SYNTHESIS";
}

export interface AgentResult {
  agentId: SpecialistAgentId;
  agentName: string;
  runId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  executionTimeMs?: number;
  technology: string;
  role: string;
  findings: string[];
  evidence: string[];
  confidence: number; // 0 - 100
  recommendations: string[];
  metrics?: Record<string, string | number>;
  details?: any; // Structured domain data (e.g. graph nodes, simulation data, forecast series)
  errors?: string[];
}

export interface AgentConflict {
  id: string;
  agentA: { id: SpecialistAgentId; name: string; claim: string };
  agentB: { id: SpecialistAgentId; name: string; claim: string };
  description: string;
  discrepancyType: "SCHEDULE_SEVERITY" | "SUPPLIER_RELIABILITY" | "FINANCIAL_EXPOSURE" | "RISK_RATING";
  resolution: string;
  resolvedConfidence: number;
}

export interface MonteCarloScenarioResult {
  id: string;
  name: string;
  probability: number;
  expectedDelayDays: number;
  financialImpact: string;
  bufferStatus: "SAFE" | "DEPLETED" | "CRITICAL";
  recoveryWindowDays: number;
  narrative: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "TIER1_SUPPLIER" | "TIER2_SUPPLIER" | "PORT" | "PLANT" | "DISTRIBUTION_CENTER";
  status: "OPERATIONAL" | "BOTTLENECK" | "AT_RISK" | "DISRUPTED";
  criticality: "HIGH" | "MEDIUM" | "LOW";
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  leadTimeDays: number;
  isCriticalPath: boolean;
}

export interface PreviaDecisionEvent {
  runId: string;
  sourceEngine: "disruption" | "drift";
  timestamp: string;
  originalEngineResult: DisruptionRun | DeliveryDriftRun;
  agentResults: Record<SpecialistAgentId, AgentResult>;
  risks: string[];
  findings: string[];
  financialImpact: string;
  scheduleImpact: string;
  starvationHorizon: string;
  rootCauses: string[];
  recommendations: string[];
  evidence: string[];
  assumptions: string[];
  confidence: number;
  conflicts: AgentConflict[];

  // Traceable Decision Loop: AI recommendation -> Human decision -> Action -> Outcome
  originalRecommendation?: string;
  humanDecision?: "pending" | "approved" | "rejected" | "modified" | "assigned" | "completed" | "dismissed";
  modifiedRecommendation?: string;
  actionStatus?: "PENDING" | "IN_PROGRESS" | "EXECUTED" | "SUPERSEDED" | "REJECTED";
  outcome?: string;
  actualOutcome?: string;
  assignedTo?: string;
  decisionTimestamp?: string;
  decisionOperator?: string;
}

export const AGENT_REGISTRY: Record<SpecialistAgentId, SpecialistAgentMeta> = {
  risk_sentinel: {
    id: "risk_sentinel",
    name: "Risk Sentinel Agent",
    role: "Detect and score multi-dimensional supply-chain risks across volatility, velocity, and exposure.",
    technology: "XGBoost / Random Forest + Statistical Dispersion Modeling",
    category: "DETECTION",
  },
  forecasting: {
    id: "forecasting",
    name: "Forecasting Agent",
    role: "Forecast demand, inventory buffer depletion timelines, lead times, and supply trends.",
    technology: "Time-Series Models, Exponential Smoothing & Trajectory Fitting",
    category: "PREDICTION",
  },
  anomaly_detection: {
    id: "anomaly_detection",
    name: "Anomaly Detection Agent",
    role: "Detect abnormal supplier behavior, order quantity shifts, delivery variance, and communication slips.",
    technology: "Isolation Forest, Z-score Outlier Detection & IQR Heuristics",
    category: "DETECTION",
  },
  supplier_intelligence: {
    id: "supplier_intelligence",
    name: "Supplier Intelligence Agent",
    role: "Analyze supplier reliability, historical performance, delays, single-source concentration, and tier segmentation.",
    technology: "XGBoost + Supplier Segmentation & Concentration Modeling",
    category: "DETECTION",
  },
  nlp_document: {
    id: "nlp_document",
    name: "NLP & Document Agent",
    role: "Extract structured intelligence from supplier emails, PDFs, reports, contracts, and unstructured communications.",
    technology: "NLP + Transformer Semantic Extraction + Gemini Context",
    category: "DETECTION",
  },
  external_intelligence: {
    id: "external_intelligence",
    name: "External Intelligence Agent",
    role: "Analyze relevant external signals: weather, geopolitical corridors, port congestion, and transportation disruptions.",
    technology: "Geospatial Corridors, Port Congestion Index & Global Signal Feed",
    category: "SYSTEMIC",
  },
  financial_intelligence: {
    id: "financial_intelligence",
    name: "Financial Intelligence Agent",
    role: "Analyze financial exposure using available trusted data and RAG. Strictly preserves 'Insufficient data' when data is missing.",
    technology: "Cost Modeling + RAG Context. Anti-hallucination zero-fabrication rule",
    category: "SYSTEMIC",
  },
  graph_intelligence: {
    id: "graph_intelligence",
    name: "Graph Intelligence Agent",
    role: "Analyze dependencies between suppliers, materials, purchase orders, shipments, factories, and warehouses.",
    technology: "Graph ML / Network Topology & Bottleneck Path Analysis",
    category: "SYSTEMIC",
  },
  scenario_simulator: {
    id: "scenario_simulator",
    name: "Scenario Simulator Agent",
    role: "Run Monte Carlo what-if scenarios: supplier failure, delivery delay, inventory depletion, alternative suppliers, and quota cuts.",
    technology: "Monte Carlo Stochastic Simulation (1,000 Iteration Distribution)",
    category: "PREDICTION",
  },
  optimization: {
    id: "optimization",
    name: "Optimization Agent",
    role: "Identify optimized supplier allocation, inventory rebalancing, logistics routing, and resource decisions.",
    technology: "Linear Allocation Optimization / Google OR-Tools Heuristics",
    category: "ACTION_SYNTHESIS",
  },
  computer_vision: {
    id: "computer_vision",
    name: "Computer Vision Agent",
    role: "Extract information from invoices, scanned documents, shipment images, bills of lading, and packaging labels.",
    technology: "Visual Document Inspection & Automated OCR Verification",
    category: "DETECTION",
  },
  mitigation_action: {
    id: "mitigation_action",
    name: "Mitigation & Action Agent",
    role: "Convert validated analysis into concrete, prioritized, operational mitigation plans with risk reduction scores.",
    technology: "Multi-Criteria Decision Analysis & Action Policy Ranking",
    category: "ACTION_SYNTHESIS",
  },
  decision_validation: {
    id: "decision_validation",
    name: "Decision & Validation Agent",
    role: "Validate evidence, cross-check agent findings, detect conflicts, compute composite confidence, and produce consolidated intelligence.",
    technology: "Consensus Arbitration, Conflict Detection & Composite Verification",
    category: "ACTION_SYNTHESIS",
  },
};
