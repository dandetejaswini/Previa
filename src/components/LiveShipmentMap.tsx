import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ShipmentRecord } from "../types";
import {
  Radio,
  Ship,
  MapPin,
  ArrowRight,
  Route,
  Navigation,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { lookupLocationCoordinates } from "../lib/locationCoordinates";

interface LiveShipmentMapProps {
  shipments: ShipmentRecord[];
  selectedShipmentId?: string | null;
  onSelectShipment: (shipment: ShipmentRecord) => void;
  telemetryStatus?: {
    hasActiveTelemetryFeed?: boolean;
    totalTelemetryPoints?: number;
    guidance?: string;
    aisStream?: {
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
    };
  };
}

interface ShipmentRouteItem {
  shipment: ShipmentRecord;
  hasLiveCoords: boolean;
  liveLat?: number;
  liveLng?: number;
  originCoords?: { latitude: number; longitude: number; name: string } | null;
  destCoords?: { latitude: number; longitude: number; name: string } | null;
  hasValidRoute: boolean;
}

export const LiveShipmentMap: React.FC<LiveShipmentMapProps> = ({
  shipments,
  selectedShipmentId,
  onSelectShipment,
  telemetryStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Analyze each shipment's geographic state strictly
  const analyzedShipments = useMemo<ShipmentRouteItem[]>(() => {
    return shipments.map((s) => {
      const hasLive =
        s.currentLocation &&
        typeof s.currentLocation.latitude === "number" &&
        !isNaN(s.currentLocation.latitude) &&
        typeof s.currentLocation.longitude === "number" &&
        !isNaN(s.currentLocation.longitude) &&
        s.currentLocation.latitude >= -90 &&
        s.currentLocation.latitude <= 90 &&
        s.currentLocation.longitude >= -180 &&
        s.currentLocation.longitude <= 180;

      const originCoords = s.origin ? lookupLocationCoordinates(s.origin) : null;
      const destCoords = s.destination ? lookupLocationCoordinates(s.destination) : null;
      const hasValidRoute = Boolean(originCoords && destCoords);

      const liveLat = hasLive && typeof s.currentLocation?.latitude === "number" ? s.currentLocation.latitude : undefined;
      const liveLng = hasLive && typeof s.currentLocation?.longitude === "number" ? s.currentLocation.longitude : undefined;

      return {
        shipment: s,
        hasLiveCoords: Boolean(hasLive && liveLat !== undefined && liveLng !== undefined),
        liveLat,
        liveLng,
        originCoords,
        destCoords,
        hasValidRoute,
      };
    });
  }, [shipments]);

  // Determine overall map visualization state
  const liveShipments = useMemo(
    () => analyzedShipments.filter((item) => item.hasLiveCoords),
    [analyzedShipments]
  );
  const routeShipments = useMemo(
    () => analyzedShipments.filter((item) => !item.hasLiveCoords && item.hasValidRoute),
    [analyzedShipments]
  );

  const selectedItem = useMemo(() => {
    if (!selectedShipmentId) return null;
    return analyzedShipments.find((item) => item.shipment.shipmentId === selectedShipmentId) || null;
  }, [analyzedShipments, selectedShipmentId]);

  // Current active mode
  const currentMode: "LIVE" | "ROUTE_VIEW" | "NO_DATA" = useMemo(() => {
    if (selectedItem) {
      if (selectedItem.hasLiveCoords) return "LIVE";
      if (selectedItem.hasValidRoute) return "ROUTE_VIEW";
      return "NO_DATA";
    }
    if (liveShipments.length > 0) return "LIVE";
    if (routeShipments.length > 0) return "ROUTE_VIEW";
    return "NO_DATA";
  }, [selectedItem, liveShipments, routeShipments]);

  const aisState = telemetryStatus?.aisStream;

  // Track mount lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe Leaflet Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let resizeTimer: any = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      const container = mapContainerRef.current;
      const map = L.map(container, {
        center: [25, 20],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      routesLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Safe delayed invalidateSize
      resizeTimer = setTimeout(() => {
        if (
          isMountedRef.current &&
          mapInstanceRef.current &&
          (mapInstanceRef.current as any)._mapPane &&
          mapContainerRef.current
        ) {
          try {
            map.invalidateSize();
          } catch (e) {
            console.warn("[LiveShipmentMap] Initial invalidateSize catch:", e);
          }
        }
      }, 200);

      // Safe ResizeObserver
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          if (
            isMountedRef.current &&
            mapInstanceRef.current &&
            (mapInstanceRef.current as any)._mapPane &&
            mapContainerRef.current
          ) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch (_) {}
          }
        });
        resizeObserver.observe(container);
      }
    } catch (err: any) {
      console.error("[LiveShipmentMap] Leaflet initialization error:", err);
      setMapError("Map initialization unavailable");
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (resizeObserver) {
        try {
          resizeObserver.disconnect();
        } catch (_) {}
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          routesLayerRef.current?.clearLayers();
          markersLayerRef.current?.clearLayers();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("[LiveShipmentMap] Safe unmount catch:", e);
        }
        mapInstanceRef.current = null;
        routesLayerRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update map layers truthfully based on mode and active data
  useEffect(() => {
    if (
      !isMountedRef.current ||
      !mapInstanceRef.current ||
      !markersLayerRef.current ||
      !routesLayerRef.current ||
      !(mapInstanceRef.current as any)._mapPane
    ) {
      return;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const routesGroup = routesLayerRef.current;

    try {
      markersGroup.clearLayers();
      routesGroup.clearLayers();

      const bounds: [number, number][] = [];

      // Determine items to display:
      // If a shipment is selected, prioritize it; otherwise render all available items
      const itemsToRender = selectedItem
        ? [selectedItem]
        : analyzedShipments.filter((it) => it.hasLiveCoords || it.hasValidRoute);

      if (itemsToRender.length === 0) {
        map.setView([25, 20], 2);
        return;
      }

      itemsToRender.forEach((item) => {
        const { shipment, hasLiveCoords, liveLat, liveLng, originCoords, destCoords, hasValidRoute } =
          item;
        const isSelected = shipment.shipmentId === selectedShipmentId;

        // -------------------------------------------------------------
        // 1. STATE A: LIVE POSITION (Verified coordinates received)
        // -------------------------------------------------------------
        if (hasLiveCoords && liveLat !== undefined && liveLng !== undefined) {
          bounds.push([liveLat, liveLng]);

          const isDelayed = shipment.status === "delayed";
          const markerColor = isDelayed ? "#dc2626" : "#2F6F6D";
          const source = shipment.source || (shipment.vessel ? "AISStream" : "Carrier GPS");
          const vesselLabel =
            shipment.vessel ||
            (shipment.mmsi ? `MMSI: ${shipment.mmsi}` : shipment.carrier || "Designated Transport");

          const liveIconHtml = `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${markerColor};
              color: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.4);
              border: 2.5px solid white;
              cursor: pointer;
              transform: ${isSelected ? "scale(1.2)" : "scale(1.0)"};
              transition: transform 0.2s ease;
            ">
              <span style="
                position: absolute;
                inset: -5px;
                border-radius: 50%;
                border: 2px solid ${markerColor};
                opacity: 0.75;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
                <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                <path d="M12 10v4"/>
                <path d="M12 2v3"/>
              </svg>
            </div>
          `;

          const liveIcon = L.divIcon({
            html: liveIconHtml,
            className: "custom-live-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          });

          const liveMarker = L.marker([liveLat, liveLng], { icon: liveIcon });

          const popupContent = `
            <div style="font-family: var(--font-sans, sans-serif); min-width: 220px; padding: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin-bottom: 6px;">
                <strong style="font-size: 13px; color: #211A27;">${shipment.shipmentId}</strong>
                <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #dcfce7; color: #166534;">
                  LIVE TELEMETRY
                </span>
              </div>
              <div style="font-size: 11px; color: #444; line-height: 1.6; margin-bottom: 8px;">
                <div><strong>Transport:</strong> ${vesselLabel}</div>
                <div><strong>Live Lat/Lng:</strong> ${liveLat.toFixed(4)}°, ${liveLng.toFixed(4)}°</div>
                ${shipment.speed !== undefined ? `<div><strong>Speed:</strong> ${shipment.speed.toFixed(1)} kn</div>` : ""}
                ${shipment.heading !== undefined ? `<div><strong>Heading:</strong> ${String(Math.round(shipment.heading)).padStart(3, "0")}°</div>` : ""}
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between;">
                  <span style="font-size: 10px; color: #2F6F6D; font-weight: 600;">Source: ${source}</span>
                  <span style="font-size: 10px; color: #888;">${new Date(shipment.latestUpdate).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          `;

          liveMarker.bindPopup(popupContent);
          liveMarker.on("click", () => onSelectShipment(shipment));
          markersGroup.addLayer(liveMarker);
        }

        // -------------------------------------------------------------
        // 2. STATE B: ROUTE VIEW (Planned Route • Origin to Destination)
        // -------------------------------------------------------------
        // When live position is not available, render planned route corridor connecting
        // verified origin node to destination node. Strictly DO NOT place a fake marker along the line.
        else if (hasValidRoute && originCoords && destCoords) {
          const origLat = originCoords.latitude;
          const origLng = originCoords.longitude;
          const destLat = destCoords.latitude;
          const destLng = destCoords.longitude;

          bounds.push([origLat, origLng]);
          bounds.push([destLat, destLng]);

          // Route Corridor Polyline (Dashed elegant corridor line)
          const polyline = L.polyline(
            [
              [origLat, origLng],
              [destLat, destLng],
            ],
            {
              color: isSelected ? "#B96F4A" : "#246B68",
              weight: isSelected ? 3.5 : 2.5,
              opacity: 0.85,
              dashArray: "6, 8",
              lineCap: "round",
            }
          );

          polyline.bindTooltip(
            `<strong>Planned Route (Not Live)</strong><br/>${originCoords.name} → ${destCoords.name}<br/>${shipment.shipmentId}`,
            { sticky: true, className: "font-mono text-xs" }
          );
          polyline.on("click", () => onSelectShipment(shipment));
          routesGroup.addLayer(polyline);

          // Origin Node Marker (Anchor Dot)
          const originIconHtml = `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: #201A24;
              color: #ffffff;
              padding: 2px 7px;
              border-radius: 6px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              font-family: monospace;
              font-size: 10px;
              font-weight: 700;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #D9A441; display: inline-block;"></span>
              <span>ORIGIN: ${originCoords.name}</span>
            </div>
          `;

          const originIcon = L.divIcon({
            html: originIconHtml,
            className: "custom-route-origin",
            iconSize: [140, 24],
            iconAnchor: [12, 12],
          });

          const originMarker = L.marker([origLat, origLng], { icon: originIcon });
          originMarker.on("click", () => onSelectShipment(shipment));
          markersGroup.addLayer(originMarker);

          // Destination Node Marker (Anchor Dot)
          const destIconHtml = `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: #246B68;
              color: #ffffff;
              padding: 2px 7px;
              border-radius: 6px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              font-family: monospace;
              font-size: 10px;
              font-weight: 700;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff; display: inline-block;"></span>
              <span>DEST: ${destCoords.name}</span>
            </div>
          `;

          const destIcon = L.divIcon({
            html: destIconHtml,
            className: "custom-route-dest",
            iconSize: [160, 24],
            iconAnchor: [12, 12],
          });

          const destMarker = L.marker([destLat, destLng], { icon: destIcon });
          destMarker.on("click", () => onSelectShipment(shipment));
          markersGroup.addLayer(destMarker);
        }
      });

      // Fit bounds safely
      if (bounds.length > 0) {
        if (bounds.length === 1) {
          map.setView(bounds[0], 5);
        } else {
          map.fitBounds(L.latLngBounds(bounds), {
            padding: [45, 45],
            maxZoom: 6,
          });
        }
      } else {
        map.setView([25, 20], 2);
      }
    } catch (e) {
      console.warn("[LiveShipmentMap] Layer update catch:", e);
    }
  }, [analyzedShipments, selectedShipmentId, selectedItem, onSelectShipment]);

  // Determine top status badge truthfully
  const getPrimaryStatusBadge = () => {
    if (currentMode === "LIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE TELEMETRY</span>
        </span>
      );
    }

    if (currentMode === "ROUTE_VIEW") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F0EE] text-[#246B68] border border-[#CDE2E1]">
          <Route className="w-3 h-3 text-[#246B68]" />
          <span>ROUTE VIEW • NOT LIVE</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700 border border-stone-300">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
        <span>NO ROUTE DATA</span>
      </span>
    );
  };

  // Provider status text
  const getProviderStatusText = () => {
    if (aisState?.connected) {
      return "AISStream: Connected • Waiting for live position";
    }
    if (aisState?.status === "AIS CONNECTING") {
      return "AISStream: Connecting to WebSocket...";
    }
    return "Carrier GPS / AIS: Waiting for telemetry coordinates";
  };

  // Dynamic map container height based on mode
  const getContainerHeightClass = () => {
    if (currentMode === "LIVE") {
      return "min-h-[320px] h-[320px] sm:h-[350px]";
    }
    if (currentMode === "ROUTE_VIEW") {
      return "min-h-[260px] h-[260px] sm:h-[285px]";
    }
    return "min-h-[160px] h-[160px] sm:h-[175px]";
  };

  return (
    <div className="space-y-2.5">
      {/* Top Telemetry & Route Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-stone-mist/30 border border-graphite/70 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#B86F52]" />
          <span className="font-bold text-charcoal">
            {currentMode === "LIVE"
              ? "LIVE SHIPMENT TELEMETRY"
              : currentMode === "ROUTE_VIEW"
              ? "PLANNED CORRIDOR ROUTE"
              : "SHIPMENT TELEMETRY"}
          </span>
          <span className="text-charcoal-muted">&bull;</span>
          <span className="text-[11px] text-charcoal-muted">
            {currentMode === "LIVE"
              ? `${liveShipments.length} verified live coordinate feed(s)`
              : currentMode === "ROUTE_VIEW"
              ? "Route View • Live position not available"
              : "No verified coordinate feeds active"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getPrimaryStatusBadge()}
        </div>
      </div>

      {/* Map Container Area */}
      <div
        className={`relative rounded-xl border border-graphite/80 overflow-hidden shadow-inner bg-[#e5e3df] transition-all duration-300 ${getContainerHeightClass()}`}
      >
        {mapError ? (
          <div className="absolute inset-0 bg-[#FAF8F4] flex items-center justify-center p-4 text-center">
            <p className="text-xs font-mono text-charcoal-muted">
              MAP ENGINE TEMPORARILY UNAVAILABLE
            </p>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        )}

        {/* Route View Bottom Annotation Banner */}
        {currentMode === "ROUTE_VIEW" && !mapError && (
          <div className="absolute bottom-2 left-2 right-2 sm:left-auto sm:right-2 z-10 pointer-events-none">
            <div className="bg-[#201A24]/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg border border-white/20 shadow-md text-[10px] font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441]" />
              <span className="font-bold text-[#D9A441]">PLANNED ROUTE</span>
              <span className="text-white/60">•</span>
              <span className="text-white/90">{getProviderStatusText()}</span>
            </div>
          </div>
        )}

        {/* State C: Compact Empty State Overlay when no live coordinates and no route endpoints exist */}
        {currentMode === "NO_DATA" && !mapError && (
          <div className="absolute inset-0 bg-[#FAF8F4]/95 backdrop-blur-xs flex items-center justify-center p-4 z-10">
            <div className="max-w-md w-full p-4 bg-white border border-graphite rounded-xl shadow-xs text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-charcoal">
                <Ship className="w-4 h-4 text-[#2F6F6D]" />
                <h3 className="text-xs font-bold font-editorial uppercase tracking-tight">
                  No Route Data Available
                </h3>
              </div>

              <div className="space-y-1 text-[11px] text-charcoal-muted leading-relaxed">
                <p className="font-mono text-charcoal font-semibold text-[10px]">
                  {getProviderStatusText()}
                </p>
                <p className="text-[10px]">
                  Carrier and milestone records are listed in the manifest below. Live vessel/GPS telemetry will appear automatically upon packet receipt.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
