import React from "react";
import { PageView } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Target,
  Eye,
  Users,
  Building2,
  TrendingDown,
  ArrowRight,
  Workflow,
  CheckCircle2,
  Anchor,
  Layers,
  Radar,
  Cpu,
} from "lucide-react";
import { PreviaBrand, PreviaBrandIcon } from "../components/brand/PreviaBrand";
import { PREVIA_IMAGERY } from "../data/imagery";

interface AboutPageProps {
  onNavigate: (page: PageView) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      onNavigate("intelligence");
    } else {
      openAuthModal("intelligence");
    }
  };

  return (
    <div className="bg-parchment min-h-screen text-charcoal">
      {/* Header Banner */}
      <section className="pt-12 pb-16 bg-gradient-to-b from-parchment-light to-parchment border-b border-graphite">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="flex items-center justify-center">
            <PreviaBrand
              variant="light"
              size="lg"
              showSubtitle={true}
              subtitleText="Supply Chain Intelligence"
              showAiBadge={true}
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white border border-graphite text-[#2F6F6D]">
            <Radar className="w-3.5 h-3.5 text-[#B86F52]" />
            <span>Mission & Operational Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-charcoal tracking-tight">
            About Previa
          </h1>
          <p className="text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
            Eliminating blind spots in multi-tier supply networks. Previa empowers operational teams to forecast disruptions, calculate precise financial exposure, and execute prescriptive playbooks before crises cascade.
          </p>
        </div>
      </section>

      {/* Purpose & Vision with Editorial Imagery */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl border border-graphite bg-white shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-copper-subtle border border-[#E8D5CD] flex items-center justify-center text-[#B86F52]">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-editorial font-bold text-charcoal">Our Purpose</h2>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Global supply chains are exposed to compounding volatility. Cleanroom shutdowns, maritime canal choke points, raw-material export bans, and severe weather mean disruptions are no longer isolated anomalies—they are weekly realities. Previa transforms reactive panic into calibrated, auditable mitigation.
              </p>
            </div>
            <div className="pt-4 border-t border-graphite flex items-center gap-2 text-xs font-mono text-[#B86F52]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B86F52]" />
              <span>Built for High-Complexity Operations</span>
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-graphite bg-white shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#211A27] text-white flex items-center justify-center border border-[#3A3043]">
                <Eye className="w-5 h-5 text-[#D9A441]" />
              </div>
              <h2 className="text-xl font-editorial font-bold text-charcoal">Our Vision</h2>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                An industrial reality where plant directors never receive an unexpected component starvation notice or an unbudgeted emergency air-cargo invoice. We envision supply networks where operational telemetry is processed instantly and mitigations are executed with verified mathematical proof.
              </p>
            </div>
            <div className="pt-4 border-t border-graphite flex items-center gap-2 text-xs font-mono text-[#2F6F6D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6F6D]" />
              <span>Predictive Certainty Across Corridors</span>
            </div>
          </div>
        </div>

        {/* Real Industrial Infrastructure Photo Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl overflow-hidden border border-graphite">
          <div className="relative h-60 bg-slate-900">
            <img
              src={PREVIA_IMAGERY.intermodalFreightRail.src}
              alt={PREVIA_IMAGERY.intermodalFreightRail.alt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211A27]/90 via-[#211A27]/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#B86F52] uppercase font-bold">
                Intermodal Rail
              </span>
              <p className="text-xs font-medium mt-1">
                {PREVIA_IMAGERY.intermodalFreightRail.caption}
              </p>
            </div>
          </div>

          <div className="relative h-60 bg-slate-900">
            <img
              src={PREVIA_IMAGERY.oceanVesselTransit.src}
              alt={PREVIA_IMAGERY.oceanVesselTransit.alt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211A27]/90 via-[#211A27]/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#2F6F6D] uppercase font-bold">
                Maritime Freight
              </span>
              <p className="text-xs font-medium mt-1">
                {PREVIA_IMAGERY.oceanVesselTransit.caption}
              </p>
            </div>
          </div>
        </div>

        {/* Evolution Comparison Grid */}
        <div className="space-y-6">
          <div className="border-b border-graphite pb-4">
            <span className="text-xs font-mono font-bold text-[#2F6F6D] uppercase tracking-widest">
              Strategic Value Shift
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-charcoal mt-1">
              Why Supply Networks Require New Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="p-6 bg-white rounded-2xl border border-graphite space-y-2">
              <span className="text-xs font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                Era 1: Legacy SCM
              </span>
              <h3 className="text-base font-bold text-charcoal font-editorial">Reactive Firefighting</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Discover disruptions only after an assembly line halts or a vessel bypasses port. Heavy dependence on emergency email chains and spot-freight surcharges.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-graphite space-y-2">
              <span className="text-xs font-mono font-bold text-charcoal-subtle uppercase tracking-wider block">
                Era 2: Passive BI
              </span>
              <h3 className="text-base font-bold text-charcoal font-editorial">Static Alert Maps</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Traditional dashboards render thousands of red dots on a global map, leaving procurement managers to manually deduce downstream financial consequences.
              </p>
            </div>

            <div className="p-6 bg-[#F7EFEB] rounded-2xl border border-[#E8D5CD] space-y-2">
              <span className="text-xs font-mono font-bold text-[#874932] uppercase tracking-wider block">
                Era 3: Previa AI
              </span>
              <h3 className="text-base font-bold text-[#29262A] font-editorial">Prescriptive Playbooks</h3>
              <p className="text-xs text-[#29262A] leading-relaxed">
                Autonomous risk classification, multi-tier impact quantification, and verified cross-functional execution tasks prior to line starvation.
              </p>
            </div>
          </div>
        </div>

        {/* Roles Supported */}
        <div className="space-y-6">
          <div className="border-b border-graphite pb-4">
            <span className="text-xs font-mono font-bold text-[#69656B] uppercase tracking-widest">
              Stakeholder Orchestration
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-charcoal mt-1">
              Built for Enterprise Cross-Functional Execution
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-graphite bg-white space-y-2">
              <Users className="w-5 h-5 text-[#B86F52] mb-1" />
              <h4 className="text-xs font-bold text-charcoal">Procurement Leads</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Mitigate sole-source supplier dependencies and activate qualified secondary vendor quotas with pre-calculated pricing models.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-graphite bg-white space-y-2">
              <Workflow className="w-5 h-5 text-[#2F6F6D] mb-1" />
              <h4 className="text-xs font-bold text-charcoal">Logistics Directors</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Manage canal delays, port congestion queues, and intermodal freight alternatives with immediate delivery drift recalculation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-graphite bg-white space-y-2">
              <Building2 className="w-5 h-5 text-[#B77935] mb-1" />
              <h4 className="text-xs font-bold text-charcoal">Plant Operations</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Protect factory run-rates, buffer stock availability, and SMT assembly lines from critical semiconductor starvation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-graphite bg-white space-y-2">
              <TrendingDown className="w-5 h-5 text-[#617A61] mb-1" />
              <h4 className="text-xs font-bold text-charcoal">Executive Leadership</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Review quantified financial exposure and signed audit certificates with complete transparency into data versus assumptions.
              </p>
            </div>
          </div>
        </div>

        {/* The Previa Principle Card */}
        <div className="p-8 rounded-2xl bg-[#211A27] text-white border border-[#3A3043] space-y-4 shadow-xl">
          <h3 className="text-lg font-editorial font-bold text-white">
            The Previa Principle: Absolute Grounding in Reality
          </h3>
          <p className="text-xs sm:text-sm text-[#D8D0C3] leading-relaxed">
            Many enterprise generative systems fabricate numbers when telemetry is incomplete. Previa strictly forbids hallucinated metrics. Every simulation explicitly distinguishes between ground-truth operational parameters and synthetic reasoning assumptions, providing a cryptographically verifiable audit trail for every mitigation decision.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStart}
              className="px-5 py-3 bg-[#B86F52] hover:bg-[#A25E43] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Previa Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className="px-5 py-3 border border-[#3A3043] bg-[#2A2132] text-white hover:bg-[#32273C] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Contact Advisory Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
