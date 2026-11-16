import React, { useState } from "react";
import {
  X,
  History,
  Trash2,
  Search,
  ChevronRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { DisruptionRun, DeliveryDriftRun } from "../../types";

interface PreviousRunsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disruptionRuns: DisruptionRun[];
  driftRuns: DeliveryDriftRun[];
  onSelectDisruptionRun: (run: DisruptionRun) => void;
  onSelectDriftRun: (run: DeliveryDriftRun) => void;
  onDeleteDisruptionRun: (id: string) => void;
  onDeleteDriftRun: (id: string) => void;
  onClearAllRuns: (type: "disruption" | "drift") => void;
}

export const PreviousRunsModal: React.FC<PreviousRunsModalProps> = ({
  isOpen,
  onClose,
  disruptionRuns,
  driftRuns,
  onSelectDisruptionRun,
  onSelectDriftRun,
  onDeleteDisruptionRun,
  onDeleteDriftRun,
  onClearAllRuns,
}) => {
  const [activeTab, setActiveTab] = useState<"drift" | "disruption">("drift");
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredDisruptions = disruptionRuns.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      r.title.toLowerCase().includes(term) ||
      r.industry.toLowerCase().includes(term) ||
      r.narrative.toLowerCase().includes(term)
    );
  });

  const filteredDrifts = driftRuns.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      r.supplier.toLowerCase().includes(term) ||
      r.material.toLowerCase().includes(term) ||
      r.riskIdentified.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211A27]/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-parchment rounded-2xl border border-graphite shadow-2xl w-full max-w-4xl overflow-hidden text-charcoal max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3043] bg-[#211A27] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-copper text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-editorial font-bold text-white">
                Previous Runs & Assessments
              </h3>
              <p className="text-xs text-[#D8D0C3] font-mono">
                Audit, revisit, and inspect historical disruption simulations and delivery drift analyses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#D8D0C3] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Search Controls */}
        <div className="p-6 pb-3 border-b border-graphite bg-parchment space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-stone-mist/60 p-1 rounded-xl w-fit border border-graphite">
              <button
                onClick={() => setActiveTab("drift")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "drift"
                    ? "bg-[#211A27] text-white shadow-xs"
                    : "text-charcoal hover:text-[#B86F52]"
                }`}
              >
                Delivery Drift Runs ({driftRuns.length})
              </button>

              <button
                onClick={() => setActiveTab("disruption")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "disruption"
                    ? "bg-[#211A27] text-white shadow-xs"
                    : "text-charcoal hover:text-[#B86F52]"
                }`}
              >
                Disruption Simulations ({disruptionRuns.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search previous runs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-graphite rounded-xl focus:outline-hidden focus:ring-1 focus:ring-copper w-48 sm:w-64 text-charcoal font-mono"
                />
              </div>

              <button
                onClick={() => onClearAllRuns(activeTab)}
                className="text-xs text-[#A94B45] hover:text-[#8C3A35] font-semibold hover:underline shrink-0 cursor-pointer font-mono"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-parchment-light">
          {activeTab === "disruption" ? (
            filteredDisruptions.length === 0 ? (
              <div className="text-center py-12 text-charcoal-muted text-xs font-mono">
                No disruption runs found matching your search.
              </div>
            ) : (
              filteredDisruptions.map((run) => (
                <div
                  key={run.id}
                  className="border border-graphite rounded-2xl p-5 bg-white hover:border-copper transition-all space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-charcoal bg-stone-mist/60 px-2 py-0.5 rounded-md border border-graphite">
                        {run.id}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#8C3A35] bg-[#F8EBEA] border border-[#EFCBC9] px-2 py-0.5 rounded-md">
                        {run.severity}
                      </span>
                      <span className="text-[11px] font-semibold text-charcoal bg-stone-mist/40 px-2 py-0.5 rounded-md border border-graphite">
                        {run.industry}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-charcoal-muted font-mono">
                        {new Date(run.timestamp).toLocaleString()}
                      </span>
                      <button
                        onClick={() => onDeleteDisruptionRun(run.id)}
                        className="text-charcoal-muted hover:text-[#A94B45] p-1 transition-colors cursor-pointer"
                        title="Delete run"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-editorial font-bold text-charcoal">
                      {run.title}
                    </h4>
                    <p className="text-xs text-charcoal-muted mt-1 line-clamp-2 leading-relaxed">
                      {run.summary || run.narrative}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
                    <div className="bg-parchment p-2.5 rounded-xl border border-graphite">
                      <span className="font-bold text-charcoal-subtle uppercase tracking-wider block text-[10px]">
                        Exposure
                      </span>
                      <span className="text-charcoal line-clamp-1 font-bold">
                        {run.keyMetrics?.financialExposure?.value || "Insufficient data"}
                      </span>
                    </div>

                    <div className="bg-parchment p-2.5 rounded-xl border border-graphite">
                      <span className="font-bold text-charcoal-subtle uppercase tracking-wider block text-[10px]">
                        Lead Time
                      </span>
                      <span className="text-charcoal line-clamp-1 font-bold">
                        {run.keyMetrics?.leadTimeDrift?.value || "Schedule under review"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={() => {
                        onSelectDisruptionRun(run);
                        onClose();
                      }}
                      className="text-xs font-bold text-copper hover:text-[#874932] flex items-center gap-1 group cursor-pointer"
                    >
                      <span>Reopen Playbook</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : filteredDrifts.length === 0 ? (
            <div className="text-center py-12 text-charcoal-muted text-xs font-mono">
              No delivery drift runs found matching your search.
            </div>
          ) : (
            filteredDrifts.map((run) => {
              const isChange = run.commitmentStatus === "Change Detected";
              return (
                <div
                  key={run.id}
                  className="border border-graphite rounded-2xl p-5 bg-white hover:border-copper transition-all space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-charcoal bg-stone-mist/60 px-2 py-0.5 rounded-md border border-graphite">
                        {run.poNumber}
                      </span>
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          run.riskLevel === "LOW RISK"
                            ? "bg-[#EEF3EE] text-[#4A5F4A] border-[#D3E0D3]"
                            : "bg-[#F9EFE5] text-[#975F24] border-[#EEDBC7]"
                        }`}
                      >
                        {run.riskLevel}
                      </span>
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          isChange
                            ? "bg-[#F8EBEA] text-[#8C3A35] border-[#EFCBC9]"
                            : "bg-[#EEF3EE] text-[#4A5F4A] border-[#D3E0D3]"
                        }`}
                      >
                        {run.commitmentStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-charcoal-muted font-mono">
                        {new Date(run.timestamp).toLocaleString()}
                      </span>
                      <button
                        onClick={() => onDeleteDriftRun(run.id)}
                        className="text-charcoal-muted hover:text-[#A94B45] p-1 transition-colors cursor-pointer"
                        title="Delete run"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-editorial font-bold text-charcoal">
                      {run.supplier} • {run.material}
                    </h4>
                    <p className="text-xs text-charcoal-muted mt-1 line-clamp-2 leading-relaxed">
                      {run.riskIdentified}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
                    <div className="bg-parchment p-2.5 rounded-xl border border-graphite">
                      <span className="font-bold text-charcoal-subtle uppercase tracking-wider block text-[10px]">
                        Calculated Drift
                      </span>
                      <span className="text-charcoal font-bold">
                        {run.driftComparison?.driftDisplay || "0 days"}
                      </span>
                    </div>

                    <div className="bg-parchment p-2.5 rounded-xl border border-graphite">
                      <span className="font-bold text-charcoal-subtle uppercase tracking-wider block text-[10px]">
                        Required In-Plant Date
                      </span>
                      <span className="text-charcoal font-medium">
                        {run.requiredInPlantDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={() => {
                        onSelectDriftRun(run);
                        onClose();
                      }}
                      className="text-xs font-bold text-copper hover:text-[#874932] flex items-center gap-1 group cursor-pointer"
                    >
                      <span>Reopen Audit</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-graphite bg-parchment flex items-center justify-between text-xs text-charcoal-muted font-mono">
          <span>Persisted securely in client storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-charcoal hover:bg-stone-mist rounded-xl transition-colors cursor-pointer border border-graphite"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
