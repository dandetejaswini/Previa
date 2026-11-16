import React, { useState, useEffect, useRef } from "react";
import { PageView, KnowledgeBaseDocument, KnowledgeBaseChunk } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  parseDocumentOnServer,
  persistIngestedDocument,
  getKnowledgeBaseDocuments,
  deleteKnowledgeBaseDocument,
  DocumentParseApiResponse,
} from "../lib/knowledgeBaseService";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  BookOpen,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
  RefreshCw,
  Eye,
  X,
  FileCheck,
  Tag,
  Hash,
} from "lucide-react";

interface KnowledgeBasePageProps {
  onNavigate: (page: PageView) => void;
  onOpenRAG: () => void;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ onNavigate, onOpenRAG }) => {
  const { currentUser, isAuthenticated, isAdmin, isLoadingAuth, profileRole, openAuthModal } = useAuth();

  // Ingestion state
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [parsePreview, setParsePreview] = useState<DocumentParseApiResponse | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [retryTargetDocId, setRetryTargetDocId] = useState<string | null>(null);

  // Existing documents
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Chunks Inspector Modal
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeBaseDocument | null>(null);
  const [inspectingChunks, setInspectingChunks] = useState<KnowledgeBaseChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const list = await getKnowledgeBaseDocuments();
      setDocuments(list);
    } catch (err) {
      console.error("Error fetching KB documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && isAdmin && currentUser) {
      fetchDocuments();
    }
  }, [isLoadingAuth, isAuthenticated, isAdmin, currentUser]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);
    setUploadProgress(20);
    setPipelineStep("Parsing document & extracting text on server...");

    try {
      const parseResult = await parseDocumentOnServer(file, currentUser?.email || "");
      setUploadProgress(60);
      setParsePreview(parseResult);
      setPipelineStep("Document parsed successfully. Review chunks and confirm indexing.");
    } catch (err: any) {
      console.error("Document parse failed:", err);
      setErrorMessage(err?.message || "Failed to parse document. Please check the file format.");
      setParsePreview(null);
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmIndexing = async () => {
    if (!parsePreview || !currentUser?.email || !selectedFile) return;

    setIsProcessing(true);
    setPipelineStep("Writing document chunks to Firestore database...");

    try {
      await persistIngestedDocument(
        parsePreview,
        currentUser.email,
        selectedFile.size,
        customTitle,
        (progress, status) => {
          setUploadProgress(progress);
          setPipelineStep(status);
        },
        retryTargetDocId || undefined
      );

      setSuccessMessage(
        `Successfully indexed "${customTitle || parsePreview.fileName}" (${parsePreview.chunks.length} chunks, ~${parsePreview.totalEstimatedTokens} tokens). Grounded RAG is now live for this document!`
      );
      setParsePreview(null);
      setSelectedFile(null);
      setRetryTargetDocId(null);
      setCustomTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err: any) {
      console.error("Indexing failed:", err);
      setErrorMessage(err?.message || "Failed to commit chunks to database.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPreview = () => {
    setParsePreview(null);
    setSelectedFile(null);
    setErrorMessage(null);
    setRetryTargetDocId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteKnowledgeBaseDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document.");
    }
  };

  const handleInspectChunks = async (doc: KnowledgeBaseDocument) => {
    setInspectingDoc(doc);
    setIsLoadingChunks(true);
    try {
      const q = query(
        collection(db, "knowledge_base", doc.documentId, "chunks"),
        orderBy("chunkIndex", "asc")
      );
      const snapshot = await getDocs(q);
      const chunks = snapshot.docs.map((d) => d.data() as KnowledgeBaseChunk);
      setInspectingChunks(chunks);
    } catch (err) {
      console.error("Error fetching chunks:", err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  // -------------------------------------------------------------
  // ACCESS CONTROL GATE (If not authenticated as designated Admin)
  // -------------------------------------------------------------
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-parchment">
        <div
          id="admin-kb-access-denied-card"
          className="max-w-lg w-full bg-white border border-graphite rounded-2xl p-8 text-center shadow-xl space-y-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FEECEC] border border-[#F5C2C2] text-[#B92A2A] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-700">
              Admin Ingestion Restricted
            </span>
            <h1 className="text-xl font-editorial font-bold text-charcoal mt-2">
              Knowledge Base Management
            </h1>
            <p className="text-xs text-charcoal-muted mt-2 leading-relaxed">
              Knowledge Base ingestion and document deletion are protected administrative capabilities.
              Only the authenticated Administrator (<strong className="text-charcoal font-mono">tejaswinidande2913@gmail.com</strong>) may ingest documents.
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F4] border border-[#EAE3D8] rounded-xl text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-charcoal-muted">
              <span>Active User:</span>
              <strong className="text-charcoal font-semibold">
                {currentUser?.email || "Unauthenticated"}
              </strong>
            </div>
            <div className="flex justify-between text-charcoal-muted">
              <span>Evaluated Profile Role:</span>
              <span className="font-bold text-copper">{profileRole}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {!isAuthenticated ? (
              <button
                onClick={() => openAuthModal()}
                className="flex-1 py-2.5 px-4 bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In with Admin Google Account
              </button>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="flex-1 py-2.5 px-4 bg-[#211A27] hover:bg-[#2F2437] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Switch Account
              </button>
            )}
            <button
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

  const filteredDocs = documents.filter((d) =>
    (d.title + d.fileName + d.fileType).toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-[#211A27] rounded-2xl p-6 sm:p-8 text-white border border-[#3A3043] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2F6F6D] text-white uppercase tracking-wider">
                Enterprise Ingestion Engine
              </span>
              <span className="text-xs font-mono text-[#D8D0C3]/70">
                Admin: {currentUser?.email || "Admin"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-white tracking-tight">
              Knowledge Base Corpus
            </h1>
            <p className="text-xs text-[#D8D0C3] mt-1.5 max-w-2xl leading-relaxed">
              Upload PDF contracts, supplier standard operating procedures, customs documentation, and demurrage schedules. Documents are parsed, split into contextual ~1350-character chunks with overlap, and indexed directly into Firestore for the shared RAG assistant.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenRAG}
              className="px-4 py-2.5 rounded-xl bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D9A441]" />
              <span>Test Grounded RAG</span>
            </button>
            <button
              onClick={() => onNavigate("admin_dashboard")}
              className="px-4 py-2.5 rounded-xl bg-[#2A2132] hover:bg-[#352A3F] border border-[#4E415A] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Document Upload Zone */}
      {!parsePreview && (
        <div className="bg-white border border-graphite rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-graphite pb-4">
            <div>
              <h2 className="text-base font-bold font-editorial text-charcoal">
                Ingest New Document
              </h2>
              <p className="text-xs text-charcoal-muted">
                Supported formats: PDF (with page mapping), Word DOCX, Plain Text (TXT, Markdown), CSV, JSON
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FAF8F4] border border-graphite text-charcoal">
              Target: ~1350 chars/chunk • ~180 char overlap
            </span>
          </div>

          <div
            id="kb-file-dropzone"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-copper bg-copper-subtle/40 scale-[1.005]"
                : "border-[#D8D2C6] hover:border-copper/60 hover:bg-[#FAF8F4]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.json"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-copper-subtle text-copper flex items-center justify-center mx-auto mb-3 border border-[#E8D5CD]">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-charcoal">
              Drag and drop your enterprise document here
            </h3>
            <p className="text-xs text-charcoal-muted mt-1">
              or click to browse files from your computer
            </p>

            <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-mono text-charcoal-muted">
              <span className="px-2 py-0.5 bg-[#FAF8F4] border border-graphite rounded">PDF</span>
              <span className="px-2 py-0.5 bg-[#FAF8F4] border border-graphite rounded">DOCX</span>
              <span className="px-2 py-0.5 bg-[#FAF8F4] border border-graphite rounded">TXT</span>
              <span className="px-2 py-0.5 bg-[#FAF8F4] border border-graphite rounded">MD</span>
              <span className="px-2 py-0.5 bg-[#FAF8F4] border border-graphite rounded">CSV</span>
              <span className="px-2 py-0.5 bg-[#FAF8F4] border border-graphite rounded">JSON</span>
            </div>
          </div>

          {isProcessing && (
            <div className="p-4 bg-[#FAF8F4] border border-[#EAE3D8] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                <span>{pipelineStep}</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#EAE3D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-copper transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parse Preview & Confirmation Step */}
      {parsePreview && (
        <div className="bg-white border border-graphite rounded-2xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-graphite pb-4">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-forest-subtle text-forest">
                Extraction Complete
              </span>
              <h2 className="text-lg font-bold font-editorial text-charcoal mt-1">
                Document Chunking & Structure Preview
              </h2>
              <p className="text-xs text-charcoal-muted">
                Review the extracted chunks, estimated tokens, and section boundaries before committing to Firestore.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelPreview}
                disabled={isProcessing}
                className="px-3 py-2 border border-graphite hover:bg-parchment rounded-xl text-xs font-semibold text-charcoal cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-index-btn"
                onClick={handleConfirmIndexing}
                disabled={isProcessing}
                className="px-5 py-2 bg-copper hover:bg-[#A25E43] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing Chunks...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Confirm & Commit to Knowledge Base</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Document Title Input & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-bold uppercase text-charcoal-muted mb-1">
                Display Title (Visible in RAG Citations)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Global Ocean Freight Carrier Agreement 2026"
                className="w-full px-3.5 py-2 bg-[#FAF8F4] border border-graphite rounded-xl text-xs text-charcoal font-semibold focus:outline-hidden focus:border-copper"
              />
            </div>

            <div className="bg-[#FAF8F4] border border-[#EAE3D8] rounded-xl p-3">
              <span className="text-[10px] font-mono text-charcoal-muted uppercase block">
                Total Chunks Generated
              </span>
              <span className="text-lg font-bold font-editorial text-charcoal">
                {parsePreview.chunks.length} chunks
              </span>
              <span className="text-[10px] font-mono text-charcoal-muted block mt-0.5">
                Avg: {parsePreview.averageChunkSize} chars
              </span>
            </div>

            <div className="bg-[#FAF8F4] border border-[#EAE3D8] rounded-xl p-3">
              <span className="text-[10px] font-mono text-charcoal-muted uppercase block">
                Estimated Token Count
              </span>
              <span className="text-lg font-bold font-editorial text-charcoal">
                ~{parsePreview.totalEstimatedTokens.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-charcoal-muted block mt-0.5">
                Format: {parsePreview.detectedFormat}
              </span>
            </div>
          </div>

          {/* Chunk Sample Carousel / List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal-muted">
                Generated Chunks Preview (First 5 chunks)
              </h3>
              <span className="text-[11px] text-charcoal-muted">
                Showing {Math.min(parsePreview.chunks.length, 5)} of {parsePreview.chunks.length}
              </span>
            </div>

            <div className="space-y-3">
              {parsePreview.chunks.slice(0, 5).map((c) => (
                <div
                  key={c.chunkIndex}
                  className="bg-[#FAF8F4] border border-[#EAE3D8] rounded-xl p-4 text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-charcoal-muted border-b border-[#EAE3D8] pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-graphite font-bold text-charcoal">
                        Chunk #{c.chunkIndex + 1}
                      </span>
                      {c.pageNumber && (
                        <span className="text-copper font-semibold">
                          Page {c.pageNumber}
                        </span>
                      )}
                      {c.section && c.section !== "undefined" ? (
                        <span className="text-charcoal truncate max-w-xs font-semibold">
                          Section: "{c.section}"
                        </span>
                      ) : (
                        <span className="text-charcoal-muted truncate max-w-xs italic">
                          Section not detected
                        </span>
                      )}
                    </div>
                    <span>
                      {c.charCount} chars • ~{c.tokenCount} tokens
                    </span>
                  </div>

                  <p className="text-charcoal leading-relaxed whitespace-pre-wrap font-sans text-xs">
                    {c.text}
                  </p>

                  {c.keywords && c.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <Tag className="w-3 h-3 text-charcoal-muted shrink-0" />
                      {c.keywords.slice(0, 8).map((k, ki) => (
                        <span
                          key={ki}
                          className="px-1.5 py-0.2 rounded bg-white border border-graphite text-[9px] font-mono text-charcoal-muted"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Existing Knowledge Base Documents Table */}
      <div className="bg-white border border-graphite rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-graphite flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F4]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-copper" />
            <div>
              <h2 className="text-sm font-bold font-editorial text-charcoal">
                Indexed Enterprise Documents ({documents.length})
              </h2>
              <p className="text-[11px] text-charcoal-muted">
                These documents constitute the active retrieval source for the shared Previa RAG assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter documents..."
                className="pl-8 pr-3 py-1.5 bg-white border border-graphite rounded-lg text-xs text-charcoal placeholder:text-charcoal-muted focus:outline-hidden focus:border-copper w-48"
              />
            </div>
            <button
              onClick={fetchDocuments}
              disabled={isLoadingDocs}
              className="p-1.5 rounded-lg border border-graphite hover:bg-white text-charcoal-muted hover:text-charcoal transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {isLoadingDocs ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-charcoal-muted font-medium">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-xs text-charcoal-muted">
              {documents.length === 0
                ? "No documents in Knowledge Base yet. Use the upload area above to ingest your first file."
                : "No documents matching your search filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-graphite text-[10px] font-mono uppercase text-charcoal-muted">
                <tr>
                  <th className="py-3 px-4 font-bold">Document Title / File</th>
                  <th className="py-3 px-4 font-bold">Format</th>
                  <th className="py-3 px-4 font-bold">Chunks</th>
                  <th className="py-3 px-4 font-bold">Tokens</th>
                  <th className="py-3 px-4 font-bold">Uploaded Date</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite">
                {filteredDocs.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-[#FAF8F4]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
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
                      {(doc.chunkCount ?? 0) > 0 ? (
                        <span>{doc.chunkCount} chunks</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          0 chunks (Incomplete)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted">
                      ~{doc.totalEstimatedTokens?.toLocaleString() || "—"}
                    </td>
                    <td className="py-3 px-4 text-charcoal-muted font-mono text-[11px]">
                      {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(doc.chunkCount ?? 0) === 0 && (
                          <button
                            onClick={() => {
                              setRetryTargetDocId(doc.documentId);
                              if (fileInputRef.current) {
                                fileInputRef.current.click();
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Retry document indexing"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                            <span>Retry</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleInspectChunks(doc)}
                          className="px-2.5 py-1 text-xs font-semibold text-charcoal hover:bg-parchment rounded-lg border border-graphite flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inspect chunks"
                        >
                          <Eye className="w-3.5 h-3.5 text-copper" />
                          <span>Chunks</span>
                        </button>

                        {deleteConfirmId === doc.documentId ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(doc.documentId)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-gray-200 text-charcoal rounded text-[10px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(doc.documentId)}
                            className="p-1.5 text-charcoal-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chunks Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#16111B]/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-graphite rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden text-charcoal">
            <div className="p-4 bg-[#211A27] text-white border-b border-[#3A3043] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#B86F52] text-white flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-editorial text-white">
                    Chunk Inspector: {inspectingDoc.title}
                  </h3>
                  <p className="text-[10px] text-[#A39CA8] font-mono">
                    {inspectingDoc.fileName} • {inspectingDoc.chunkCount} Total Chunks
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1 text-[#A39CA8] hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-parchment/30">
              {isLoadingChunks ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-charcoal-muted">Loading chunks from Firestore...</p>
                </div>
              ) : inspectingChunks.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-graphite space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-charcoal">No Indexed Chunks Found</p>
                    <p className="text-[11px] text-charcoal-muted max-w-md mx-auto">
                      This document entry does not have indexed chunks stored in Firestore (which can happen if a previous write batch was interrupted). You can click "Retry" in the document list to re-index all chunks cleanly.
                    </p>
                  </div>
                </div>
              ) : (
                inspectingChunks.map((chunk) => (
                  <div
                    key={chunk.chunkId}
                    className="bg-white border border-graphite rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-charcoal-muted border-b border-graphite pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#FAF8F4] border border-graphite font-bold text-charcoal">
                          Chunk #{chunk.chunkIndex + 1}
                        </span>
                        {chunk.pageNumber && (
                          <span className="text-copper font-semibold">
                            Page {chunk.pageNumber}
                          </span>
                        )}
                        {chunk.section && chunk.section !== "undefined" ? (
                          <span className="text-charcoal font-semibold">
                            Section: "{chunk.section}"
                          </span>
                        ) : (
                          <span className="text-charcoal-muted italic">
                            Section not detected
                          </span>
                        )}
                      </div>
                      <span>~{chunk.tokenCount} tokens</span>
                    </div>

                    <p className="text-xs text-charcoal leading-relaxed whitespace-pre-wrap font-sans">
                      {chunk.text}
                    </p>

                    {chunk.keywords && chunk.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <Tag className="w-3 h-3 text-charcoal-muted shrink-0" />
                        {chunk.keywords.slice(0, 10).map((kw, kwi) => (
                          <span
                            key={kwi}
                            className="px-1.5 py-0.2 rounded bg-[#FAF8F4] border border-graphite text-[9px] font-mono text-charcoal-muted"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#FAF8F4] border-t border-graphite flex justify-end">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 bg-charcoal text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
