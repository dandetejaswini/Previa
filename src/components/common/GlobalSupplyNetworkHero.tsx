import React, { useState } from "react";
import {
  Ship,
  Building2,
  Boxes,
  Radar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Compass,
} from "lucide-react";

interface NetworkNode {
  id: string;
  name: string;
  role: "Deepwater Port" | "Semiconductor Fab" | "Intermodal Hub" | "Assembly Plant";
  location: string;
  x: number; // percentage in SVG coordinate space (0..800)
  y: number; // (0..420)
  status: "nominal" | "warning" | "critical";
  metric: string;
  detail: string;
}

const NODES: NetworkNode[] = [
  {
    id: "hsinchu",
    name: "Fab 14A Microelectronics",
    role: "Semiconductor Fab",
    location: "Hsinchu / Taiwan",
    x: 640,
    y: 195,
    status: "critical",
    metric: "Wafer Yield Alert (-40%)",
    detail: "Seismic maintenance cleanroom protocol active. Secondary spot buffer allocated.",
  },
  {
    id: "shanghai",
    name: "Yangshan Deepwater Port",
    role: "Deepwater Port",
    location: "Shanghai / East Asia",
    x: 615,
    y: 165,
    status: "warning",
    metric: "Berthing Congestion: +2.4d",
    detail: "Typhoon contingency queues. 14 container vessels rerouted to Ningbo.",
  },
  {
    id: "singapore",
    name: "Tuas Mega Port Terminal",
    role: "Deepwater Port",
    location: "Singapore / Malacca Strait",
    x: 580,
    y: 260,
    status: "nominal",
    metric: "Transshipment: 100% On-Time",
    detail: "Primary Indian Ocean connecting gateway operating at nominal dispatch velocity.",
  },
  {
    id: "rotterdam",
    name: "Maasvlakte II Gateway",
    role: "Deepwater Port",
    location: "Rotterdam / North Sea",
    x: 385,
    y: 110,
    status: "warning",
    metric: "Drift Horizon: +3.8d",
    detail: "Cape of Good Hope detour arrival wave expected in 96 hours.",
  },
  {
    id: "antwerp",
    name: "Scheldt Chemical & Auto Depot",
    role: "Intermodal Hub",
    location: "Antwerp / Western Europe",
    x: 375,
    y: 125,
    status: "nominal",
    metric: "Inbound Rail: High Liquidity",
    detail: "Direct block-train freight to Central European assembly nodes synchronized.",
  },
  {
    id: "longbeach",
    name: "San Pedro Bay Terminal",
    role: "Deepwater Port",
    location: "Long Beach / US West Coast",
    x: 130,
    y: 160,
    status: "nominal",
    metric: "Rail Dwell Time: 2.1d",
    detail: "Automated gate throughput nominal. Intermodal rail departure capacity cleared.",
  },
  {
    id: "chicago",
    name: "Midwest Intermodal Nexus",
    role: "Intermodal Hub",
    location: "Chicago / Great Lakes",
    x: 195,
    y: 135,
    status: "nominal",
    metric: "Safety Horizon: 14.2 Days",
    detail: "Tier-1 automotive subassembly inventory buffer above minimum threshold.",
  },
];

