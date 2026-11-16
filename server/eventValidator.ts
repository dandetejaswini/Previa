import { OperationalEvent, OperationalEventSeverity, OperationalEventType } from "../src/types";

export const ALLOWED_EVENT_TYPES: readonly OperationalEventType[] = [
  "shipment.created",
  "shipment.updated",
  "shipment.delayed",
  "shipment.delivered",
  "disruption.detected",
  "disruption.updated",
  "disruption.resolved",
  "risk.detected",
  "risk.updated",
  "risk.resolved",
  "impact.calculated",
  "agent.started",
  "agent.processing",
  "agent.completed",
  "agent.error",
  "operator.action",
] as const;

export const ALLOWED_SEVERITIES: readonly OperationalEventSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  event?: OperationalEvent;
}

/**
 * Validates and normalizes incoming operational event payloads from Previa intelligence agents.
 * Strict validation: rejects malformed payloads and returns clear error messages.
 */
export function validateOperationalEvent(body: any): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      error: "Malformed payload: Request body must be a JSON object.",
    };
  }

  // 1. Validate eventId (required, non-empty string)
  if (typeof body.eventId !== "string" || body.eventId.trim().length === 0) {
    return {
      valid: false,
      error: "Validation failed: 'eventId' is required and must be a non-empty string.",
    };
  }
  const eventId = body.eventId.trim();

  // 2. Validate eventType (required, must match allowed set)
  if (typeof body.eventType !== "string" || !ALLOWED_EVENT_TYPES.includes(body.eventType as any)) {
    return {
      valid: false,
      error: `Validation failed: 'eventType' must be one of: ${ALLOWED_EVENT_TYPES.join(", ")}. Received: '${body.eventType}'`,
    };
  }
  const eventType = body.eventType as OperationalEventType;

  // 3. Validate timestamp (required, valid parseable ISO date)
  if (typeof body.timestamp !== "string" || body.timestamp.trim().length === 0) {
    return {
      valid: false,
      error: "Validation failed: 'timestamp' is required and must be a valid ISO 8601 string.",
    };
  }
  const parsedTime = Date.parse(body.timestamp.trim());
  if (isNaN(parsedTime)) {
    return {
      valid: false,
      error: "Validation failed: 'timestamp' must be a valid ISO 8601 date string (e.g. '2026-09-24T10:30:00Z').",
    };
  }
  const timestamp = new Date(parsedTime).toISOString();

  // 4. Validate source (required, non-empty string)
  if (typeof body.source !== "string" || body.source.trim().length === 0) {
    return {
      valid: false,
      error: "Validation failed: 'source' is required and must be a non-empty string (e.g. 'shipment_tracker').",
    };
  }
  const source = body.source.trim();

  // 5. Validate agent (required, non-empty string)
  if (typeof body.agent !== "string" || body.agent.trim().length === 0) {
    return {
      valid: false,
      error: "Validation failed: 'agent' is required and must be a non-empty string (e.g. 'Shipment Tracker').",
    };
  }
  const agent = body.agent.trim();

  // 6. Validate status (required, non-empty string)
  if (typeof body.status !== "string" || body.status.trim().length === 0) {
    return {
      valid: false,
      error: "Validation failed: 'status' is required and must be a non-empty string (e.g. 'detected', 'processing').",
    };
  }
  const status = body.status.trim();

  // 7. Validate severity if supplied (optional, but if present must be low|medium|high|critical)
  let severity: OperationalEventSeverity | undefined = undefined;
  if (body.severity !== undefined && body.severity !== null && body.severity !== "") {
    if (typeof body.severity !== "string") {
      return {
        valid: false,
        error: "Validation failed: 'severity' must be a string if supplied.",
      };
    }
    const normalizedSeverity = body.severity.trim().toLowerCase() as OperationalEventSeverity;
    if (!ALLOWED_SEVERITIES.includes(normalizedSeverity)) {
      return {
        valid: false,
        error: `Validation failed: 'severity' must be one of: ${ALLOWED_SEVERITIES.join(", ")}. Received: '${body.severity}'`,
      };
    }
    severity = normalizedSeverity;
  }

  // 8. Optional fields normalization
  const shipmentId =
    typeof body.shipmentId === "string" && body.shipmentId.trim().length > 0
      ? body.shipmentId.trim()
      : undefined;

  const supplierId =
    typeof body.supplierId === "string" && body.supplierId.trim().length > 0
      ? body.supplierId.trim()
      : undefined;

  let location = undefined;
  if (body.location && typeof body.location === "object" && !Array.isArray(body.location)) {
    location = {
      name: typeof body.location.name === "string" ? body.location.name.trim() : undefined,
      latitude:
        typeof body.location.latitude === "number" && !isNaN(body.location.latitude)
          ? body.location.latitude
          : null,
      longitude:
        typeof body.location.longitude === "number" && !isNaN(body.location.longitude)
          ? body.location.longitude
          : null,
    };
  }

  const data =
    body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : {};

  const evidence = Array.isArray(body.evidence) ? body.evidence : [];
  const reasoning = Array.isArray(body.reasoning) ? body.reasoning : [];

  let confidence: number | undefined = undefined;
  if (typeof body.confidence === "number" && !isNaN(body.confidence)) {
    confidence = body.confidence;
  }

  const requiresHumanReview =
    typeof body.requiresHumanReview === "boolean" ? body.requiresHumanReview : false;

  const validatedEvent: OperationalEvent = {
    eventId,
    eventType,
    timestamp,
    source,
    agent,
    severity,
    shipmentId,
    supplierId,
    location,
    status,
    data,
    evidence,
    reasoning,
    confidence,
    requiresHumanReview,
    ingestedAt: new Date().toISOString(),
  };

  return {
    valid: true,
    event: validatedEvent,
  };
}
