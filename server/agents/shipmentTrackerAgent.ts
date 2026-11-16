import { AgentExecutionRecord, OperationalEvent, ShipmentRecord } from "../../src/types";

export interface ShipmentTrackerInput {
  shipmentId?: string;
  poNumber?: string;
  supplierId?: string;
  origin?: string;
  destination?: string;
  status?: string;
  eta?: string;
  carrier?: string;
  location?: { name?: string; latitude?: number | null; longitude?: number | null };
  delayDays?: number;
  rawStatement?: string;
  existingShipment?: ShipmentRecord;
}

export interface ShipmentTrackerOutput {
  shipment: ShipmentRecord;
  telemetryAvailable: boolean;
  telemetryNotice: string;
  milestoneStatus: string;
  isDelayed: boolean;
  delayDays: number;
  riskSummary: string;
  poRelationship?: string;
  supplierRelationship?: string;
}

/**
 * AGENT 1 — SHIPMENT TRACKER
 * Tracks actual shipment and delivery information.
 * Uses actual shipment data without fabricating GPS coordinates.
 * If live location telemetry is unavailable, returns "Live location telemetry unavailable".
 */
export async function executeShipmentTrackerAgent(
  runId: string,
  input: ShipmentTrackerInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const shipmentId = input.shipmentId || input.existingShipment?.shipmentId || `SHIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const origin = input.origin || input.existingShipment?.origin || "Origin unassigned";
    const destination = input.destination || input.existingShipment?.destination || "Destination unassigned";
    const supplierId = input.supplierId || input.existingShipment?.supplierId;
    const poNumber = input.poNumber || input.existingShipment?.poNumber;
    const carrier = input.carrier || input.existingShipment?.carrier || "Carrier not designated";
    const delayDays = typeof input.delayDays === "number" ? input.delayDays : (input.existingShipment?.delayDays || 0);
    const eta = input.eta || input.existingShipment?.eta || "Pending carrier confirmation";

    const hasValidCoords =
      input.location?.latitude != null &&
      input.location?.longitude != null &&
      !isNaN(input.location.latitude) &&
      !isNaN(input.location.longitude);

    evidence.push(`Shipment ID: ${shipmentId}`);
    evidence.push(`Route: ${origin} → ${destination}`);
    if (poNumber) evidence.push(`Purchase Order: ${poNumber}`);
    if (supplierId) evidence.push(`Supplier: ${supplierId}`);
    if (delayDays > 0) evidence.push(`Recorded Schedule Delay: +${delayDays} days`);

    const telemetryAvailable = hasValidCoords;
    const telemetryNotice = telemetryAvailable
      ? `Live coordinates verified at [${input.location?.latitude?.toFixed(4)}, ${input.location?.longitude?.toFixed(4)}]`
      : "Live location telemetry unavailable";

    const isDelayed = delayDays > 0 || (input.status === "delayed");
    const status = isDelayed ? "delayed" : (input.status || input.existingShipment?.status || "in_transit");

    const milestoneStatus = isDelayed
      ? `Critical milestone delayed by ${delayDays} days on route ${origin} to ${destination}`
      : `Operational milestone in transit with carrier ${carrier}`;

    const shipmentRecord: ShipmentRecord = {
      shipmentId,
      supplierId,
      poNumber,
      origin,
      destination,
      status,
      carrier,
      delayDays: delayDays > 0 ? delayDays : undefined,
      eta,
      latestUpdate: timestamp,
      lastEventId: `evt_${Math.random().toString(36).substring(2, 9)}`,
      historyCount: (input.existingShipment?.historyCount || 0) + 1,
      currentLocation: telemetryAvailable
        ? {
            name: input.location?.name || `${origin} Hub`,
            latitude: input.location?.latitude,
            longitude: input.location?.longitude,
          }
        : {
            name: input.location?.name || "Transit Corridor",
            latitude: null,
            longitude: null,
          },
      severity: isDelayed ? (delayDays > 14 ? "critical" : delayDays > 7 ? "high" : "medium") : "low",
    };

    const output: ShipmentTrackerOutput = {
      shipment: shipmentRecord,
      telemetryAvailable,
      telemetryNotice,
      milestoneStatus,
      isDelayed,
      delayDays,
      riskSummary: isDelayed
        ? `Schedule drift of ${delayDays} days threatens downstream delivery commit.`
        : "Shipment on nominal schedule with carrier baseline.",
      poRelationship: poNumber ? `Linked to ${poNumber}` : undefined,
      supplierRelationship: supplierId ? `Fulfilled by ${supplierId}` : undefined,
    };

    return {
      runId,
      agentId: "shipment_tracker",
      agentName: "Shipment Tracker",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: shipmentId,
      result: output,
      evidence,
      confidence: telemetryAvailable ? 0.98 : 0.85,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "shipment_tracker",
      agentName: "Shipment Tracker",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      inputReference: input.shipmentId,
      error: err?.message || "Execution error in Shipment Tracker",
      evidence: ["Agent execution encountered an unhandled exception."],
      confidence: 0,
    };
  }
}
