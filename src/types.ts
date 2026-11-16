export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type PriorityLevel = "Immediate" | "High" | "Medium" | "Low";

export interface RecommendedAction {
  action: string;
  priority: PriorityLevel | string;
  timeframe: string;
  owner: string;
}

export interface PotentialImpact {
  operational: string;
  financial: string;
  timeline: string;
  affectedStakeholders: string[];
}

export interface RiskAnalysis {
  riskIdentified: string;
  riskLevel: RiskLevel;
  priority: PriorityLevel;
  executiveSummary: string;
  potentialImpact: PotentialImpact;
  likelyCauses: string[];
  recommendedActions: RecommendedAction[];
  providedInformation: string[];
  assumptions: string[];
}

export interface RiskAnalysisRecord {
  id: string;
  scenario: string;
  analysis: RiskAnalysis;
  timestamp: string;
  isSimulated?: boolean;
}

export type AppProfile = "ADMIN" | "USER";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  profileRole: AppProfile;
  role?: string;
  company?: string;
  provider?: "google" | "password";
  auth_provider?: "google" | "email";
  provider_user_id?: string;
  created_at?: string;
}

export type PageView =
  | "home"
  | "about"
  | "intelligence"
  | "control_tower"
  | "contact"
  | "admin_dashboard"
  | "admin_knowledge_base"
  | "signup"
  | "login";

// Knowledge Base & RAG Types
export type DocumentProcessingStatus = "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface KnowledgeBaseDocument {
  documentId: string;
  title?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  processingStatus: DocumentProcessingStatus;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  totalCharacters: number;
  totalTokens: number; // Estimated tokens
  totalEstimatedTokens?: number;
  totalChunks: number;
  chunkCount?: number;
  averageChunkSize: number;
  source: string;
  processingError?: string;
  version: number;
}

export interface KnowledgeBaseChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number; // Estimated tokens
  sourceFileName: string;
  pageNumber?: number | null;
  section?: string | null;
  keywords?: string[];
  createdAt: string;
}

export interface KnowledgeBaseMetrics {
  totalDocuments: number;
  totalChunks: number;
  totalEstimatedTokens: number;
  successfulDocuments: number;
  failedDocuments: number;
  lastIngestionTime: string | null;
  status: "Operational" | "Empty" | "Processing" | "Degraded";
}

export interface RAGSourceCitation {
  fileName: string;
  pageNumber?: number | null;
  section?: string | null;
  chunkId?: string;
  excerpt?: string;
}

export interface RAGAnswerResponse {
  answer: string;
  citations: RAGSourceCitation[];
  groundedChunkCount: number;
  isInsufficientKnowledge: boolean;
  matchedChunks?: KnowledgeBaseChunk[];
}

export interface RAGChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string | number;
  citations?: RAGSourceCitation[];
  groundedChunkCount?: number;
  isInsufficientKnowledge?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: RAGSourceCitation[];
  groundedChunkCount?: number;
  isInsufficentKnowledge?: boolean;
}

// Disruption Engine Types
export type IndustrySectorId =
  | "semiconductor"
  | "maritime"
  | "minerals"
  | "port_rail"
  | "pharma"
  | "general";

export interface TelemetryTag {
  id: string;
  key: string;
  value: string;
}

export interface RootVector {
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
}

export interface PlaybookTask {
  id: string;
  description: string;
  timeframe: string;
  status: "PENDING" | "COMPLETED";
  auditProofRequired: boolean;
  proofSubmitted?: boolean;
  proofText?: string;
}

export interface PlaybookPhase {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  assignedLead: string;
  tasks: PlaybookTask[];
}

export interface DisruptionRun {
  id: string;
  userId?: string;
  title: string;
  industry: string;
  sectorId: IndustrySectorId;
  severity: string;
  urgency: string;
  narrative: string;
  sectorParameters: Record<string, string>;
  telemetry: TelemetryTag[];
  timestamp: string;
  summary: string;
  keyMetrics: {
    financialExposure: {
      value: string;
      label: string;
    };
    leadTimeDrift: {
      value: string;
      label: string;
    };
    starvationHorizon: {
      value: string;
      label: string;
    };
  };
  rootVectors: RootVector[];
  playbook: PlaybookPhase[];
  auditGrounding: {
    confidenceScore: number;
    explicitTelemetry: string[];
    assumptionsAndGaps: string[];
  };
}

