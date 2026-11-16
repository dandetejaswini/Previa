import React, { useState } from "react";
import {
  Cpu,
  Ship,
  Gem,
  TrainTrack,
  Pill,
  Layers,
  Zap,
  ShieldAlert,
  AlertTriangle,
  Clock,
  DollarSign,
  FileCheck,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Award,
  Sparkles,
  Square,
  Upload,
  X,
} from "lucide-react";
import {
  DisruptionRun,
  IndustrySectorId,
  TelemetryTag,
  PlaybookTask,
} from "../../types";
import {
  INDUSTRY_SECTORS,
  CALIBRATED_PRESETS,
  DisruptionPreset,
  CommonScenarioOption,
} from "../../data/presets";
import { AgentIntelligenceSection } from "./AgentIntelligenceSection";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../lib/apiClient";

interface DisruptionEngineProps {
  activeRun: DisruptionRun | null;
  onSaveRun: (run: DisruptionRun) => void;
  onOpenAuditCert: (run: DisruptionRun) => void;
  onNavigateToControlTower?: () => void;
}

export const DisruptionEngine: React.FC<DisruptionEngineProps> = ({
  activeRun,
  onSaveRun,
  onOpenAuditCert,
  onNavigateToControlTower,
}) => {
  const { currentUser } = useAuth();
  const [selectedSector, setSelectedSector] = useState<IndustrySectorId>(
    activeRun?.sectorId || "semiconductor"
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [selectedCommonScenarioId, setSelectedCommonScenarioId] = useState<string>("");
  const [title, setTitle] = useState(activeRun?.title || "");
  const [urgency, setUrgency] = useState(
    activeRun?.urgency || "Immediate (0–7 Days)"
  );
  const [severity, setSeverity] = useState(
    activeRun?.severity || "Critical (P1)"
  );
  const [narrative, setNarrative] = useState(activeRun?.narrative || "");

  const [sectorParams, setSectorParams] = useState<Record<string, string>>(
    activeRun?.sectorParameters || {}
  );

  const [telemetry, setTelemetry] = useState<TelemetryTag[]>(
    activeRun?.telemetry || []
  );
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const [validationAttempted, setValidationAttempted] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<DisruptionRun | null>(activeRun);
  const [orchestrationData, setOrchestrationData] = useState<any>(null);
  const [groundingOpen, setGroundingOpen] = useState(true);

  // Proof submission modal state
  const [proofModalTask, setProofModalTask] = useState<{
    phaseId: string;
    task: PlaybookTask;
  } | null>(null);
  const [proofText, setProofText] = useState("");

  // Sync when activeRun changes externally (e.g. from Previous Runs)
  React.useEffect(() => {
    if (activeRun) {
      setCurrentRun(activeRun);
      setSelectedSector(activeRun.sectorId);
      setTitle(activeRun.title);
      setUrgency(activeRun.urgency);
      setSeverity(activeRun.severity);
      setNarrative(activeRun.narrative);
      setSectorParams(activeRun.sectorParameters || {});
      setTelemetry(activeRun.telemetry || []);
      setSelectedCommonScenarioId("");
      setSelectedPresetId("");
      setValidationAttempted(false);
      setMissingFieldsList([]);
    }
  }, [activeRun]);

  const activeSectorConfig =
    INDUSTRY_SECTORS.find((s) => s.id === selectedSector) || INDUSTRY_SECTORS[0];

  // Required sector field keys specification
  const REQUIRED_SECTOR_KEYS: Record<IndustrySectorId, string[]> = {
    maritime: ["originPort", "destinationPort", "vesselRoute"],
    semiconductor: ["fabricator", "component"],
    minerals: ["mineRefinery", "material"],
    port_rail: ["portTerminal", "railCorridor"],
    pharma: ["facility", "product"],
    general: ["supplier", "component"],
  };

  const isSectorFieldRequired = (fieldKey: string): boolean => {
    const reqKeys = REQUIRED_SECTOR_KEYS[selectedSector] || [];
    return reqKeys.includes(fieldKey);
  };

  /**
   * CRITICAL FIX: INDUSTRY CHANGE MUST RESET PREVIOUS SCENARIO
   * When user changes the industry sector:
   * 1. Change selected industry.
   * 2. Clear previously selected common scenario.
   * 3. Clear scenario title.
   * 4. Clear operational narrative.
   * 5. Reset urgency to default.
   * 6. Reset impact severity to default.
   * 7. Reset industry-specific parameters.
   * 8. Remove scenario-specific values from previous industry.
   * 9. Show common scenarios for the NEW industry.
   * 10. Allow user to either select new predefined scenario or enter custom scenario.
   */
  const handleSectorChange = (sectorId: IndustrySectorId) => {
    if (sectorId === selectedSector) return;
    setSelectedSector(sectorId);
    setSelectedPresetId("");
    setSelectedCommonScenarioId("");
    setTitle("");
    setNarrative("");
    setUrgency("Immediate (0–7 Days)");
    setSeverity("Critical (P1)");
    setSectorParams({});
    setTelemetry([]);
    setErrorMessage(null);
    setValidationAttempted(false);
    setMissingFieldsList([]);
  };

  const applyCommonScenario = (scenario: CommonScenarioOption) => {
    setSelectedCommonScenarioId(scenario.id);
    setSelectedPresetId("");
    setTitle(scenario.title);
    setNarrative(scenario.narrative);
    setUrgency(scenario.urgency);
    setSeverity(scenario.severity);
    setSectorParams(scenario.sectorParameters ? { ...scenario.sectorParameters } : {});
    setMissingFieldsList([]);
    setErrorMessage(null);
  };

  const applyPreset = (preset: DisruptionPreset) => {
    setSelectedPresetId(preset.id);
    setSelectedSector(preset.sectorId);
    setSelectedCommonScenarioId("");
    setTitle(preset.title);
    setUrgency(preset.urgency);
    setSeverity(preset.severity);
    setNarrative(preset.narrative);
    setSectorParams({ ...preset.sectorParameters });
    setTelemetry(
      preset.telemetry.map((t, idx) => ({
        id: `preset-t-${idx}`,
        key: t.key,
        value: t.value,
      }))
    );
    setMissingFieldsList([]);
    setErrorMessage(null);
  };

  const handleAddTelemetry = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    setTelemetry([
      ...telemetry,
      {
        id: `telemetry-${Date.now()}`,
        key: newKey.trim(),
        value: newValue.trim(),
      },
    ]);
    setNewKey("");
    setNewValue("");
  };

  const handleRemoveTelemetry = (id: string) => {
    setTelemetry(telemetry.filter((t) => t.id !== id));
  };

  const validateForm = (): { isValid: boolean; missing: string[] } => {
    const missing: string[] = [];

    // Base required fields
    if (!title.trim()) missing.push("Scenario / Disruption Title");
    if (!urgency.trim()) missing.push("Urgency Horizon");
    if (!severity.trim()) missing.push("Impact Severity");
    if (!narrative.trim()) missing.push("Operational Disruption Narrative");

    // Sector-specific required fields
    const reqKeys = REQUIRED_SECTOR_KEYS[selectedSector] || [];
    reqKeys.forEach((key) => {
      const val = sectorParams[key];
      if (!val || !val.trim()) {
        const fieldConfig = activeSectorConfig.fields.find((f) => f.key === key);
        missing.push(fieldConfig?.label || key);
      }
    });

    return { isValid: missing.length === 0, missing };
  };

  const handleSynthesize = async () => {
    setValidationAttempted(true);
    const { isValid, missing } = validateForm();

    if (!isValid) {
      setMissingFieldsList(missing);
      setErrorMessage("Please complete the required fields before running the analysis.");
      return;
    }

    setMissingFieldsList([]);
    setIsSynthesizing(true);
    setErrorMessage(null);

    try {
      const res = await authFetch(
        "/api/synthesize-disruption",
        {
          method: "POST",
          body: JSON.stringify({
            sectorId: selectedSector,
            industry: activeSectorConfig.name,
            title: title.trim(),
            urgency,
            severity,
            narrative: narrative.trim(),
            sectorParameters: sectorParams,
            telemetry,
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
            : "Failed to synthesize disruption playbook with Gemini AI.");
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
      setIsSynthesizing(false);
    }
  };

  const toggleTaskStatus = (phaseId: string, taskId: string) => {
    if (!currentRun) return;
    const updatedPlaybook = currentRun.playbook.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const nextStatus =
            task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
          return {
            ...task,
            status: nextStatus as "PENDING" | "COMPLETED",
          };
        }),
      };
    });

    const updatedRun = {
      ...currentRun,
      playbook: updatedPlaybook,
    };
    setCurrentRun(updatedRun);
    onSaveRun(updatedRun);
  };

  const submitProof = () => {
    if (!proofModalTask || !currentRun) return;
    const { phaseId, task } = proofModalTask;

    const updatedPlaybook = currentRun.playbook.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((t) => {
          if (t.id !== task.id) return t;
          return {
            ...t,
            proofSubmitted: true,
            proofText: proofText.trim() || "Operational audit proof verified.",
            status: "COMPLETED" as const,
          };
        }),
      };
    });

    const updatedRun = {
      ...currentRun,
      playbook: updatedPlaybook,
    };
    setCurrentRun(updatedRun);
    onSaveRun(updatedRun);
    setProofModalTask(null);
    setProofText("");
  };

  // Calculate task completion rate
  const allTasks = currentRun?.playbook.flatMap((p) => p.tasks) || [];
  const completedTasks = allTasks.filter((t) => t.status === "COMPLETED");
  const completionPercentage = allTasks.length
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0;

  const renderSectorIcon = (id: IndustrySectorId) => {
    switch (id) {
      case "semiconductor":
        return <Cpu className="w-5 h-5" />;
      case "maritime":
        return <Ship className="w-5 h-5" />;
      case "minerals":
        return <Gem className="w-5 h-5" />;
      case "port_rail":
        return <TrainTrack className="w-5 h-5" />;
      case "pharma":
        return <Pill className="w-5 h-5" />;
      case "general":
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Simulator Configuration Form */}
      <div className="bg-white border border-graphite rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Subheader */}
        <div className="border-b border-graphite pb-5 space-y-4">
          <div>
            <h2 className="text-base font-editorial font-bold text-charcoal flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-copper" />
              <span>Previa AI Disruption Simulator</span>
            </h2>
            <p className="text-xs text-charcoal-muted mt-0.5 font-mono">
              Ingest qualitative signals, quantify exposure, and synthesize actionable 3-phase containment playbooks
            </p>
          </div>

          {/* Calibrated Presets Selector */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label
              htmlFor="calibrated-preset-select"
              className="text-xs font-semibold text-charcoal-subtle whitespace-nowrap shrink-0"
            >
              Calibrated Presets:
            </label>
            <div className="relative flex-1 min-w-0 w-full">
              <select
                id="calibrated-preset-select"
                value={selectedPresetId}
                onChange={(e) => {
                  const preset = CALIBRATED_PRESETS.find(
                    (p) => p.id === e.target.value
                  );
                  if (preset) applyPreset(preset);
                }}
                className="w-full text-xs bg-parchment border border-graphite rounded-xl pl-3.5 pr-9 py-2 font-mono font-medium text-charcoal focus:outline-hidden focus:ring-1 focus:ring-copper focus:bg-white transition-colors cursor-pointer appearance-none"
              >
                <option value="">Select a calibrated scenario preset...</option>
                {CALIBRATED_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-charcoal-muted">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 1. Select Industry Disruption Sector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal-subtle">
              1. Select Industry Disruption Sector <span className="text-[#B86F52]">*</span>
            </label>
            <span className="text-[11px] font-mono text-charcoal-muted flex items-center gap-1">
              <span className="text-[#B86F52] font-bold">*</span>
              <span>Required for AI analysis</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {INDUSTRY_SECTORS.map((sector) => {
              const isSelected = selectedSector === sector.id;
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => handleSectorChange(sector.id)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#211A27] bg-[#211A27] text-white shadow-xs"
                      : "border-graphite bg-stone-mist/30 hover:bg-stone-mist/60 text-charcoal"
                  }`}
                >
                  <div
                    className={`mb-2.5 p-1.5 rounded-lg w-fit ${
                      isSelected ? "bg-white/15 text-[#B86F52]" : "text-[#2F6F6D]"
                    }`}
                  >
                    {renderSectorIcon(sector.id)}
                  </div>
                  <span className="text-xs font-bold leading-snug">
                    {sector.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Common Scenarios for the Selected Industry */}
          {activeSectorConfig.commonScenarios && activeSectorConfig.commonScenarios.length > 0 && (
            <div className="p-4 bg-stone-mist/30 border border-graphite/70 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-mono font-bold uppercase text-charcoal flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B96F4A]" />
                  <span>Common {activeSectorConfig.name} Scenarios</span>
                </span>
                <span className="text-[11px] text-charcoal-muted font-mono">
                  Select a scenario to populate fields, or enter custom details below
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSectorConfig.commonScenarios.map((sc) => {
                  const isSelected = selectedCommonScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => applyCommonScenario(sc)}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-mono transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#211A27] text-white border-[#211A27] ring-1 ring-[#B86F52]"
                          : "bg-white hover:bg-stone-mist/70 border-graphite text-charcoal hover:border-[#B96F4A]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-[#B86F52]" : "bg-[#246B68]"
                        }`}
                      />
                      <span>{sc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Basic Scenario Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
              Scenario / Disruption Title <span className="text-[#B86F52]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationAttempted && e.target.value.trim()) {
                  setMissingFieldsList(missingFieldsList.filter((m) => m !== "Scenario / Disruption Title"));
                }
              }}
              placeholder="e.g. Taiwan Fab 14A Seismic Shutdown"
              className={`w-full text-xs px-3.5 py-2.5 bg-parchment border rounded-xl text-charcoal focus:bg-white focus:outline-hidden transition-colors ${
                validationAttempted && !title.trim()
                  ? "border-[#A94B45] focus:ring-1 focus:ring-[#A94B45] bg-[#F8EBEA]/30"
                  : "border-graphite focus:ring-1 focus:ring-copper"
              }`}
            />
            {validationAttempted && !title.trim() && (
              <p className="text-[10px] text-[#A94B45] font-mono mt-1">
                Scenario / Disruption Title is required.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
              Urgency Horizon <span className="text-[#B86F52]">*</span>
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper"
            >
              <option value="Immediate (0–7 Days)">Immediate (0–7 Days)</option>
              <option value="Near Term (1–4 Weeks)">Near Term (1–4 Weeks)</option>
              <option value="Medium Term (1–3 Months)">Medium Term (1–3 Months)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
              Impact Severity <span className="text-[#B86F52]">*</span>
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper"
            >
              <option value="Critical (P1)">Critical (P1)</option>
              <option value="High (P2)">High (P2)</option>
              <option value="Medium (P3)">Medium (P3)</option>
              <option value="Low (P4)">Low (P4)</option>
            </select>
          </div>
        </div>

        {/* Operational Narrative */}
        <div>
          <label className="block text-xs font-semibold text-charcoal-subtle mb-1">
            Operational Disruption Narrative &amp; Telemetry Signal <span className="text-[#B86F52]">*</span>
          </label>
          <textarea
            rows={3}
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              if (validationAttempted && e.target.value.trim()) {
                setMissingFieldsList(missingFieldsList.filter((m) => m !== "Operational Disruption Narrative"));
              }
            }}
            placeholder="Paste supplier notice, email, telex, port advisory, or incident log..."
            className={`w-full text-xs p-3.5 bg-parchment border rounded-xl text-charcoal focus:bg-white focus:outline-hidden leading-relaxed font-mono transition-colors ${
              validationAttempted && !narrative.trim()
                ? "border-[#A94B45] focus:ring-1 focus:ring-[#A94B45] bg-[#F8EBEA]/30"
                : "border-graphite focus:ring-1 focus:ring-copper"
            }`}
          />
          {validationAttempted && !narrative.trim() && (
            <p className="text-[10px] text-[#A94B45] font-mono mt-1">
              Operational disruption narrative is required.
            </p>
          )}
        </div>

        {/* 2. Specialized Sector Parameters */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#B86F52]" />
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal-subtle">
                2. Specialized Sector Parameters: {activeSectorConfig.name}
              </label>
            </div>
          </div>

          {/* Explicit Analysis Input Clarity Notice */}
          <div className="p-3 bg-stone-mist/40 border border-graphite/80 rounded-xl flex items-start gap-2.5 text-xs text-charcoal">
            <Info className="w-4 h-4 text-[#B86F52] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold font-mono text-[10px] uppercase text-[#B86F52] tracking-wider block">
                Analysis Input — Not Live Telemetry
              </span>
              <p className="text-[11px] text-charcoal-muted leading-relaxed">
                These values provide domain context for AI disruption analysis, route reasoning, and scenario modeling. They do not generate live vessel telemetry or artificial GPS positions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-mist/30 p-4 rounded-xl border border-graphite">
            {activeSectorConfig.fields.map((field) => {
              const isRequired = isSectorFieldRequired(field.key);
              const isInvalid = validationAttempted && isRequired && (!sectorParams[field.key] || !sectorParams[field.key].trim());

              return (
                <div
                  key={field.key}
                  className={field.fullWidth ? "sm:col-span-2" : ""}
                >
                  <label className="block text-[11px] font-semibold text-charcoal-muted mb-1">
                    {field.label} {isRequired ? <span className="text-[#B86F52] font-bold">*</span> : <span className="text-[10px] font-normal text-charcoal-muted/70">(optional)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={sectorParams[field.key] || ""}
                    onChange={(e) => {
                      const updated = {
                        ...sectorParams,
                        [field.key]: e.target.value,
                      };
                      setSectorParams(updated);
                      if (validationAttempted && e.target.value.trim()) {
                        setMissingFieldsList(missingFieldsList.filter((m) => m !== field.label && m !== field.key));
                      }
                    }}
                    className={`w-full text-xs px-3 py-2 bg-white border rounded-lg text-charcoal focus:outline-hidden font-mono transition-colors ${
                      isInvalid
                        ? "border-[#A94B45] focus:ring-1 focus:ring-[#A94B45] bg-[#F8EBEA]/30"
                        : "border-graphite focus:ring-1 focus:ring-copper"
                    }`}
                  />
                  {isInvalid && (
                    <p className="text-[10px] text-[#A94B45] font-mono mt-1">
                      {field.label.split(" (")[0]} is required.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Dynamic Operational Telemetry */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-charcoal-subtle">
              3. Dynamic Operational Telemetry (Key-Value Ingestion)
            </label>
            <span className="text-[10px] font-mono text-charcoal-muted">(optional additional parameters)</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Parameter Key (e.g. Factory Buffer Stock)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="flex-1 text-xs px-3 py-2 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper font-mono"
            />
            <input
              type="text"
              placeholder="Telemetry Value (e.g. 11 Days On-Hand)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 text-xs px-3 py-2 bg-parchment border border-graphite rounded-xl text-charcoal focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-copper font-mono"
            />
            <button
              type="button"
              onClick={handleAddTelemetry}
              className="px-4 py-2 bg-[#211A27] hover:bg-[#3A3043] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#B86F52]" />
              <span>Add Tag</span>
            </button>
          </div>

          {/* Rendered Telemetry Chips */}
          {telemetry.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {telemetry.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 bg-stone-mist/60 border border-graphite text-charcoal text-xs px-3 py-1.5 rounded-lg font-mono"
                >
                  <span className="font-bold text-[#211A27]">{t.key}:</span>
                  <span>{t.value}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTelemetry(t.id)}
                    className="text-charcoal-muted hover:text-[#A94B45] transition-colors ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controlled Error Alert & Missing Required Fields Summary */}
        {errorMessage && (
          <div className="p-4 bg-[#F8EBEA] border border-[#EFCBC9] rounded-xl space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#8C3A35] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#8C3A35]">
                  {missingFieldsList.length > 0 ? "Required Information Missing" : "Synthesis Unavailable"}
                </p>
                <p className="text-xs text-[#8C3A35] mt-0.5 leading-relaxed font-mono">{errorMessage}</p>

                {missingFieldsList.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#EFCBC9] space-y-1">
                    <span className="text-[11px] font-bold text-[#8C3A35] font-mono block">
                      Missing required information:
                    </span>
                    <ul className="list-disc list-inside text-xs text-[#8C3A35] space-y-0.5 font-mono">
                      {missingFieldsList.map((f, idx) => (
                        <li key={idx}>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMissingFieldsList([]);
                }}
                className="text-[#8C3A35] hover:opacity-70 p-0.5 rounded-sm cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {missingFieldsList.length === 0 && (
              <div className="flex items-center gap-2 pt-1.5 border-t border-[#EFCBC9]">
                <button
                  type="button"
                  onClick={handleSynthesize}
                  disabled={isSynthesizing}
                  className="px-3 py-1.5 bg-[#A94B45] hover:bg-[#8C3A35] disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isSynthesizing ? "animate-spin" : ""}`} />
                  <span>Retry Synthesis</span>
                </button>
                <span className="text-[11px] text-[#8C3A35] font-mono">Manual retry only</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button & Disclaimer */}
        <div className="pt-4 border-t border-graphite flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-charcoal-muted font-mono">
            <Info className="w-4 h-4 text-[#B86F52] shrink-0" />
            <span>
              Previa AI enforces root-vector modeling, financial exposure quantification, and chronological containment playbooks.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing}
            className="w-full sm:w-auto px-6 py-3 bg-copper hover:bg-[#A25E43] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-[#CD8569]/30"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Playbook...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Synthesize Disruption Playbook</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Generated Assessment & Playbook Section */}
      {!currentRun ? (
        <div className="bg-white border border-graphite rounded-2xl p-10 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-stone-mist/50 border border-graphite flex items-center justify-center mx-auto text-charcoal-muted">
            <Zap className="w-6 h-6 text-[#B86F52]" />
          </div>
          <h3 className="text-base font-editorial font-bold text-charcoal">
            Awaiting Disruption Scenario Input
          </h3>
          <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
            Enter your operational disruption parameters above or select a calibrated preset, then click <span className="font-semibold text-charcoal">"Synthesize Disruption Playbook"</span> to run Previa AI impact modeling.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="bg-white border border-graphite rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-charcoal bg-stone-mist/60 border border-graphite px-2.5 py-1 rounded-md">
                  {currentRun.id}
                </span>
                <span className="text-xs font-bold text-charcoal bg-stone-mist/40 border border-graphite px-2.5 py-1 rounded-md">
                  {currentRun.industry}
                </span>
                <span className="text-xs font-mono font-bold text-[#8C3A35] bg-[#F8EBEA] border border-[#EFCBC9] px-2.5 py-1 rounded-md">
                  {currentRun.severity}
                </span>
                <span className="text-xs font-mono font-semibold text-[#975F24] bg-[#F9EFE5] border border-[#EEDBC7] px-2.5 py-1 rounded-md">
                  {currentRun.urgency}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-charcoal bg-stone-mist/50 hover:bg-stone-mist rounded-xl border border-graphite transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-charcoal-muted" />
                  <span>New Simulation</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuditCert(currentRun)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#2F6F6D] bg-[#E8F2F1] hover:bg-[#D5E8E7] border border-[#CDE2E1] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-[#2F6F6D]" />
                  <span>Issue Audit Certificate</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-editorial font-bold text-charcoal tracking-tight">
                Operational Containment & Risk Assessment: {currentRun.title}
              </h3>
              <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
                {currentRun.summary || currentRun.narrative}
              </p>
            </div>

            {/* 3 Key Risk Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Financial Risk Exposure */}
              <div className="bg-parchment border border-graphite rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-charcoal-subtle">
                  <DollarSign className="w-4 h-4 text-[#617A61]" />
                  <span>Financial Risk Exposure</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-charcoal leading-snug font-mono">
                  {currentRun.keyMetrics.financialExposure.value}
                </div>
                <div className="text-[11px] text-charcoal-muted font-mono">
                  {currentRun.keyMetrics.financialExposure.label}
                </div>
              </div>

              {/* Lead-Time Schedule Drift */}
              <div className="bg-parchment border border-graphite rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-charcoal-subtle">
                  <Clock className="w-4 h-4 text-[#B77935]" />
                  <span>Lead-Time Schedule Drift</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-charcoal leading-snug font-mono">
                  {currentRun.keyMetrics.leadTimeDrift.value}
                </div>
                <div className="text-[11px] text-charcoal-muted font-mono">
                  {currentRun.keyMetrics.leadTimeDrift.label}
                </div>
              </div>

              {/* Operational Starvation Horizon */}
              <div className="bg-parchment border border-graphite rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-charcoal-subtle">
                  <AlertTriangle className="w-4 h-4 text-[#A94B45]" />
                  <span>Operational Starvation Horizon</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-charcoal leading-snug font-mono">
                  {currentRun.keyMetrics.starvationHorizon.value}
                </div>
                <div className="text-[11px] text-charcoal-muted font-mono">
                  {currentRun.keyMetrics.starvationHorizon.label}
                </div>
              </div>
            </div>
          </div>

          {/* Systemic Root Vectors & Drivers */}
          <div className="bg-white border border-graphite rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-editorial font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#B86F52]" />
              <span>Systemic Root Vectors & Drivers</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentRun.rootVectors.map((vector, index) => (
                <div
                  key={index}
                  className="border border-graphite rounded-xl p-4 space-y-2 bg-parchment"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-charcoal-subtle uppercase">
                      {vector.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${
                        vector.severity === "CRITICAL"
                          ? "bg-[#F8EBEA] text-[#8C3A35] border border-[#EFCBC9]"
                          : vector.severity === "HIGH"
                          ? "bg-[#F9EFE5] text-[#975F24] border border-[#EEDBC7]"
                          : "bg-[#E8F2F1] text-[#2F6F6D] border border-[#CDE2E1]"
                      }`}
                    >
                      {vector.severity}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-charcoal">
                    {vector.title}
                  </h5>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    {vector.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Autonomous 12-Agent Intelligence Fleet Synthesis */}
          <AgentIntelligenceSection
            agentResults={orchestrationData?.agentExecutions || (currentRun as any)?.orchestration?.agentExecutions}
            isOrchestrating={isSynthesizing}
            runId={currentRun.id}
          />

          {/* Actionable 3-Phase Mitigation Playbook */}
          <div className="bg-white border border-graphite rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite pb-4">
              <div>
                <h4 className="text-sm font-editorial font-bold uppercase tracking-wider text-charcoal">
                  Actionable 3-Phase Mitigation Playbook
                </h4>
                <p className="text-xs text-charcoal-muted mt-0.5 font-mono">
                  Chronological task containment protocols with assigned operational leads and audit verification
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono font-semibold text-charcoal">
                  {completedTasks.length} / {allTasks.length} Tasks ({completionPercentage}%)
                </span>
                <div className="w-24 h-2 bg-stone-mist rounded-full overflow-hidden border border-graphite">
                  <div
                    className="h-full bg-[#617A61] transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* The 3 Phases */}
            <div className="space-y-6">
              {currentRun.playbook.map((phase) => (
                <div
                  key={phase.id}
                  className="border border-graphite rounded-xl p-5 bg-stone-mist/20 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-graphite pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#2F6F6D] uppercase bg-[#E8F2F1] px-2 py-0.5 rounded-sm border border-[#CDE2E1]">
                          {phase.badge}
                        </span>
                        <h5 className="text-sm font-bold text-charcoal">
                          {phase.title}
                        </h5>
                      </div>
                      <p className="text-xs text-charcoal-muted mt-1 font-mono">
                        {phase.subtitle}
                      </p>
                    </div>

                    <div className="text-[11px] font-mono font-medium text-charcoal bg-white px-2.5 py-1 rounded-lg border border-graphite w-fit">
                      Lead: <span className="font-bold text-charcoal">{phase.assignedLead}</span>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5">
                    {phase.tasks.map((task) => {
                      const isCompleted = task.status === "COMPLETED";
                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCompleted
                              ? "bg-[#EEF3EE]/60 border-[#D3E0D3] text-charcoal"
                              : "bg-white border-graphite text-charcoal"
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleTaskStatus(phase.id, task.id)}
                              className="mt-0.5 text-charcoal-muted hover:text-charcoal transition-colors shrink-0 cursor-pointer"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-[#617A61]" />
                              ) : (
                                <Square className="w-4 h-4 text-graphite" />
                              )}
                            </button>
                            <div className="space-y-1">
                              <p
                                className={`text-xs font-semibold leading-relaxed ${
                                  isCompleted ? "line-through text-charcoal-muted" : "text-charcoal"
                                }`}
                              >
                                {task.description}
                              </p>
                              {task.proofSubmitted && (
                                <div className="text-[10px] text-[#4A5F4A] font-mono font-medium flex items-center gap-1">
                                  <span>✓ Audit Proof Submitted:</span>
                                  <span className="italic">{task.proofText}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center font-mono">
                            <span className="text-[11px] text-charcoal-muted bg-stone-mist/50 px-2 py-0.5 rounded-sm border border-graphite">
                              {task.timeframe}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                                isCompleted
                                  ? "bg-[#EEF3EE] text-[#4A5F4A] border border-[#D3E0D3]"
                                  : "bg-stone-mist/40 text-charcoal border border-graphite"
                              }`}
                            >
                              {task.status}
                            </span>

                            {task.auditProofRequired && !task.proofSubmitted && (
                              <button
                                type="button"
                                onClick={() =>
                                  setProofModalTask({ phaseId: phase.id, task })
                                }
                                className="text-[10px] font-bold text-copper hover:text-[#874932] bg-[#F4EDE9] px-2 py-0.5 rounded-sm border border-[#E2C7BE] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Submit Proof</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Factual Audit & Grounding Defense Accordion */}
          <div className="bg-white border border-graphite rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setGroundingOpen(!groundingOpen)}
              className="w-full px-6 py-4 flex items-center justify-between bg-stone-mist/30 hover:bg-stone-mist/50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#617A61]" />
                <span className="text-xs font-editorial font-bold uppercase tracking-wider text-charcoal">
                  Factual Audit & Grounding Defense
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#EEF3EE] text-[#4A5F4A] px-2 py-0.5 rounded-full border border-[#D3E0D3]">
                  Confidence: {currentRun.auditGrounding.confidenceScore}% Validated
                </span>
              </div>
              {groundingOpen ? (
                <ChevronUp className="w-4 h-4 text-charcoal-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-charcoal-muted" />
              )}
            </button>

            {groundingOpen && (
              <div className="p-6 border-t border-graphite space-y-4 text-xs font-mono">
                <div>
                  <h6 className="font-bold text-charcoal mb-2 uppercase tracking-wider text-[11px]">
                    Explicit Grounded Telemetry
                  </h6>
                  <ul className="space-y-1 text-charcoal text-[11px]">
                    {currentRun.auditGrounding.explicitTelemetry.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#2F6F6D] font-bold">✓</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-graphite">
                  <h6 className="font-bold text-charcoal mb-2 uppercase tracking-wider text-[11px]">
                    Operator Assumptions & Verification Gaps
                  </h6>
                  <ul className="space-y-1 text-charcoal-muted">
                    {currentRun.auditGrounding.assumptionsAndGaps.map((g, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#B77935] font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof Submission Modal */}
      {proofModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211A27]/75 backdrop-blur-xs">
          <div className="bg-parchment rounded-2xl border border-graphite shadow-xl max-w-md w-full p-6 space-y-4">
            <h4 className="text-sm font-editorial font-bold text-charcoal">
              Submit Operational Audit Proof
            </h4>
            <p className="text-xs text-charcoal-muted font-mono">
              Provide verifiable proof or protocol reference for task:
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-graphite text-xs font-medium text-charcoal">
              {proofModalTask.task.description}
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-subtle mb-1 font-mono">
                Audit Proof / Evidence Description
              </label>
              <textarea
                rows={3}
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="e.g. War room charter logged in SAP ERP ref #WR-2026-991, verified by Director of Sourcing"
                className="w-full text-xs p-3 bg-white border border-graphite rounded-xl text-charcoal focus:outline-hidden focus:ring-1 focus:ring-copper font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProofModalTask(null)}
                className="px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-stone-mist rounded-xl border border-graphite cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitProof}
                className="px-4 py-1.5 text-xs font-bold text-white bg-copper hover:bg-[#A25E43] rounded-xl cursor-pointer border border-[#CD8569]/30"
              >
                Verify & Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
