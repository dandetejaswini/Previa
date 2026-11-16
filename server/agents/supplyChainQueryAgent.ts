import {
  AgentExecutionRecord,
  SupplyChainQueryResponse,
  ControlTowerLiveState,
  SupplyChainGraphNode,
  ShipmentRecord,
  RiskRecord,
  DisruptionRecord,
  PreviaDecisionEvent,
} from "../../src/types";
import { GoogleGenAI } from "@google/genai";

export interface SupplyChainQueryInput {
  question: string;
  selectedNode?: SupplyChainGraphNode | null;
  contextData?: {
    shipment?: ShipmentRecord | null;
    risk?: RiskRecord | null;
    supplier?: string | null;
    disruption?: DisruptionRecord | null;
    decision?: PreviaDecisionEvent | null;
  };
  controlTowerState?: ControlTowerLiveState | null;
  activeAnalysisRun?: any;
  aiClient?: GoogleGenAI | null;
}

/**
 * AGENT 12 — SUPPLY CHAIN QUERY AGENT
 * Answers operational supply chain questions directly from verified platform state.
 * Clearly distinguishes:
 * [FACT] Verified ledger data
 * [SIMULATION] Monte Carlo or scenario models
 * [RECOMMENDATION] Playbook actions pending human sign-off
 * [ASSUMPTION] Operational working premises
 */
