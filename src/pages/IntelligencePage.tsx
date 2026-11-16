import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { PageView, DisruptionRun, DeliveryDriftRun } from "../types";
import {
  INITIAL_DISRUPTION_RUNS,
  INITIAL_DRIFT_RUNS,
} from "../data/presets";
import { DisruptionEngine } from "../components/ai/DisruptionEngine";
import { DeliveryDriftAnalyzer } from "../components/ai/DeliveryDriftAnalyzer";
import { PreviousRunsModal } from "../components/ai/PreviousRunsModal";
import { GoogleSheetsModal } from "../components/ai/GoogleSheetsModal";
import { AuditCertificateModal } from "../components/ai/AuditCertificateModal";
import { PreviaBrand, PreviaBrandIcon } from "../components/brand/PreviaBrand";
import { authFetch } from "../lib/apiClient";
import {
  ShieldAlert,
  Layers,
  Clock,
  FileSpreadsheet,
  History,
  Radar,
  Radio,
} from "lucide-react";

interface IntelligencePageProps {
  initialScenario?: string;
  onClearInitialScenario?: () => void;
  onNavigate?: (page: PageView) => void;
}

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  initialScenario,
  onClearInitialScenario,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || "guest";

  // Active AI View Tab
  const [activeTab, setActiveTab] = useState<"disruption" | "drift">("disruption");

  // Disruption Runs State (User-scoped)
  const [disruptionRuns, setDisruptionRuns] = useState<DisruptionRun[]>([]);

  // Delivery Drift Runs State (User-scoped)
  const [driftRuns, setDriftRuns] = useState<DeliveryDriftRun[]>([]);

  // Active selected run to display
  const [activeDisruptionRun, setActiveDisruptionRun] = useState<DisruptionRun | null>(null);
  const [activeDriftRun, setActiveDriftRun] = useState<DeliveryDriftRun | null>(null);

  // Modals state
  const [isPreviousRunsOpen, setIsPreviousRunsOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [sheetsExportPayload, setSheetsExportPayload] = useState<any>(null);

  const [auditCertData, setAuditCertData] = useState<{
    run: any;
    type: "disruption" | "drift";
  } | null>(null);

  // Load User-Scoped Runs from Backend & LocalStorage cache when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setDisruptionRuns([]);
      setDriftRuns([]);
      setActiveDisruptionRun(null);
      setActiveDriftRun(null);
      return;
    }

    // 1. Initial read from user-scoped localStorage cache
    try {
      const userDisruptionCache = localStorage.getItem(`previa_disruption_runs_${currentUser.id}`);
      if (userDisruptionCache) {
        const parsed = JSON.parse(userDisruptionCache);
        if (Array.isArray(parsed)) {
          setDisruptionRuns(parsed);
        }
      } else {
        setDisruptionRuns([]);
      }

      const userDriftCache = localStorage.getItem(`previa_drift_runs_${currentUser.id}`);
      if (userDriftCache) {
        const parsed = JSON.parse(userDriftCache);
        if (Array.isArray(parsed)) {
          setDriftRuns(parsed);
        }
      } else {
        setDriftRuns([]);
      }
    } catch {
      setDisruptionRuns([]);
      setDriftRuns([]);
    }

    // 2. Fetch authoritative backend records scoped to authenticated user
    let isCancelled = false;
    Promise.all([
      authFetch("/api/runs/disruptions", {}, currentUser).then((res) => (res.ok ? res.json() : null)),
      authFetch("/api/runs/drift", {}, currentUser).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([disruptionData, driftData]) => {
        if (isCancelled) return;
        if (disruptionData?.success && Array.isArray(disruptionData.runs)) {
          setDisruptionRuns(disruptionData.runs);
          localStorage.setItem(
            `previa_disruption_runs_${currentUser.id}`,
            JSON.stringify(disruptionData.runs)
          );
        }
        if (driftData?.success && Array.isArray(driftData.runs)) {
          setDriftRuns(driftData.runs);
          localStorage.setItem(
            `previa_drift_runs_${currentUser.id}`,
            JSON.stringify(driftData.runs)
          );
        }
      })
      .catch((err) => {
        console.warn("[Previa AI] Error syncing previous runs from server:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  // Sync Disruption Runs to user-scoped localStorage
  useEffect(() => {
    if (currentUser?.id) {
      try {
        localStorage.setItem(`previa_disruption_runs_${currentUser.id}`, JSON.stringify(disruptionRuns));
      } catch (e) {
        console.error(e);
      }
    }
  }, [disruptionRuns, currentUser?.id]);

  // Sync Drift Runs to user-scoped localStorage
  useEffect(() => {
    if (currentUser?.id) {
      try {
        localStorage.setItem(`previa_drift_runs_${currentUser.id}`, JSON.stringify(driftRuns));
      } catch (e) {
        console.error(e);
      }
    }
  }, [driftRuns, currentUser?.id]);

  // Handle initial scenario from Home page
  useEffect(() => {
    if (initialScenario) {
      setActiveTab("disruption");
      if (onClearInitialScenario) {
        onClearInitialScenario();
      }
    }
  }, [initialScenario, onClearInitialScenario]);

  // Disruption Handlers
  const handleSaveDisruptionRun = (run: DisruptionRun) => {
    const userRun = { ...run, userId: currentUser?.id };
    setDisruptionRuns((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === run.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = userRun;
        return next;
      }
      return [userRun, ...prev];
    });
    setActiveDisruptionRun(userRun);

    if (currentUser) {
      authFetch("/api/runs/disruptions", {
        method: "POST",
        body: JSON.stringify(userRun),
      }, currentUser).catch(console.error);
    }
  };

  const handleDeleteDisruptionRun = (id: string) => {
    setDisruptionRuns((prev) => prev.filter((r) => r.id !== id));
    if (activeDisruptionRun?.id === id) {
      setActiveDisruptionRun(disruptionRuns.find((r) => r.id !== id) || null);
    }
    if (currentUser) {
      authFetch(`/api/runs/disruptions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }, currentUser).catch(console.error);
    }
  };

  // Drift Handlers
  const handleSaveDriftRun = (run: DeliveryDriftRun) => {
    const userRun = { ...run, userId: currentUser?.id };
    setDriftRuns((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === run.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = userRun;
        return next;
      }
      return [userRun, ...prev];
    });
    setActiveDriftRun(userRun);

    if (currentUser) {
      authFetch("/api/runs/drift", {
        method: "POST",
        body: JSON.stringify(userRun),
      }, currentUser).catch(console.error);
    }
  };

  const handleDeleteDriftRun = (id: string) => {
    setDriftRuns((prev) => prev.filter((r) => r.id !== id));
    if (activeDriftRun?.id === id) {
      setActiveDriftRun(driftRuns.find((r) => r.id !== id) || null);
    }
    if (currentUser) {
      authFetch(`/api/runs/drift/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }, currentUser).catch(console.error);
    }
  };

  const handleClearAllRuns = (type: "disruption" | "drift") => {
    if (type === "disruption") {
      setDisruptionRuns([]);
      setActiveDisruptionRun(null);
      if (currentUser) {
        authFetch("/api/runs/disruptions", { method: "DELETE" }, currentUser).catch(console.error);
      }
    } else {
      setDriftRuns([]);
      setActiveDriftRun(null);
      if (currentUser) {
        authFetch("/api/runs/drift", { method: "DELETE" }, currentUser).catch(console.error);
      }
    }
  };

  const handleOpenSheetsWithPayload = (payload?: any) => {
    setSheetsExportPayload(payload || activeDriftRun || activeDisruptionRun);
    setIsSheetsModalOpen(true);
  };

  const totalRunsCount = disruptionRuns.length + driftRuns.length;

  return (
    <div className="min-h-screen bg-parchment pb-20 pt-8 text-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header Card */}
        <div className="bg-white border border-graphite rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title & Subtitle */}
            <div className="flex items-start gap-4">
              <PreviaBrandIcon size="lg" />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-editorial font-bold text-charcoal tracking-tight">
                    Previa AI Workspace
                  </h1>
                  <span className="text-xs font-mono font-semibold bg-[#E8F2F1] text-[#246B68] px-2.5 py-0.5 rounded-full border border-[#CDE2E1]">
                    Resilience & Disruption Engine
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-2xl leading-relaxed">
                  Synthesize multi-tier disruption containment vectors, quantify financial exposure, and audit delivery drift over time.
                </p>
              </div>
            </div>

            {/* Quick Action Pills & Operator Profile */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenSheetsWithPayload()}
                className="px-4 py-2.5 bg-copper hover:bg-[#A25E43] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer border border-[#CD8569]/30"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#D9A441]" />
                <span>Export Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPreviousRunsOpen(true)}
                className="px-3.5 py-2.5 bg-white hover:bg-stone-mist/40 text-charcoal font-semibold text-xs rounded-xl border border-graphite shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <History className="w-4 h-4 text-charcoal-muted" />
                <span>Previous Runs ({totalRunsCount})</span>
              </button>

              {/* Operator Badge */}
              <div className="flex items-center gap-2.5 bg-stone-mist/50 border border-graphite px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-[#211A27] text-white flex items-center justify-center text-xs font-bold font-mono">
                  {(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}
                </div>
                <div className="text-left text-xs hidden sm:block">
                  <div className="font-bold text-charcoal leading-tight">
                    {currentUser?.name || currentUser?.email || "Authorized Operator"}
                  </div>
                  <div className="text-[10px] text-charcoal-muted leading-tight font-mono">
                    {currentUser?.company || currentUser?.email || "Global Logistics Network"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="mt-8 border-t border-graphite pt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("disruption")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "disruption"
                  ? "bg-[#211A27] text-white shadow-xs"
                  : "bg-stone-mist/50 text-charcoal-muted hover:text-charcoal hover:bg-stone-mist"
              }`}
            >
              <Layers className="w-4 h-4 text-[#B86F52]" />
              <span>Disruption Engine</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("drift")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "drift"
                  ? "bg-[#211A27] text-white shadow-xs"
                  : "bg-stone-mist/50 text-charcoal-muted hover:text-charcoal hover:bg-stone-mist"
              }`}
            >
              <Clock className="w-4 h-4 text-[#2F6F6D]" />
              <span>Delivery Drift Analyzer</span>
            </button>
          </div>
        </div>

        {/* Section 1: Disruption Engine */}
        {activeTab === "disruption" && (
          <DisruptionEngine
            activeRun={activeDisruptionRun}
            onSaveRun={handleSaveDisruptionRun}
            onOpenAuditCert={(run) => setAuditCertData({ run, type: "disruption" })}
            onNavigateToControlTower={() => onNavigate?.("control_tower")}
          />
        )}

        {/* Section 2: Delivery Drift Analyzer */}
        {activeTab === "drift" && (
          <DeliveryDriftAnalyzer
            activeRun={activeDriftRun}
            driftRuns={driftRuns}
            onSaveRun={handleSaveDriftRun}
            onSelectRun={(run) => setActiveDriftRun(run)}
            onOpenSheetsModal={handleOpenSheetsWithPayload}
            onOpenAllRuns={() => setIsPreviousRunsOpen(true)}
            onNavigateToControlTower={() => onNavigate?.("control_tower")}
          />
        )}
      </div>

      {/* Modals */}
      <PreviousRunsModal
        isOpen={isPreviousRunsOpen}
        onClose={() => setIsPreviousRunsOpen(false)}
        disruptionRuns={disruptionRuns}
        driftRuns={driftRuns}
        onSelectDisruptionRun={(run) => {
          setActiveDisruptionRun(run);
          setActiveTab("disruption");
        }}
        onSelectDriftRun={(run) => {
          setActiveDriftRun(run);
          setActiveTab("drift");
        }}
        onDeleteDisruptionRun={handleDeleteDisruptionRun}
        onDeleteDriftRun={handleDeleteDriftRun}
        onClearAllRuns={handleClearAllRuns}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        exportData={sheetsExportPayload}
      />

      <AuditCertificateModal
        isOpen={!!auditCertData}
        onClose={() => setAuditCertData(null)}
        runData={auditCertData?.run}
        type={auditCertData?.type || "disruption"}
      />
    </div>
  );
};
