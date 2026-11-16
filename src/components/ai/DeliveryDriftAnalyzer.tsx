import React, { useState } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  RefreshCw,
  Zap,
  Plus,
  Trash2,
  Search,
  Check,
  ArrowRight,
  ShieldCheck,
  ListChecks,
  Square,
  Sparkles,
  X,
} from "lucide-react";
import { DeliveryDriftRun, DriftAction } from "../../types";
import { DRIFT_BENCHMARK_EXAMPLES } from "../../data/presets";
import { AgentIntelligenceSection } from "./AgentIntelligenceSection";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../lib/apiClient";

interface DeliveryDriftAnalyzerProps {
  activeRun: DeliveryDriftRun | null;
  driftRuns: DeliveryDriftRun[];
  onSaveRun: (run: DeliveryDriftRun) => void;
  onSelectRun: (run: DeliveryDriftRun) => void;
  onOpenSheetsModal: (exportPayload?: any) => void;
  onOpenAllRuns: () => void;
  onNavigateToControlTower?: () => void;
}

export const DeliveryDriftAnalyzer: React.FC<DeliveryDriftAnalyzerProps> = ({
  activeRun,
  driftRuns,
  onSaveRun,
  onSelectRun,
  onOpenSheetsModal,
  onOpenAllRuns,
  onNavigateToControlTower,
}) => {
  const { currentUser } = useAuth();
  const [supplier, setSupplier] = useState(activeRun?.supplier || "");
  const [material, setMaterial] = useState(activeRun?.material || "");
  const [poNumber, setPoNumber] = useState(activeRun?.poNumber || "");
  const [originalDeliveryDate, setOriginalDeliveryDate] = useState(
    activeRun?.originalDeliveryDate || ""
  );
  const [requiredInPlantDate, setRequiredInPlantDate] = useState(
    activeRun?.requiredInPlantDate || ""
  );
  const [riskCategory, setRiskCategory] = useState(
    activeRun?.riskCategory ||
      "Supplier & Semiconductor Delays (Manufacturing)"
  );
  const [latestCommunication, setLatestCommunication] = useState(
    activeRun?.latestCommunication || ""
  );

  const [optionalOpen, setOptionalOpen] = useState(false);
  const [quantity, setQuantity] = useState(
    activeRun?.optionalDetails?.quantity || ""
  );
  const [unit, setUnit] = useState(activeRun?.optionalDetails?.unit || "");
  const [notes, setNotes] = useState(activeRun?.optionalDetails?.notes || "");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<DeliveryDriftRun | null>(
    activeRun || null
  );
  const [orchestrationData, setOrchestrationData] = useState<any>(null);

  // New custom action inline input
  const [newActionTitle, setNewActionTitle] = useState("");
  const [showAddActionInput, setShowAddActionInput] = useState(false);

  // Sync if activeRun changes externally
  React.useEffect(() => {
    if (activeRun) {
      setCurrentRun(activeRun);
      setSupplier(activeRun.supplier);
      setMaterial(activeRun.material);
      setPoNumber(activeRun.poNumber);
      setOriginalDeliveryDate(activeRun.originalDeliveryDate);
      setRequiredInPlantDate(activeRun.requiredInPlantDate);
      setRiskCategory(activeRun.riskCategory);
      setLatestCommunication(activeRun.latestCommunication);
      if (activeRun.optionalDetails) {
        setQuantity(activeRun.optionalDetails.quantity || "");
        setUnit(activeRun.optionalDetails.unit || "");
        setNotes(activeRun.optionalDetails.notes || "");
      }
    }
  }, [activeRun]);

  const handleClear = () => {
    setSupplier("");
    setMaterial("");
    setPoNumber("");
    setOriginalDeliveryDate("");
    setRequiredInPlantDate("");
    setLatestCommunication("");
    setQuantity("");
    setUnit("");
    setNotes("");
  };

  const handleApplyBenchmark = (benchmark: typeof DRIFT_BENCHMARK_EXAMPLES[0]) => {
    setSupplier(benchmark.supplier);
    setMaterial(benchmark.material);
    setPoNumber(benchmark.poNumber);
    setOriginalDeliveryDate(benchmark.originalDeliveryDate);
    setRequiredInPlantDate(benchmark.requiredInPlantDate);
    setRiskCategory(benchmark.riskCategory);
    setLatestCommunication(benchmark.latestCommunication);
    if (benchmark.optionalDetails) {
      setQuantity(benchmark.optionalDetails.quantity || "");
      setUnit(benchmark.optionalDetails.unit || "");
      setNotes(benchmark.optionalDetails.notes || "");
    }
  };

  const handleAppendIssue = (text: string) => {
    if (latestCommunication.trim()) {
      setLatestCommunication(`${latestCommunication.trim()} ${text}`);
    } else {
      setLatestCommunication(text);
    }
  };

  const handleAnalyze = async () => {
    if (!supplier.trim() || !originalDeliveryDate.trim() || !latestCommunication.trim()) {
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await authFetch(
        "/api/analyze-drift",
        {
          method: "POST",
          body: JSON.stringify({
            supplier,
            material,
            poNumber,
            originalDeliveryDate,
            requiredInPlantDate,
            riskCategory,
            latestCommunication,
            optionalDetails: { quantity, unit, notes },
            userId: currentUser?.id,
            userEmail: currentUser?.email,
          }),
        },
        currentUser
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.error ||
          (res.status === 503
            ? "Gemini AI is temporarily unavailable. Please try again."
            : res.status === 429
            ? "Gemini free-tier usage limit has been reached temporarily. Please try again later."
            : "Failed to analyze delivery commitment with Gemini AI.");
        setErrorMessage(msg);
        return;
      }

      if (data.run) {
        setCurrentRun(data.run);
        onSaveRun(data.run);
        setErrorMessage(null);
        if (data.orchestration) {
          setOrchestrationData(data.orchestration);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Network error or service unavailable. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSubPhase = (actionId: string, subPhaseId: string) => {
    if (!currentRun) return;
    const updatedActions = currentRun.recommendedActions.map((action) => {
      if (action.id !== actionId) return action;
      return {
        ...action,
        subPhases: action.subPhases.map((sp) => {
          if (sp.id !== subPhaseId) return sp;
          return { ...sp, completed: !sp.completed };
        }),
      };
    });

    const updatedRun = {
      ...currentRun,
      recommendedActions: updatedActions,
    };
    setCurrentRun(updatedRun);
    onSaveRun(updatedRun);
  };

  const handleAddCustomAction = () => {
    if (!newActionTitle.trim() || !currentRun) return;
    const newAction: DriftAction = {
      id: `custom-act-${Date.now()}`,
      title: newActionTitle.trim(),
      subPhases: [
        {
          id: `sp-${Date.now()}-1`,
          title: "Assign designated owner and set milestone deadline",
          completed: false,
        },
        {
          id: `sp-${Date.now()}-2`,
          title: "Verify supplier response and record in ERP audit trail",
          completed: false,
        },
      ],
    };

    const updatedRun = {
      ...currentRun,
      recommendedActions: [...currentRun.recommendedActions, newAction],
    };
    setCurrentRun(updatedRun);
    onSaveRun(updatedRun);
    setNewActionTitle("");
    setShowAddActionInput(false);
  };

  const handleDeleteAction = (actionId: string) => {
    if (!currentRun) return;
    const updatedRun = {
      ...currentRun,
      recommendedActions: currentRun.recommendedActions.filter(
        (a) => a.id !== actionId
      ),
    };
    setCurrentRun(updatedRun);
    onSaveRun(updatedRun);
  };

  return (
    <div className="space-y-6">
      {/* Top Previous Drift Runs Bar & Google Sheets Sync */}
      <div className="bg-white border border-graphite rounded-xl p-3 sm:px-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-charcoal-subtle uppercase tracking-wider text-[11px]">
            Previous Drift Runs:
          </span>
          {driftRuns.slice(0, 3).map((run) => (
            <button
              key={run.id}
              onClick={() => {
                onSelectRun(run);
                setCurrentRun(run);
              }}
              className={`px-2.5 py-1 rounded-md border font-mono text-xs transition-colors cursor-pointer ${
                currentRun?.id === run.id
                  ? "bg-[#211A27] text-white border-[#211A27]"
                  : "bg-parchment hover:bg-stone-mist text-charcoal border-graphite"
              }`}
            >
              {run.poNumber} ({run.supplier.split(" ")[0]}) {run.driftComparison?.driftDisplay || "+0d"}
            </button>
          ))}
          <button
            onClick={onOpenAllRuns}
            className="text-copper hover:text-[#874932] font-semibold flex items-center gap-0.5 ml-1 cursor-pointer font-mono"
          >
            <span>View All ({driftRuns.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Supplier Commitment Input (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-graphite rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-graphite pb-3">
            <h3 className="text-sm font-editorial font-bold text-charcoal uppercase tracking-wider">
              Supplier Commitment Input
            </h3>

            {/* Load Benchmark Example dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="text-xs font-semibold text-copper hover:text-[#874932] flex items-center gap-1 bg-[#F4EDE9] px-2.5 py-1 rounded-md border border-[#E2C7BE] cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-copper" />
                <span>Load Benchmark Example</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-64 bg-parchment border border-graphite rounded-xl shadow-lg p-1 hidden group-hover:block group-focus-within:block z-20">
                {DRIFT_BENCHMARK_EXAMPLES.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleApplyBenchmark(ex)}
                    className="w-full text-left p-2 hover:bg-white rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-charcoal">{ex.name}</div>
                    <div className="text-[10px] text-charcoal-muted truncate font-mono">
                      {ex.supplier} • {ex.poNumber}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
                Supplier / Vendor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Foxconn Technology Group"
                className="w-full text-xs px-3 py-2 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
                Material / Part / Component
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Automotive-Grade 32-bit Microcontrollers"
                className="w-full text-xs px-3 py-2 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-subtle mb-1 font-mono">
                  PO #
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="PO-78492-AUT"
                  className="w-full text-xs px-2.5 py-2 bg-parchment border border-graphite rounded-xl font-mono text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-subtle mb-1 font-mono">
                  Original Delivery
                </label>
                <input
                  type="date"
                  value={originalDeliveryDate}
                  onChange={(e) => setOriginalDeliveryDate(e.target.value)}
                  className="w-full text-xs px-2 py-2 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-subtle mb-1 font-mono">
                  Req In-Plant Date
                </label>
                <input
                  type="date"
                  value={requiredInPlantDate}
                  onChange={(e) => setRequiredInPlantDate(e.target.value)}
                  className="w-full text-xs px-2 py-2 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
                Risk Category
              </label>
              <select
                value={riskCategory}
                onChange={(e) => setRiskCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper"
              >
                <option value="Supplier & Semiconductor Delays (Manufacturing)">
                  Supplier & Semiconductor Delays (Manufacturing)
                </option>
                <option value="Logistics / Transportation">
                  Logistics / Transportation
                </option>
                <option value="Port Congestion / Intermodal">
                  Port Congestion / Intermodal
                </option>
                <option value="Raw Material Shortage">
                  Raw Material Shortage
                </option>
                <option value="Quality & Compliance Inspection">
                  Quality & Compliance Inspection
                </option>
              </select>
            </div>

            {/* Predefined Issue Chips */}
            <div>
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Quick Template Issues:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Partial batch ready, balance delayed 18 days",
                  "Customs paperwork hold at port terminal",
                  "Port congestion +7 days",
                  "Raw material yield deficit",
                  "Vessel reroute Cape of Good Hope +14 days",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAppendIssue(chip)}
                    className="text-[11px] bg-stone-mist/50 hover:bg-stone-mist text-charcoal px-2.5 py-1 rounded-lg border border-graphite transition-colors text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Latest Supplier Communication */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
                Latest Supplier Communication / Update
              </label>
              <textarea
                rows={3}
                value={latestCommunication}
                onChange={(e) => setLatestCommunication(e.target.value)}
                placeholder="Paste latest supplier email, portal update, dispatch advisory, or delay notice..."
                className="w-full text-xs p-3 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper font-mono text-[11px] leading-relaxed"
              />
            </div>

            {/* Optional Operational Details Accordion */}
            <div className="border border-graphite rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOptionalOpen(!optionalOpen)}
                className="w-full px-3.5 py-2.5 bg-stone-mist/30 hover:bg-stone-mist/50 flex items-center justify-between text-xs font-semibold text-charcoal transition-colors cursor-pointer"
              >
                <span>Optional Operational Details (Quantity, SMT Lines, Notes)</span>
                {optionalOpen ? (
                  <ChevronUp className="w-4 h-4 text-charcoal-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-charcoal-muted" />
                )}
              </button>

              {optionalOpen && (
                <div className="p-3.5 space-y-3 bg-parchment border-t border-graphite text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal-subtle mb-1">
                        Order Quantity
                      </label>
                      <input
                        type="text"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="50,000"
                        className="w-full text-xs px-2.5 py-1.5 border border-graphite rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal-subtle mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="Units / Pieces / FEUs"
                        className="w-full text-xs px-2.5 py-1.5 border border-graphite rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-charcoal-subtle mb-1">
                      Critical Factory Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Direct SMT line delivery for Plant 4"
                      className="w-full text-xs px-2.5 py-1.5 border border-graphite rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Controlled Error Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-[#F8EBEA] border border-[#EFCBC9] rounded-xl space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#8C3A35] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#8C3A35]">Analysis Unavailable</p>
                    <p className="text-xs text-[#8C3A35] mt-0.5 leading-relaxed font-mono">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-[#8C3A35] hover:opacity-70 p-0.5 rounded-sm cursor-pointer"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1.5 border-t border-[#EFCBC9]">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 bg-[#A94B45] hover:bg-[#8C3A35] disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                    <span>Retry Analysis</span>
                  </button>
                  <span className="text-[11px] text-[#8C3A35] font-mono">Manual retry only</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-xs font-semibold text-charcoal hover:bg-stone-mist rounded-xl transition-colors cursor-pointer border border-graphite"
              >
                Clear Fields
              </button>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 py-2.5 px-4 bg-copper hover:bg-[#A25E43] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#CD8569]/30"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Drift...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Analyze Commitment with Previa AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Deterministic Audit Grounding Footer */}
          <div className="p-3.5 bg-parchment border border-graphite rounded-xl text-[11px] text-charcoal-muted space-y-1 font-mono">
            <div className="font-bold text-charcoal flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F6F6D]" />
              <span>Deterministic Audit Grounding</span>
            </div>
            <p className="leading-relaxed">
              Previa AI strictly enforces factual evidence boundaries. It compares original contractual commitments against revised communications, quantifies timeline drift, and isolates verified facts from operator assumptions.
            </p>
          </div>
        </div>

        {/* Right Column: Analysis Result (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-5">
          {!currentRun ? (
            <div className="bg-white border border-graphite rounded-2xl p-12 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-mist/60 text-charcoal-muted flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-editorial font-bold text-charcoal">
                Awaiting Delivery Commitment Input
              </h4>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto font-mono">
                Select a benchmark example on the left or input custom PO details and click "Analyze Commitment with Previa AI".
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Audit Status Banner */}
              <div className="bg-white border border-graphite rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#617A61]" />
                    <span className="text-xs font-mono font-bold text-charcoal uppercase tracking-wider">
                      Audit Complete: {currentRun.poNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSheetsModal(currentRun)}
                    className="text-xs font-semibold text-charcoal hover:text-white bg-stone-mist/50 hover:bg-[#211A27] px-3 py-1.5 rounded-lg border border-graphite transition-colors flex items-center gap-1.5 w-fit cursor-pointer font-mono"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2F6F6D]" />
                    <span>Export Audit to Google Sheets</span>
                  </button>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#2F6F6D] bg-[#E8F2F1] px-2 py-0.5 rounded-md border border-[#CDE2E1]">
                    Previa AI Verified
                  </span>
                  <span className="text-[10px] text-charcoal-muted font-mono">
                    {new Date(currentRun.timestamp).toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      currentRun.priority === "LOW"
                        ? "bg-stone-mist/50 text-charcoal border-graphite"
                        : "bg-[#F9EFE5] text-[#975F24] border-[#EEDBC7]"
                    }`}
                  >
                    {currentRun.priority} PRIORITY
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      currentRun.riskLevel === "LOW RISK"
                        ? "bg-[#EEF3EE] text-[#4A5F4A] border-[#D3E0D3]"
                        : "bg-[#F8EBEA] text-[#8C3A35] border-[#EFCBC9]"
                    }`}
                  >
                    {currentRun.riskLevel}
                  </span>
                </div>

                {/* Commitment Status Card */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    currentRun.commitmentStatus === "Change Detected"
                      ? "bg-[#F8EBEA]/70 border-[#EFCBC9]"
                      : "bg-[#EEF3EE]/70 border-[#D3E0D3]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-charcoal-subtle">
                      Commitment Status
                    </span>
                    <h4
                      className={`text-base font-editorial font-bold ${
                        currentRun.commitmentStatus === "Change Detected"
                          ? "text-[#8C3A35]"
                          : "text-[#4A5F4A]"
                      }`}
                    >
                      {currentRun.commitmentStatus}
                    </h4>
                    <p className="text-xs text-charcoal-muted">
                      {currentRun.statusDetail ||
                        (currentRun.commitmentStatus === "Change Detected"
                          ? `Schedule drift detected against purchase order baseline.`
                          : `Contractual commitment verified with no negative timeline variance.`)}
                    </p>
                  </div>

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      currentRun.commitmentStatus === "Change Detected"
                        ? "bg-[#F8EBEA] text-[#8C3A35] border border-[#EFCBC9]"
                        : "bg-[#EEF3EE] text-[#4A5F4A] border border-[#D3E0D3]"
                    }`}
                  >
                    {currentRun.commitmentStatus === "Change Detected" ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* 3-Card Drift Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono">
                  <div className="bg-parchment p-3 rounded-xl border border-graphite space-y-1">
                    <span className="text-[10px] font-bold text-charcoal-subtle uppercase tracking-wider block">
                      Original Commitment
                    </span>
                    <div className="text-xs font-bold text-charcoal">
                      {currentRun.driftComparison.originalCommitment}
                    </div>
                    <div className="text-[10px] text-charcoal-muted">
                      Contractual baseline
                    </div>
                  </div>

                  <div className="bg-parchment p-3 rounded-xl border border-graphite space-y-1">
                    <span className="text-[10px] font-bold text-charcoal-subtle uppercase tracking-wider block">
                      Latest Supplier Commitment
                    </span>
                    <div className="text-xs font-bold text-charcoal">
                      {currentRun.driftComparison.latestSupplierCommitment}
                    </div>
                    <div className="text-[10px] text-charcoal-muted">
                      Statement date
                    </div>
                  </div>

                  <div className="bg-[#211A27] text-white p-3 rounded-xl border border-[#3A3043] space-y-1">
                    <span className="text-[10px] font-bold text-[#D8D0C3] uppercase tracking-wider block">
                      Calculated Drift
                    </span>
                    <div className="text-sm font-bold text-[#D9A441]">
                      {currentRun.driftComparison.driftDisplay}
                    </div>
                    <div className="text-[10px] text-[#A69EA8]">
                      Schedule slip against baseline
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column Grid: Risk Identified & Potential Impact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-graphite rounded-xl p-4 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                    Risk Identified
                  </span>
                  <p className="text-xs text-charcoal leading-relaxed font-medium">
                    {currentRun.riskIdentified}
                  </p>
                </div>

                <div className="bg-white border border-graphite rounded-xl p-4 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                    Potential Impact
                  </span>
                  <p className="text-xs text-charcoal leading-relaxed font-medium">
                    {currentRun.potentialImpact}
                  </p>
                </div>
              </div>

              {/* Likely Causes */}
              <div className="bg-white border border-graphite rounded-xl p-4 shadow-xs space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                  Likely Causes (Extracted from Supplier Update)
                </span>
                <p className="text-xs text-charcoal leading-relaxed font-medium">
                  {currentRun.likelyCauses}
                </p>
              </div>

              {/* Recommended Operational Next Actions & Sub-Phases */}
              <div className="bg-white border border-graphite rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-graphite pb-3">
                  <div>
                    <h4 className="text-xs font-editorial font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-[#B86F52]" />
                      <span>Recommended Operational Next Actions & Sub-Phases</span>
                    </h4>
                    <span className="text-[11px] text-charcoal-muted font-mono">
                      {currentRun.recommendedActions.length} operational protocol steps
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddActionInput(!showAddActionInput)}
                      className="text-[11px] font-semibold text-charcoal hover:bg-stone-mist px-2.5 py-1 rounded-lg border border-graphite transition-colors flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <Plus className="w-3 h-3 text-[#B86F52]" />
                      <span>Custom Action</span>
                    </button>
                  </div>
                </div>

                {/* Inline add custom action input */}
                {showAddActionInput && (
                  <div className="p-3 bg-parchment rounded-xl border border-graphite space-y-2 text-xs">
                    <input
                      type="text"
                      placeholder="e.g. Schedule emergency air charter quote"
                      value={newActionTitle}
                      onChange={(e) => setNewActionTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-graphite rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-copper"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddActionInput(false)}
                        className="px-2.5 py-1 text-charcoal-muted hover:bg-stone-mist rounded-md cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomAction}
                        className="px-3 py-1 bg-copper text-white font-semibold rounded-md hover:bg-[#A25E43] cursor-pointer border border-[#CD8569]/30"
                      >
                        Add Action
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions list */}
                <div className="space-y-3.5">
                  {currentRun.recommendedActions.map((action, actionIdx) => (
                    <div
                      key={action.id}
                      className="border border-graphite rounded-xl p-4 bg-stone-mist/20 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-xs font-bold text-charcoal bg-stone-mist/60 border border-graphite px-1.5 py-0.5 rounded-sm shrink-0">
                            0{actionIdx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-charcoal leading-snug">
                            {action.title}
                          </h5>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAction(action.id)}
                          className="text-charcoal-muted hover:text-[#A94B45] transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Sub-phases checklist */}
                      <div className="space-y-1.5 pl-5 border-l-2 border-graphite">
                        {action.subPhases.map((sp) => (
                          <div
                            key={sp.id}
                            onClick={() => toggleSubPhase(action.id, sp.id)}
                            className="flex items-center gap-2 text-xs cursor-pointer group py-0.5"
                          >
                            <button
                              type="button"
                              className="text-charcoal-muted group-hover:text-charcoal cursor-pointer"
                            >
                              {sp.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#617A61]" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-graphite" />
                              )}
                            </button>
                            <span
                              className={`text-[11px] leading-relaxed ${
                                sp.completed
                                  ? "line-through text-charcoal-subtle"
                                  : "text-charcoal group-hover:text-[#B86F52]"
                              }`}
                            >
                              {sp.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Autonomous 12-Agent Intelligence Fleet Synthesis */}
              <AgentIntelligenceSection
                agentResults={orchestrationData?.agentExecutions || (currentRun as any)?.orchestration?.agentExecutions}
                isOrchestrating={isAnalyzing}
                runId={currentRun.id}
              />

              {/* 2-Column Grid: Evidence (Provided Facts) vs Assumptions & Information Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-graphite rounded-xl p-4 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                    Evidence (Provided Facts)
                  </span>
                  <ul className="space-y-1 text-[11px] text-charcoal font-mono">
                    {currentRun.evidenceFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#2F6F6D] font-bold">✓</span>
                        <span className="leading-relaxed">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-graphite rounded-xl p-4 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                    Assumptions & Information Gaps
                  </span>
                  <ul className="space-y-1 text-[11px] text-charcoal-muted font-mono">
                    {currentRun.assumptionsAndGaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#B77935] font-bold">•</span>
                        <span className="leading-relaxed">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