// Delivery Drift Types
export interface DriftSubPhase {
  id: string;
  title: string;
  completed: boolean;
}

export interface DriftAction {
  id: string;
  title: string;
  subPhases: DriftSubPhase[];
}

export interface DeliveryDriftRun {
  id: string;
  userId?: string;
  poNumber: string;
  supplier: string;
  material: string;
  originalDeliveryDate: string;
  requiredInPlantDate: string;
  riskCategory: string;
  latestCommunication: string;
  optionalDetails?: {
    quantity?: string;
    unit?: string;
    notes?: string;
  };
  timestamp: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskLevel: "LOW RISK" | "MEDIUM RISK" | "HIGH RISK" | "CRITICAL RISK";
  commitmentStatus: "No Change Detected" | "Change Detected";
  statusDetail?: string;
  driftComparison: {
    originalCommitment: string;
    latestSupplierCommitment: string;
    calculatedDriftDays: number | null;
    driftDisplay: string;
  };
  riskIdentified: string;
  potentialImpact: string;
  likelyCauses: string;
  recommendedActions: DriftAction[];
  evidenceFacts: string[];
  assumptionsAndGaps: string[];
}

// Operational Event Types for Previa 12-Agent Intelligence System
export type OperationalEventType =
  | "shipment.created"
  | "shipment.updated"
  | "shipment.delayed"
  | "shipment.delivered"
  | "shipment.telemetry_received"
  | "disruption.detected"
  | "disruption.updated"
  | "disruption.resolved"
  | "risk.detected"
  | "risk.updated"
  | "risk.resolved"
  | "impact.calculated"
  | "agent.started"
  | "agent.processing"
  | "agent.completed"
  | "agent.error"
  | "operator.action"
  | "supplier.risk_changed"
  | "forecast.updated"
  | "mitigation.recommended"
  | "decision.created"
  | "operator.approved"
  | "operator.rejected"
  | "operator.modified"
  | "playbook.completed";

export type OperationalEventSeverity = "low" | "medium" | "high" | "critical";

export interface OperationalEventLocation {
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string;
  telemetrySource?: string;
}

export interface OperationalEvent {
  eventId: string;
  userId?: string;
  userEmail?: string;
  eventType: OperationalEventType;
  timestamp: string;
  source: string;
  agent: string;
  severity?: OperationalEventSeverity;
  shipmentId?: string;
  supplierId?: string;
  location?: OperationalEventLocation;
  status: string;
  data?: Record<string, any>;
  evidence?: any[];
  reasoning?: any[];
  confidence?: number;
  requiresHumanReview?: boolean;
  ingestedAt?: string;
  runId?: string;
}

export interface ShipmentRecord {
  shipmentId: string;
  userId?: string;
  supplierId?: string;
  origin?: string;
  destination?: string;
  status: "created" | "in_transit" | "delayed" | "delivered" | string;
  severity?: OperationalEventSeverity;
  carrier?: string;
  vessel?: string;
  currentLocation?: OperationalEventLocation;
  delayDays?: number;
  eta?: string;
  originalEta?: string;
  poNumber?: string;
  items?: string;
  latestUpdate: string;
  lastEventId: string;
  historyCount?: number;
  source?: "Carrier GPS" | "AIS" | "IoT" | "API Feeds" | string;
  telemetryType?: "GPS" | "AIS" | "Cellular IoT" | "Carrier EDI" | string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  telemetryAvailable?: boolean;
  mmsi?: string;
  imo?: string;
}

export interface DisruptionRecord {
  disruptionId: string;
  userId?: string;
  title: string;
  corridor?: string;
  severity: OperationalEventSeverity;
  status: "detected" | "active" | "mitigating" | "resolved" | string;
  detectedAt: string;
  resolvedAt?: string;
  summary?: string;
  evidence?: any[];
  reasoning?: any[];
  confidence?: number;
  requiresHumanReview?: boolean;
  lastEventId: string;
}

