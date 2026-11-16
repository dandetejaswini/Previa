import React, { useState } from "react";
import {
  Sliders,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingDown,
  DollarSign,
  Clock,
} from "lucide-react";
import { ScenarioSimulationResult } from "../../types";
import { PreviaBrand } from "../brand/PreviaBrand";

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName?: string;
  baselineDelay?: number;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  supplierName = "Tier-1 Semiconductor Foundry",
  baselineDelay = 7,
}) => {
  const [delayDelta, setDelayDelta] = useState(0);
  const [allocationShift, setAllocationShift] = useState(25);
  const [bufferBurn, setBufferBurn] = useState(5);
  const [result, setResult] = useState<ScenarioSimulationResult | null>(null);

  if (!isOpen) return null;

  const handleSimulate = () => {
    const effectiveDelay = Math.max(0, baselineDelay + delayDelta);
    const mitigatedDelay = Math.max(0, Math.round(effectiveDelay * (1 - allocationShift / 100)));

    const res: ScenarioSimulationResult = {
      scenarioId: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      baseline: {
        financialExposure: `$${((baselineDelay * 180000)).toLocaleString()} idle overhead`,
        starvationHorizon: `${Math.max(0, 12 - baselineDelay)} days safety buffer`,
        leadTimeVariance: `+${baselineDelay} days`,
      },
      simulated: {
        financialExposure: `$${((mitigatedDelay * 180000 + allocationShift * 5000)).toLocaleString()} with split surcharge`,
        starvationHorizon: `${Math.max(0, 12 - mitigatedDelay)} operating days preserved`,
        leadTimeVariance: `+${mitigatedDelay} days (mitigated)`,
        mitigationScore: Math.min(100, Math.max(30, Math.round(92 - mitigatedDelay * 2.5 + allocationShift * 0.2))),
      },
      tradeoffs: [
        `Shifting ${allocationShift}% capacity to secondary suppliers reduces critical assembly delay by ${Math.round(effectiveDelay - mitigatedDelay)} days.`,
        `Safety buffer retention improves to ${Math.max(0, 12 - mitigatedDelay)} days, avoiding complete plant line starvation.`,
        `Dual-source contracting introduces an estimated ${(allocationShift * 0.4).toFixed(1)}% spot logistics surcharge.`,
      ],
      optimalAction: allocationShift > 20
        ? `Approve ${allocationShift}% emergency allocation shift to secondary qualified supplier.`
        : `Maintain current carrier expedited protocol with 48-hour checkpoint review.`,
      humanApprovalRequired: true,
    };

    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
      <div className="bg-white border border-graphite rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graphite pb-3">
          <PreviaBrand
            variant="light"
            size="sm"
            subtitleText={`Scenario Simulation • ${supplierName}`}
          />

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders Area */}
        <div className="space-y-4 p-4 bg-stone-mist/20 border border-graphite rounded-xl text-xs font-mono">
          {/* Slider 1: Delay Delta */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-charcoal font-semibold">Simulated Delay Variance (Days):</span>
              <span className="font-bold text-[#B86F52]">
                {delayDelta > 0 ? `+${delayDelta}d` : `${delayDelta}d`} (Total: {baselineDelay + delayDelta}d)
              </span>
            </div>
            <input
              type="range"
              min={-baselineDelay}
              max={28}
              value={delayDelta}
              onChange={(e) => setDelayDelta(parseInt(e.target.value, 10))}
              className="w-full accent-[#B86F52] cursor-pointer"
            />
          </div>

          {/* Slider 2: Secondary Allocation Shift */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-charcoal font-semibold">Secondary Supplier Allocation Shift:</span>
              <span className="font-bold text-[#2F6F6D]">{allocationShift}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={allocationShift}
              onChange={(e) => setAllocationShift(parseInt(e.target.value, 10))}
              className="w-full accent-[#2F6F6D] cursor-pointer"
            />
          </div>

          {/* Slider 3: Buffer Burn */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-charcoal font-semibold">Factory Buffer Burn Rate (Days):</span>
              <span className="font-bold text-charcoal">{bufferBurn} operating days</span>
            </div>
            <input
              type="range"
              min={1}
              max={14}
              value={bufferBurn}
              onChange={(e) => setBufferBurn(parseInt(e.target.value, 10))}
              className="w-full accent-charcoal cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSimulate}
              className="px-4 py-2 bg-[#211A27] hover:bg-[#3A3043] text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Monte Carlo Analysis</span>
            </button>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-4 pt-2 border-t border-graphite">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Simulated Outcome Comparison
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                Resilience Score: {result.simulated.mitigationScore}/100
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-stone-mist/30 border border-graphite/60 rounded-xl space-y-1">
                <span className="text-[10px] text-charcoal-muted uppercase block">Baseline Drift</span>
                <span className="text-charcoal font-bold block">{result.baseline.leadTimeVariance}</span>
                <span className="text-[10px] text-charcoal-muted block">{result.baseline.starvationHorizon}</span>
              </div>
              <div className="p-3 bg-[#FAF7F2] border border-[#B86F52]/60 rounded-xl space-y-1">
                <span className="text-[10px] text-[#B86F52] uppercase block font-bold">Simulated Mitigated</span>
                <span className="text-[#B86F52] font-bold block">{result.simulated.leadTimeVariance}</span>
                <span className="text-[10px] text-charcoal-muted block">{result.simulated.starvationHorizon}</span>
              </div>
            </div>

            {/* Tradeoff List */}
            <div className="space-y-1.5 text-xs font-mono">
              <span className="text-[10px] font-bold uppercase text-charcoal-muted block tracking-wider">
                Tradeoff Analysis
              </span>
              <ul className="space-y-1">
                {result.tradeoffs.map((t, idx) => (
                  <li key={idx} className="p-2 bg-stone-mist/20 border border-graphite/40 rounded-lg text-charcoal">
                    • {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Optimal Action Recommendation */}
            <div className="p-3 bg-[#E8F2F1] border border-[#CDE2E1] rounded-xl text-xs font-mono space-y-1 text-[#2F6F6D]">
              <span className="text-[10px] font-bold uppercase block">
                Recommended Operator Mitigation (Human Approval Required)
              </span>
              <p className="font-bold text-charcoal">{result.optimalAction}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
