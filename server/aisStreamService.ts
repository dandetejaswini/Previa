import { OperationalEvent, ShipmentRecord } from "../src/types";
import { operationalStore } from "./operationalStore";
import { executeShipmentTrackerAgent } from "./agents/shipmentTrackerAgent";
import { executeRiskSentinelAgent } from "./agents/riskSentinelAgent";

export interface AISStreamPositionReport {
  Cog?: number;
  Sog?: number;
  TrueHeading?: number;
  Latitude?: number;
  Longitude?: number;
  NavigationalStatus?: number;
  RateOfTurn?: number;
  Timestamp?: number;
}

export interface AISStreamMetaData {
  MMSI: number;
  MMSI_String?: string | number;
  ShipName?: string;
  latitude: number;
  longitude: number;
  time_utc: string;
}

export interface AISStreamMessage {
  MessageType: string;
  MetaData: AISStreamMetaData;
  Message: {
    PositionReport?: AISStreamPositionReport;
  };
}

export interface AISStreamStatus {
  provider: "AISStream";
  configured: boolean;
  connected: boolean;
  status:
    | "AIS NOT CONFIGURED"
    | "AIS CONNECTING"
    | "AIS CONNECTED"
    | "WAITING FOR VESSEL TELEMETRY"
    | "LIVE TELEMETRY"
    | "STALE TELEMETRY"
    | "AIS CONNECTION ERROR";
  lastMessageAt: string | null;
  vesselsTracked: number;
  messagesReceived: number;
  reconnectAttempts: number;
  activeBoundingBoxes: number;
  guidance: string;
  latestVessels: Array<{
    mmsi: string;
    shipName?: string;
    latitude: number;
    longitude: number;
    speedKnots?: number;
    heading?: number;
    timestamp: string;
  }>;
}

// Major Global Maritime Trade Corridors (Bounding Boxes: [[lat1, lon1], [lat2, lon2]])
const DEFAULT_BOUNDING_BOXES: [ [number, number], [number, number] ][] = [
  // 1. Red Sea, Suez Canal, and Bab-el-Mandeb Strait
  [[11.0, 32.0], [31.5, 45.0]],
  // 2. Arabian Sea, Persian Gulf, and Gulf of Oman
  [[15.0, 50.0], [28.0, 72.0]],
  // 3. Malacca Strait, Singapore, and South China Sea transit
  [[0.5, 98.0], [7.5, 105.5]],
  // 4. Mediterranean Sea & Gibraltar approach
  [[32.0, -6.0], [44.0, 34.0]],
  // 5. English Channel, Dover Strait & Rotterdam approach
  [[49.0, -2.0], [54.0, 6.0]],
  // 6. East Asian Sea Lanes (Taiwan Strait, East China Sea)
  [[21.0, 118.0], [33.0, 128.0]],
];

export class AISStreamService {
  private ws: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private isConnecting = false;
  private isDestroyed = false;

  private lastMessageAt: string | null = null;
  private messagesReceived = 0;
  private vesselsTrackedMap = new Map<string, {
    mmsi: string;
    shipName?: string;
    latitude: number;
    longitude: number;
    speedKnots?: number;
    heading?: number;
    timestamp: string;
  }>();

  // Known shipment to vessel/MMSI mapping
  private shipmentVesselMap = new Map<string, {
    shipmentId: string;
    vesselName?: string;
    mmsi?: string;
    imo?: string;
    carrier?: string;
  }>();

  constructor() {
    this.init();
  }

  public init() {
    const apiKey = process.env.AISSTREAM_API_KEY;
    if (!apiKey) {
      console.log("[AISStream] AISSTREAM_API_KEY is not configured in server environment. Live AIS streaming is on standby.");
      return;
    }
    this.connect();
  }

  public isConfigured(): boolean {
    return !!process.env.AISSTREAM_API_KEY;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === 1; // 1 = OPEN
  }

