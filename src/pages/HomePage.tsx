import React from "react";
import { PageView } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  ShieldAlert,
  TrendingUp,
  Cpu,
  Layers,
  Clock,
  DollarSign,
  CheckCircle2,
  Truck,
  Building2,
  Boxes,
  Radar,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Anchor,
  Compass,
  FileCheck2,
  Ship,
  Sparkles,
  Bot,
} from "lucide-react";
import { GlobalSupplyNetworkHero } from "../components/common/GlobalSupplyNetworkHero";
import { PREVIA_IMAGERY } from "../data/imagery";

interface HomePageProps {
  onNavigate: (page: PageView) => void;
  onSelectSampleScenario?: (scenario: string) => void;
}

const PREVIA_12_AGENTS = [
  {
    name: "Shipment Tracker",
    icon: Ship,
    desc: "Real-time multi-modal logistics telemetry and vessel tracking.",
  },
  {
    name: "Disruption Intelligence",
    icon: ShieldAlert,
    desc: "Qualitative shock analysis, port advisories, and incident synthesis.",
  },
  {
    name: "Risk Sentinel",
    icon: AlertTriangle,
    desc: "Continuous multi-factor vulnerability scoring across nodes and routes.",
  },
  {
    name: "Impact & Financial Analyzer",
    icon: DollarSign,
    desc: "Quantifies revenue exposure, idle facility costs, and emergency surcharges.",
  },
  {
    name: "Forecasting Agent",
    icon: TrendingUp,
    desc: "Predicts arrival variance, stockout horizons, and safety buffer burn rates.",
  },
  {
    name: "Supplier Intelligence Agent",
    icon: Building2,
    desc: "Evaluates fulfillment velocity, concentration risks, and vendor health.",
  },
  {
    name: "Anomaly Detection Agent",
    icon: Radar,
    desc: "Flags unexpected lead-time drift, route deviations, and dwell spikes.",
  },
  {
    name: "Document & Vision Intelligence",
    icon: FileCheck2,
    desc: "Ingests bills of lading, customs filings, invoices, and manifests.",
  },
  {
    name: "Graph & Dependency Intelligence",
    icon: Layers,
    desc: "Maps multi-echelon dependency topology and single-source choke points.",
  },
  {
    name: "Scenario, Optimization & Mitigation Agent",
    icon: Boxes,
    desc: "Deterministic Monte Carlo simulation and mitigation playbook generation.",
  },
  {
    name: "User Activity Agent",
    icon: Clock,
    desc: "Tracks user-specific audits, decisions, approved actions, and reviews.",
  },
  {
    name: "Supply Chain Query Agent",
    icon: Cpu,
    desc: "Operational copilot answering real-time questions about active supply state.",
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectSampleScenario }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      onNavigate("intelligence");
    } else {
      openAuthModal("intelligence");
    }
  };

  const handleExploreAgents = () => {
    const el = document.getElementById("agents-discovery-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLearnMore = () => {
    const el = document.getElementById("how-previa-works-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      onNavigate("about");
    }
  };

  const sampleScenarios = [
    {
      title: "Example: Supplier Lead-Time Extension",
      icon: Building2,
      text: "Tier-1 automotive microcontroller fabrication in East Asia delayed 4 weeks due to cleanroom seismic maintenance.",
      badge: "Benchmark P1",
      badgeClass: "bg-[#F8EBEA] text-[#8C3A35] border-[#EFCBC9]",
      metric: "Model: +28d Drift",
      metricColor: "text-[#A94B45]",
    },
    {
      title: "Example: Maritime Corridor Bottleneck",
      icon: Truck,
      text: "Container vessel rerouting around Cape of Good Hope adds 14–18 days maritime transit to Maasvlakte Rotterdam.",
      badge: "Benchmark High",
      badgeClass: "bg-[#F9EFE5] text-[#975F24] border-[#EEDBC7]",
      metric: "Model: +16d Drift",
      metricColor: "text-[#B77935]",
    },
    {
      title: "Example: Raw-Material Allocation Quota",
      icon: Boxes,
      text: "Export quota restrictions on battery-grade lithium carbonate causing spot price spikes across tier-2 cell suppliers.",
      badge: "Benchmark Shock",
      badgeClass: "bg-[#FBF5E5] text-[#8C6418] border-[#E8D4A2]",
      metric: "Model: $420k Exposure",
      metricColor: "text-[#D9A441]",
    },
  ];

  return (
    <div className="bg-parchment min-h-screen text-charcoal">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-12 lg:pt-14 lg:pb-16 border-b border-graphite bg-gradient-to-b from-parchment-light via-parchment to-stone-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Main Hero Header & Visual Telemetry Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Main Hero Header */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#FAF8F4] border border-[#D8D2C6] text-[#2F6F6D] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#B86F52]" />
                <span>Autonomous Predictive Supply Chain Intelligence</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-editorial font-bold text-charcoal tracking-tight leading-[1.1]">
                Predict supply-chain disruptions{" "}
                <span className="text-[#B86F52] italic">
                  before they halt production.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-charcoal-muted max-w-2xl leading-relaxed">
                Previa equips enterprise procurement leads and logistics directors with continuous multi-tier telemetry, forecasting financial exposure and orchestrating pre-emptive supplier reallocations days before factory starvation occurs.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button
                  id="hero-primary-cta-btn"
                  onClick={handleGetStarted}
                  className="px-6 py-3.5 bg-copper hover:bg-[#A25E43] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border border-[#CD8569]/30"
                >
                  <span>Launch Previa Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="hero-explore-agents-btn"
                  onClick={handleExploreAgents}
                  className="px-6 py-3.5 bg-white hover:bg-[#FAF8F4] text-charcoal font-semibold rounded-xl border border-graphite transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-[#B86F52]" />
                  <span>Explore Agents</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-charcoal-muted font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#617A61]" />
                  Zero ungrounded hallucinations
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#617A61]" />
                  Explicit assumption boundaries
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#617A61]" />
                  Auditable mitigation proof chains
                </span>
              </div>
            </div>

            {/* Right: Industrial Logistics Photography & Live Telemetry Imagery */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-2xl border border-graphite bg-white overflow-hidden shadow-md group">
                <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                  <img
                    src={PREVIA_IMAGERY.oceanVesselTransit.src}
                    alt={PREVIA_IMAGERY.oceanVesselTransit.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#211A27]/90 via-[#211A27]/25 to-transparent" />

                  {/* Top Live Badge */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#211A27]/85 text-[#FAF8F4] border border-white/20 backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#617A61] animate-pulse" />
                      <span>Transpacific Northern Lane</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-[#B86F52] text-[10px] font-mono font-bold text-white uppercase">
                      AIS Telemetry
                    </span>
                  </div>

                  {/* Bottom Image Caption & Status */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#D8D0C3]">Vessel: Ever Apex / Voy 0418</span>
                      <span className="text-[#D9A441] font-bold">+14d Drift</span>
                    </div>
                    <p className="text-xs font-semibold leading-snug drop-shadow-xs">
                      {PREVIA_IMAGERY.oceanVesselTransit.caption}
                    </p>
                  </div>
                </div>

                {/* Sub-strip with multi-modal second image */}
                <div className="p-3.5 bg-[#FAF8F4] border-t border-graphite flex items-center gap-3">
                  <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-graphite relative">
                    <img
                      src={PREVIA_IMAGERY.intermodalFreightRail.src}
                      alt={PREVIA_IMAGERY.intermodalFreightRail.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#69656B]">
                        Intermodal Rail Buffer
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#2F6F6D]">
                        Active Inbound
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal truncate font-medium mt-0.5">
                      Rotterdam Rail Hub to Central European Assembly Plant
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Telemetry Signal pill */}
              <div className="p-3 bg-white border border-graphite rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-charcoal">
                  <span className="w-2 h-2 rounded-full bg-[#B86F52]" />
                  <span className="font-semibold text-[11px]">Global Satellite & Port AIS Feeds</span>
                </div>
                <span className="text-[10px] font-bold text-[#2F6F6D] bg-[#E8F2F1] px-2 py-0.5 rounded-sm border border-[#CDE2E1]">
                  Live Synchronized
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 12 AI AGENTS — ONE CONNECTED INTELLIGENCE LAYER (High Prominence Discovery) */}
      <section
        id="agents-discovery-section"
        className="py-12 sm:py-16 bg-white border-b border-graphite"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-graphite pb-4">
            <div className="max-w-3xl space-y-2">
              <span className="text-xs font-mono font-bold text-[#B86F52] uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#B86F52]" />
                <span>12 AI AGENTS &bull; ONE CONNECTED INTELLIGENCE LAYER</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-charcoal tracking-tight">
                12 specialized agents work together to detect, analyze, forecast, and respond to supply-chain risk.
              </h2>
            </div>
            <button
              type="button"
              onClick={handleGetStarted}
              className="px-4 py-2 bg-[#211A27] hover:bg-[#3A3043] text-white text-xs font-mono font-bold rounded-xl border border-graphite transition-all flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer shadow-xs"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B86F52]" />
            </button>
          </div>

          {/* 12 Canonical Agents Clean Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {PREVIA_12_AGENTS.map((ag, idx) => {
              const Icon = ag.icon;
              return (
                <div
                  key={ag.name}
                  className="p-4 rounded-xl bg-stone-mist/20 border border-graphite/80 hover:border-[#B86F52] hover:bg-stone-mist/40 transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-[#211A27] text-[#FAF8F4] flex items-center justify-center group-hover:bg-[#B86F52] transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-charcoal-muted">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold font-editorial text-charcoal leading-snug">
                      {ag.name}
                    </h3>
                  </div>

                  <p className="text-[11px] text-charcoal-muted leading-relaxed font-sans">
                    {ag.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Multi-Modal Logistics Telemetry Grid & Snapshot */}
      <section className="py-12 bg-parchment border-b border-graphite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#69656B]">
                <Radar className="w-4 h-4 text-[#B86F52]" />
                <span>Multi-Modal Logistics Telemetry Grid</span>
              </div>
              <span className="text-xs font-mono text-[#2F6F6D] font-semibold hidden sm:inline-block">
                Suez • Malacca • Maasvlakte • Long Beach Corridors
              </span>
            </div>

            <GlobalSupplyNetworkHero />
          </div>

          {/* Key Metric Highlights & Live Assessment Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Example Intelligence Assessment Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-graphite shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-3.5 bg-[#211A27] text-white flex items-center justify-between border-b border-[#3A3043]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D9A441]" />
                  <span className="text-xs font-bold tracking-wide">Illustrative Scenario Assessment</span>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#D8D0C3]">
                  Corridor Ref #TW-884-ROT (Reference Example)
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#B86F52] uppercase tracking-wider">
                      Example Disruption Scenario
                    </span>
                    <h3 className="text-base font-bold text-charcoal font-editorial mt-0.5">
                      Taiwan Fab 14A Substrate Shortage & Kaohsiung Dwell Spike
                    </h3>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#F8EBEA] text-[#8C3A35] border border-[#EFCBC9] shrink-0 self-start sm:self-auto">
                    Simulated P1 Critical
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-stone-mist/50 border border-graphite">
                    <span className="text-[#69656B] text-[11px] font-medium block">Lead-Time Drift</span>
                    <span className="text-base font-bold text-charcoal font-mono mt-0.5 block">+28 Days</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-mist/50 border border-graphite">
                    <span className="text-[#69656B] text-[11px] font-medium block">Assembly Starvation</span>
                    <span className="text-base font-bold text-[#A94B45] font-mono mt-0.5 block">11 Days Horizon</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-mist/50 border border-graphite">
                    <span className="text-[#69656B] text-[11px] font-medium block">Exposure Avoided</span>
                    <span className="text-base font-bold text-[#617A61] font-mono mt-0.5 block">$540,000 USD</span>
                  </div>
                </div>

                <div className="p-4 bg-[#F7EFEB] border border-[#E8D5CD] rounded-xl text-xs space-y-1">
                  <span className="font-bold text-[#874932] flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5 text-[#B86F52]" />
                    Prescribed Autonomous Action
                  </span>
                  <p className="text-[#29262A] text-xs leading-relaxed">
                    Activate secondary wafer reservation in Tainan packaging center. Split inbound transit: 35% air-freight buffer to plant assembly line; balance rerouted via Tuas transshipment.
                  </p>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-stone-mist/30 border-t border-graphite flex items-center justify-between">
                <span className="text-xs text-charcoal-muted">
                  Audited with Gemini 2.5 Multi-Step Reasoning
                </span>
                <button
                  onClick={handleGetStarted}
                  className="text-xs font-bold text-[#B86F52] hover:text-[#874932] flex items-center gap-1 cursor-pointer"
                >
                  <span>Simulate in Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Industrial Logistics Editorial Visual Card */}
            <div className="lg:col-span-5 rounded-2xl border border-graphite bg-white overflow-hidden shadow-sm flex flex-col">
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={PREVIA_IMAGERY.heroContainerPort.src}
                  alt={PREVIA_IMAGERY.heroContainerPort.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#211A27] via-transparent to-transparent opacity-85" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="inline-block px-2 py-0.5 rounded-sm bg-[#B86F52] text-[10px] font-mono font-bold uppercase mb-1">
                    {PREVIA_IMAGERY.heroContainerPort.tag}
                  </span>
                  <p className="text-xs font-semibold leading-snug drop-shadow-sm">
                    {PREVIA_IMAGERY.heroContainerPort.caption}
                  </p>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold font-editorial text-charcoal">
                    Real-World Operational Grounding
                  </h4>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    Previa bridges telemetry feeds across global maritime channels, intermodal freight rails, and Tier-1 fab schedules, ensuring your executive decisions reflect actual physical logistics constraints.
                  </p>
                </div>

                <div className="pt-3 border-t border-graphite flex items-center justify-between text-xs font-mono">
                  <span className="text-[#69656B]">Average Resolution Time</span>
                  <span className="font-bold text-[#2F6F6D]">&lt; 3.5 Minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section: Detect → Predict → Recommend → Act */}
      <section id="how-previa-works-section" className="py-20 bg-parchment-light border-b border-graphite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-bold text-[#B86F52] uppercase tracking-widest">
              Core Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-editorial font-bold text-charcoal tracking-tight">
              From Firefighting to Predictive Certainty
            </h2>
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
              Moving from frantic spreadsheets and retroactive damage control to automated threat anticipation across four coordinated phases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1: Detect */}
            <div className="p-6 rounded-2xl border border-graphite bg-white hover:border-[#B86F52] hover:shadow-md transition-all duration-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#211A27] text-white flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B77935]" />
                <h3 className="text-base font-bold text-charcoal font-editorial">Detect</h3>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Ingest real-world operational signals: fab equipment outages, carrier canal detours, dockworker strikes, and spot material spikes.
              </p>
            </div>

            {/* Step 2: Predict */}
            <div className="p-6 rounded-2xl border border-graphite bg-white hover:border-[#2F6F6D] hover:shadow-md transition-all duration-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#2F6F6D] text-white flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#448987]" />
                <h3 className="text-base font-bold text-charcoal font-editorial">Predict</h3>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Advanced reasoning models calculate multi-echelon ripple effects: line-starvation horizons, stockout dates, and carrier dwell times.
              </p>
            </div>

            {/* Step 3: Recommend */}
            <div className="p-6 rounded-2xl border border-graphite bg-white hover:border-[#B86F52] hover:shadow-md transition-all duration-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#B86F52] text-white flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#D9A441]" />
                <h3 className="text-base font-bold text-charcoal font-editorial">Recommend</h3>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Synthesize actionable mitigation plays with assigned cross-functional owners, realistic timelines, and explicit assumption logs.
              </p>
            </div>

            {/* Step 4: Act */}
            <div className="p-6 rounded-2xl border border-graphite bg-white hover:border-[#617A61] hover:shadow-md transition-all duration-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#617A61] text-white flex items-center justify-center font-mono font-bold text-sm">
                04
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#617A61]" />
                <h3 className="text-base font-bold text-charcoal font-editorial">Act & Audit</h3>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Coordinate procurement, inventory planning, and plant leads around verified execution checklists, exportable to enterprise sheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industrial Logistics Gallery & Capabilities Section */}
      <section className="py-20 bg-parchment border-b border-graphite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#2F6F6D] uppercase tracking-widest">
              Field Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-editorial font-bold text-charcoal tracking-tight">
              Engineered for Real Physical Logistics
            </h2>
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
              Tested across automotive microelectronics, maritime container corridors, and multi-tier aerospace supply chains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Capability 1 */}
            <div className="bg-white rounded-2xl border border-graphite overflow-hidden shadow-sm flex flex-col">
              <div className="h-44 overflow-hidden relative">
                <img
                  src={PREVIA_IMAGERY.precisionSemiconductorFoundry.src}
                  alt={PREVIA_IMAGERY.precisionSemiconductorFoundry.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-[#211A27]/85 text-white font-mono text-[10px] font-bold">
                  {PREVIA_IMAGERY.precisionSemiconductorFoundry.tag}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-charcoal font-editorial mb-1.5">
                    Fabrication & Supplier Delays
                  </h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    Audit Tier-1 single-source dependencies, simulate wafer allocation cuts, and test regional secondary foundry qualifications before shutdown occurs.
                  </p>
                </div>
                <div className="pt-3 border-t border-graphite flex items-center gap-1.5 text-xs font-mono text-[#B86F52] font-semibold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Semiconductor & High-Reliability</span>
                </div>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="bg-white rounded-2xl border border-graphite overflow-hidden shadow-sm flex flex-col">
              <div className="h-44 overflow-hidden relative">
                <img
                  src={PREVIA_IMAGERY.oceanVesselTransit.src}
                  alt={PREVIA_IMAGERY.oceanVesselTransit.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-[#211A27]/85 text-white font-mono text-[10px] font-bold">
                  {PREVIA_IMAGERY.oceanVesselTransit.tag}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-charcoal font-editorial mb-1.5">
                    Maritime & Canal Choke Points
                  </h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    Evaluate container reroutings around the Cape, Red Sea security choke points, and port labor actions with immediate delivery variance projections.
                  </p>
                </div>
                <div className="pt-3 border-t border-graphite flex items-center gap-1.5 text-xs font-mono text-[#2F6F6D] font-semibold">
                  <Anchor className="w-3.5 h-3.5" />
                  <span>Maritime Transit Corridors</span>
                </div>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="bg-white rounded-2xl border border-graphite overflow-hidden shadow-sm flex flex-col">
              <div className="h-44 overflow-hidden relative">
                <img
                  src={PREVIA_IMAGERY.automatedDistributionCenter.src}
                  alt={PREVIA_IMAGERY.automatedDistributionCenter.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-[#211A27]/85 text-white font-mono text-[10px] font-bold">
                  {PREVIA_IMAGERY.automatedDistributionCenter.tag}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-charcoal font-editorial mb-1.5">
                    Buffer Depletion & Safety Horizons
                  </h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    Continuously calculate remaining days of buffer stock under dynamic drift and prioritize component allocation across critical production lines.
                  </p>
                </div>
                <div className="pt-3 border-t border-graphite flex items-center gap-1.5 text-xs font-mono text-[#617A61] font-semibold">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Fulfillment & Safety Horizons</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Measurable ROI in Numbers (Aubergine Card) */}
      <section className="py-20 bg-parchment-light border-b border-graphite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-bold text-[#B86F52] uppercase tracking-widest">
                Cost Avoidance & SLA Integrity
              </span>
              <h2 className="text-3xl sm:text-4xl font-editorial font-bold text-charcoal tracking-tight leading-tight">
                Stop paying emergency spot premiums to solve preventable bottlenecks.
              </h2>
              <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
                Every hour of delayed response to an overseas component outage or transit backlog compounds costs exponentially. Previa gives your procurement team the lead-time needed to negotiate, re-route, and protect plant SLAs.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#EEF3EE] text-[#4A5F4A] flex items-center justify-center shrink-0 mt-0.5 border border-[#D3E0D3]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">Air Freight Spot Premium Prevention</h4>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      Avoid six-figure last-minute air charters by re-balancing sea freight buffer weeks in advance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#EEF3EE] text-[#4A5F4A] flex items-center justify-center shrink-0 mt-0.5 border border-[#D3E0D3]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">Protection of On-Time-In-Full (OTIF)</h4>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      Maintain customer delivery guarantees and eliminate vendor penalty chargebacks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#EEF3EE] text-[#4A5F4A] flex items-center justify-center shrink-0 mt-0.5 border border-[#D3E0D3]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">Traceable Cross-Functional Alignment</h4>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      Unify sourcing, inventory, and operations leads around clear auditable checklists.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aubergine Architecture Highlights Box */}
            <div className="lg:col-span-6 bg-[#211A27] text-white rounded-2xl p-8 sm:p-10 border border-[#3A3043] shadow-xl space-y-8">
              <div className="flex items-center justify-between border-b border-[#3A3043] pb-4">
                <h3 className="text-lg font-editorial font-bold tracking-tight text-white">
                  Architectural Pillars of Previa AI
                </h3>
                <span className="text-[10px] font-mono uppercase text-[#B86F52]">
                  Enterprise System
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border-b border-[#3A3043] pb-4">
                  <span className="text-2xl sm:text-3xl font-editorial font-bold text-[#D9A441]">
                    Grounded
                  </span>
                  <p className="text-xs text-[#D8D0C3] mt-1 font-mono">
                    Zero ungrounded hallucinations; explicit assumption logs
                  </p>
                </div>

                <div className="border-b border-[#3A3043] pb-4">
                  <span className="text-2xl sm:text-3xl font-editorial font-bold text-[#448987]">
                    Actionable
                  </span>
                  <p className="text-xs text-[#D8D0C3] mt-1 font-mono">
                    Phased playbooks with assigned owners and timelines
                  </p>
                </div>

                <div>
                  <span className="text-2xl sm:text-3xl font-editorial font-bold text-[#617A61]">
                    Auditable
                  </span>
                  <p className="text-xs text-[#D8D0C3] mt-1 font-mono">
                    Deterministic cryptographic certificates & proof logs
                  </p>
                </div>

                <div>
                  <span className="text-2xl sm:text-3xl font-editorial font-bold text-[#B86F52]">
                    Exportable
                  </span>
                  <p className="text-xs text-[#D8D0C3] mt-1 font-mono">
                    Native sync to Google Sheets, CSV, TSV, and markdown
                  </p>
                </div>
              </div>

              <button
                onClick={handleGetStarted}
                className="w-full py-3.5 bg-[#B86F52] hover:bg-[#A25E43] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#CD8569]/30"
              >
                <span>Launch Previa Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Scenario Cards */}
      <section className="py-16 bg-parchment border-b border-graphite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#69656B] uppercase tracking-wider">
                Reference Benchmark Scenarios (Examples)
              </span>
              <h3 className="text-2xl sm:text-3xl font-editorial font-bold text-charcoal mt-1">
                Explore Illustrative Supply Chain Shocks
              </h3>
            </div>
            <button
              onClick={handleGetStarted}
              className="text-xs font-bold text-[#B86F52] hover:text-[#874932] flex items-center gap-1 self-start md:self-auto cursor-pointer"
            >
              Analyze your own scenario <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleScenarios.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-graphite hover:border-[#B86F52] shadow-xs flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-stone-mist/60 flex items-center justify-center text-charcoal">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-charcoal">{s.title}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badgeClass}`}>
                        {s.badge}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-muted leading-relaxed">
                      "{s.text}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-graphite flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${s.metricColor}`}>
                      {s.metric}
                    </span>
                    <button
                      onClick={() => {
                        if (onSelectSampleScenario) {
                          onSelectSampleScenario(s.text);
                        }
                        handleGetStarted();
                      }}
                      className="text-xs font-bold text-charcoal hover:text-[#B86F52] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Simulate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 bg-[#211A27] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#2F6F6D]/30 border border-[#2F6F6D]/60 text-[#448987]">
            <Radar className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Autonomous Disruption Preparedness</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-editorial font-bold tracking-tight text-white">
            Ready to secure your global supply network?
          </h2>

          <p className="text-[#D8D0C3] text-sm max-w-xl mx-auto leading-relaxed">
            Join enterprise procurement and logistics directors who anticipate disruptions days before they impact manufacturing operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#B86F52] hover:bg-[#A25E43] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className="w-full sm:w-auto px-6 py-3.5 border border-[#3A3043] hover:border-[#D8D2C6] text-white font-medium text-xs rounded-xl transition-colors cursor-pointer bg-[#2A2132]"
            >
              Contact Enterprise Sourcing Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
