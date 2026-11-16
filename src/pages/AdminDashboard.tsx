import React, { useState, useEffect } from "react";
import { PageView, KnowledgeBaseDocument } from "../types";
import { useAuth } from "../context/AuthContext";
import { getKnowledgeBaseDocuments, deleteKnowledgeBaseDocument } from "../lib/knowledgeBaseService";
import {
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Database,
  Cpu,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface AdminDashboardProps {
  onNavigate: (page: PageView) => void;
  onOpenRAG: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onOpenRAG }) => {
  const { currentUser, isAuthenticated, isAdmin, isLoadingAuth, profileRole, openAuthModal } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const list = await getKnowledgeBaseDocuments();
      setDocuments(list);
    } catch (err) {
      console.error("Failed to load KB docs in dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && isAdmin && currentUser) {
      fetchDocs();
    }
  }, [isLoadingAuth, isAuthenticated, isAdmin, currentUser]);

  const handleDelete = async (docId: string) => {
    setIsDeleting(true);
    try {
      await deleteKnowledgeBaseDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document. Please check network and permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // ACCESS CONTROL GATE (If not authenticated as designated Admin)
  // -------------------------------------------------------------
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-parchment">
        <div
          id="admin-access-denied-card"
          className="max-w-lg w-full bg-white border border-graphite rounded-2xl p-8 text-center shadow-xl space-y-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FEECEC] border border-[#F5C2C2] text-[#B92A2A] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-700">
              Access Restricted
            </span>
            <h1 className="text-xl font-editorial font-bold text-charcoal mt-2">
              Administrator Console
            </h1>
            <p className="text-xs text-charcoal-muted mt-2 leading-relaxed">
              This console and the Knowledge Base document ingestion pipeline are restricted exclusively to the designated Previa Administrator (
              <strong className="text-charcoal font-mono">tejaswinidande2913@gmail.com</strong>).
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F4] border border-[#EAE3D8] rounded-xl text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-charcoal-muted">
              <span>Current Session:</span>
              <strong className="text-charcoal font-semibold">
                {currentUser?.email || "Unauthenticated"}
              </strong>
            </div>
            <div className="flex justify-between text-charcoal-muted">
              <span>Evaluated Profile Role:</span>
              <span className="font-bold text-copper">{profileRole}</span>
            </div>
            <div className="flex justify-between text-charcoal-muted">
              <span>Admin Privileges:</span>
              <span className="font-bold text-red-600">DENIED</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {!isAuthenticated ? (
              <button
                id="admin-signin-gate-btn"
                onClick={() => openAuthModal()}
                className="flex-1 py-2.5 px-4 bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In with Admin Google Account
              </button>
            ) : (
              <button
                id="admin-switch-account-btn"
                onClick={() => openAuthModal()}
                className="flex-1 py-2.5 px-4 bg-[#211A27] hover:bg-[#2F2437] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Switch Account
              </button>
            )}
            <button
              id="admin-return-home-btn"
              onClick={() => onNavigate("home")}
              className="py-2.5 px-4 border border-graphite hover:bg-parchment text-charcoal text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate aggregates
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunkCount || d.totalChunks || 0), 0);
  const totalTokens = documents.reduce((acc, d) => acc + (d.totalEstimatedTokens || d.totalTokens || 0), 0);
  const totalCharacters = documents.reduce((acc, d) => acc + (d.totalCharacters || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#211A27] rounded-2xl p-6 sm:p-8 text-white border border-[#3A3043] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B86F52] text-white uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Administrator Profile Active
              </span>
              <span className="text-xs font-mono text-[#D8D0C3]/70">
                {currentUser?.email || "Admin"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-white tracking-tight">
              Knowledge Base & Operations Console
            </h1>
            <p className="text-xs text-[#D8D0C3] mt-1.5 max-w-2xl leading-relaxed">
              Centralized administrative dashboard for document ingestion, chunk indexing, and enterprise RAG corpus management. Upload agreements, supplier manuals, and tariffs to empower accurate, zero-hallucination answers across the platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="admin-go-to-kb-btn"
              onClick={() => onNavigate("admin_knowledge_base")}
              className="px-4 py-2.5 rounded-xl bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ingest New Document</span>
            </button>
            <button
              id="admin-launch-rag-btn"
              onClick={onOpenRAG}
              className="px-4 py-2.5 rounded-xl bg-[#2A2132] hover:bg-[#352A3F] border border-[#4E415A] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D9A441]" />
              <span>Test Shared RAG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-graphite rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Indexed Documents
            </span>
            <BookOpen className="w-4 h-4 text-copper" />
          </div>
          <div className="text-2xl font-bold font-editorial text-charcoal">
            {isLoading ? "..." : documents.length}
          </div>
          <p className="text-[10px] text-charcoal-muted mt-1 font-mono">
            PDF, DOCX, TXT, CSV, JSON
          </p>
        </div>

        <div className="bg-white border border-graphite rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Total Chunks
            </span>
            <Layers className="w-4 h-4 text-forest" />
          </div>
          <div className="text-2xl font-bold font-editorial text-charcoal">
            {isLoading ? "..." : totalChunks.toLocaleString()}
          </div>
          <p className="text-[10px] text-charcoal-muted mt-1 font-mono">
            ~1350 chars with ~180 overlap
          </p>
        </div>

        <div className="bg-white border border-graphite rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Estimated Tokens
            </span>
            <Cpu className="w-4 h-4 text-[#8C5D9F]" />
          </div>
          <div className="text-2xl font-bold font-editorial text-charcoal">
            {isLoading ? "..." : totalTokens.toLocaleString()}
          </div>
          <p className="text-[10px] text-charcoal-muted mt-1 font-mono">
            Grounding context window
          </p>
        </div>

        <div className="bg-white border border-graphite rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Security Rules
            </span>
            <CheckCircle2 className="w-4 h-4 text-forest" />
          </div>
          <div className="text-sm font-bold text-forest mt-1 flex items-center gap-1">
            <span>Enforced in Firestore</span>
          </div>
          <p className="text-[10px] text-charcoal-muted mt-1 font-mono">
            Admin writes • Authenticated reads
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigate("admin_knowledge_base")}
          className="bg-white border border-graphite hover:border-copper/60 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-copper-subtle text-copper flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold font-editorial text-charcoal">
              Knowledge Base Manager
            </h2>
            <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
              Upload PDF and Word contracts, parse text, preview chunks, inspect metadata, and maintain the enterprise index.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-graphite flex items-center justify-between text-xs font-bold text-copper">
            <span>Manage Documents</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={onOpenRAG}
          className="bg-white border border-graphite hover:border-copper/60 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#211A27] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-[#D9A441]" />
            </div>
            <h2 className="text-base font-bold font-editorial text-charcoal">
              Enterprise RAG Chatbot
            </h2>
            <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
              Test queries against your uploaded documents with source-grounded citations, page references, and zero hallucination.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-graphite flex items-center justify-between text-xs font-bold text-copper">
            <span>Open Assistant</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate("control_tower")}
          className="bg-white border border-graphite hover:border-copper/60 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-forest-subtle text-forest flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold font-editorial text-charcoal">
              Control Tower Telemetry
            </h2>
            <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
              View active logistics corridors, simulated disruption alerts, and cross-modal shipping lanes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-graphite flex items-center justify-between text-xs font-bold text-forest">
            <span>View Corridors</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Indexed Documents Table */}
      <div className="bg-white border border-graphite rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-graphite flex items-center justify-between bg-[#FAF8F4]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-copper" />
            <div>
              <h2 className="text-sm font-bold font-editorial text-charcoal">
                Active Knowledge Documents
              </h2>
              <p className="text-[11px] text-charcoal-muted">
                {documents.length} document{documents.length === 1 ? "" : "s"} indexed in Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDocs}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-graphite hover:bg-white text-charcoal-muted hover:text-charcoal transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline text-[11px]">Refresh</span>
            </button>
            <button
              onClick={() => onNavigate("admin_knowledge_base")}
              className="px-3 py-1.5 bg-copper hover:bg-[#A25E43] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-charcoal-muted font-medium">
              Loading Knowledge Base documents...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F4] border border-[#EAE3D8] text-charcoal-muted flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-charcoal">
              No Documents Ingested Yet
            </h3>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
              Upload your organization's first supply chain policy, carrier contract, or operating manual to populate the Knowledge Base.
            </p>
            <button
              onClick={() => onNavigate("admin_knowledge_base")}
              className="px-4 py-2 bg-copper text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-graphite text-[10px] font-mono uppercase text-charcoal-muted">
                <tr>
                  <th className="py-3 px-4 font-bold">Document Title</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Chunks</th>
                  <th className="py-3 px-4 font-bold">Estimated Tokens</th>
                  <th className="py-3 px-4 font-bold">Uploaded Date</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite">
                {documents.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-[#FAF8F4]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-copper shrink-0" />
                        <div>
                          <div className="font-bold text-charcoal">{doc.title}</div>
                          <div className="text-[10px] text-charcoal-muted font-mono truncate max-w-xs">
                            {doc.fileName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FAF8F4] border border-graphite text-charcoal">
                        {doc.fileType.split("/").pop() || doc.fileType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-charcoal">
                      {doc.chunkCount} chunks
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted">
                      {doc.totalEstimatedTokens?.toLocaleString() || "—"} tokens
                    </td>
                    <td className="py-3 px-4 text-charcoal-muted font-mono text-[11px]">
                      {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {deleteConfirmId === doc.documentId ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDelete(doc.documentId)}
                            disabled={isDeleting}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            {isDeleting ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={isDeleting}
                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-charcoal rounded text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(doc.documentId)}
                          className="p-1.5 text-charcoal-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete document and chunks"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
