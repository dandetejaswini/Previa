import React, { useState } from "react";
import {
  Layers,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  FileText,
  Clock,
  MapPin,
  Cpu,
  HelpCircle,
  Eye,
} from "lucide-react";
import {
  SupplyChainGraphNode,
  SupplyChainGraphEdge,
  SupplyChainNetworkState,
  SupplyChainNodeType,
  SupplyChainNodeState,
} from "../types";

interface SupplyChainNetworkViewProps {
  network?: SupplyChainNetworkState | null;
  onSelectNode: (node: SupplyChainGraphNode) => void;
  onAskPreviaForNode?: (node: SupplyChainGraphNode) => void;
}

const TYPE_ICONS: Record<SupplyChainNodeType, string> = {
  supplier: "🏭",
  material: "📦",
  po: "📋",
  shipment: "🚢",
  port: "⚓",
  rail_hub: "🚆",
  warehouse: "🏢",
  factory: "⚙️",
  customer: "🏬",
};

const STATE_COLORS: Record<
  SupplyChainNodeState,
  { bg: string; border: string; text: string; badge: string }
> = {
  NORMAL: {
    bg: "bg-white",
    border: "border-graphite/80",
    text: "text-charcoal",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  WATCH: {
    bg: "bg-amber-50/40",
    border: "border-amber-300",
    text: "text-amber-900",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
  },
  AT_RISK: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-950",
    badge: "bg-amber-200 text-amber-900 border-amber-400",
  },
  HIGH_RISK: {
    bg: "bg-rose-50/60",
    border: "border-rose-400",
    text: "text-rose-950",
    badge: "bg-rose-100 text-rose-800 border-rose-300",
  },
  CRITICAL: {
    bg: "bg-rose-50",
    border: "border-rose-500",
    text: "text-rose-950",
    badge: "bg-rose-600 text-white border-rose-700",
  },
  DISRUPTED: {
    bg: "bg-rose-100/70",
    border: "border-rose-600",
    text: "text-rose-950",
    badge: "bg-rose-700 text-white border-rose-800",
  },
  RECOVERING: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-950",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  RESOLVED: {
    bg: "bg-emerald-50/60",
    border: "border-emerald-300",
    text: "text-emerald-950",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

export const SupplyChainNetworkView: React.FC<SupplyChainNetworkViewProps> = ({
  network,
  onSelectNode,
  onAskPreviaForNode,
}) => {
  const nodes = network?.nodes || [];
  const edges = network?.edges || [];

  const [selectedNode, setSelectedNode] = useState<SupplyChainGraphNode | null>(
    nodes[0] || null
  );

  if (nodes.length === 0) {
    return (
      <div className="bg-white border border-graphite/80 rounded-2xl p-10 shadow-xs text-center space-y-3">
        <Layers className="w-8 h-8 text-charcoal-muted/50 mx-auto" />
        <h4 className="text-sm font-bold text-charcoal font-mono uppercase tracking-wider">
          Supply Chain Network
        </h4>
        <p className="text-xs font-semibold text-charcoal">
          No verified dependency data is currently available.
        </p>
        <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
          Connect supplier, shipment, or network records to build the operational dependency view.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-graphite/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-graphite pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-editorial font-bold text-charcoal tracking-tight">
              Multi-Tier Supply Chain Network
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-mist text-charcoal font-bold border border-graphite">
              {nodes.length} Nodes • {edges.length} Relationships
            </span>
          </div>
          <p className="text-xs text-charcoal-muted">
            End-to-end topological mapping from Tier-1 suppliers to assembly facilities
          </p>
        </div>
      </div>

      {/* Network Nodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const styling = STATE_COLORS[node.state] || STATE_COLORS.NORMAL;
          const icon = TYPE_ICONS[node.type] || "📍";

          return (
            <div
              key={node.id}
              onClick={() => {
                setSelectedNode(node);
                onSelectNode(node);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${styling.bg} ${styling.border} ${
                isSelected ? "ring-2 ring-[#B86F52] shadow-sm scale-102" : "hover:border-charcoal/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{icon}</span>
                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-xs border ${styling.badge}`}>
                  {node.state}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="font-bold text-xs text-charcoal block truncate leading-tight">
                  {node.label}
                </span>
                <span className="text-[10px] font-mono uppercase text-charcoal-muted block">
                  {node.type}
                </span>
              </div>

              {node.delayDays !== undefined && node.delayDays > 0 && (
                <div className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate">
                  +{node.delayDays}d drift
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Node Detailed Inspector */}
      {selectedNode && (
        <div className="p-4 bg-stone-mist/20 border border-graphite rounded-xl space-y-4 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite/40 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{TYPE_ICONS[selectedNode.type] || "📍"}</span>
                <h4 className="text-sm font-bold text-charcoal font-mono">{selectedNode.label}</h4>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm border ${
                    STATE_COLORS[selectedNode.state]?.badge || "bg-stone-mist text-charcoal"
                  }`}
                >
                  {selectedNode.state}
                </span>
              </div>
              <p className="text-xs text-charcoal-muted font-mono">
                Entity Type: {selectedNode.type.toUpperCase()} • Risk Tier: {selectedNode.riskLevel}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onAskPreviaForNode
                    ? onAskPreviaForNode(selectedNode)
                    : onSelectNode(selectedNode)
                }
                className="px-3 py-1.5 bg-[#211A27] hover:bg-[#3A3043] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Previa</span>
              </button>
            </div>
          </div>

          {/* Node Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            {selectedNode.supplierId && (
              <div className="p-2 bg-white border border-graphite/60 rounded-lg">
                <span className="text-[10px] text-charcoal-muted uppercase block">Supplier</span>
                <span className="font-bold text-charcoal truncate block">{selectedNode.supplierId}</span>
              </div>
            )}
            {selectedNode.poNumber && (
              <div className="p-2 bg-white border border-graphite/60 rounded-lg">
                <span className="text-[10px] text-charcoal-muted uppercase block">PO Reference</span>
                <span className="font-bold text-charcoal truncate block">{selectedNode.poNumber}</span>
              </div>
            )}
            {selectedNode.relatedShipmentId && (
              <div className="p-2 bg-white border border-graphite/60 rounded-lg">
                <span className="text-[10px] text-charcoal-muted uppercase block">Shipment ID</span>
                <span className="font-bold text-charcoal truncate block">{selectedNode.relatedShipmentId}</span>
              </div>
            )}
            {selectedNode.delayDays !== undefined && (
              <div className="p-2 bg-white border border-graphite/60 rounded-lg">
                <span className="text-[10px] text-charcoal-muted uppercase block">Schedule Delay</span>
                <span className="font-bold text-rose-700 block">+{selectedNode.delayDays} days</span>
              </div>
            )}
          </div>

          {/* Diagnostics & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {selectedNode.aiFindings && (
              <div className="p-3 bg-white border border-graphite/60 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-charcoal uppercase block">AI Diagnostic</span>
                <p className="text-charcoal leading-relaxed">{selectedNode.aiFindings}</p>
              </div>
            )}
            {selectedNode.recommendation && (
              <div className="p-3 bg-white border border-graphite/60 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-[#B86F52] uppercase block">
                  Recommended Mitigation
                </span>
                <p className="text-charcoal leading-relaxed">{selectedNode.recommendation}</p>
              </div>
            )}
          </div>

          {/* Evidence Trail */}
          {selectedNode.evidence && selectedNode.evidence.length > 0 && (
            <div className="space-y-1 text-xs font-mono">
              <span className="text-[10px] font-bold uppercase text-charcoal-muted block">
                Grounding Evidence
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.evidence.map((ev, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-graphite/60 rounded text-charcoal">
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
