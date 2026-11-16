import React from "react";
import { PageView } from "../types";
import { Activity, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { PreviaBrand } from "./brand/PreviaBrand";

interface FooterProps {
  onNavigate: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#F7F6F1] text-[#66736C] border-t border-[#E5E0D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col (2 cols wide on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <PreviaBrand
              variant="light"
              size="md"
              subtitleText="Autonomous Supply Chain Intelligence"
              onClick={() => onNavigate("home")}
            />
            <p className="text-sm text-[#66736C] max-w-sm leading-relaxed">
              Previa is the AI-powered supply-chain intelligence platform engineered for enterprise procurement and logistics teams to forecast disruptions, quantify financial exposure, and execute automated mitigation protocols.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white text-[#246B68] border border-[#E5E0D8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#246B68] animate-pulse"></span>
                Previa Telemetry Stream • Live
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#34413B] tracking-wider uppercase mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className="hover:text-[#466B5C] transition-colors cursor-pointer text-[#66736C]"
                >
                  Home Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("intelligence")}
                  className="hover:text-[#466B5C] transition-colors flex items-center gap-1.5 cursor-pointer text-[#66736C]"
                >
                  <span>Risk Intelligence</span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#DDE8E1] text-[#466B5C] rounded-xs font-mono border border-[#DDE2DC]">
                    AI
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="hover:text-[#466B5C] transition-colors cursor-pointer text-[#66736C]"
                >
                  Why Previa
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("control_tower")}
                  className="hover:text-[#466B5C] transition-colors cursor-pointer text-[#66736C]"
                >
                  Control Tower
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("contact")}
                  className="hover:text-[#466B5C] transition-colors cursor-pointer text-[#66736C]"
                >
                  Contact Sourcing Team
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("signup")}
                  className="hover:text-[#466B5C] transition-colors cursor-pointer text-[#66736C]"
                >
                  Create Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("login")}
                  className="hover:text-[#466B5C] transition-colors cursor-pointer text-[#66736C]"
                >
                  Operator Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Supply Chain Workflows */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#34413B] tracking-wider uppercase mb-4">
              Disruption Playbooks
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-[#66736C]">Semiconductor Foundry Outages</li>
              <li className="text-[#66736C]">Maritime Freight Corridors</li>
              <li className="text-[#66736C]">Critical Raw-Material Buffers</li>
              <li className="text-[#66736C]">Intermodal Rail Logistics</li>
              <li className="text-[#66736C]">Delivery Drift Audit Logging</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#34413B] tracking-wider uppercase mb-4">
              Enterprise Office
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#557A6B] shrink-0 mt-0.5" />
                <span className="text-[#66736C]">100 Logistics Blvd, Suite 400<br />Chicago, IL 60601</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#557A6B] shrink-0" />
                <span className="text-[#66736C]">intelligence@previa.ai</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#557A6B] shrink-0" />
                <span className="text-[#66736C]">+1 (800) 555-PREVIA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="mt-12 pt-8 border-t border-[#DDE2DC] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8B958F]">
          <p>© {new Date().getFullYear()} Previa Technologies Inc. Built for resilient global supply networks.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-[#66736C]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#66836F]" />
              SOC2 Type II & ISO 27001 Verified
            </span>
            <span className="text-[#8B958F]">Privacy Policy</span>
            <span className="text-[#8B958F]">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
