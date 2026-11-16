import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ship,
  Cpu,
  Zap,
  ChevronRight,
  Radar,
  Radio,
  RefreshCw,
  ShieldAlert,
  Search,
  Filter,
  X,
  MapPin,
  Calendar,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Truck,
  HelpCircle,
  MessageSquare,
  Sparkles,
  UserCheck,
  Shield,
  Sliders,
  FileCheck,
  Compass,
  Gauge,
  BookOpen,
  Route,
} from "lucide-react";
import {
  PageView,
  ControlTowerLiveState,
  OperationalEvent,
  ShipmentRecord,
  RiskRecord,
  DisruptionRecord,
  ImpactRecord,
  AgentStatusRecord,
  PreviaDecisionEvent,
  SupplyChainGraphNode,
} from "../types";
import { LiveShipmentMap } from "../components/LiveShipmentMap";
import { SupplyChainNetworkView } from "../components/SupplyChainNetworkView";
import { AskPreviaDrawer, AskPreviaContext } from "../components/ai/AskPreviaDrawer";
import { UserActivityModal } from "../components/ai/UserActivityModal";
import { AgentFleetModal } from "../components/AgentFleetModal";
import { DecisionReviewModal } from "../components/ai/DecisionReviewModal";
import { ScenarioSimulatorModal } from "../components/ai/ScenarioSimulatorModal";
import { PreviaBrand, PreviaBrandIcon } from "../components/brand/PreviaBrand";
import { lookupLocationCoordinates } from "../lib/locationCoordinates";
import { useAuth } from "../context/AuthContext";
import { authFetch } from "../lib/apiClient";

interface ControlTowerPageProps {
  onNavigate: (page: PageView) => void;
  onOpenRAG?: () => void;
}