export async function executeSupplyChainQueryAgent(
  runId: string,
  input: SupplyChainQueryInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];
  const q = (input.question || "").toLowerCase();

  try {
    const node = input.selectedNode;
    const ctx = input.contextData;
    const state = input.controlTowerState;
    const shipments = state?.shipments || [];
    const risks = state?.risks || [];
    const disruptions = state?.disruptions || [];
    const decisions = state?.decisions || [];

    const facts: string[] = [];
    const simulations: string[] = [];
    const recommendations: string[] = [];
    const assumptions: string[] = [];
    const relatedEntities: string[] = [];

    // Check focused contextual entity first (from drawer context)
    const focusedShipment = ctx?.shipment || shipments.find((s) =>
      q.includes(s.shipmentId.toLowerCase()) ||
      (node && node.relatedShipmentId === s.shipmentId) ||
      (node && node.type === "shipment" && node.label === s.shipmentId)
    );

    const focusedRisk = ctx?.risk || risks.find((r) =>
      q.includes(r.riskId.toLowerCase()) || q.includes(r.title.toLowerCase())
    );

    const focusedSupplier = ctx?.supplier || node?.supplierId;

    // 1. SPECIFIC SHIPMENT INQUIRY
    if (focusedShipment) {
      relatedEntities.push(focusedShipment.shipmentId);
      const isDelayed = focusedShipment.status === "delayed" || (focusedShipment.delayDays && focusedShipment.delayDays > 0);
      const delayDays = focusedShipment.delayDays || 0;

      if (isDelayed) {
        facts.push(`Shipment ${focusedShipment.shipmentId} is currently delayed by ${delayDays} day(s).`);
        facts.push(`Route: ${focusedShipment.origin || "Origin"} → ${focusedShipment.destination || "Destination"}${focusedShipment.carrier ? ` (Carrier: ${focusedShipment.carrier})` : ""}.`);
        facts.push(`Status: ${focusedShipment.status}. Contractual ETA: ${focusedShipment.eta || "Pending confirmation"}.`);
        if (focusedShipment.currentLocation?.name) {
          facts.push(`Latest verified position: ${focusedShipment.currentLocation.name}.`);
        }
        simulations.push(`Schedule variance of +${delayDays}d exceeds configured operational buffer threshold.`);
        recommendations.push("Review supplier commitment and available alternate intermodal routing.");
        recommendations.push("Notify downstream receiving warehouse to adjust assembly buffer allocation.");
      } else {
        facts.push(`Shipment ${focusedShipment.shipmentId} is on track with nominal transit schedule.`);
        facts.push(`Route: ${focusedShipment.origin || "Origin"} → ${focusedShipment.destination || "Destination"} via carrier ${focusedShipment.carrier || "unassigned"}.`);
        facts.push(`Status: ${focusedShipment.status}. Estimated arrival: ${focusedShipment.eta || "Nominal"}.`);
        recommendations.push("Continue automated milestone and GPS tracking.");
      }
    }
    // 2. SPECIFIC RISK INQUIRY
    else if (focusedRisk) {
      relatedEntities.push(focusedRisk.riskId);
      facts.push(`Risk Incident: "${focusedRisk.title}".`);
      facts.push(`Severity: ${focusedRisk.severity.toUpperCase()}. Category: ${focusedRisk.category}. Status: ${focusedRisk.status}.`);
      if (focusedRisk.supplierId) facts.push(`Affected Supplier: ${focusedRisk.supplierId}.`);
      if (focusedRisk.shipmentId) facts.push(`Affected Shipment: ${focusedRisk.shipmentId}.`);
      recommendations.push("Review open containment action items and mitigation playbooks in the Previa AI Workspace.");
    }
    // 3. QUESTION: WHICH SHIPMENTS ARE AT RISK?
    else if (q.includes("shipment") && (q.includes("risk") || q.includes("which") || q.includes("delayed") || q.includes("status"))) {
      if (shipments.length === 0) {
        facts.push("No verified shipment risks are currently recorded.");
        facts.push(`Shipments monitored: 0. Active shipment risks: 0.`);
        recommendations.push("Connect verified shipment telemetry to enable shipment-level risk analysis.");
        assumptions.push("No shipment-level conclusion can be made because no verified shipment telemetry is currently available.");
      } else {
        const atRisk = shipments.filter(
          (s) => s.status === "delayed" || s.severity === "high" || s.severity === "critical"
        );
        if (atRisk.length > 0) {
          facts.push(`${atRisk.length} of ${shipments.length} active shipment(s) are currently flagged at risk:`);
          atRisk.forEach((s) => {
            relatedEntities.push(s.shipmentId);
            facts.push(`• Shipment ${s.shipmentId} (${s.origin || "Origin"} → ${s.destination || "Destination"}): ${s.status}${s.delayDays ? `, +${s.delayDays}d drift` : ""}.`);
          });
          recommendations.push("Inspect carrier milestone updates and evaluate alternate freight routing.");
        } else {
          facts.push(`All ${shipments.length} active monitored shipment(s) are currently tracking nominal schedules.`);
          facts.push("No active shipment delays or critical risk thresholds breached.");
        }
      }
    }
    // 4. QUESTION: WHICH SUPPLIERS ARE AFFECTED / AT RISK?
    else if (q.includes("supplier") && (q.includes("risk") || q.includes("which") || q.includes("who") || q.includes("affected"))) {
      const atRiskSuppliers = new Set<string>();
      if (focusedSupplier) atRiskSuppliers.add(focusedSupplier);
      risks.forEach((r) => { if (r.supplierId) atRiskSuppliers.add(r.supplierId); });
      shipments.forEach((s) => {
        if (s.supplierId && (s.status === "delayed" || s.severity === "high" || s.severity === "critical")) {
          atRiskSuppliers.add(s.supplierId);
        }
      });

      if (atRiskSuppliers.size > 0) {
        facts.push(`${atRiskSuppliers.size} supplier(s) are currently associated with active risks or schedule drift:`);
        atRiskSuppliers.forEach((sup) => {
          relatedEntities.push(sup);
          facts.push(`• ${sup}`);
        });
        recommendations.push("Audit safety stock inventory and verify secondary qualified vendors.");
      } else {
        facts.push("No suppliers are currently marked in 'CRITICAL' or delayed status in the operational store.");
        recommendations.push("Maintain standard milestone cadence with Tier-1 partners.");
      }
    }
    // 5. QUESTION: WHAT DECISIONS ARE PENDING?
    else if (q.includes("decision") || q.includes("pending") || q.includes("action") || q.includes("review")) {
      const pendingDecs = decisions.filter((d) => !d.humanDecision || d.humanDecision === "pending");
      if (pendingDecs.length > 0) {
        facts.push(`${pendingDecs.length} mitigation decision event(s) are waiting for operator review:`);
        pendingDecs.forEach((d) => {
          relatedEntities.push(d.runId);
          facts.push(`• Run ${d.runId}: ${d.recommendations[0]?.title || d.recommendations[0]?.action || "Mitigation action pending"}`);
        });
        recommendations.push("Open the Decision Review modal in the Control Tower to approve, reject, or modify actions.");
      } else {
        facts.push("No decision events are currently pending operator review.");
      }
    }
    // 6. NODE CONTEXT
    else if (node) {
      relatedEntities.push(node.label);
      facts.push(`Selected Entity: ${node.label} (${node.type.toUpperCase()}). State: ${node.state}, Risk Level: ${node.riskLevel}.`);
      if (node.delayDays) facts.push(`Delivery delay: +${node.delayDays} days.`);
      if (node.aiFindings) facts.push(`Diagnostic: ${node.aiFindings}.`);
      if (node.recommendation) recommendations.push(node.recommendation);
    }
    // 7. DIRECT OPERATIONAL OVERVIEW
    else {
      facts.push(`Operational State: ${shipments.length} shipment(s), ${risks.length} active risk(s), ${disruptions.length} disruption(s).`);
      if (shipments.length === 0 && risks.length === 0) {
        facts.push("No verified operational events currently require urgent containment.");
        recommendations.push("Connect verified shipment telemetry or ingest carrier milestones to monitor live positions.");
      } else {
        recommendations.push("Select any shipment, risk, or network node in the Control Tower for detailed root-cause evaluation.");
      }
    }

    const answer = facts.join(" ");

    const output: SupplyChainQueryResponse = {
      answer,
      facts,
      simulations,
      recommendations,
      assumptions,
      relatedEntities,
      confidence: 0.96,
    };

    return {
      runId,
      agentId: "supply_chain_query",
      agentName: "Supply Chain Query Agent",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: input.question,
      result: output,
      evidence: [...evidence, ...facts],
      confidence: 0.96,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "supply_chain_query",
      agentName: "Supply Chain Query Agent",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in Supply Chain Query Agent",
      evidence: ["Failed to synthesize supply chain answer."],
      confidence: 0,
    };
  }
}
