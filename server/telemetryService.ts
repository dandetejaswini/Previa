import { OperationalEvent, ShipmentRecord } from "../src/types";
import { operationalStore } from "./operationalStore";
import { aisStreamService } from "./aisStreamService";

export type TelemetrySource = "Carrier GPS" | "AIS" | "AISStream" | "IoT" | "API Feeds";
export type TelemetryType = "GPS" | "AIS" | "Cellular IoT" | "Carrier EDI";

export interface NormalizedShipmentTelemetry {
  shipmentId: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  speed?: number;
  heading?: number;
  status: string;
  origin?: string;
  destination?: string;
  carrier?: string;
  vessel?: string;
  source: TelemetrySource;
  telemetryType: TelemetryType;
  accuracy?: number;
  lastUpdated?: string;
}

export interface TelemetryProviderStatus {
  providerId: string;
  name: string;
  type: TelemetryType;
  configured: boolean;
  connected: boolean;
  source: TelemetrySource;
  lastPing?: string;
  eventsIngested: number;
  configRequirement: string;
}

export interface ITelemetryProvider {
  id: string;
  name: string;
  type: TelemetryType;
  source: TelemetrySource;
  isConfigured(): boolean;
  getStatus(): TelemetryProviderStatus;
  normalize(rawPayload: any): NormalizedShipmentTelemetry | null;
}

/**
 * Carrier GPS & EDI 214 Tracking Provider Adapter
 */
class CarrierGPSProvider implements ITelemetryProvider {
  id = "carrier_gps";
  name = "Carrier GPS / EDI 214 Connector";
  type: TelemetryType = "GPS";
  source: TelemetrySource = "Carrier GPS";
  private eventsCount = 0;

  isConfigured(): boolean {
    return !!process.env.CARRIER_TRACKING_API_KEY;
  }

  getStatus(): TelemetryProviderStatus {
    const configured = this.isConfigured();
    return {
      providerId: this.id,
      name: this.name,
      type: this.type,
      configured,
      connected: configured,
      source: this.source,
      eventsIngested: this.eventsCount,
      configRequirement: configured
        ? "CARRIER_TRACKING_API_KEY configured and active."
        : "Set CARRIER_TRACKING_API_KEY in server environment or send EDI 214 payloads to /api/telemetry/ingest.",
    };
  }

