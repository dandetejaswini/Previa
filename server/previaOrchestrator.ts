import {
  PreviaAgentId,
  AgentExecutionRecord,
  PreviaDecisionEvent,
  PreviaDecisionRecommendation,
  ControlTowerLiveState,
  UserActivityRecord,
  OperationalEvent,
  SupplyChainGraphNode,
  SupplyChainNetworkState,
} from "../src/types";
import { operationalStore } from "./operationalStore";
import { executeShipmentTrackerAgent } from "./agents/shipmentTrackerAgent";
import { executeDisruptionIntelligenceAgent } from "./agents/disruptionIntelligenceAgent";
import { executeRiskSentinelAgent } from "./agents/riskSentinelAgent";
import { executeImpactFinancialAgent } from "./agents/impactFinancialAgent";
import { executeForecastingAgent } from "./agents/forecastingAgent";
import { executeSupplierIntelligenceAgent } from "./agents/supplierIntelligenceAgent";
import { executeAnomalyDetectionAgent } from "./agents/anomalyDetectionAgent";
import { executeDocumentVisionAgent } from "./agents/documentVisionAgent";
import { executeGraphIntelligenceAgent } from "./agents/graphIntelligenceAgent";
import { executeScenarioOptimizationAgent } from "./agents/scenarioOptimizationAgent";
import { executeUserActivityAgent } from "./agents/userActivityAgent";
import { executeSupplyChainQueryAgent } from "./agents/supplyChainQueryAgent";
import { GoogleGenAI } from "@google/genai";

export interface OrchestrationRunRequest {
  sourceEngine: "disruption_engine" | "delivery_drift_analyzer" | "shipment_tracker" | "operator";
  title?: string;
  narrative?: string;
  industry?: string;
  sectorId?: string;
  severity?: string;
  urgency?: string;
  supplier?: string;
  material?: string;
  poNumber?: string;
  originalDeliveryDate?: string;
  latestCommunication?: string;
  calculatedDriftDays?: number | null;
  telemetry?: Array<{ key: string; value: string }>;
  sectorParameters?: Record<string, string>;
  userId?: string;
  userEmail?: string;
  originalResult?: any;
}

export interface OrchestrationRunResult {
  runId: string;
  timestamp: string;
  decisionEvent: PreviaDecisionEvent;
  agentResults: Record<PreviaAgentId, AgentExecutionRecord>;
  network: SupplyChainNetworkState;
  summary: string;
}

class PreviaOrchestrator {
  private userActivities: UserActivityRecord[] = [];

  constructor() {}