export const GlobalSupplyNetworkHero: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode>(NODES[0]);

  return (
    <div className="relative rounded-2xl bg-[#211A27] border border-[#3A3043] overflow-hidden shadow-2xl text-parchment">
      {/* Top Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#3A3043] bg-[#1A1420]/80 backdrop-blur-xs text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#B86F52]">
            <Radar className="w-3.5 h-3.5 text-[#D9A441]" />
            <span className="font-semibold tracking-wider uppercase">
              Multi-Modal Corridors • Node Schematic
            </span>
          </div>
          <span className="hidden sm:inline-block text-[#69656B]">|</span>
          <span className="text-[11px] text-[#E7E1D7] hidden sm:inline-block">
            Key Maritime & Rail Corridors: <strong className="text-white">Global Nodes</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1 text-[#448987]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6F6D]" />
            Corridor Network
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#2F6F6D]/40 text-[#448987] border border-[#2F6F6D]/50 text-[10px]">
            Multi-Tier Flow
          </span>
        </div>
      </div>

      {/* SVG Supply Chain Map Canvas */}
      <div className="relative p-4 sm:p-6 bg-gradient-to-b from-[#211A27] via-[#1D1723] to-[#17111C]">
        <svg
          viewBox="0 0 800 380"
          className="w-full h-auto select-none overflow-visible"
          style={{ minHeight: "260px" }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3A3043" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>

            {/* Gradients */}
            <linearGradient id="route-teal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2F6F6D" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#448987" stopOpacity="1" />
              <stop offset="100%" stopColor="#B86F52" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="route-copper" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B86F52" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#D9A441" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#A94B45" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect width="800" height="380" fill="url(#grid-pattern)" />

          {/* Abstract Continental Landmass Contours (Light Architectural Guides) */}
          <path
            d="M 100,100 Q 140,70 210,80 Q 240,110 220,180 Q 180,220 120,190 Z"
            fill="#27202E"
            fillOpacity="0.35"
            stroke="#3D3246"
            strokeWidth="0.8"
          />
          <path
            d="M 330,80 Q 420,60 440,110 Q 410,160 360,170 Q 320,130 330,80 Z"
            fill="#27202E"
            fillOpacity="0.35"
            stroke="#3D3246"
            strokeWidth="0.8"
          />
          <path
            d="M 520,120 Q 640,90 690,150 Q 680,240 600,280 Q 540,240 520,180 Z"
            fill="#27202E"
            fillOpacity="0.35"
            stroke="#3D3246"
            strokeWidth="0.8"
          />

          {/* Shipping Routes (Curved Geodesic Lines) */}
          {/* Transpacific Route: Hsinchu / Shanghai -> Long Beach */}
          <path
            d="M 640,195 Q 400,20 130,160"
            fill="none"
            stroke="url(#route-copper)"
            strokeWidth="2.2"
            strokeDasharray="6 3"
            strokeOpacity="0.85"
          />

          {/* US Inland Rail Corridor: Long Beach -> Chicago */}
          <path
            d="M 130,160 Q 160,140 195,135"
            fill="none"
            stroke="#2F6F6D"
            strokeWidth="2.5"
            strokeOpacity="0.9"
          />

          {/* Maritime Loop: Shanghai -> Singapore */}
          <path
            d="M 615,165 Q 630,220 580,260"
            fill="none"
            stroke="#2F6F6D"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeOpacity="0.75"
          />

          {/* Asia-Europe Maritime Line: Singapore -> Suez/Rotterdam */}
          <path
            d="M 580,260 Q 460,330 385,110"
            fill="none"
            stroke="url(#route-teal)"
            strokeWidth="2.4"
            strokeOpacity="0.8"
          />

          {/* European Rhine-Scheldt Feeder: Rotterdam -> Antwerp */}
          <path
            d="M 385,110 L 375,125"
            fill="none"
            stroke="#B86F52"
            strokeWidth="3"
            strokeOpacity="0.9"
          />

          {/* Active Cargo Vessel Markers (Pulsing Disruption / Transit beacons) */}
          {/* Disruption Alert Zone (Bab-el-Mandeb / Indian Ocean Cape Detour) */}
          <g transform="translate(485, 275)">
            <circle r="14" fill="#A94B45" fillOpacity="0.2" className="animate-ping" />
            <circle r="6" fill="#A94B45" />
            <text x="10" y="4" fill="#A94B45" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
              DRIFT +14d
            </text>
          </g>

          {/* In-Transit Nominal Cargo Vessel (Transpacific) */}
          <g transform="translate(360, 92)">
            <circle r="4" fill="#D9A441" />
            <circle r="8" fill="none" stroke="#D9A441" strokeWidth="0.8" strokeDasharray="2 2" />
            <text x="8" y="-4" fill="#E7E1D7" fontSize="8" fontFamily="JetBrains Mono">
              EVER-GIVEN (TEU 20k)
            </text>
          </g>

          {/* Interactive Network Nodes */}
          {NODES.map((node) => {
            const isSelected = selectedNode.id === node.id;
            const statusColor =
              node.status === "critical"
                ? "#A94B45"
                : node.status === "warning"
                ? "#B77935"
                : "#2F6F6D";

            const haloColor =
              node.status === "critical"
                ? "rgba(169, 75, 69, 0.4)"
                : node.status === "warning"
                ? "rgba(183, 121, 53, 0.35)"
                : "rgba(47, 111, 109, 0.35)";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer transition-transform duration-150 hover:scale-110"
              >
                {/* Status Halo */}
                <circle
                  r={isSelected ? 16 : 10}
                  fill={haloColor}
                  className={node.status === "critical" ? "animate-pulse" : ""}
                />

                {/* Node Center */}
                <circle
                  r={isSelected ? 6 : 4.5}
                  fill={isSelected ? "#B86F52" : statusColor}
                  stroke="#FAF8F4"
                  strokeWidth={1.5}
                />

                {/* Label */}
                <text
                  x="0"
                  y={node.y > 220 ? -12 : 16}
                  textAnchor="middle"
                  fill={isSelected ? "#FAF8F4" : "#D8D0C3"}
                  fontSize={isSelected ? "11" : "9.5"}
                  fontWeight={isSelected ? "bold" : "500"}
                  fontFamily="Plus Jakarta Sans"
                >
                  {node.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Inspector Flyout */}
        <div className="mt-2 p-4 rounded-xl bg-[#1A1420] border border-[#3A3043] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedNode.status === "critical"
                    ? "bg-[#A94B45]"
                    : selectedNode.status === "warning"
                    ? "bg-[#B77935]"
                    : "bg-[#2F6F6D]"
                }`}
              />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#B86F52]">
                {selectedNode.role} • {selectedNode.location}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {selectedNode.name}
            </h4>
            <p className="text-xs text-[#E7E1D7] max-w-xl leading-relaxed">
              {selectedNode.detail}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-[#3A3043] sm:pl-5 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#69656B] block">
                Node Telemetry
              </span>
              <span
                className={`text-xs font-bold font-mono ${
                  selectedNode.status === "critical"
                    ? "text-[#A94B45]"
                    : selectedNode.status === "warning"
                    ? "text-[#D9A441]"
                    : "text-[#617A61]"
                }`}
              >
                {selectedNode.metric}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