  normalize(raw: any): NormalizedShipmentTelemetry | null {
    if (!raw || (!raw.shipmentId && !raw.trackingNumber && !raw.id)) return null;
    const shipmentId = String(raw.shipmentId || raw.trackingNumber || raw.id).trim();

    const lat = typeof raw.latitude === "number" && !isNaN(raw.latitude) ? raw.latitude : null;
    const lng = typeof raw.longitude === "number" && !isNaN(raw.longitude) ? raw.longitude : null;

    this.eventsCount++;
    return {
      shipmentId,
      latitude: lat,
      longitude: lng,
      timestamp: raw.timestamp || new Date().toISOString(),
      speed: typeof raw.speed === "number" ? raw.speed : undefined,
      heading: typeof raw.heading === "number" ? raw.heading : undefined,
      status: raw.status || (raw.delayDays && raw.delayDays > 0 ? "delayed" : "in_transit"),
      origin: raw.origin,
      destination: raw.destination,
      carrier: raw.carrier,
      vessel: raw.vessel,
      source: "Carrier GPS",
      telemetryType: "GPS",
      accuracy: typeof raw.accuracy === "number" ? raw.accuracy : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Maritime AIS Telemetry Provider Adapter (AISStream WebSocket / OpenAIS)
 */
class AISMaritimeProvider implements ITelemetryProvider {
  id = "maritime_ais";
  name = "AISStream Maritime Telemetry Stream";
  type: TelemetryType = "AIS";
  source: TelemetrySource = "AISStream";
  private eventsCount = 0;

  isConfigured(): boolean {
    return aisStreamService.isConfigured();
  }

  getStatus(): TelemetryProviderStatus {
    const aisStatus = aisStreamService.getStatus();
    const configured = aisStatus.configured;
    return {
      providerId: this.id,
      name: this.name,
      type: this.type,
      configured,
      connected: aisStatus.connected,
      source: this.source,
      eventsIngested: aisStatus.messagesReceived || this.eventsCount,
      lastPing: aisStatus.lastMessageAt || undefined,
      configRequirement: configured
        ? "AISSTREAM_API_KEY active on wss://stream.aisstream.io/v0/stream"
        : "Live maritime telemetry requires AISSTREAM_API_KEY configured in server environment.",
    };
  }

  normalize(raw: any): NormalizedShipmentTelemetry | null {
    if (!raw || (!raw.shipmentId && !raw.mmsi && !raw.vessel)) return null;
    const shipmentId = String(raw.shipmentId || `MMSI-${raw.mmsi}` || raw.vessel).trim();

    const lat = typeof raw.latitude === "number" && !isNaN(raw.latitude) ? raw.latitude : null;
    const lng = typeof raw.longitude === "number" && !isNaN(raw.longitude) ? raw.longitude : null;

    this.eventsCount++;
    return {
      shipmentId,
      latitude: lat,
      longitude: lng,
      timestamp: raw.timestamp || new Date().toISOString(),
      speed: typeof raw.speedKnots === "number" ? raw.speedKnots : typeof raw.speed === "number" ? raw.speed : undefined,
      heading: typeof raw.headingDegrees === "number" ? raw.headingDegrees : typeof raw.heading === "number" ? raw.heading : undefined,
      status: raw.status || "in_transit",
      origin: raw.origin,
      destination: raw.destination,
      carrier: raw.carrier || raw.operator,
      vessel: raw.vessel || raw.vesselName,
      source: "AIS",
      telemetryType: "AIS",
      accuracy: typeof raw.accuracyMeters === "number" ? raw.accuracyMeters : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * IoT Cargo Sensor Provider Adapter (Cellular/Satellite tracking tags)
 */
class IoTSensorProvider implements ITelemetryProvider {
  id = "cargo_iot";
  name = "Cargo IoT Sensor Ingestion";
  type: TelemetryType = "Cellular IoT";
  source: TelemetrySource = "IoT";
  private eventsCount = 0;

  isConfigured(): boolean {
    return !!process.env.IOT_TELEMETRY_SECRET || !!process.env.PREVIA_EVENT_INGESTION_SECRET;
  }

  getStatus(): TelemetryProviderStatus {
    const configured = this.isConfigured();
    return {
      providerId: this.id,
      name: this.name,
      type: this.type,
      configured,
      connected: configured,
      source: this.source,
      eventsIngested: this.eventsCount,
      configRequirement: configured
        ? "IoT Sensor webhook endpoint verified."
        : "Webhook endpoint active at /api/telemetry/ingest.",
    };
  }

  normalize(raw: any): NormalizedShipmentTelemetry | null {
    if (!raw || (!raw.shipmentId && !raw.deviceId && !raw.tagId)) return null;
    const shipmentId = String(raw.shipmentId || raw.deviceId || raw.tagId).trim();

    const lat = typeof raw.latitude === "number" && !isNaN(raw.latitude) ? raw.latitude : null;
    const lng = typeof raw.longitude === "number" && !isNaN(raw.longitude) ? raw.longitude : null;

    this.eventsCount++;
    return {
      shipmentId,
      latitude: lat,
      longitude: lng,
      timestamp: raw.timestamp || new Date().toISOString(),
      speed: typeof raw.speed === "number" ? raw.speed : undefined,
      heading: typeof raw.heading === "number" ? raw.heading : undefined,
      status: raw.status || "in_transit",
      origin: raw.origin,
      destination: raw.destination,
      carrier: raw.carrier,
      vessel: raw.vessel,
      source: "IoT",
      telemetryType: "Cellular IoT",
      accuracy: typeof raw.accuracy === "number" ? raw.accuracy : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export class PreviaTelemetryService {
  private providers: Map<string, ITelemetryProvider> = new Map();
  private lastTelemetryIngestedAt: string | null = null;
  private totalTelemetryPoints = 0;

  constructor() {
    this.registerProvider(new CarrierGPSProvider());
    this.registerProvider(new AISMaritimeProvider());
    this.registerProvider(new IoTSensorProvider());
  }

  public registerProvider(provider: ITelemetryProvider) {
    this.providers.set(provider.id, provider);
  }

  /**
   * Returns current telemetry system status, provider health, and environment instructions.
   */
  public getTelemetryStatus() {
    const aisStatus = aisStreamService.getStatus();
    const providerStatuses = Array.from(this.providers.values()).map((p) => p.getStatus());
    const anyConfigured = providerStatuses.some((p) => p.configured) || aisStatus.configured;

    return {
      hasActiveTelemetryFeed: (anyConfigured && this.totalTelemetryPoints > 0) || aisStatus.messagesReceived > 0,
      totalTelemetryPoints: this.totalTelemetryPoints + aisStatus.messagesReceived,
      lastIngestedAt: aisStatus.lastMessageAt || this.lastTelemetryIngestedAt,
      providers: providerStatuses,
      aisStream: aisStatus,
      guidance: aisStatus.configured
        ? (aisStatus.connected ? aisStatus.guidance : "AISStream configured. Connecting...")
        : "Live maritime telemetry requires AISSTREAM_API_KEY. Configure this server-side environment variable to enable live AIS vessel tracking.",
    };
  }

  /**
   * Ingests and normalizes live telemetry from an external carrier, AIS feed, or IoT webhook.
   * Stores directly in the operational store and notifies the Shipment Tracker Agent.
   */
  public ingestTelemetry(rawPayload: any, preferredProviderId?: string): {
    success: boolean;
    telemetry?: NormalizedShipmentTelemetry;
    error?: string;
  } {
    let normalized: NormalizedShipmentTelemetry | null = null;

    if (preferredProviderId && this.providers.has(preferredProviderId)) {
      normalized = this.providers.get(preferredProviderId)!.normalize(rawPayload);
    } else {
      // Auto-detect based on provider
      for (const provider of this.providers.values()) {
        normalized = provider.normalize(rawPayload);
        if (normalized) break;
      }
    }

    if (!normalized || !normalized.shipmentId) {
      return {
        success: false,
        error: "Payload could not be normalized into a valid shipment telemetry record (missing shipmentId/coordinates).",
      };
    }

    this.lastTelemetryIngestedAt = normalized.timestamp;
    this.totalTelemetryPoints++;

    // Construct genuine operational event
    const eventId = `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const operationalEvent: OperationalEvent = {
      eventId,
      eventType: "shipment.telemetry_received",
      timestamp: normalized.timestamp,
      source: normalized.source,
      agent: "Shipment Tracker",
      severity: normalized.status === "delayed" ? "medium" : "low",
      status: normalized.status,
      shipmentId: normalized.shipmentId,
      location: normalized.latitude != null && normalized.longitude != null
        ? {
            name: `${normalized.origin || "In-Transit"} → ${normalized.destination || "Destination"}`,
            latitude: normalized.latitude,
            longitude: normalized.longitude,
          }
        : undefined,
      data: {
        shipmentId: normalized.shipmentId,
        speed: normalized.speed,
        heading: normalized.heading,
        origin: normalized.origin,
        destination: normalized.destination,
        carrier: normalized.carrier,
        vessel: normalized.vessel,
        source: normalized.source,
        telemetryType: normalized.telemetryType,
        accuracy: normalized.accuracy,
      },
    };

    operationalStore.ingestEvent(operationalEvent);

    return {
      success: true,
      telemetry: normalized,
    };
  }
}

export const previaTelemetryService = new PreviaTelemetryService();
