import fs from "fs";
import path from "path";
import {
  OperationalEvent,
  ControlTowerLiveState,
  ControlTowerKPIs,
  ShipmentRecord,
  DisruptionRecord,
  RiskRecord,
  ImpactRecord,
  AgentStatusRecord,
  PreviaDecisionEvent,
  SupplyChainNetworkState,
  SupplyChainGraphNode,
  SupplyChainGraphEdge,
  DisruptionRun,
  DeliveryDriftRun,
} from "../src/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE_PATH = path.join(DATA_DIR, "operational_store.json");

// Default initial agent status tracking for all 12 Previa core agents
const INITIAL_AGENTS: Record<string, AgentStatusRecord> = {
  "Shipment Tracker": {
    name: "Shipment Tracker",
    source: "shipment_tracker",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to track real-time shipment milestones and telemetry",
    stage: 1,
  },
  "Disruption Intelligence": {
    name: "Disruption Intelligence",
    source: "disruption_intelligence",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to detect and classify port, weather, and geopolitical disruptions",
    stage: 1,
  },
  "Risk Sentinel": {
    name: "Risk Sentinel",
    source: "risk_sentinel",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to compute multi-factor risk scores and vulnerabilities",
    stage: 1,
  },
  "Impact & Financial Analyzer": {
    name: "Impact & Financial Analyzer",
    source: "impact_analyzer",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to calculate financial exposure and production buffer drift",
    stage: 1,
  },
  "Forecasting Agent": {
    name: "Forecasting Agent",
    source: "forecasting_agent",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to forecast delivery windows and stockout horizons",
    stage: 1,
  },
  "Supplier Intelligence Agent": {
    name: "Supplier Intelligence Agent",
    source: "supplier_intelligence",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to analyze supplier fulfillment rates and concentration",
    stage: 1,
  },
  "Anomaly Detection Agent": {
    name: "Anomaly Detection Agent",
    source: "anomaly_detection",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to detect statistical outliers in schedule, orders, and statements",
    stage: 1,
  },
  "Document & Vision Intelligence": {
    name: "Document & Vision Intelligence",
    source: "document_vision",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to extract entities and sentiment from supplier documents",
    stage: 1,
  },
  "Graph & Dependency Intelligence": {
    name: "Graph & Dependency Intelligence",
    source: "graph_intelligence",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to evaluate multi-tier supply chain topological dependencies",
    stage: 1,
  },
  "Scenario, Optimization & Mitigation Agent": {
    name: "Scenario, Optimization & Mitigation Agent",
    source: "scenario_optimization",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to run Monte Carlo simulations and synthesize mitigation playbooks",
    stage: 2,
  },
  "User Activity Agent": {
    name: "User Activity Agent",
    source: "user_activity",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to answer personalized activity questions for authenticated users",
    stage: 3,
  },
  "Supply Chain Query Agent": {
    name: "Supply Chain Query Agent",
    source: "supply_chain_query",
    status: "idle",
    lastActive: "",
    eventsProcessedCount: 0,
    currentTask: "Ready to answer general supply chain and Control Tower inquiries",
    stage: 3,
  },
};

interface SerializedStore {
  version: number;
  lastUpdated: string;
  events: OperationalEvent[];
  shipments: ShipmentRecord[];
  disruptions: DisruptionRecord[];
  risks: RiskRecord[];
  impacts: ImpactRecord[];
  agents: Record<string, AgentStatusRecord>;
  decisions?: PreviaDecisionEvent[];
  disruptionRuns?: (DisruptionRun & { userId?: string })[];
  driftRuns?: (DeliveryDriftRun & { userId?: string })[];
}

class OperationalStore {
  private eventsById: Map<string, OperationalEvent> = new Map();
  private shipmentsById: Map<string, ShipmentRecord> = new Map();
  private disruptionsById: Map<string, DisruptionRecord> = new Map();
  private risksById: Map<string, RiskRecord> = new Map();
  private impactsById: Map<string, ImpactRecord> = new Map();
  private agentsByName: Map<string, AgentStatusRecord> = new Map();
  private decisionsById: Map<string, PreviaDecisionEvent> = new Map();
  private disruptionRunsById: Map<string, DisruptionRun & { userId?: string }> = new Map();
  private driftRunsById: Map<string, DeliveryDriftRun & { userId?: string }> = new Map();
  private lastUpdated: string = new Date().toISOString();
  private isPersisting: boolean = false;

