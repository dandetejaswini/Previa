import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { getKnowledgeBaseDocuments } from "../lib/knowledgeBaseService";
import { useAuth } from "../context/AuthContext";
import { PreviaBrandIcon } from "./brand/PreviaBrand";

interface RAGLauncherButtonProps {
  onOpen: () => void;
}

export const RAGLauncherButton: React.FC<RAGLauncherButtonProps> = ({ onOpen }) => {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAuth();
  const [docCount, setDocCount] = useState<number>(0);

  useEffect(() => {
    // Only query Firestore if authentication initialization is complete and user is authenticated
    if (!isLoadingAuth && isAuthenticated && currentUser) {
      getKnowledgeBaseDocuments()
        .then((docs) => setDocCount(docs.length))
        .catch((err) => {
          console.warn("[Previa RAG Launcher] Could not load doc count:", err);
        });
    } else {
      setDocCount(0);
    }
  }, [isLoadingAuth, isAuthenticated, currentUser]);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        id="floating-rag-assistant-btn"
        onClick={onOpen}
        className="group relative flex items-center gap-2.5 px-3.5 py-2.5 bg-[#211A27] hover:bg-[#2F2437] text-white rounded-2xl shadow-xl border border-[#483B54] hover:border-[#B96F4A] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        aria-label="Open Previa Knowledge Base Assistant"
      >
        <PreviaBrandIcon size="sm" className="group-hover:scale-105" />

        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-editorial text-[#F7F6F1] tracking-tight">
              Previa RAG
            </span>
            <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded-xs bg-[#B96F4A] text-white">
              AI
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#D8D0C3]/80 block">
            {docCount > 0 ? `${docCount} Docs Grounded` : "Knowledge Assistant"}
          </span>
        </div>

        <Sparkles className="w-3.5 h-3.5 text-[#D9A441] sm:ml-1" />
      </button>
    </div>
  );
};