export const ControlTowerPage: React.FC<ControlTowerPageProps> = ({
  onNavigate,
  onOpenRAG,
}) => {
  const { currentUser } = useAuth();
  const [liveState, setLiveState] = useState<ControlTowerLiveState | null>(null);
  const [telemetryStatus, setTelemetryStatus] = useState<{
    hasActiveTelemetryFeed?: boolean;
    totalTelemetryPoints?: number;
    guidance?: string;
    aisStream?: any;
    providers?: any[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);

  // Modals and Drawers for 12-Agent Intelligence Interaction
  const [isAskPreviaOpen, setIsAskPreviaOpen] = useState(false);
  const [askPreviaContext, setAskPreviaContext] = useState<AskPreviaContext | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [reviewingDecision, setReviewingDecision] = useState<PreviaDecisionEvent | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Fetch real operational state & telemetry provider status from backend scoped to authenticated user
  const fetchState = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [stateRes, telRes] = await Promise.all([
        authFetch("/api/control-tower/state", {}, currentUser),
        fetch("/api/telemetry/status").catch(() => null),
      ]);

      if (stateRes.ok) {
        const data = await stateRes.json();
        if (data.success && data.state) {
          setLiveState(data.state);
        }
      }

      if (telRes && telRes.ok) {
        const telData = await telRes.json();
        if (telData.success) {
          setTelemetryStatus(telData);
        }
      }
    } catch (err) {
      console.error("[ControlTower] Error fetching state:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [currentUser]);

  // Poll for real operational updates every 5 seconds (lightweight)
  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      fetchState();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Operational state variables (strictly genuine ledger data)
  const totalEvents = liveState?.kpis.totalEventsIngested || 0;
  const rawShipments = liveState?.shipments || [];
  const rawRisks = liveState?.risks || [];
  const rawDisruptions = liveState?.disruptions || [];
  const rawActivity = liveState?.activityTimeline || [];
  const rawDecisions = liveState?.decisions || [];
  const agents = liveState?.agents || {};
  const lastUpdated = liveState?.lastUpdated || "";

  // Connection Freshness Indicator
  const connectionStatus = useMemo<{
    label: "LIVE" | "STALE" | "STANDBY" | "NO LIVE TELEMETRY";
    style: string;
    dotStyle: string;
  }>(() => {
    const hasAis = telemetryStatus?.aisStream?.connected;
    const hasLivePackets = telemetryStatus?.aisStream?.status === "LIVE TELEMETRY";

    if (hasLivePackets) {
      return {
        label: "LIVE",
        style: "bg-emerald-50 text-emerald-800 border-emerald-300",
        dotStyle: "bg-emerald-500 animate-pulse",
      };
    }

    if (hasAis) {
      return {
        label: "STANDBY",
        style: "bg-blue-50 text-blue-800 border-blue-300",
        dotStyle: "bg-blue-500 animate-pulse",
      };
    }

    if (totalEvents === 0 && (!telemetryStatus?.hasActiveTelemetryFeed || telemetryStatus.totalTelemetryPoints === 0)) {
      return {
        label: "NO LIVE TELEMETRY",
        style: "bg-stone-200/80 text-stone-700 border-stone-300",
        dotStyle: "bg-stone-500",
      };
    }

    const latestEvent = rawActivity[0];
    const eventTime = Date.parse(latestEvent?.timestamp || lastUpdated);
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

    if (!isNaN(eventTime) && eventTime >= fifteenMinutesAgo) {
      return {
        label: "LIVE",
        style: "bg-emerald-50 text-emerald-800 border-emerald-300",
        dotStyle: "bg-emerald-500 animate-pulse",
      };
    }

    if (totalEvents > 0) {
      return {
        label: "STALE",
        style: "bg-amber-50 text-amber-800 border-amber-300",
        dotStyle: "bg-amber-500",
      };
    }

    return {
      label: "NO LIVE TELEMETRY",
      style: "bg-stone-200/80 text-stone-700 border-stone-300",
      dotStyle: "bg-stone-500",
    };
  }, [totalEvents, telemetryStatus, rawActivity, lastUpdated]);

  // Computed Filtered Lists from Real Shipments
  const filteredShipments = useMemo(() => {
    return rawShipments.filter((s) => {
      // Status filter
      if (statusFilter !== "ALL" && s.status !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search query (shipmentId, origin, destination, carrier)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.shipmentId.toLowerCase().includes(q) ||
          s.origin?.toLowerCase().includes(q) ||
          s.destination?.toLowerCase().includes(q) ||
          s.carrier?.toLowerCase().includes(q) ||
          s.items?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [rawShipments, statusFilter, searchQuery]);

  // Operational metrics calculated strictly from actual data
  const shipmentsCount = rawShipments.length;
  const livePositionsCount = useMemo(() => {
    return rawShipments.filter(
      (s) =>
        s.currentLocation &&
        typeof s.currentLocation.latitude === "number" &&
        !isNaN(s.currentLocation.latitude) &&
        typeof s.currentLocation.longitude === "number" &&
        !isNaN(s.currentLocation.longitude)
    ).length;
  }, [rawShipments]);

  const atRiskCount = useMemo(() => {
    return rawShipments.filter(
      (s) => s.severity === "high" || s.severity === "critical" || s.status === "delayed"
    ).length;
  }, [rawShipments]);

  const delayedCount = useMemo(() => {
    return rawShipments.filter((s) => s.status === "delayed" || (s.delayDays && s.delayDays > 0)).length;
  }, [rawShipments]);

  const disruptionsCount = useMemo(() => {
    return rawDisruptions.filter((d) => d.status === "active").length;
  }, [rawDisruptions]);

  const criticalRisksCount = useMemo(() => {
    return rawRisks.filter((r) => r.severity === "critical" && r.status === "active").length;
  }, [rawRisks]);

  // Active Risks list
  const activeRisks = useMemo(() => {
    return rawRisks
      .filter((r) => r.status === "active")
      .filter((r) => {
        if (severityFilter === "ALL") return true;
        return r.severity === severityFilter.toLowerCase();
      })
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.supplierId?.toLowerCase().includes(q) ||
          r.shipmentId?.toLowerCase().includes(q)
        );
      });
  }, [rawRisks, severityFilter, searchQuery]);

  // Prioritized Decision Events (Pending review first)
  const prioritizedDecisions = useMemo(() => {
    return [...rawDecisions].sort((a, b) => {
      const aPending = a.humanDecision === "pending" || !a.humanDecision ? 1 : 0;
      const bPending = b.humanDecision === "pending" || !b.humanDecision ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;
      return (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0);
    });
  }, [rawDecisions]);

  // Canonical 12-Agent Fleet Registry
  const agentFleet = useMemo<
    {
      name: string;
      status: "Running" | "Complete" | "Waiting" | "No Data" | "Failed" | "Idle";
      count: number;
      lastActive: string;
      currentTask?: string;
    }[]
  >(() => {
    const ALL_12_NAMES = [
      "Shipment Tracker",
      "Disruption Intelligence",
      "Risk Sentinel",
      "Impact & Financial Analyzer",
      "Forecasting Agent",
      "Supplier Intelligence Agent",
      "Anomaly Detection Agent",
      "Document & Vision Intelligence",
      "Graph & Dependency Intelligence",
      "Scenario, Optimization & Mitigation Agent",
      "User Activity Agent",
      "Supply Chain Query Agent",
    ];

    return ALL_12_NAMES.map((name) => {
      const record =
        agents[name] ||
        agents[name.replace(" & Financial", "")] ||
        agents[name.replace(" Agent", "")];
      const count = record?.eventsProcessedCount || 0;

      let status: "Running" | "Complete" | "Waiting" | "No Data" | "Failed" | "Idle" =
        "Idle";

      if (record?.status === "error" || record?.status === "failed") {
        status = "Failed";
      } else if (record?.status === "running" || record?.status === "processing") {
        status = "Running";
      } else if (record?.status === "waiting") {
        status = "Waiting";
      } else if (record?.status === "no_data") {
        status = "No Data";
      } else if (record?.status === "completed" || count > 0) {
        status = "Complete";
      } else {
        status = "Idle";
      }

      return {
        name,
        status,
        count,
        lastActive: record?.lastActive || "",
        currentTask: record?.currentTask,
      };
    });
  }, [agents]);

  // Breakdown summary for fleet
  const fleetStats = useMemo(() => {
    const running = agentFleet.filter((a) => a.status === "Running").length;
    const complete = agentFleet.filter((a) => a.status === "Complete").length;
    const waiting = agentFleet.filter((a) => a.status === "Waiting").length;
    const idle = agentFleet.filter((a) => a.status === "Idle").length;
    const failed = agentFleet.filter((a) => a.status === "Failed").length;
    return { running, complete, waiting, idle, failed, total: agentFleet.length };
  }, [agentFleet]);

  // Format timestamp helper
  const formatTimestamp = (isoStr?: string) => {
    if (!isoStr) return "—";
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to trigger Ask Previa with focused shipment
  const handleAskPreviaAboutShipment = (sh: ShipmentRecord) => {
    setAskPreviaContext({
      selectedShipment: sh,
      selectedSupplier: sh.supplierId,
    });
    setIsAskPreviaOpen(true);
  };

  // Helper to trigger Ask Previa with focused risk
  const handleAskPreviaAboutRisk = (rk: RiskRecord) => {
    setAskPreviaContext({
      selectedRisk: rk,
      selectedSupplier: rk.supplierId,
    });
    setIsAskPreviaOpen(true);
  };

  // Check if entire platform has zero operational data
  const hasZeroOperationalData =
    totalEvents === 0 &&
    rawShipments.length === 0 &&
    rawRisks.length === 0 &&
    rawDisruptions.length === 0;

  return (
    <div className="bg-parchment min-h-screen text-charcoal pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* ================================================================= */}
        {/* 1. CONTROL TOWER HEADER                                           */}
        {/* ================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-graphite pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#B96F4A] uppercase tracking-widest flex items-center gap-1.5">
                <Radar className="w-4 h-4 text-[#B96F4A]" />
                <span>PREVIA CONTROL TOWER</span>
              </span>

              {/* Real Connection Freshness Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${connectionStatus.style}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus.dotStyle}`} />
                <span>{connectionStatus.label}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-charcoal tracking-tight">
              Operational Control Center
            </h1>
            <p className="text-xs text-charcoal-muted">
              Live carrier position telemetry, verified operational events, and active risk mitigation.
            </p>
          </div>

          {/* Right Header Actions: Ask Previa (Primary) | My Activity | Agent Fleet | Scenario Simulator | Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Ask Previa — PRIMARY ACTION */}
            <button
              type="button"
              id="btn-ask-previa-drawer"
              onClick={() => {
                setAskPreviaContext({
                  selectedShipment,
                });
                setIsAskPreviaOpen(true);
              }}
              className="px-4 py-2 bg-[#201A24] hover:bg-[#332A39] text-white text-xs font-mono font-bold rounded-xl border border-[#201A24] transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Open Ask Previa Operational Copilot"
            >
              <Radio className="w-3.5 h-3.5 text-[#B96F4A]" />
              <span>Ask Previa</span>
            </button>

            {/* My Activity */}
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-stone-mist text-charcoal text-xs font-mono font-medium rounded-xl border border-graphite transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-charcoal-muted" />
              <span>My Activity</span>
            </button>

            {/* Agent Fleet */}
            <button
              type="button"
              onClick={() => setIsFleetModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-stone-mist text-charcoal text-xs font-mono font-medium rounded-xl border border-graphite transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-charcoal-muted" />
              <span>Agent Fleet</span>
            </button>

            {/* Scenario Simulator */}
            <button
              type="button"
              onClick={() => setIsScenarioModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-stone-mist text-charcoal text-xs font-mono font-medium rounded-xl border border-graphite transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-charcoal-muted" />
              <span>Scenario Simulator</span>
              <span className="text-[9px] px-1 py-0.2 bg-stone-mist rounded font-mono text-charcoal-muted">SIM</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchState(true)}
              disabled={refreshing}
              className="p-2 bg-white hover:bg-stone-mist text-charcoal rounded-xl border border-graphite transition-colors cursor-pointer shadow-2xs"
              title="Refresh operational telemetry"
            >
              <RefreshCw
                className={`w-4 h-4 text-charcoal-muted ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. TOP STATUS BAR (Section 3: Compact LIVE OPERATIONS Metrics)    */}
        {/* ================================================================= */}
        <div className="bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-graphite/60 pb-2 mb-3">
            <span className="text-[11px] font-mono font-bold uppercase text-[#246B68] tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#246B68] animate-pulse" />
              <span>LIVE OPERATIONS</span>
            </span>
            <span className="text-[10px] font-mono text-charcoal-muted">
              {lastUpdated ? `Sync: ${formatTimestamp(lastUpdated)}` : "Standby"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {/* Total Shipments */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-charcoal-muted block">
                Total Shipments
              </span>
              <div className="text-2xl font-editorial font-bold text-charcoal">
                {shipmentsCount}
              </div>
            </div>

            {/* Live Positions */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-charcoal-muted block">
                Live Positions
              </span>
              <div className="text-2xl font-editorial font-bold text-[#246B68] flex items-center gap-1.5">
                <span>{livePositionsCount}</span>
                {livePositionsCount > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ) : (
                  <span className="text-[10px] font-mono font-normal text-charcoal-muted">(Route View)</span>
                )}
              </div>
            </div>

            {/* At Risk */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-charcoal-muted block">
                At Risk
              </span>
              <div className="text-2xl font-editorial font-bold text-[#A37031]">
                {atRiskCount}
              </div>
            </div>

            {/* Delayed */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-charcoal-muted block">
                Delayed
              </span>
              <div className="text-2xl font-editorial font-bold text-[#B34944]">
                {delayedCount}
              </div>
            </div>

            {/* Disruptions */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-charcoal-muted block">
                Disruptions
              </span>
              <div className="text-2xl font-editorial font-bold text-charcoal">
                {disruptionsCount}
              </div>
            </div>

            {/* Critical Risks */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-charcoal-muted block">
                Critical Risks
              </span>
              <div className="text-2xl font-editorial font-bold text-[#B34944]">
                {criticalRisksCount}
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Banner (Section 8) if zero operational data exists */}
        {hasZeroOperationalData && (
          <div className="bg-[#FAF8F4] border border-graphite rounded-2xl p-8 text-center space-y-3">
            <Radio className="w-8 h-8 text-[#B96F4A] mx-auto opacity-75" />
            <h3 className="text-sm font-bold font-editorial text-charcoal">
              NO LIVE OPERATIONAL DATA
            </h3>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
              Previa is connected and ready to monitor verified supply-chain events.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2 text-[11px] font-mono text-charcoal">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-graphite">
                • Carrier GPS / EDI
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-graphite">
                • AIS maritime telemetry
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-graphite">
                • IoT shipment telemetry
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-graphite">
                • Verified operational events
              </span>
            </div>
          </div>
        )}

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white border border-graphite rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shipment, route, origin, destination, carrier..."
              className="w-full pl-8 pr-4 py-1.5 bg-stone-mist/20 border border-graphite rounded-xl text-xs font-mono text-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:border-[#246B68]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-charcoal-muted text-[11px]">Status:</span>
            {["ALL", "IN_TRANSIT", "DELAYED", "DELIVERED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border ${
                  statusFilter === st
                    ? "bg-[#201A24] text-white border-[#201A24]"
                    : "bg-white text-charcoal-muted border-graphite hover:bg-stone-mist"
                }`}
              >
                {st}
              </button>
            ))}

            <span className="text-charcoal-muted text-[11px] ml-2">Risk:</span>
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border ${
                  severityFilter === sev
                    ? "bg-[#B96F4A] text-white border-[#B96F4A]"
                    : "bg-white text-charcoal-muted border-graphite hover:bg-stone-mist"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. MAIN OPERATIONAL ROW (Live Shipments ~65% | Active Risks ~35%) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN (8 cols ~67%): Live Shipment Tracker & Manifest Table */}
          <div className="lg:col-span-8 space-y-5">
            {/* Live Interactive Map Section */}
            <div className="bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-graphite pb-2.5">
                <div>
                  <h2 className="text-sm sm:text-base font-editorial font-bold text-charcoal tracking-tight">
                    Live Shipment Tracker
                  </h2>
                  <p className="text-[11px] text-charcoal-muted font-mono">
                    Verified shipment routes with live telemetry when available
                  </p>
                </div>
                <div className="text-[11px] font-mono text-charcoal-muted">
                  {filteredShipments.length}{" "}
                  {filteredShipments.length === 1 ? "vessel/shipment" : "vessels/shipments"}
                </div>
              </div>

              {/* Map */}
              <LiveShipmentMap
                shipments={filteredShipments}
                selectedShipmentId={selectedShipment?.shipmentId}
                onSelectShipment={(sh) => setSelectedShipment(sh)}
                telemetryStatus={telemetryStatus || undefined}
              />
            </div>

            {/* Selected Shipment Detail Card (if clicked) */}
            {selectedShipment && (
              <div className="bg-white border border-[#246B68]/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 relative animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="absolute right-4 top-4 p-1.5 text-charcoal-muted hover:text-charcoal bg-stone-mist/30 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-charcoal font-mono">
                      {selectedShipment.shipmentId}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm ${
                        selectedShipment.status === "delayed"
                          ? "bg-rose-100 text-rose-800"
                          : selectedShipment.status === "delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedShipment.status}
                    </span>
                    {selectedShipment.delayDays !== undefined && (
                      <span className="text-[10px] font-mono text-[#B34944] font-bold bg-[#FAECEB] px-2 py-0.5 rounded-sm border border-[#E5B5B3]">
                        +{selectedShipment.delayDays}d drift
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-[#E6F0EE] text-[#246B68] border border-[#CDE2E1]">
                      Source: {selectedShipment.source || (selectedShipment.vessel ? "AISStream" : "Carrier GPS")}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm ${
                        selectedShipment.currentLocation?.latitude != null &&
                        selectedShipment.currentLocation?.longitude != null
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : selectedShipment.origin && selectedShipment.destination
                          ? "bg-[#E6F0EE] text-[#246B68] border border-[#CDE2E1]"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {selectedShipment.currentLocation?.latitude != null &&
                      selectedShipment.currentLocation?.longitude != null
                        ? "LIVE POSITION"
                        : selectedShipment.origin && selectedShipment.destination
                        ? "ROUTE VIEW • NOT LIVE"
                        : "NO VERIFIED POSITION"}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-muted">
                    {selectedShipment.items || "Cargo manifest registered on carrier bill of lading"}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-stone-mist/20 rounded-xl border border-graphite/60 space-y-0.5">
                    <span className="text-[10px] text-charcoal-muted uppercase block">Origin</span>
                    <span className="font-bold text-charcoal block truncate">
                      {selectedShipment.origin || "—"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-mist/20 rounded-xl border border-graphite/60 space-y-0.5">
                    <span className="text-[10px] text-charcoal-muted uppercase block">Destination</span>
                    <span className="font-bold text-charcoal block truncate">
                      {selectedShipment.destination || "—"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-mist/20 rounded-xl border border-graphite/60 space-y-0.5">
                    <span className="text-[10px] text-charcoal-muted uppercase block">Carrier / Vessel</span>
                    <span className="font-bold text-charcoal block truncate">
                      {selectedShipment.vessel
                        ? `${selectedShipment.carrier || "Vessel"} • ${selectedShipment.vessel}`
                        : selectedShipment.carrier || "—"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-mist/20 rounded-xl border border-graphite/60 space-y-0.5">
                    <span className="text-[10px] text-charcoal-muted uppercase block">Contractual ETA</span>
                    <span className="font-bold text-charcoal block truncate">
                      {selectedShipment.eta || "Pending confirmation"}
                    </span>
                  </div>
                </div>

                {/* Coordinates & Route Freshness State */}
                <div className="p-3 bg-stone-mist/20 border border-graphite/60 rounded-xl space-y-2 text-xs font-mono">
                  {selectedShipment.currentLocation?.latitude != null &&
                  selectedShipment.currentLocation?.longitude != null ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-emerald-800 font-bold uppercase text-[10px] tracking-wider">
                          LIVE POSITION:
                        </span>
                        <strong className="text-charcoal font-bold">
                          {selectedShipment.currentLocation.latitude.toFixed(4)}°,{" "}
                          {selectedShipment.currentLocation.longitude.toFixed(4)}°{" "}
                          {selectedShipment.currentLocation.name ? `(${selectedShipment.currentLocation.name})` : ""}
                        </strong>
                      </div>
                      <span className="text-[11px] text-charcoal-muted">
                        Updated: {formatTimestamp(selectedShipment.latestUpdate)}
                      </span>
                    </div>
                  ) : selectedShipment.origin && selectedShipment.destination ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Route className="w-3.5 h-3.5 text-[#246B68]" />
                          <span className="text-[#246B68] font-bold uppercase text-[10px] tracking-wider">
                            ROUTE VIEW • NOT LIVE
                          </span>
                          <span className="text-charcoal-muted text-[11px]">
                            • Live position: Not available
                          </span>
                        </div>
                        <span className="text-[11px] text-charcoal-muted">
                          Last operational event: {formatTimestamp(selectedShipment.latestUpdate)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-charcoal font-mono pt-1 border-t border-graphite/40">
                        <span className="font-semibold text-charcoal">{selectedShipment.origin}</span>
                        <span className="text-charcoal-muted font-bold hidden sm:inline">● ───────────────────────── ●</span>
                        <span className="text-charcoal-muted font-bold sm:hidden">→</span>
                        <span className="font-semibold text-charcoal">{selectedShipment.destination}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-charcoal-muted/70" />
                        <span className="text-charcoal-muted font-bold uppercase text-[10px] tracking-wider">
                          NO VERIFIED LIVE POSITION
                        </span>
                        <span className="text-charcoal-muted text-[11px]">
                          • Source: {selectedShipment.source || (selectedShipment.vessel ? "AISStream" : "Carrier GPS")}
                        </span>
                      </div>
                      <span className="text-[11px] text-charcoal-muted">
                        Last operational event: {formatTimestamp(selectedShipment.latestUpdate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct Ask Previa button */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleAskPreviaAboutShipment(selectedShipment)}
                    className="px-4 py-2 bg-[#201A24] hover:bg-[#332A39] text-white text-xs font-mono font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#B96F4A]" />
                    <span>Ask Previa About This Shipment &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* Real Shipment Manifest Table */}
            <div className="bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-graphite pb-2.5">
                <div>
                  <h2 className="text-sm sm:text-base font-editorial font-bold text-charcoal tracking-tight">
                    Live Shipments
                  </h2>
                  <p className="text-[11px] text-charcoal-muted">
                    Verified milestone commitments and telemetry
                  </p>
                </div>
                <span className="text-xs font-mono text-charcoal-muted">
                  {filteredShipments.length} verified
                </span>
              </div>

              {filteredShipments.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-2">
                  <Truck className="w-7 h-7 text-charcoal-muted/40 mx-auto" />
                  <h4 className="text-xs font-bold text-charcoal font-mono">
                    No verified live shipment telemetry available.
                  </h4>
                  <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
                    Connect a carrier GPS, AIS, EDI, or IoT source to display live shipment movement.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-graphite text-charcoal-muted text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 font-bold">Shipment</th>
                        <th className="py-2.5 px-3 font-bold">Route</th>
                        <th className="py-2.5 px-3 font-bold">Status</th>
                        <th className="py-2.5 px-3 font-bold">ETA</th>
                        <th className="py-2.5 px-3 font-bold">Risk</th>
                        <th className="py-2.5 px-3 font-bold">Source</th>
                        <th className="py-2.5 px-3 font-bold">Position State</th>
                        <th className="py-2.5 px-3 font-bold">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-graphite/60">
                      {filteredShipments.map((sh) => {
                        const isSelected = selectedShipment?.shipmentId === sh.shipmentId;
                        const source = sh.source || (sh.vessel ? "AIS" : "Carrier GPS");
                        const hasLivePos =
                          sh.currentLocation &&
                          typeof sh.currentLocation.latitude === "number" &&
                          !isNaN(sh.currentLocation.latitude) &&
                          typeof sh.currentLocation.longitude === "number" &&
                          !isNaN(sh.currentLocation.longitude);
                        const hasRoute = Boolean(sh.origin && sh.destination);

                        return (
                          <tr
                            key={sh.shipmentId}
                            onClick={() => setSelectedShipment(sh)}
                            className={`hover:bg-stone-mist/30 cursor-pointer transition-colors ${
                              isSelected ? "bg-stone-mist/40" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-charcoal block">
                                {sh.shipmentId}
                              </span>
                              <span className="text-[10px] text-charcoal-muted block truncate max-w-[140px]">
                                {sh.vessel ? `${sh.carrier || "Vessel"} • ${sh.vessel}` : sh.carrier || "Carrier unassigned"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-charcoal">
                              <span>{sh.origin || "—"}</span>
                              <ArrowRight className="w-3 h-3 inline mx-1 text-charcoal-muted" />
                              <span>{sh.destination || "—"}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm inline-block ${
                                  sh.status === "delayed"
                                    ? "bg-rose-100 text-rose-800"
                                    : sh.status === "delivered"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {sh.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-charcoal block">{sh.eta || "—"}</span>
                              {sh.delayDays !== undefined && sh.delayDays > 0 && (
                                <span className="text-[10px] text-[#B34944] font-bold block">
                                  +{sh.delayDays}d
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {sh.severity ? (
                                <span
                                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm inline-block ${
                                    sh.severity === "critical"
                                      ? "bg-rose-100 text-rose-800"
                                      : sh.severity === "high"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-stone-mist text-charcoal"
                                  }`}
                                >
                                  {sh.severity}
                                </span>
                              ) : (
                                <span className="text-charcoal-muted">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-mono text-[#246B68] font-semibold block">
                                {source}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {hasLivePos ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>LIVE</span>
                                </span>
                              ) : hasRoute ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#E6F0EE] text-[#246B68] font-bold text-[9px] uppercase">
                                  <Route className="w-2.5 h-2.5" />
                                  <span>ROUTE VIEW</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-sm bg-stone-100 text-stone-600 text-[9px] uppercase font-semibold">
                                  NO POSITION
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-charcoal-muted text-[11px] whitespace-nowrap">
                              {formatTimestamp(sh.latestUpdate)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (4 cols ~33%): Active Risks */}
          <div className="lg:col-span-4 space-y-5">
            {/* Active Risks Panel */}
            <div className="bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-graphite pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#B96F4A]" />
                  <h3 className="text-sm font-bold text-charcoal">Active Risks</h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-charcoal-muted">
                  {activeRisks.length}
                </span>
              </div>

              {activeRisks.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-2">
                  <ShieldCheck className="w-7 h-7 text-[#4D7C5E]/70 mx-auto" />
                  <h4 className="text-xs font-bold text-charcoal font-mono uppercase">
                    NO ACTIVE RISKS
                  </h4>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    No verified operational risks currently require attention.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {activeRisks.map((risk) => {
                    const isCritical = risk.severity === "critical";
                    const isHigh = risk.severity === "high";

                    return (
                      <div
                        key={risk.riskId}
                        className="p-3 bg-stone-mist/20 border border-graphite rounded-xl space-y-2 text-xs hover:border-[#246B68] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-charcoal leading-snug">{risk.title}</span>
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm shrink-0 ${
                              isCritical
                                ? "bg-rose-100 text-rose-800 font-bold"
                                : isHigh
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {risk.severity}
                          </span>
                        </div>

                        <div className="text-[11px] text-charcoal-muted font-mono space-y-0.5">
                          {risk.shipmentId && <div>Affected: {risk.shipmentId}</div>}
                          {risk.supplierId && <div>Supplier: {risk.supplierId}</div>}
                          <div>Source: {risk.category}</div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-charcoal-muted pt-1 border-t border-graphite/40">
                          <span>Detected: {formatTimestamp(risk.detectedAt)}</span>
                          <button
                            type="button"
                            onClick={() => handleAskPreviaAboutRisk(risk)}
                            className="text-[#246B68] hover:underline font-bold cursor-pointer"
                          >
                            Review &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. ACTIVITY & GOVERNANCE ROW (Recent Activity 50% | Decisions 50%) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Recent Operational Activity (6 cols ~50%) */}
          <div className="lg:col-span-6 bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-graphite pb-2.5">
              <div>
                <h2 className="text-sm sm:text-base font-editorial font-bold text-charcoal tracking-tight">
                  Recent Operational Activity
                </h2>
                <p className="text-[11px] text-charcoal-muted">
                  Audit log of verified domain state changes and telemetry
                </p>
              </div>
              <span className="text-xs font-mono text-charcoal-muted">
                {rawActivity.length} {rawActivity.length === 1 ? "event" : "events"}
              </span>
            </div>

            {rawActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-charcoal-muted font-mono">
                NO RECENT OPERATIONAL ACTIVITY
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-graphite text-charcoal-muted text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-2.5 font-bold">Time</th>
                      <th className="py-2 px-2.5 font-bold">Event</th>
                      <th className="py-2 px-2.5 font-bold">Entity</th>
                      <th className="py-2 px-2.5 font-bold">Source</th>
                      <th className="py-2 px-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-graphite/60">
                    {rawActivity.slice(0, 10).map((ev) => (
                      <tr key={ev.eventId} className="hover:bg-stone-mist/20">
                        <td className="py-2 px-2.5 text-charcoal-muted text-[11px] whitespace-nowrap">
                          {formatTimestamp(ev.timestamp)}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-charcoal truncate max-w-[120px]">
                          {ev.eventType}
                        </td>
                        <td className="py-2 px-2.5 text-charcoal truncate max-w-[120px]">
                          {ev.shipmentId || ev.supplierId || ev.location?.name || "—"}
                        </td>
                        <td className="py-2 px-2.5 text-charcoal-muted text-[11px] truncate max-w-[90px]">
                          {ev.source || ev.agent}
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-stone-mist text-charcoal font-semibold">
                            {ev.status || "logged"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Autonomous Decision Events (6 cols ~50%) */}
          <div className="lg:col-span-6 bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-graphite pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B96F4A]" />
                <h3 className="text-sm sm:text-base font-editorial font-bold text-charcoal tracking-tight">
                  Decision Events
                </h3>
              </div>
              <span className="text-xs font-mono text-charcoal-muted">
                {prioritizedDecisions.length} recorded
              </span>
            </div>

            {prioritizedDecisions.length === 0 ? (
              <div className="py-8 text-center text-xs text-charcoal-muted font-mono">
                NO DECISION EVENTS REQUIRING ACTION
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {prioritizedDecisions.slice(0, 5).map((dec) => {
                  const isApproved = dec.humanDecision === "approved";
                  const isRejected = dec.humanDecision === "rejected";
                  const isModified = dec.humanDecision === "modified";
                  const isPending = !dec.humanDecision || dec.humanDecision === "pending";
                  const topRec = dec.recommendations[0];

                  return (
                    <div
                      key={dec.eventId}
                      className="p-3 bg-stone-mist/20 border border-graphite rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-charcoal block text-xs">
                            Run {dec.runId} Mitigation Decision
                          </span>
                          <span className="text-[11px] font-mono text-charcoal-muted">
                            Affected: {dec.affectedEntities?.join(", ") || "Corridor components"}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isRejected
                              ? "bg-rose-100 text-rose-800"
                              : isModified
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800 font-bold"
                          }`}
                        >
                          {isPending ? "Pending Review" : dec.humanDecision}
                        </span>
                      </div>

                      {topRec && (
                        <div className="p-2 bg-white rounded-lg border border-graphite/60 text-[11px] text-charcoal leading-relaxed">
                          <strong className="text-charcoal block font-mono text-[10px] uppercase text-[#246B68]">
                            AI Recommendation:
                          </strong>
                          {topRec.title || topRec.action}
                        </div>
                      )}

                      <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-graphite/40">
                        <span className="text-[10px] font-mono text-charcoal-muted">
                          Timestamp: {formatTimestamp(dec.timestamp)}
                        </span>

                        <button
                          type="button"
                          onClick={() => setReviewingDecision(dec)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer shadow-xs ${
                            isPending
                              ? "bg-[#201A24] hover:bg-[#332A39] text-white"
                              : "bg-stone-mist/60 hover:bg-stone-mist border border-graphite text-charcoal"
                          }`}
                        >
                          {isPending ? "Review & Act →" : "View Decision"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 5. MULTI-TIER SUPPLY CHAIN NETWORK (Full Width)                   */}
        {/* ================================================================= */}
        <div className="bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-graphite pb-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-editorial font-bold text-charcoal tracking-tight">
                Multi-Tier Supply Chain Network
              </h2>
              <p className="text-[11px] text-charcoal-muted">
                Interactive topological dependency graph computed by Graph &amp; Dependency Intelligence
              </p>
            </div>
            <span className="text-[11px] font-mono text-charcoal-muted">
              Select node to query downstream dependencies
            </span>
          </div>

          <SupplyChainNetworkView
            network={liveState?.network}
            onSelectNode={(node) => {
              setAskPreviaContext({
                selectedNode: node,
                selectedSupplier: node.supplierId,
              });
              setIsAskPreviaOpen(true);
            }}
          />
        </div>

        {/* ================================================================= */}
        {/* 6. COMPACT AI AGENT FLEET SUMMARY (Full Width)                    */}
        {/* ================================================================= */}
        <div className="bg-white border border-graphite rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-charcoal font-mono uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#B96F4A]" />
              <span>AI AGENT FLEET &bull; 12 SPECIALIZED AGENTS</span>
            </h3>
            <p className="text-xs text-charcoal-muted">
              Shipment Tracker, Disruption Intelligence, Risk Sentinel, Financial Analyzer, Forecasting, Supplier Intelligence, Anomaly Detection, Document Intelligence, Graph Intelligence, Mitigation, Activity, and Query Agent.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold">
                Running: {fleetStats.running}
              </span>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold">
                Complete: {fleetStats.complete}
              </span>
              <span className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-[10px] font-bold">
                Waiting: {fleetStats.waiting}
              </span>
              <span className="px-2 py-1 bg-stone-mist/30 text-charcoal border border-graphite rounded-lg text-[10px] font-bold">
                Idle: {fleetStats.idle}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFleetModalOpen(true)}
              className="px-3 py-1.5 bg-[#201A24] hover:bg-[#332A39] text-white text-xs font-mono font-semibold rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap ml-2"
            >
              View Agent Fleet &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. MODALS & ASSISTANT DRAWERS                                     */}
      {/* ================================================================= */}

      {/* Ask Previa Right-Side Assistant Drawer (Section 11 & 12) */}
      <AskPreviaDrawer
        isOpen={isAskPreviaOpen}
        onClose={() => setIsAskPreviaOpen(false)}
        context={askPreviaContext}
        controlTowerState={liveState}
        onOpenRAG={onOpenRAG}
      />

      {/* User Activity Modal (Section 14) */}
      <UserActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      />

      {/* 12-Agent Fleet Full Telemetry Modal (Section 7) */}
      <AgentFleetModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        agents={agents}
      />

      {/* Human-in-the-Loop Decision Review Modal */}
      <DecisionReviewModal
        decision={reviewingDecision}
        onClose={() => setReviewingDecision(null)}
        onDecisionUpdated={() => fetchState(true)}
      />

      {/* Scenario Simulator Modal (Section 15: Clearly Marked SIMULATION) */}
      <ScenarioSimulatorModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
      />
    </div>
  );
};