  /**
   * Register a verified shipment to vessel MMSI mapping
   */
  public registerShipmentVessel(mapping: {
    shipmentId: string;
    vesselName?: string;
    mmsi?: string;
    imo?: string;
    carrier?: string;
  }) {
    this.shipmentVesselMap.set(mapping.shipmentId, mapping);
    if (mapping.mmsi) {
      this.shipmentVesselMap.set(`MMSI_${mapping.mmsi}`, mapping);
    }
    if (mapping.vesselName) {
      this.shipmentVesselMap.set(`VESSEL_${mapping.vesselName.toLowerCase()}`, mapping);
    }
  }

  /**
   * Retrieves shipment mapping for a given vessel
   */
  public findShipmentForVessel(mmsi?: string | number, vesselName?: string): string | null {
    if (mmsi && this.shipmentVesselMap.has(`MMSI_${mmsi}`)) {
      return this.shipmentVesselMap.get(`MMSI_${mmsi}`)!.shipmentId;
    }
    if (vesselName && this.shipmentVesselMap.has(`VESSEL_${vesselName.toLowerCase()}`)) {
      return this.shipmentVesselMap.get(`VESSEL_${vesselName.toLowerCase()}`)!.shipmentId;
    }
    return null;
  }

  /**
   * Open WebSocket connection to AISStream endpoint
   */
  private connect() {
    if (this.isDestroyed || this.isConnecting) return;
    const apiKey = process.env.AISSTREAM_API_KEY;
    if (!apiKey) return;

    this.isConnecting = true;
    const endpoint = "wss://stream.aisstream.io/v0/stream";

    console.log(`[AISStream] Initiating server-side connection to ${endpoint}...`);

    try {
      // Use Node 22 native global WebSocket
      const WebSocketClass = (globalThis as any).WebSocket;
      if (!WebSocketClass) {
        console.error("[AISStream] Native WebSocket is unavailable in current Node environment.");
        this.isConnecting = false;
        return;
      }

      this.ws = new WebSocketClass(endpoint);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        console.log("[AISStream] Connected successfully to stream.aisstream.io");

        // Parse configurable bounding boxes or use major corridors
        let boundingBoxes = DEFAULT_BOUNDING_BOXES;
        if (process.env.AIS_BOUNDING_BOXES) {
          try {
            const parsed = JSON.parse(process.env.AIS_BOUNDING_BOXES);
            if (Array.isArray(parsed) && parsed.length > 0) {
              boundingBoxes = parsed;
            }
          } catch (e) {
            console.warn("[AISStream] Could not parse custom AIS_BOUNDING_BOXES. Using default maritime lanes.");
          }
        }

        // Collect specific MMSI filters if available
        const filterMmsis: string[] = [];
        if (process.env.AIS_FILTER_MMSI) {
          filterMmsis.push(...process.env.AIS_FILTER_MMSI.split(",").map((s) => s.trim()).filter(Boolean));
        }

        // Add any active shipment MMSIs from operational store
        const liveShipments: ShipmentRecord[] = operationalStore.getShipments();
        liveShipments.forEach((s: ShipmentRecord) => {
          if (s.mmsi) filterMmsis.push(s.mmsi);
        });

        const subscriptionMessage: any = {
          APIKey: apiKey,
          BoundingBoxes: boundingBoxes,
          FilterMessageTypes: ["PositionReport"],
        };

        if (filterMmsis.length > 0) {
          subscriptionMessage.FiltersShipMMSI = filterMmsis;
          console.log(`[AISStream] Subscribed with MMSI filter: [${filterMmsis.join(", ")}] across ${boundingBoxes.length} bounding boxes.`);
        } else {
          console.log(`[AISStream] Subscribed across ${boundingBoxes.length} global trade corridor bounding boxes.`);
        }

        this.ws.send(JSON.stringify(subscriptionMessage));
      };

      this.ws.onmessage = (event: any) => {
        try {
          let rawData: string;
          if (typeof event.data === "string") {
            rawData = event.data;
          } else if (event.data instanceof ArrayBuffer) {
            rawData = new TextDecoder().decode(event.data);
          } else if (Buffer.isBuffer(event.data)) {
            rawData = event.data.toString("utf-8");
          } else {
            rawData = String(event.data);
          }

          const parsed: AISStreamMessage = JSON.parse(rawData);
          this.handleAISMessage(parsed);
        } catch (err) {
          // Ignore keepalive or malformed non-JSON frames
        }
      };

      this.ws.onerror = (err: any) => {
        console.warn("[AISStream] Connection warning:", err?.message || "Socket error");
      };

      this.ws.onclose = (event: any) => {
        this.isConnecting = false;
        this.ws = null;
        console.log(`[AISStream] Disconnected (code: ${event?.code || "unknown"}).`);
        this.scheduleReconnect();
      };
    } catch (err: any) {
      this.isConnecting = false;
      this.ws = null;
      console.error("[AISStream] Failed to initialize WebSocket:", err?.message);
      this.scheduleReconnect();
    }
  }

  /**
   * Exponential backoff reconnection with jitter
   */
  private scheduleReconnect() {
    if (this.isDestroyed || !this.isConfigured()) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectAttempts++;
    // Exponential backoff: base 2000ms * (1.5 ^ attempts) + jitter up to 1000ms, capped at 30 seconds
    const backoffMs = Math.min(30000, 2000 * Math.pow(1.5, Math.min(this.reconnectAttempts, 8)));
    const jitter = Math.floor(Math.random() * 1000);
    const delay = backoffMs + jitter;

    console.log(`[AISStream] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Process and normalize verified AIS PositionReport
   */
  private handleAISMessage(msg: AISStreamMessage) {
    if (!msg || msg.MessageType !== "PositionReport") return;

    const meta = msg.MetaData;
    const pos = msg.Message?.PositionReport;
    if (!meta) return;

    const lat = typeof pos?.Latitude === "number" && !isNaN(pos.Latitude) ? pos.Latitude : meta.latitude;
    const lng = typeof pos?.Longitude === "number" && !isNaN(pos.Longitude) ? pos.Longitude : meta.longitude;

    if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }

    const mmsiStr = String(meta.MMSI || meta.MMSI_String || "");
    const shipName = (meta.ShipName || "").trim();
    const speedKnots = typeof pos?.Sog === "number" && !isNaN(pos.Sog) ? pos.Sog : undefined;
    const heading = typeof pos?.TrueHeading === "number" && pos.TrueHeading <= 360 ? pos.TrueHeading : typeof pos?.Cog === "number" ? pos.Cog : undefined;
    const timestamp = meta.time_utc ? new Date(meta.time_utc).toISOString() : new Date().toISOString();

    this.lastMessageAt = timestamp;
    this.messagesReceived++;

    // Track in live vessel map
    this.vesselsTrackedMap.set(mmsiStr, {
      mmsi: mmsiStr,
      shipName: shipName || undefined,
      latitude: lat,
      longitude: lng,
      speedKnots,
      heading,
      timestamp,
    });

    // Match with existing shipment in operational store
    let matchedShipmentId = this.findShipmentForVessel(mmsiStr, shipName);
    const liveShipments: ShipmentRecord[] = operationalStore.getShipments();

    if (!matchedShipmentId) {
      // Find shipment that matches either MMSI or vessel name
      const found = liveShipments.find(
        (s: ShipmentRecord) =>
          (s.mmsi && s.mmsi === mmsiStr) ||
          (s.vessel && shipName && s.vessel.toLowerCase().includes(shipName.toLowerCase())) ||
          (s.carrier && shipName && s.carrier.toLowerCase().includes(shipName.toLowerCase()))
      );
      if (found) {
        matchedShipmentId = found.shipmentId;
      }
    }

    // Target shipment to update
    const targetId = matchedShipmentId || `MMSI-${mmsiStr}`;

    const operationalEvent: OperationalEvent = {
      eventId: `ais_${mmsiStr}_${Date.now()}`,
      eventType: "shipment.telemetry_received",
      timestamp,
      source: "AISStream",
      agent: "Shipment Tracker",
      severity: "low",
      status: "in_transit",
      shipmentId: targetId,
      location: {
        name: shipName ? `Vessel: ${shipName} (MMSI: ${mmsiStr})` : `MMSI: ${mmsiStr}`,
        latitude: lat,
        longitude: lng,
        timestamp,
        telemetrySource: "AISStream",
      },
      data: {
        shipmentId: targetId,
        vessel: shipName || `Vessel MMSI ${mmsiStr}`,
        mmsi: mmsiStr,
        speed: speedKnots,
        heading,
        source: "AISStream",
        telemetryType: "AIS",
        latitude: lat,
        longitude: lng,
        telemetryAvailable: true,
      },
    };

    operationalStore.ingestEvent(operationalEvent);

    // If an associated shipment exists, run Shipment Tracker Agent to evaluate delivery milestones
    if (matchedShipmentId) {
      const existing = liveShipments.find((s: ShipmentRecord) => s.shipmentId === matchedShipmentId);
      if (existing) {
        executeShipmentTrackerAgent(`AIS-${Date.now()}`, {
          shipmentId: matchedShipmentId,
          origin: existing.origin,
          destination: existing.destination,
          carrier: existing.carrier,
          location: {
            name: shipName || existing.vessel,
            latitude: lat,
            longitude: lng,
          },
          status: speedKnots !== undefined && speedKnots < 0.5 ? "delayed" : "in_transit",
          existingShipment: existing,
        }).catch((err) => {
          console.warn("[AISStream] ShipmentTrackerAgent error:", err?.message);
        });

        // If vessel is halted in active corridor (speed < 0.5 knots), trigger Risk Sentinel Agent
        if (speedKnots !== undefined && speedKnots < 0.5 && existing.status !== "delivered") {
          executeRiskSentinelAgent(`RISK-AIS-${Date.now()}`, {
            shipmentId: matchedShipmentId,
            supplier: existing.supplierId,
            delayDays: existing.delayDays || 2,
            statement: `Maritime vessel ${shipName || existing.vessel || mmsiStr} reported stationary/drifting (SOG: ${speedKnots} kn) in corridor at coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}].`,
          }).catch(() => {});
        }
      }
    }
  }

  /**
   * Return safe, clean status of AISStream service without exposing secrets
   */
  public getStatus(): AISStreamStatus {
    const configured = this.isConfigured();
    const connected = this.isConnected();

    let status: AISStreamStatus["status"] = "AIS NOT CONFIGURED";
    let guidance = "";

    if (!configured) {
      status = "AIS NOT CONFIGURED";
      guidance = "Live maritime telemetry requires AISSTREAM_API_KEY. Configure this server-side environment variable to enable live AIS vessel tracking.";
    } else if (this.isConnecting && !connected) {
      status = "AIS CONNECTING";
      guidance = "Connecting to AISStream WebSocket (wss://stream.aisstream.io/v0/stream)...";
    } else if (connected) {
      if (this.messagesReceived > 0 && this.lastMessageAt) {
        const lastMsgTime = Date.parse(this.lastMessageAt);
        const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
        if (!isNaN(lastMsgTime) && lastMsgTime >= fifteenMinAgo) {
          status = "LIVE TELEMETRY";
          guidance = `AISStream streaming live: ${this.vesselsTrackedMap.size} vessel(s) positioned in trade corridors.`;
        } else {
          status = "STALE TELEMETRY";
          guidance = "AISStream connected, but last vessel message was over 15 minutes ago.";
        }
      } else {
        status = "WAITING FOR VESSEL TELEMETRY";
        guidance = "AISStream connected. Waiting for matching vessel telemetry inside subscribed corridors.";
      }
    } else if (this.reconnectAttempts > 0) {
      status = "AIS CONNECTION ERROR";
      guidance = `AISStream disconnected. Reconnection attempt in progress (${this.reconnectAttempts} retries).`;
    } else {
      status = "AIS NOT CONFIGURED";
      guidance = "AISStream on standby.";
    }

    // Get 5 latest vessel positions
    const latestVessels = Array.from(this.vesselsTrackedMap.values())
      .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
      .slice(0, 5);

    return {
      provider: "AISStream",
      configured,
      connected,
      status,
      lastMessageAt: this.lastMessageAt,
      vesselsTracked: this.vesselsTrackedMap.size,
      messagesReceived: this.messagesReceived,
      reconnectAttempts: this.reconnectAttempts,
      activeBoundingBoxes: DEFAULT_BOUNDING_BOXES.length,
      guidance,
      latestVessels,
    };
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }
}

export const aisStreamService = new AISStreamService();