export interface RiskRecord {
  riskId: string;
  userId?: string;
  category: string;
  severity: OperationalEventSeverity;
  title: string;
  status: "detected" | "active" | "mitigated" | "resolved" | string;
  detectedAt: string;
  supplierId?: string;
  shipmentId?: string;
  confidence?: number;
  evidence?: any[];
  reasoning?: any[];
  lastEventId: string;
}

export interface ImpactRecord {
  impactId: string;
  userId?: string;
  calculatedAt: string;
  financialExposure?: number | string;
  leadTimeDriftDays?: number;
  affectedSuppliers?: string[];
  affectedShipments?: string[];
  summary?: string;
  confidence?: number;
  lastEventId: string;
}

export interface AgentStatusRecord {
  name: string;
  source: string;
  status: "idle" | "running" | "processing" | "completed" | "error" | "failed" | "listening" | "waiting" | "no_data";
  lastActive: string;
  lastEventId?: string;
  lastEventType?: string;
  eventsProcessedCount: number;
  currentTask?: string;
  lastErrorMessage?: string;
  stage?: 1 | 2 | 3;
}

export interface ControlTowerKPIs {
  activeShipments: number;
  delayedShipments: number;
  activeDisruptions: number;
  criticalRisks: number;
  totalFinancialExposure: number;
  financialExposureDisplay: string;
  monitoredCorridors: number;
  activeAgents: number;
  totalEventsIngested: number;
}

// ---------------------------------------------------------------------------
// 12 CORE AGENTS DEFINITIONS
// ---------------------------------------------------------------------------
export type PreviaAgentId =
  | "shipment_tracker"
  | "disruption_intelligence"
  | "risk_sentinel"
  | "impact_analyzer"
  | "forecasting_agent"
  | "supplier_intelligence"
  | "anomaly_detection"
  | "document_vision"
  | "graph_intelligence"
  | "scenario_optimization"
  | "user_activity"
  | "supply_chain_query";

