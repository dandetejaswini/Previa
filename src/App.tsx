import React, { useState, useEffect } from "react";
import { PageView } from "./types";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { IntelligencePage } from "./pages/IntelligencePage";
import { ContactPage } from "./pages/ContactPage";
import { ControlTowerPage } from "./pages/ControlTowerPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { KnowledgeBasePage } from "./pages/KnowledgeBasePage";
import { SignUpPage } from "./pages/SignUpPage";
import { LoginPage } from "./pages/LoginPage";
import { RAGChatbotModal } from "./components/RAGChatbotModal";
import { RAGLauncherButton } from "./components/RAGLauncherButton";
import { ShieldAlert } from "lucide-react";

function parseInitialPage(): PageView {
  const hash = window.location.hash.replace("#", "").toLowerCase();
  if (
    hash === "about" ||
    hash === "intelligence" ||
    hash === "contact" ||
    hash === "control_tower" ||
    hash === "admin_dashboard" ||
    hash === "admin_knowledge_base" ||
    hash === "signup" ||
    hash === "login"
  ) {
    return hash as PageView;
  }
  return "home";
}

function MainApp() {
  const {
    redirectTarget,
    isAuthenticated,
    isLoadingAuth,
    authModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    closeAuthModal,
    openAuthModal,
  } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>(parseInitialPage);

  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(undefined);
  const [ragModalOpen, setRagModalOpen] = useState(false);

  // Sync with browser hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (
        hash === "home" ||
        hash === "about" ||
        hash === "intelligence" ||
        hash === "contact" ||
        hash === "control_tower" ||
        hash === "admin_dashboard" ||
        hash === "admin_knowledge_base" ||
        hash === "signup" ||
        hash === "login"
      ) {
        setCurrentPage(hash as PageView);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // If already authenticated and on login/signup, redirect to intelligence
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && (currentPage === "signup" || currentPage === "login")) {
      const target = redirectTarget || "intelligence";
      setCurrentPage(target as PageView);
      window.location.hash = target;
    }
  }, [isLoadingAuth, isAuthenticated, currentPage, redirectTarget]);

  const handleNavigate = (page: PageView) => {
    if (page === "intelligence" && !isAuthenticated) {
      openAuthModal("intelligence", "signin");
      return;
    }
    if ((page === "admin_dashboard" || page === "admin_knowledge_base") && !isAuthenticated) {
      openAuthModal(page, "signin");
      return;
    }
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectSampleScenario = (scenario: string) => {
    setSelectedScenario(scenario);
    handleNavigate("intelligence");
  };

  return (
    <div className="min-h-screen flex flex-col bg-parchment font-sans antialiased text-charcoal selection:bg-[#E6D0C5] selection:text-[#211A27]">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === "home" && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectSampleScenario={handleSelectSampleScenario}
          />
        )}

        {currentPage === "about" && <AboutPage onNavigate={handleNavigate} />}

        {currentPage === "signup" && <SignUpPage onNavigate={handleNavigate} />}

        {currentPage === "login" && <LoginPage onNavigate={handleNavigate} />}

        {currentPage === "intelligence" && (
          isLoadingAuth ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#D8D2C6] border-t-[#B86F52] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-charcoal-muted">
                Verifying Previa AI authorization...
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white border border-graphite rounded-2xl p-8 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-copper-subtle text-copper flex items-center justify-center mx-auto border border-[#E8D5CD]">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-editorial font-bold text-charcoal">
                    Authentication Required
                  </h2>
                  <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
                    Access to the Previa AI Engine, disruption simulations, and operational telemetry requires an authenticated operator session.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    id="access-gate-signin-btn"
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-copper hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    id="access-gate-signup-btn"
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-white border border-graphite hover:border-[#B86F52] text-charcoal text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                  <button
                    id="access-gate-home-btn"
                    type="button"
                    onClick={() => handleNavigate("home")}
                    className="w-full text-xs font-semibold text-charcoal-muted hover:text-charcoal pt-1 cursor-pointer"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <IntelligencePage
              initialScenario={selectedScenario}
              onClearInitialScenario={() => setSelectedScenario(undefined)}
            />
          )
        )}

        {currentPage === "control_tower" && (
          <ControlTowerPage
            onNavigate={handleNavigate}
            onOpenRAG={() => setRagModalOpen(true)}
          />
        )}

        {currentPage === "contact" && <ContactPage />}

        {currentPage === "admin_dashboard" && (
          <AdminDashboard
            onNavigate={handleNavigate}
            onOpenRAG={() => setRagModalOpen(true)}
          />
        )}

        {currentPage === "admin_knowledge_base" && (
          <KnowledgeBasePage
            onNavigate={handleNavigate}
            onOpenRAG={() => setRagModalOpen(true)}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Floating Shared RAG Assistant Button */}
      <RAGLauncherButton onOpen={() => setRagModalOpen(true)} />

      {/* Shared RAG Chatbot Modal */}
      <RAGChatbotModal
        isOpen={ragModalOpen}
        onClose={() => setRagModalOpen(false)}
      />

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={closeAuthModal}
        onModeChange={setAuthMode}
        onNavigate={handleNavigate}
        onSuccess={() => {
          if (
            redirectTarget === "intelligence" ||
            currentPage === "intelligence" ||
            currentPage === "signup" ||
            currentPage === "login"
          ) {
            setCurrentPage("intelligence");
            window.location.hash = "intelligence";
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