  public recordActivity(activity: {
    userId?: string;
    userEmail?: string;
    actionType: UserActivityRecord["actionType"];
    entityName?: string;
    entityId?: string;
    runId?: string;
    summary: string;
    details?: Record<string, any>;
  }) {
    const record: UserActivityRecord = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: activity.userId || "anonymous",
      userEmail: activity.userEmail || "",
      actionType: activity.actionType,
      entityName: activity.entityName,
      entityId: activity.entityId,
      runId: activity.runId,
      summary: activity.summary,
      timestamp: new Date().toISOString(),
      details: activity.details,
    };
    this.userActivities.unshift(record);
    if (this.userActivities.length > 500) {
      this.userActivities = this.userActivities.slice(0, 500);
    }
  }

  public getUserActivities(userId?: string, userEmail?: string): UserActivityRecord[] {
    if (!userId && !userEmail) return [];
    return this.userActivities.filter((a) => {
      if (userId && a.userId === userId) return true;
      if (userEmail && a.userEmail && a.userEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });
  }

  /**
   * Main Staged Concurrency Orchestrator
   */
  public async orchestrate(
    request: OrchestrationRunRequest,
    aiClient?: GoogleGenAI | null
  ): Promise<OrchestrationRunResult> {
    const runId = `PREV-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();
    const effectiveUserId = request.userId;

    console.log(`[Previa Orchestrator] Triggered orchestration run '${runId}' via '${request.sourceEngine}' for user '${effectiveUserId || "anonymous"}'`);

    // Record user activity
    if (effectiveUserId) {
      this.recordActivity({
        userId: effectiveUserId,
        userEmail: request.userEmail,
        actionType: "analysis_run",
        runId,
        entityName: request.title || request.supplier || request.poNumber || "Supply Chain Analysis",
        summary: `Initiated 12-agent intelligence analysis for: "${request.title || request.supplier || request.poNumber || 'Operational Disruption'}"`,
      });
    }

    const delayDays = typeof request.calculatedDriftDays === "number" ? request.calculatedDriftDays : 7;
    const supplier = request.supplier || request.sectorParameters?.fabricator || "Primary Supplier";
    const poNumber = request.poNumber || (request.title ? `PO-${Math.floor(10000 + Math.random() * 90000)}` : undefined);
    const shipmentId = `SHIP-${Math.floor(1000 + Math.random() * 9000)}`;

    // STAGE 1: Execute Independent Agents CONCURRENTLY with Promise.allSettled
    const stage1Promises = [
      // 1. Shipment Tracker
      executeShipmentTrackerAgent(runId, {
        shipmentId,
        poNumber,
        supplierId: supplier,
        delayDays,
        origin: request.sectorParameters?.fabricator || "Taipei Port",
        destination: "Rotterdam Terminal Hub",
        status: delayDays > 0 ? "delayed" : "in_transit",
        rawStatement: request.latestCommunication || request.narrative,
      }),
      // 2. Disruption Intelligence
      executeDisruptionIntelligenceAgent(runId, {
        title: request.title,
        narrative: request.narrative,
        industry: request.industry,
        sectorId: request.sectorId,
        severity: request.severity,
        telemetry: request.telemetry,
        aiClient,
      }),
      // 3. Risk Sentinel
      executeRiskSentinelAgent(runId, {
        supplier,
        poNumber,
        shipmentId,
        delayDays,
        statement: request.latestCommunication || request.narrative,
        category: request.sectorId || "Operational Risk",
      }),
      // 4. Impact & Financial Analyzer
      executeImpactFinancialAgent(runId, {
        narrative: request.narrative || request.latestCommunication,
        delayDays,
        telemetry: request.telemetry,
      }),
      // 5. Forecasting Agent
      executeForecastingAgent(runId, {
        leadTimeDays: 45,
        projectedDriftDays: delayDays,
        currentBufferDays: Math.max(0, 12 - delayDays),
      }),
      // 6. Supplier Intelligence Agent
      executeSupplierIntelligenceAgent(runId, {
        supplierId: supplier,
        delayDays,
      }),
      // 7. Anomaly Detection Agent
      executeAnomalyDetectionAgent(runId, {
        entityId: supplier,
        delayDays,
        statement: request.latestCommunication || request.narrative,
      }),
      // 8. Document & Vision Intelligence
      executeDocumentVisionAgent(runId, {
        rawStatement: request.latestCommunication || request.narrative,
      }),
      // 9. Graph & Dependency Intelligence
      executeGraphIntelligenceAgent(runId, {
        supplier,
        material: request.material || request.sectorParameters?.component || "Critical Sourced Component",
        poNumber,
        shipmentId,
        delayDays,
        severity: request.severity,
      }),
    ];

    const stage1Results = await Promise.allSettled(stage1Promises);

    const agentResults: Record<string, AgentExecutionRecord> = {};
    const stage1Map: Record<string, any> = {};

    stage1Results.forEach((res) => {
      if (res.status === "fulfilled") {
        const record = res.value;
        agentResults[record.agentId] = record;
        stage1Map[record.agentId] = record.result;
      }
    });

    // STAGE 2: Execute Scenario, Optimization & Mitigation Agent using Stage 1 outputs
    const stage2Result = await executeScenarioOptimizationAgent(runId, {
      stage1Results: stage1Map,
      supplier,
      delayDays,
      financialExposureDisplay: stage1Map["impact_analyzer"]?.financialExposure?.display,
      narrative: request.narrative || request.latestCommunication,
    });
    agentResults[stage2Result.agentId] = stage2Result;

    // STAGE 3: Decision Synthesis -> PreviaDecisionEvent
    const riskSentinelResult = stage1Map["risk_sentinel"];
    const impactResult = stage1Map["impact_analyzer"];
    const graphResult = stage1Map["graph_intelligence"];
    const scenarioResult = stage2Result.result;

    const compositeScore = riskSentinelResult?.compositeScore || 75;
    const severityRating = delayDays > 14 ? "CRITICAL" : delayDays > 7 ? "HIGH" : delayDays > 0 ? "MEDIUM" : "LOW";

    const risks = [
      {
        id: `risk-${runId}-1`,
        title: `Schedule Drift: +${delayDays}d delivery delay detected on ${supplier}`,
        category: request.sectorId || "Supplier Risk",
        severity: severityRating as any,
        score: typeof compositeScore === "number" ? compositeScore : 70,
        explanation: riskSentinelResult?.scoreExplanation || "Schedule drift identified against baseline contractual milestones.",
      },
    ];

    const recommendations: PreviaDecisionRecommendation[] = scenarioResult?.recommendedActionPlan || [
      {
        id: `rec-${runId}-1`,
        title: "Immediate Buffer Ring-Fencing",
        action: `Engage ${supplier} to ring-fence available stock.`,
        priority: "HIGH",
        timeframe: "0-24 Hours",
        owner: "Procurement Lead",
        requiresApproval: true,
        status: "pending",
      },
    ];

    const networkState: SupplyChainNetworkState = graphResult?.network || {
      nodes: [],
      edges: [],
      lastEvaluated: timestamp,
    };

    const decisionEvent: PreviaDecisionEvent = {
      eventId: `dec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      runId,
      sourceEngine: request.sourceEngine,
      timestamp,
      userId: effectiveUserId,
      userEmail: request.userEmail,
      originalEngineResult: request.originalResult || {},
      agentResults: agentResults as any,
      risks,
      affectedEntities: [supplier, shipmentId, poNumber || "PO-Baseline"].filter(Boolean),
      affectedNodes: networkState.nodes.map((n) => n.id),
      affectedCorridors: stage1Map["disruption_intelligence"]?.affectedCorridors || ["Transpacific Corridor"],
      financialImpact: {
        exposureMin: impactResult?.financialExposure?.min || undefined,
        exposureMax: impactResult?.financialExposure?.max || undefined,
        displayValue: impactResult?.financialExposure?.display || "Insufficient data",
        currency: "USD",
        breakdown: impactResult?.productionImpact || "Buffer consumption pacing affected",
      },
      scheduleImpact: {
        driftDays: delayDays,
        displayValue: impactResult?.scheduleImpact?.display || `+${delayDays} days variance`,
        criticalPathVariance: `Variance of ${delayDays} calendar days relative to PO contract date`,
      },
      starvationHorizon: {
        daysRemaining: stage1Map["forecasting_agent"]?.stockoutHorizonDays ?? Math.max(0, 12 - delayDays),
        displayValue: `${stage1Map["forecasting_agent"]?.stockoutHorizonDays ?? Math.max(0, 12 - delayDays)} days safety buffer remaining`,
        affectedFacilities: ["Primary Assembly Plant"],
      },
      recommendations,
      evidence: [
        `Incident Trigger: ${request.sourceEngine}`,
        `Supplier: ${supplier}`,
        `Calculated Drift: +${delayDays} days`,
        ...(stage1Map["risk_sentinel"]?.primaryVulnerabilities || []),
      ],
      assumptions: [
        "Supplier telematics reflect verifiable carrier and milestone timestamps.",
        "Primary manufacturing buffer consumption nominal rate is 1.0 buffer day per operating day.",
      ],
      confidence: 0.94,
      humanDecision: "pending",
      actionStatus: "pending",
    };

    // 4. Update Operational Store & Control Tower State (strictly scoped to user)
    operationalStore.recordDecisionEvent(decisionEvent);

    // Ingest operational event for the decision
    const operationalEvent: OperationalEvent = {
      eventId: decisionEvent.eventId,
      userId: effectiveUserId,
      userEmail: request.userEmail,
      eventType: "decision.created",
      timestamp,
      source: "previa_orchestrator",
      agent: "Previa Agent Orchestrator",
      severity: severityRating === "CRITICAL" ? "critical" : severityRating === "HIGH" ? "high" : "medium",
      status: "pending_review",
      shipmentId,
      supplierId: supplier,
      runId,
      data: {
        decisionId: decisionEvent.eventId,
        runId,
        userId: effectiveUserId,
        sourceEngine: request.sourceEngine,
        driftDays: delayDays,
        financialExposure: decisionEvent.financialImpact.displayValue,
        recommendationCount: recommendations.length,
      },
      evidence: decisionEvent.evidence,
      confidence: decisionEvent.confidence,
      requiresHumanReview: true,
    };
    operationalStore.ingestEvent(operationalEvent);

    // Ingest disruption event if originating from disruption engine
    if (request.sourceEngine === "disruption_engine" || stage1Map["disruption_intelligence"]) {
      const disruptionId = `disr_${runId}`;
      operationalStore.ingestEvent({
        eventId: disruptionId,
        userId: effectiveUserId,
        userEmail: request.userEmail,
        eventType: "disruption.detected",
        timestamp,
        source: "disruption_intelligence",
        agent: "Disruption Intelligence",
        severity: severityRating === "CRITICAL" ? "critical" : severityRating === "HIGH" ? "high" : "medium",
        status: "active",
        location: {
          name: stage1Map["disruption_intelligence"]?.affectedCorridors?.[0] || request.sectorParameters?.corridor || "Global Freight Corridor",
        },
        data: {
          disruptionId,
          userId: effectiveUserId,
          title: request.title || `${request.industry || "Supply Chain"} Disruption Incident`,
          corridor: stage1Map["disruption_intelligence"]?.affectedCorridors?.[0] || request.sectorParameters?.corridor || "Global Freight Corridor",
          summary: request.narrative || stage1Map["disruption_intelligence"]?.summary,
          evidence: decisionEvent.evidence,
          reasoning: [request.narrative || "Operational disruption detected"],
        },
        confidence: 0.94,
        requiresHumanReview: true,
      });
    }

    // Ingest shipment event if shipment tracker returned a shipment record
    const trackerShipment = stage1Map["shipment_tracker"]?.shipment;
    if (trackerShipment && shipmentId) {
      operationalStore.ingestEvent({
        eventId: `shp_ev_${Date.now()}`,
        userId: effectiveUserId,
        userEmail: request.userEmail,
        eventType: trackerShipment.delayDays && trackerShipment.delayDays > 0 ? "shipment.delayed" : "shipment.created",
        timestamp,
        source: "shipment_tracker",
        agent: "Shipment Tracker",
        severity: severityRating === "CRITICAL" ? "critical" : severityRating === "HIGH" ? "high" : "medium",
        status: trackerShipment.status || "in_transit",
        shipmentId: trackerShipment.shipmentId,
        supplierId: trackerShipment.supplierId,
        location: trackerShipment.currentLocation,
        data: {
          ...trackerShipment,
          userId: effectiveUserId,
        },
      });
    }

    // Ingest risk event
    operationalStore.ingestEvent({
      eventId: `risk_ev_${Date.now()}`,
      userId: effectiveUserId,
      userEmail: request.userEmail,
      eventType: "risk.detected",
      timestamp,
      source: "risk_sentinel",
      agent: "Risk Sentinel",
      severity: severityRating === "CRITICAL" ? "critical" : severityRating === "HIGH" ? "high" : "medium",
      status: "active",
      supplierId: supplier,
      shipmentId,
      runId,
      data: {
        ...risks[0],
        userId: effectiveUserId,
      },
      confidence: 0.92,
    });

    // Ingest impact event
    if (impactResult) {
      operationalStore.ingestEvent({
        eventId: `imp_ev_${Date.now()}`,
        userId: effectiveUserId,
        userEmail: request.userEmail,
        eventType: "impact.calculated",
        timestamp,
        source: "impact_analyzer",
        agent: "Impact & Financial Analyzer",
        severity: severityRating === "CRITICAL" ? "critical" : severityRating === "HIGH" ? "high" : "medium",
        status: "active",
        supplierId: supplier,
        shipmentId,
        runId,
        data: {
          ...impactResult,
          userId: effectiveUserId,
          financialExposure: impactResult.financialExposure?.display || decisionEvent.financialImpact.displayValue,
          leadTimeDriftDays: delayDays,
          affectedSuppliers: [supplier],
          affectedShipments: [shipmentId],
        },
        confidence: 0.94,
      });
    }

    return {
      runId,
      timestamp,
      decisionEvent,
      agentResults: agentResults as any,
      network: networkState,
      summary: `Completed 12-agent orchestration for ${supplier}: ${risks[0].title}. ${recommendations.length} mitigation actions generated for operator review.`,
    };
  }

  /**
   * Interactive Supply Chain Query Agent execution (scoped to userId)
   */
  public async handleSupplyChainQuery(
    question: string,
    selectedNode?: SupplyChainGraphNode | null,
    contextData?: any,
    aiClient?: GoogleGenAI | null,
    userId?: string
  ) {
    const runId = `QRY-${Date.now()}`;
    const liveState = operationalStore.getLiveState(userId);

    if (userId) {
      this.recordActivity({
        userId,
        actionType: "query_asked",
        runId,
        summary: `Asked Supply Chain Query Agent: "${question.slice(0, 80)}${question.length > 80 ? '...' : ''}"`,
        entityName: selectedNode?.label || contextData?.shipment?.shipmentId || contextData?.risk?.title,
      });
    }

    const execution = await executeSupplyChainQueryAgent(runId, {
      question,
      selectedNode,
      contextData,
      controlTowerState: liveState,
      aiClient,
    });

    operationalStore.updateAgentStatus("Supply Chain Query Agent", {
      status: "completed",
      currentTask: `Answered: "${question.slice(0, 35)}..."`,
      lastActive: new Date().toISOString(),
    });

    return execution;
  }

  /**
   * Interactive User Activity Agent execution (scoped strictly to userId)
   */
  public async handleUserActivityQuery(query: string, userId?: string, userEmail?: string) {
    const runId = `ACT-QRY-${Date.now()}`;
    const activities = this.getUserActivities(userId, userEmail);

    const execution = await executeUserActivityAgent(runId, {
      query,
      userId,
      userEmail,
      userActivities: activities,
    });

    operationalStore.updateAgentStatus("User Activity Agent", {
      status: "completed",
      currentTask: `Answered user activity query`,
      lastActive: new Date().toISOString(),
    });

    return execution;
  }

  /**
   * Human Operator Action: Approve / Reject / Modify
   */
  public handleOperatorDecisionAction(
    decisionId: string,
    action: "approve" | "reject" | "modify",
    operatorData: {
      userId?: string;
      userEmail?: string;
      modifiedRecommendation?: string;
      recommendationId?: string;
      notes?: string;
    }
  ): { success: boolean; decision?: PreviaDecisionEvent; error?: string } {
    const decision = operationalStore.getDecision(decisionId, operatorData.userId);
    if (!decision) {
      return { success: false, error: "Decision event not found or unauthorized." };
    }

    // Enforce terminal state machine: Once approved, rejected, or completed, decisions cannot be mutated again
    const currentStatus = (decision.humanDecision || "").toLowerCase();
    if (currentStatus === "approved" || currentStatus === "rejected" || currentStatus === "completed") {
      return {
        success: false,
        error: `Decision event ${decisionId} is already in terminal state '${decision.humanDecision}' and cannot be acted on again.`,
      };
    }

    const timestamp = new Date().toISOString();
    const actionStatus = action === "approve" ? "completed" : action === "reject" ? "rejected" : "in_progress";
    const humanDecision = action === "approve" ? "approved" : action === "reject" ? "rejected" : "modified";

    decision.humanDecision = humanDecision;
    decision.actionStatus = actionStatus as any;
    if (operatorData.modifiedRecommendation) {
      decision.modifiedRecommendation = operatorData.modifiedRecommendation;
    }

    if (operatorData.recommendationId) {
      const rec = decision.recommendations.find((r) => r.id === operatorData.recommendationId);
      if (rec) {
        rec.status = humanDecision;
        rec.approvedBy = operatorData.userEmail || operatorData.userId;
        rec.approvedAt = timestamp;
        if (operatorData.notes) rec.notes = operatorData.notes;
      }
    } else {
      decision.recommendations.forEach((r) => {
        r.status = humanDecision;
        r.approvedBy = operatorData.userEmail || operatorData.userId;
        r.approvedAt = timestamp;
      });
    }

    operationalStore.recordDecisionEvent(decision);

    // Ingest event for activity timeline
    const eventType: OperationalEvent["eventType"] =
      action === "approve"
        ? "operator.approved"
        : action === "reject"
        ? "operator.rejected"
        : "operator.modified";

    operationalStore.ingestEvent({
      eventId: `op_${Date.now()}`,
      userId: operatorData.userId,
      userEmail: operatorData.userEmail,
      eventType,
      timestamp,
      source: "operator_action",
      agent: "Scenario, Optimization & Mitigation Agent",
      severity: "medium",
      status: humanDecision,
      runId: decision.runId,
      data: {
        decisionId,
        action,
        userId: operatorData.userId,
        operator: operatorData.userEmail || operatorData.userId,
        notes: operatorData.notes || operatorData.modifiedRecommendation,
      },
    });

    // Record user activity
    this.recordActivity({
      userId: operatorData.userId,
      userEmail: operatorData.userEmail,
      actionType: action === "approve" ? "recommendation_approved" : action === "reject" ? "recommendation_rejected" : "recommendation_modified",
      runId: decision.runId,
      summary: `Operator ${humanDecision} mitigation playbook for run ${decision.runId}`,
      entityId: decisionId,
    });

    return { success: true, decision };
  }
}

export const previaOrchestrator = new PreviaOrchestrator();