  constructor() {
    this.initStore();
  }

  private initStore() {
    // Initialize default 12-agent registry
    for (const [name, agent] of Object.entries(INITIAL_AGENTS)) {
      this.agentsByName.set(name, { ...agent });
    }

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_FILE_PATH)) {
        const raw = fs.readFileSync(STORE_FILE_PATH, "utf-8");
        const parsed: SerializedStore = JSON.parse(raw);

        if (Array.isArray(parsed.events)) {
          for (const ev of parsed.events) {
            this.eventsById.set(ev.eventId, ev);
          }
        }
        if (Array.isArray(parsed.shipments)) {
          for (const sh of parsed.shipments) {
            this.shipmentsById.set(sh.shipmentId, sh);
          }
        }
        if (Array.isArray(parsed.disruptions)) {
          for (const d of parsed.disruptions) {
            this.disruptionsById.set(d.disruptionId, d);
          }
        }
        if (Array.isArray(parsed.risks)) {
          for (const r of parsed.risks) {
            this.risksById.set(r.riskId, r);
          }
        }
        if (Array.isArray(parsed.impacts)) {
          for (const imp of parsed.impacts) {
            this.impactsById.set(imp.impactId, imp);
          }
        }
        if (parsed.agents && typeof parsed.agents === "object") {
          for (const [name, agent] of Object.entries(parsed.agents)) {
            // Merge with default 12 agents, preserving counts
            const existing = this.agentsByName.get(name);
            if (existing) {
              this.agentsByName.set(name, {
                ...existing,
                ...agent,
                name: existing.name,
              });
            } else {
              this.agentsByName.set(name, agent);
            }
          }
        }
        if (Array.isArray(parsed.decisions)) {
          for (const dec of parsed.decisions) {
            this.decisionsById.set(dec.eventId, dec);
          }
        }
        if (Array.isArray(parsed.disruptionRuns)) {
          for (const run of parsed.disruptionRuns) {
            this.disruptionRunsById.set(run.id, run);
          }
        }
        if (Array.isArray(parsed.driftRuns)) {
          for (const run of parsed.driftRuns) {
            this.driftRunsById.set(run.id, run);
          }
        }
        if (parsed.lastUpdated) {
          this.lastUpdated = parsed.lastUpdated;
        }
      }
    } catch (err) {
      console.error("[OperationalStore] Failed to load stored state, starting fresh:", err);
    }
  }

  private persist() {
    if (this.isPersisting) return;
    this.isPersisting = true;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const serialized: SerializedStore = {
        version: 2,
        lastUpdated: this.lastUpdated,
        events: Array.from(this.eventsById.values()),
        shipments: Array.from(this.shipmentsById.values()),
        disruptions: Array.from(this.disruptionsById.values()),
        risks: Array.from(this.risksById.values()),
        impacts: Array.from(this.impactsById.values()),
        agents: Object.fromEntries(this.agentsByName.entries()),
        decisions: Array.from(this.decisionsById.values()),
        disruptionRuns: Array.from(this.disruptionRunsById.values()),
        driftRuns: Array.from(this.driftRunsById.values()),
      };

      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(serialized, null, 2), "utf-8");
    } catch (err) {
      console.error("[OperationalStore] Error persisting store to disk:", err);
    } finally {
      this.isPersisting = false;
    }
  }

  // --- Disruption Runs Management (Scoped strictly to userId) ---
  public saveDisruptionRun(run: DisruptionRun, userId?: string) {
    const effectiveUserId = userId || (run as any).userId;
    const enriched = { ...run, userId: effectiveUserId };
    this.disruptionRunsById.set(run.id, enriched);
    this.lastUpdated = new Date().toISOString();
    this.persist();
  }

  public getDisruptionRuns(userId?: string): DisruptionRun[] {
    if (!userId) return [];
    return Array.from(this.disruptionRunsById.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
  }

  public deleteDisruptionRun(id: string, userId?: string): boolean {
    const existing = this.disruptionRunsById.get(id);
    if (!existing) return false;
    if (userId && existing.userId && existing.userId !== userId) return false;
    this.disruptionRunsById.delete(id);
    this.lastUpdated = new Date().toISOString();
    this.persist();
    return true;
  }

  public clearDisruptionRuns(userId?: string) {
    if (!userId) return;
    for (const [id, run] of this.disruptionRunsById.entries()) {
      if (run.userId === userId) {
        this.disruptionRunsById.delete(id);
      }
    }
    this.lastUpdated = new Date().toISOString();
    this.persist();
  }

  // --- Delivery Drift Runs Management (Scoped strictly to userId) ---
  public saveDriftRun(run: DeliveryDriftRun, userId?: string) {
    const effectiveUserId = userId || (run as any).userId;
    const enriched = { ...run, userId: effectiveUserId };
    this.driftRunsById.set(run.id, enriched);
    this.lastUpdated = new Date().toISOString();
    this.persist();
  }

  public getDriftRuns(userId?: string): DeliveryDriftRun[] {
    if (!userId) return [];
    return Array.from(this.driftRunsById.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
  }

  public deleteDriftRun(id: string, userId?: string): boolean {
    const existing = this.driftRunsById.get(id);
    if (!existing) return false;
    if (userId && existing.userId && existing.userId !== userId) return false;
    this.driftRunsById.delete(id);
    this.lastUpdated = new Date().toISOString();
    this.persist();
    return true;
  }

  public clearDriftRuns(userId?: string) {
    if (!userId) return;
    for (const [id, run] of this.driftRunsById.entries()) {
      if (run.userId === userId) {
        this.driftRunsById.delete(id);
      }
    }
    this.lastUpdated = new Date().toISOString();
    this.persist();
  }

  public getTotalRunsCount(userId?: string): number {
    if (!userId) return 0;
    const disruptionCount = this.getDisruptionRuns(userId).length;
    const driftCount = this.getDriftRuns(userId).length;
    return disruptionCount + driftCount;
  }

  public hasEvent(eventId: string): boolean {
    return this.eventsById.has(eventId);
  }

  public recordDecisionEvent(decision: PreviaDecisionEvent) {
    this.decisionsById.set(decision.eventId, decision);
    this.lastUpdated = new Date().toISOString();
    this.persist();
  }

  public getDecision(decisionId: string, userId?: string): PreviaDecisionEvent | undefined {
    const decision = this.decisionsById.get(decisionId);
    if (!decision) return undefined;
    if (userId && decision.userId && decision.userId !== userId) {
      return undefined;
    }
    return decision;
  }

  public getDecisions(userId?: string): PreviaDecisionEvent[] {
    if (!userId) return [];
    return Array.from(this.decisionsById.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
  }

  public getShipments(userId?: string): ShipmentRecord[] {
    if (!userId) return [];
    return Array.from(this.shipmentsById.values()).filter((s) => s.userId === userId);
  }

  /**
   * Internal lookup used exclusively by AISStream telemetry matching to map incoming reports to user shipments
   */
  public getAllShipmentsForTelemetryMatching(): ShipmentRecord[] {
    return Array.from(this.shipmentsById.values());
  }

  public updateAgentStatus(agentName: string, update: Partial<AgentStatusRecord>) {
    const existing = this.agentsByName.get(agentName);
    if (existing) {
      this.agentsByName.set(agentName, {
        ...existing,
        ...update,
        eventsProcessedCount: (existing.eventsProcessedCount || 0) + (update.status === "completed" ? 1 : 0),
        lastActive: update.lastActive || new Date().toISOString(),
      });
      this.persist();
    }
  }

  /**
   * Ingests a validated operational event idempotently.
   * If event already exists, returns existing event without duplicate processing.
   */
  public ingestEvent(event: OperationalEvent): { duplicate: boolean; event: OperationalEvent } {
    if (this.eventsById.has(event.eventId)) {
      return {
        duplicate: true,
        event: this.eventsById.get(event.eventId)!,
      };
    }

    // Ensure event has userId if provided in data
    if (!event.userId && event.data?.userId) {
      event.userId = event.data.userId;
    }

    // 1. Store event
    this.eventsById.set(event.eventId, event);
    this.lastUpdated = new Date().toISOString();

    // 2. Reduce and update domain states
    this.applyEventReductions(event);

    // 3. Persist to disk
    this.persist();

    return {
      duplicate: false,
      event,
    };
  }

  private applyEventReductions(event: OperationalEvent) {
    const { eventType, timestamp, agent, source, severity, shipmentId, supplierId, location, status, data, userId } = event;

    // --- Agent Status Update ---
    let agentRecord = this.agentsByName.get(agent);
    if (!agentRecord) {
      agentRecord = {
        name: agent,
        source: source || "previa_orchestrator",
        status: "idle",
        lastActive: timestamp,
        eventsProcessedCount: 0,
        currentTask: "",
      };
    }

    agentRecord.lastActive = timestamp;
    agentRecord.lastEventId = event.eventId;
    agentRecord.lastEventType = eventType;
    agentRecord.eventsProcessedCount = (agentRecord.eventsProcessedCount || 0) + 1;

    if (eventType === "agent.started") {
      agentRecord.status = "running";
      agentRecord.currentTask = data?.task || "Agent initiated corridor execution";
    } else if (eventType === "agent.processing") {
      agentRecord.status = "processing";
      agentRecord.currentTask = data?.task || `Processing ${event.source} event`;
    } else if (eventType === "agent.completed") {
      agentRecord.status = "completed";
      agentRecord.currentTask = data?.task || "Execution completed";
    } else if (eventType === "agent.error") {
      agentRecord.status = "error";
      agentRecord.lastErrorMessage = data?.error || data?.message || "Operational execution error";
      agentRecord.currentTask = "Error state detected";
    } else {
      // If agent is emitting functional events (shipment.*, disruption.*, risk.*, impact.*), mark as active
      if (agentRecord.status === "idle" || agentRecord.status === "completed") {
        agentRecord.status = "processing";
        agentRecord.currentTask = `Processed ${eventType}`;
      }
    }
    this.agentsByName.set(agent, agentRecord);

    // --- Shipment State Update ---
    const targetShipmentId = shipmentId || data?.shipmentId || (eventType.startsWith("shipment.") ? event.eventId : undefined);
    if (targetShipmentId) {
      let shipment = this.shipmentsById.get(targetShipmentId);
      const effectiveUserId = userId || data?.userId || shipment?.userId;

      if (!shipment) {
        shipment = {
          shipmentId: targetShipmentId,
          userId: effectiveUserId,
          supplierId: supplierId || data?.supplierId || data?.supplier,
          origin: data?.origin || (location?.name ? location.name : undefined),
          destination: data?.destination,
          status: "in_transit",
          carrier: data?.carrier,
          poNumber: data?.poNumber,
          items: data?.items || data?.material,
          latestUpdate: timestamp,
          lastEventId: event.eventId,
          historyCount: 1,
        };
      } else {
        shipment.historyCount = (shipment.historyCount || 0) + 1;
        shipment.latestUpdate = timestamp;
        shipment.lastEventId = event.eventId;
        if (effectiveUserId) shipment.userId = effectiveUserId;
      }

      if (supplierId) shipment.supplierId = supplierId;
      if (location) shipment.currentLocation = location;
      if (data?.carrier) shipment.carrier = data.carrier;
      if (data?.vessel) shipment.vessel = data.vessel;
      if (data?.mmsi) shipment.mmsi = String(data.mmsi);
      if (data?.imo) shipment.imo = String(data.imo);
      if (data?.source) shipment.source = data.source;
      if (data?.telemetryType) shipment.telemetryType = data.telemetryType;
      if (data?.speed !== undefined) shipment.speed = data.speed;
      if (data?.heading !== undefined) shipment.heading = data.heading;
      if (data?.accuracy !== undefined) shipment.accuracy = data.accuracy;
      if (data?.origin) shipment.origin = data.origin;
      if (data?.destination) shipment.destination = data.destination;
      if (data?.poNumber) shipment.poNumber = data.poNumber;
      if (data?.items || data?.material) shipment.items = data.items || data.material;
      if (data?.eta) shipment.eta = data.eta;
      if (data?.originalEta) shipment.originalEta = data.originalEta;

      if (severity) {
        shipment.severity = severity;
      }

      if (eventType === "shipment.created") {
        shipment.status = "created";
      } else if (eventType === "shipment.updated") {
        if (shipment.status !== "delayed" && shipment.status !== "delivered") {
          shipment.status = "in_transit";
        }
      } else if (eventType === "shipment.delayed") {
        shipment.status = "delayed";
        const delayDays = typeof data?.delayDays === "number" ? data.delayDays : typeof data?.driftDays === "number" ? data.driftDays : undefined;
        if (delayDays !== undefined) {
          shipment.delayDays = delayDays;
        }
      } else if (eventType === "shipment.delivered") {
        shipment.status = "delivered";
      } else if (status) {
        shipment.status = status;
      }

      this.shipmentsById.set(targetShipmentId, shipment);
    }

    // --- Disruption State Update ---
    if (eventType.startsWith("disruption.")) {
      const disruptionId = data?.disruptionId || data?.id || event.eventId;
      const effectiveUserId = userId || data?.userId;
      let disruption = this.disruptionsById.get(disruptionId);
      if (!disruption) {
        disruption = {
          disruptionId,
          userId: effectiveUserId,
          title: data?.title || data?.summary || `Operational Disruption: ${location?.name || disruptionId}`,
          corridor: data?.corridor || location?.name || data?.corridorName,
          severity: severity || "high",
          status: "active",
          detectedAt: timestamp,
          summary: data?.summary || data?.description || (event.reasoning?.length ? event.reasoning.join(". ") : undefined),
          evidence: event.evidence,
          reasoning: event.reasoning,
          confidence: event.confidence,
          requiresHumanReview: event.requiresHumanReview,
          lastEventId: event.eventId,
        };
      } else {
        if (effectiveUserId) disruption.userId = effectiveUserId;
        if (data?.title) disruption.title = data.title;
        if (severity) disruption.severity = severity;
        if (status) disruption.status = status;
        if (data?.summary) disruption.summary = data.summary;
        disruption.lastEventId = event.eventId;
      }

      if (eventType === "disruption.resolved") {
        disruption.status = "resolved";
        disruption.resolvedAt = timestamp;
      }

      this.disruptionsById.set(disruptionId, disruption);
    }

    // --- Risk State Update ---
    if (eventType.startsWith("risk.")) {
      const riskId = data?.riskId || data?.id || event.eventId;
      const effectiveUserId = userId || data?.userId;
      let risk = this.risksById.get(riskId);
      if (!risk) {
        risk = {
          riskId,
          userId: effectiveUserId,
          title: data?.title || `Operational Risk: ${supplierId || riskId}`,
          category: data?.category || "Supplier Risk",
          severity: severity || "medium",
          status: "active",
          detectedAt: timestamp,
          supplierId,
          shipmentId,
          confidence: event.confidence,
          evidence: event.evidence,
          reasoning: event.reasoning,
          lastEventId: event.eventId,
        };
      } else {
        if (effectiveUserId) risk.userId = effectiveUserId;
        if (data?.title) risk.title = data.title;
        if (severity) risk.severity = severity;
        if (supplierId) risk.supplierId = supplierId;
        if (shipmentId) risk.shipmentId = shipmentId;
        if (event.confidence !== undefined) risk.confidence = event.confidence;
      }

      if (eventType === "risk.detected") {
        risk.status = "active";
      } else if (eventType === "risk.updated") {
        risk.status = status || "active";
      } else if (eventType === "risk.resolved") {
        risk.status = "resolved";
      }

      this.risksById.set(riskId, risk);
    }

    // --- Impact State Update ---
    if (eventType === "impact.calculated") {
      const impactId = data?.impactId || data?.id || event.eventId;
      const effectiveUserId = userId || data?.userId;
      const parsedFinancial =
        typeof data?.financialExposure === "number"
          ? data.financialExposure
          : typeof data?.financialExposure === "string"
          ? parseFloat(data.financialExposure.replace(/[^0-9.-]/g, "")) || data.financialExposure
          : undefined;

      const impactRecord: ImpactRecord = {
        impactId,
        userId: effectiveUserId,
        calculatedAt: timestamp,
        financialExposure: parsedFinancial,
        leadTimeDriftDays: data?.leadTimeDriftDays || data?.driftDays,
        affectedSuppliers: data?.affectedSuppliers || (supplierId ? [supplierId] : []),
        affectedShipments: data?.affectedShipments || (shipmentId ? [shipmentId] : []),
        summary: data?.summary || data?.potentialImpact || (event.reasoning?.length ? event.reasoning.join(". ") : undefined),
        confidence: event.confidence,
        lastEventId: event.eventId,
      };

      this.impactsById.set(impactId, impactRecord);
    }
  }

  /**
   * Computes the real Control Tower KPIs strictly from actual ledger records scoped to authenticated userId.
   */
  public computeKPIs(userId?: string): ControlTowerKPIs {
    if (!userId) {
      return {
        activeShipments: 0,
        delayedShipments: 0,
        activeDisruptions: 0,
        criticalRisks: 0,
        totalFinancialExposure: 0,
        financialExposureDisplay: "$0",
        monitoredCorridors: 0,
        activeAgents: 0,
        totalEventsIngested: 0,
      };
    }

    const shipments = Array.from(this.shipmentsById.values()).filter((s) => s.userId === userId);
    const disruptions = Array.from(this.disruptionsById.values()).filter((d) => d.userId === userId);
    const risks = Array.from(this.risksById.values()).filter((r) => r.userId === userId);
    const impacts = Array.from(this.impactsById.values()).filter((imp) => imp.userId === userId);
    const userEvents = Array.from(this.eventsById.values()).filter((e) => e.userId === userId);

    const activeShipments = shipments.filter((s) => s.status !== "delivered").length;
    const delayedShipments = shipments.filter((s) => s.status === "delayed" || (s.delayDays && s.delayDays > 0)).length;
    const activeDisruptions = disruptions.filter((d) => d.status !== "resolved").length;
    const criticalRisks = risks.filter(
      (r) => r.status !== "resolved" && r.status !== "mitigated" && (r.severity === "critical" || r.severity === "high")
    ).length;

    // Aggregate financial exposure
    let totalFinancialExposure = 0;
    for (const imp of impacts) {
      if (typeof imp.financialExposure === "number" && !isNaN(imp.financialExposure)) {
        totalFinancialExposure += imp.financialExposure;
      }
    }

    // Format financial exposure for display
    let financialExposureDisplay = "$0";
    if (totalFinancialExposure >= 1000000) {
      financialExposureDisplay = `$${(totalFinancialExposure / 1000000).toFixed(1)}M`;
    } else if (totalFinancialExposure >= 1000) {
      financialExposureDisplay = `$${(totalFinancialExposure / 1000).toFixed(0)}K`;
    } else if (totalFinancialExposure > 0) {
      financialExposureDisplay = `$${totalFinancialExposure.toLocaleString()}`;
    }

    // Count distinct corridors monitored for this user
    const corridors = new Set<string>();
    for (const sh of shipments) {
      if (sh.origin) corridors.add(sh.origin);
      if (sh.destination) corridors.add(sh.destination);
      if (sh.currentLocation?.name) corridors.add(sh.currentLocation.name);
    }
    for (const d of disruptions) {
      if (d.corridor) corridors.add(d.corridor);
    }

    // Count active agents related to user activity
    const activeAgents = userEvents.length > 0
      ? Array.from(this.agentsByName.values()).filter((a) => a.eventsProcessedCount > 0 && a.status !== "error").length
      : 0;

    return {
      activeShipments,
      delayedShipments,
      activeDisruptions,
      criticalRisks,
      totalFinancialExposure,
      financialExposureDisplay,
      monitoredCorridors: corridors.size,
      activeAgents,
      totalEventsIngested: userEvents.length,
    };
  }

  /**
   * Computes the multi-tier supply chain network graph from active verified entities owned by userId.
   */
  public computeNetworkState(userId?: string): SupplyChainNetworkState {
    if (!userId) {
      return {
        nodes: [],
        edges: [],
        lastEvaluated: this.lastUpdated,
      };
    }

    const shipments = Array.from(this.shipmentsById.values()).filter((s) => s.userId === userId);
    const decisions = Array.from(this.decisionsById.values()).filter((d) => d.userId === userId);

    const nodes: SupplyChainGraphNode[] = [];
    const edges: SupplyChainGraphEdge[] = [];
    const addedNodeIds = new Set<string>();

    const addNode = (node: SupplyChainGraphNode) => {
      if (!addedNodeIds.has(node.id)) {
        addedNodeIds.add(node.id);
        nodes.push(node);
      }
    };

    const addEdge = (edge: SupplyChainGraphEdge) => {
      edges.push(edge);
    };

    // 1. Process shipments & suppliers
    for (const sh of shipments) {
      const isDelayed = sh.status === "delayed" || (sh.delayDays && sh.delayDays > 0);
      const isCritical = sh.severity === "critical";
      const isHigh = sh.severity === "high";

      const nodeState = isCritical ? "CRITICAL" : isHigh ? "HIGH_RISK" : isDelayed ? "AT_RISK" : "NORMAL";
      const riskLevel = isCritical ? "CRITICAL" : isHigh ? "HIGH" : isDelayed ? "MEDIUM" : "LOW";

      // Supplier Node
      const supplierName = sh.supplierId || "Tier-1 Primary Foundry";
      const supplierNodeId = `node-sup-${supplierName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      addNode({
        id: supplierNodeId,
        userId,
        label: supplierName,
        type: "supplier",
        state: nodeState,
        riskLevel,
        supplierId: supplierName,
        relatedShipmentId: sh.shipmentId,
        poNumber: sh.poNumber,
        delayDays: sh.delayDays,
        affectedOperations: isDelayed ? `Fabrication milestone delayed by +${sh.delayDays} days` : "Fulfillment on nominal schedule",
        aiFindings: isDelayed ? "Schedule drift detected by Risk Sentinel and Drift Analyzer" : "Supplier milestones verified",
        recommendation: isDelayed ? "Engage supplier for priority allocation and secondary lot expediting" : "Maintain baseline monitoring",
        confidence: 0.94,
        evidence: [`Verified shipment: ${sh.shipmentId}`, `Carrier: ${sh.carrier || "DHL"}`],
        relatedAgents: ["Supplier Intelligence", "Risk Sentinel"],
      });

      // Material Node
      const materialName = sh.items || "Microcontroller IC Component";
      const matNodeId = `node-mat-${materialName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 24)}`;
      addNode({
        id: matNodeId,
        userId,
        label: materialName,
        type: "material",
        state: isDelayed ? "WATCH" : "NORMAL",
        riskLevel,
        supplierId: supplierName,
        affectedOperations: "Critical path assembly component",
      });
      addEdge({
        id: `edge-${supplierNodeId}-${matNodeId}`,
        source: supplierNodeId,
        target: matNodeId,
        relationship: "MANUFACTURES",
        status: isDelayed ? "CONGESTED" : "NORMAL",
      });

      // Shipment Node
      const shipNodeId = `node-sh-${sh.shipmentId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      addNode({
        id: shipNodeId,
        userId,
        label: sh.shipmentId,
        type: "shipment",
        state: nodeState,
        riskLevel,
        relatedShipmentId: sh.shipmentId,
        poNumber: sh.poNumber,
        supplierId: supplierName,
        delayDays: sh.delayDays,
        locationName: sh.currentLocation?.name || `${sh.origin || "Origin"} Corridor`,
        affectedOperations: `Transit route ${sh.origin || "Origin"} → ${sh.destination || "Destination"}`,
        aiFindings: isDelayed ? `Delay of ${sh.delayDays}d reported by Shipment Tracker` : "In nominal transit",
        recommendation: isDelayed ? "Trigger carrier milestone audit" : "Standard GPS polling",
        confidence: 0.95,
        evidence: [
          `Route: ${sh.origin || "Origin"} → ${sh.destination || "Destination"}`,
          `Status: ${sh.status}`,
        ],
        relatedAgents: ["Shipment Tracker", "Anomaly Detection"],
      });
      addEdge({
        id: `edge-${matNodeId}-${shipNodeId}`,
        source: matNodeId,
        target: shipNodeId,
        relationship: "TRANSPORTED_IN",
        status: isDelayed ? "DELAYED" : "NORMAL",
      });

      // Port / Hub Node (Only if origin is defined)
      let portNodeId = shipNodeId;
      if (sh.origin) {
        const originPort = sh.origin;
        portNodeId = `node-port-${originPort.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 24)}`;
        addNode({
          id: portNodeId,
          userId,
          label: originPort,
          type: "port",
          state: isCritical ? "DISRUPTED" : isDelayed ? "WATCH" : "NORMAL",
          riskLevel,
          locationName: originPort,
        });
        addEdge({
          id: `edge-${shipNodeId}-${portNodeId}`,
          source: shipNodeId,
          target: portNodeId,
          relationship: "TRANSITS_THROUGH",
          status: isDelayed ? "CONGESTED" : "NORMAL",
        });
      }

      // Destination Node (Only if destination is defined)
      if (sh.destination) {
        const destFactory = sh.destination;
        const factoryNodeId = `node-fac-${destFactory.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 24)}`;
        addNode({
          id: factoryNodeId,
          userId,
          label: destFactory,
          type: "factory",
          state: isDelayed ? "WATCH" : "NORMAL",
          riskLevel,
          locationName: destFactory,
          affectedOperations: isDelayed ? "Buffer depletion exposure on final assembly" : "Normal assembly throughput",
        });
        addEdge({
          id: `edge-${portNodeId}-${factoryNodeId}`,
          source: portNodeId,
          target: factoryNodeId,
          relationship: "DELIVERS_TO",
          status: isDelayed ? "CONGESTED" : "NORMAL",
        });
      }
    }

    // 2. Incorporate recent decision events if any
    for (const dec of decisions) {
      if (dec.affectedEntities && dec.affectedEntities.length > 0) {
        dec.affectedEntities.forEach((entity) => {
          const matched = nodes.find((n) => n.label.toLowerCase() === entity.toLowerCase());
          if (matched) {
            matched.runId = dec.runId;
            matched.recommendation = dec.recommendations[0]?.action || matched.recommendation;
          }
        });
      }
    }

    return {
      nodes,
      edges,
      lastEvaluated: this.lastUpdated,
    };
  }

  /**
   * Retrieves the live Control Tower state scoped strictly to the authenticated userId.
   */
  public getLiveState(userId?: string): ControlTowerLiveState {
    if (!userId) {
      return {
        kpis: {
          activeShipments: 0,
          delayedShipments: 0,
          activeDisruptions: 0,
          criticalRisks: 0,
          totalFinancialExposure: 0,
          financialExposureDisplay: "$0",
          monitoredCorridors: 0,
          activeAgents: 0,
          totalEventsIngested: 0,
        },
        shipments: [],
        disruptions: [],
        risks: [],
        impacts: [],
        agents: Object.fromEntries(this.agentsByName.entries()),
        activityTimeline: [],
        decisions: [],
        network: { nodes: [], edges: [], lastEvaluated: this.lastUpdated },
        lastUpdated: this.lastUpdated,
      };
    }

    const kpis = this.computeKPIs(userId);
    const network = this.computeNetworkState(userId);

    // Sort timeline by actual event timestamp descending (most recent first)
    const activityTimeline = Array.from(this.eventsById.values())
      .filter((ev) => ev.userId === userId)
      .sort((a, b) => {
        const timeA = Date.parse(a.timestamp) || 0;
        const timeB = Date.parse(b.timestamp) || 0;
        return timeB - timeA;
      });

    return {
      kpis,
      shipments: Array.from(this.shipmentsById.values())
        .filter((s) => s.userId === userId)
        .sort((a, b) => (Date.parse(b.latestUpdate) || 0) - (Date.parse(a.latestUpdate) || 0)),
      disruptions: Array.from(this.disruptionsById.values())
        .filter((d) => d.userId === userId)
        .sort((a, b) => (Date.parse(b.detectedAt) || 0) - (Date.parse(a.detectedAt) || 0)),
      risks: Array.from(this.risksById.values())
        .filter((r) => r.userId === userId)
        .sort((a, b) => (Date.parse(b.detectedAt) || 0) - (Date.parse(a.detectedAt) || 0)),
      impacts: Array.from(this.impactsById.values())
        .filter((imp) => imp.userId === userId)
        .sort((a, b) => (Date.parse(b.calculatedAt) || 0) - (Date.parse(a.calculatedAt) || 0)),
      agents: Object.fromEntries(this.agentsByName.entries()),
      activityTimeline,
      decisions: this.getDecisions(userId),
      network,
      lastUpdated: this.lastUpdated,
    };
  }

  /**
   * Returns list of events, optionally filtered by userId and paginated
   */
  public getEvents(limitCount = 100, userId?: string): OperationalEvent[] {
    if (!userId) return [];
    return Array.from(this.eventsById.values())
      .filter((ev) => ev.userId === userId)
      .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
      .slice(0, limitCount);
  }
}

// Export singleton instance
export const operationalStore = new OperationalStore();
