import React, { useState } from "react";
import { PageView } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
  Layers,
  Activity,
  Zap,
  Radio,
  BookOpen,
  UserCheck,
} from "lucide-react";
import { UserActivityModal } from "./ai/UserActivityModal";
import { PreviaBrand } from "./brand/PreviaBrand";

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const {
    currentUser,
    isAuthenticated,
    setAuthModalOpen,
    setAuthMode,
    openAuthModal,
    logout,
    profileRole,
    isAdmin,
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const handleNavClick = (page: PageView) => {
    if (page === "intelligence" && !isAuthenticated) {
      openAuthModal("intelligence");
      setMobileMenuOpen(false);
      return;
    }
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const handleLaunchSimulation = () => {
    if (!isAuthenticated) {
      openAuthModal("intelligence");
      setMobileMenuOpen(false);
      return;
    }
    onNavigate("intelligence");
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#211A27] text-parchment border-b border-[#3A3043] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <PreviaBrand
              variant="dark"
              size="md"
              subtitleText="Supply Chain Intelligence Console"
              onClick={() => handleNavClick("home")}
            />

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {isAdmin ? (
                // Designated Admin Navigation: Home, About, Dashboard, Knowledge Base
                <>
                  <button
                    id="nav-link-home"
                    onClick={() => handleNavClick("home")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === "home"
                        ? "text-white bg-[#33283D] font-bold shadow-2xs border border-[#4D3C5B]"
                        : "text-[#D8D0C3] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    Home
                  </button>

                  <button
                    id="nav-link-about"
                    onClick={() => handleNavClick("about")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === "about"
                        ? "text-white bg-[#33283D] font-bold shadow-2xs border border-[#4D3C5B]"
                        : "text-[#D8D0C3] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    About
                  </button>

                  <button
                    id="nav-link-admin-dashboard"
                    onClick={() => handleNavClick("admin_dashboard")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentPage === "admin_dashboard"
                        ? "text-white bg-[#B86F52] font-bold shadow-xs border border-[#CD8569]"
                        : "text-[#E7E1D7] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#E7A68C]" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    id="nav-link-admin-kb"
                    onClick={() => handleNavClick("admin_knowledge_base")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentPage === "admin_knowledge_base"
                        ? "text-white bg-[#B86F52] font-bold shadow-xs border border-[#CD8569]"
                        : "text-[#E7E1D7] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D9A441]" />
                    <span>Knowledge Base</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" />
                  </button>
                </>
              ) : (
                // Standard USER Navigation: Home, About, Previa AI, Control Tower, Contact
                <>
                  <button
                    id="nav-link-home"
                    onClick={() => handleNavClick("home")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === "home"
                        ? "text-white bg-[#33283D] font-bold shadow-2xs border border-[#4D3C5B]"
                        : "text-[#D8D0C3] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    Home
                  </button>

                  <button
                    id="nav-link-about"
                    onClick={() => handleNavClick("about")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === "about"
                        ? "text-white bg-[#33283D] font-bold shadow-2xs border border-[#4D3C5B]"
                        : "text-[#D8D0C3] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    About
                  </button>

                  <button
                    id="nav-link-intelligence"
                    onClick={() => handleNavClick("intelligence")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentPage === "intelligence"
                        ? "text-white bg-[#B86F52] font-bold shadow-xs border border-[#CD8569]"
                        : "text-[#E7E1D7] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    <span>Previa AI</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" />
                  </button>

                  <button
                    id="nav-link-control-tower"
                    onClick={() => handleNavClick("control_tower")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === "control_tower"
                        ? "text-white bg-[#33283D] font-bold shadow-2xs border border-[#4D3C5B]"
                        : "text-[#D8D0C3] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    Control Tower
                  </button>

                  <button
                    id="nav-link-contact"
                    onClick={() => handleNavClick("contact")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === "contact"
                        ? "text-white bg-[#33283D] font-bold shadow-2xs border border-[#4D3C5B]"
                        : "text-[#D8D0C3] hover:text-white hover:bg-[#2C2234]"
                    }`}
                  >
                    Contact
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Desktop Right Action / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-[#3A3043] bg-[#2A2132] hover:border-[#4E415A] hover:bg-[#32273C] transition-all text-left cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#B86F52] text-white flex items-center justify-center text-[10px] font-bold font-mono">
                    {(currentUser.name || currentUser.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {currentUser.name || currentUser.email}
                  </span>
                  <span
                    id="user-profile-role-badge"
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                      isAdmin
                        ? "bg-[#B86F52]/25 border border-[#B86F52]/60 text-[#F5B49D]"
                        : "bg-[#2F6F6D]/25 border border-[#2F6F6D]/60 text-[#8AE3E0]"
                    }`}
                  >
                    {profileRole}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#A39CA8]" />
                </button>

                {profileDropdownOpen && (
                  <div
                    id="user-profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-64 bg-[#261E2E] rounded-xl shadow-2xl border border-[#3A3043] py-1.5 z-50 animate-in fade-in"
                  >
                    <div className="px-3.5 py-2.5 border-b border-[#3A3043]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-bold text-[#A39CA8] uppercase tracking-wider font-mono">
                          Authenticated Profile
                        </p>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                            isAdmin
                              ? "bg-[#B86F52]/30 text-[#F5B49D] border border-[#B86F52]/60"
                              : "bg-[#2F6F6D]/30 text-[#8AE3E0] border border-[#2F6F6D]/60"
                          }`}
                        >
                          {profileRole}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate">
                        {currentUser.name || currentUser.email}
                      </p>
                      <p className="text-[10px] text-[#A39CA8] truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <>
                          <button
                            id="profile-dropdown-admin-dashboard-btn"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              onNavigate("admin_dashboard");
                            }}
                            className="w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#E7E1D7] hover:bg-[#33283D] hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#E7A68C]" />
                            Knowledge Base Dashboard
                          </button>
                          <button
                            id="profile-dropdown-admin-kb-btn"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              onNavigate("admin_knowledge_base");
                            }}
                            className="w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#E7E1D7] hover:bg-[#33283D] hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-[#D9A441]" />
                            Knowledge Base Management
                          </button>
                        </>
                      )}

                      <button
                        id="profile-dropdown-previa-ai-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate("intelligence");
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#E7E1D7] hover:bg-[#33283D] hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#B86F52]" />
                        Previa AI Engine
                      </button>
                      <button
                        id="profile-dropdown-control-tower-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate("control_tower");
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#E7E1D7] hover:bg-[#33283D] hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#2F6F6D]" />
                        Control Tower
                      </button>

                      <button
                        id="profile-dropdown-my-activity-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setIsActivityModalOpen(true);
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#E7E1D7] hover:bg-[#33283D] hover:text-white flex items-center gap-2 cursor-pointer border-t border-[#3A3043]/60 pt-1.5 mt-0.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#B86F52]" />
                        <span>My Activity</span>
                      </button>
                    </div>

                    <div className="border-t border-[#3A3043] pt-1">
                      <button
                        id="signout-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-xs font-semibold text-[#A94B45] hover:bg-[#3A2226] flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="navbar-signin-btn"
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setAuthModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#E7E1D7] hover:text-white hover:bg-[#2C2234] rounded-xl border border-[#3A3043] transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Launch Simulation CTA */}
            <button
              id="nav-launch-simulation-cta"
              onClick={handleLaunchSimulation}
              className="px-4 py-2 bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-[#CD8569]/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FBF5E5]" />
              <span>Launch Simulation</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#D8D0C3] hover:text-white hover:bg-[#2C2234]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden border-b border-[#3A3043] bg-[#211A27] px-4 pt-2 pb-4 space-y-2">
          {isAdmin ? (
            <>
              <button
                id="mobile-nav-link-home"
                onClick={() => handleNavClick("home")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  currentPage === "home" ? "bg-[#33283D] text-white font-bold" : "text-[#D8D0C3]"
                }`}
              >
                Home
              </button>
              <button
                id="mobile-nav-link-about"
                onClick={() => handleNavClick("about")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  currentPage === "about" ? "bg-[#33283D] text-white font-bold" : "text-[#D8D0C3]"
                }`}
              >
                About
              </button>
              <button
                id="mobile-nav-link-admin-dashboard"
                onClick={() => handleNavClick("admin_dashboard")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  currentPage === "admin_dashboard" ? "bg-[#B86F52] text-white font-bold" : "text-[#E7E1D7]"
                }`}
              >
                <Layers className="w-4 h-4 text-[#E7A68C]" />
                <span>Dashboard</span>
              </button>
              <button
                id="mobile-nav-link-admin-kb"
                onClick={() => handleNavClick("admin_knowledge_base")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  currentPage === "admin_knowledge_base" ? "bg-[#B86F52] text-white font-bold" : "text-[#E7E1D7]"
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#D9A441]" />
                <span>Knowledge Base</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="mobile-nav-link-home"
                onClick={() => handleNavClick("home")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  currentPage === "home" ? "bg-[#33283D] text-white font-bold" : "text-[#D8D0C3]"
                }`}
              >
                Home
              </button>
              <button
                id="mobile-nav-link-about"
                onClick={() => handleNavClick("about")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  currentPage === "about" ? "bg-[#33283D] text-white font-bold" : "text-[#D8D0C3]"
                }`}
              >
                About
              </button>
              <button
                id="mobile-nav-link-intelligence"
                onClick={() => handleNavClick("intelligence")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between ${
                  currentPage === "intelligence" ? "bg-[#B86F52] text-white" : "text-[#E7E1D7]"
                }`}
              >
                <span>Previa AI</span>
                <span className="w-2 h-2 rounded-full bg-[#D9A441]" />
              </button>
              <button
                id="mobile-nav-link-control-tower"
                onClick={() => handleNavClick("control_tower")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  currentPage === "control_tower" ? "bg-[#33283D] text-white font-bold" : "text-[#D8D0C3]"
                }`}
              >
                Control Tower
              </button>
              <button
                id="mobile-nav-link-contact"
                onClick={() => handleNavClick("contact")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  currentPage === "contact" ? "bg-[#33283D] text-white font-bold" : "text-[#D8D0C3]"
                }`}
              >
                Contact
              </button>
            </>
          )}

          <div className="pt-3 border-t border-[#3A3043] space-y-2">
            {isAuthenticated && currentUser ? (
              <div className="px-3 py-2 bg-[#261E2E] border border-[#3A3043] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-full bg-[#B86F52] text-white flex items-center justify-center text-xs font-bold font-mono">
                    {(currentUser.name || currentUser.email || "U")[0].toUpperCase()}
                  </div>
                  <div className="truncate text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
                      <span
                        className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold ${
                          isAdmin ? "bg-[#B86F52]/30 text-[#F5B49D]" : "bg-[#2F6F6D]/30 text-[#8AE3E0]"
                        }`}
                      >
                        {profileRole}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#A39CA8] truncate">{currentUser.email}</div>
                  </div>
                </div>
                <button
                  id="mobile-drawer-signout-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="p-1.5 text-[#A94B45] hover:bg-[#3A2226] rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="mobile-drawer-signin-btn"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthMode("signin");
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#3A3043] bg-[#261E2E] text-white hover:bg-[#33283D] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Sign In
              </button>
            )}

            <button
              id="mobile-drawer-launch-simulation-btn"
              onClick={handleLaunchSimulation}
              className="w-full py-2.5 px-4 rounded-xl bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Simulation</span>
            </button>
          </div>
        </div>
      )}
      {/* Authenticated User Activity Modal (Agent 11) */}
      <UserActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      />
    </header>
  );
};