export interface AgentExecutionRecord {
  runId: string;
  agentId: PreviaAgentId;
  agentName: string;
  timestamp: string;
  status: "ACTIVE" | "RUNNING" | "COMPLETE" | "FAILED" | "WAITING" | "NO DATA";
  durationMs: number;
  inputReference?: string;
  result?: any;
  evidence: string[];
  confidence: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// PREVIA DECISION EVENT
// ---------------------------------------------------------------------------
export type HumanDecisionStatus = "pending" | "approved" | "rejected" | "modified";
export type DecisionActionStatus = "pending" | "in_progress" | "completed" | "escalated";

export interface PreviaDecisionRecommendation {
  id: string;
  title: string;
  action: string;
  priority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW";
  timeframe: string;
  owner: string;
  phase?: string;
  requiresApproval: boolean;
  status: HumanDecisionStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface PreviaDecisionEvent {
  eventId: string;
  runId: string;
  sourceEngine: "disruption_engine" | "delivery_drift_analyzer" | "operator" | "shipment_tracker";
  timestamp: string;
  userId?: string;
  userEmail?: string;
  originalEngineResult: any;
  agentResults: Record<string, AgentExecutionRecord>;
  risks: Array<{
    id: string;
    title: string;
    category: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    score?: number;
    explanation: string;
  }>;
  affectedEntities: string[];
  affectedNodes: string[];
  affectedCorridors: string[];
  financialImpact: {
    exposureMin?: number;
    exposureMax?: number;
    displayValue: string;
    currency: string;
    breakdown: string;
  };
  scheduleImpact: {
    driftDays: number | null;
    displayValue: string;
    criticalPathVariance: string;
  };
  starvationHorizon: {
    daysRemaining: number | null;
    displayValue: string;
    affectedFacilities: string[];
  };
  recommendations: PreviaDecisionRecommendation[];
  evidence: string[];
  assumptions: string[];
  confidence: number;
  humanDecision: HumanDecisionStatus;
  modifiedRecommendation?: string;
  actionStatus: DecisionActionStatus;
  actualOutcome?: string;
  auditCertificateHash?: string;
}

// ---------------------------------------------------------------------------
// MULTI-TIER SUPPLY CHAIN GRAPH NETWORK
// ---------------------------------------------------------------------------
export type SupplyChainNodeType =
  | "supplier"
  | "port"
  | "rail_hub"
  | "warehouse"
  | "factory"
  | "customer"
  | "shipment"
  | "material"
  | "po";

export type SupplyChainNodeState =
  | "NORMAL"
  | "WATCH"
  | "AT_RISK"
  | "HIGH_RISK"
  | "CRITICAL"
  | "DISRUPTED"
  | "RECOVERING"
  | "RESOLVED";

export interface SupplyChainGraphNode {
  id: string;
  userId?: string;
  label: string;
  type: SupplyChainNodeType;
  state: SupplyChainNodeState;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  relatedShipmentId?: string;
  poNumber?: string;
  supplierId?: string;
  delayDays?: number;
  affectedOperations?: string;
  aiFindings?: string;
  recommendation?: string;
  confidence?: number;
  evidence?: string[];
  relatedAgents?: string[];
  runId?: string;
  locationName?: string;
  inventoryLevel?: string;
}

export interface SupplyChainGraphEdge {
  id: string;
  userId?: string;
  source: string;
  target: string;
  relationship: string;
  status: "NORMAL" | "CONGESTED" | "DISRUPTED" | "DELAYED";
}

export interface SupplyChainNetworkState {
  nodes: SupplyChainGraphNode[];
  edges: SupplyChainGraphEdge[];
  lastEvaluated: string;
}

// ---------------------------------------------------------------------------
// USER ACTIVITY LOGGING
// ---------------------------------------------------------------------------
export type UserActionType =
  | "analysis_run"
  | "run_viewed"
  | "risk_reviewed"
  | "supplier_inspected"
  | "supplier_viewed"
  | "shipment_viewed"
  | "recommendation_approved"
  | "recommendation_rejected"
  | "recommendation_modified"
  | "playbook_completed"
  | "playbook_task_completed"
  | "control_tower_viewed"
  | "node_inspected"
  | "query_asked";

export interface UserActivityRecord {
  id: string;
  userId: string;
  userEmail: string;
  actionType: UserActionType;
  entityName?: string;
  entityId?: string;
  runId?: string;
  summary: string;
  timestamp: string;
  details?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// ASSISTANT QUERY INTERFACES
// ---------------------------------------------------------------------------
export interface SupplyChainQueryResponse {
  answer: string;
  facts: string[];
  simulations: string[];
  recommendations: string[];
  assumptions: string[];
  relatedEntities: string[];
  confidence: number;
}

export interface UserActivityQueryResponse {
  answer: string;
  activitiesFound: UserActivityRecord[];
  summary: {
    todayCount: number;
    pendingActionsCount: number;
    recentSuppliers: string[];
    recentDecisions: string[];
  };
}

export interface ScenarioSimulationParams {
  supplierId?: string;
  delayDaysDelta?: number;
  allocationShiftPercent?: number;
  inventoryBufferBurnDays?: number;
  secondarySupplierQualified?: boolean;
}

export interface ScenarioSimulationResult {
  scenarioId: string;
  timestamp: string;
  baseline: {
    financialExposure: string;
    starvationHorizon: string;
    leadTimeVariance: string;
  };
  simulated: {
    financialExposure: string;
    starvationHorizon: string;
    leadTimeVariance: string;
    mitigationScore: number;
  };
  tradeoffs: string[];
  optimalAction: string;
  humanApprovalRequired: boolean;
}

export interface ControlTowerLiveState {
  kpis: ControlTowerKPIs;
  shipments: ShipmentRecord[];
  disruptions: DisruptionRecord[];
  risks: RiskRecord[];
  impacts: ImpactRecord[];
  agents: Record<string, AgentStatusRecord>;
  activityTimeline: OperationalEvent[];
  decisions: PreviaDecisionEvent[];
  network: SupplyChainNetworkState;
  lastUpdated: string;
}


