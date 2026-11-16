import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  collectionGroup,
  writeBatch,
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import {
  KnowledgeBaseDocument,
  KnowledgeBaseChunk,
  RAGSourceCitation,
  RAGAnswerResponse,
} from "../types";

export interface DocumentParseApiResponse {
  success: boolean;
  fileName: string;
  fileType: string;
  detectedFormat: string;
  rawText: string;
  totalCharacters: number;
  totalEstimatedTokens: number;
  totalChunks: number;
  averageChunkSize: number;
  chunks: Array<{
    chunkIndex: number;
    text: string;
    tokenCount: number;
    charCount: number;
    pageNumber?: number | null;
    section?: string | null;
    keywords: string[];
  }>;
  error?: string;
}

// Deep removal of undefined properties to guarantee Firestore compatibility
export function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeUndefined) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        result[k] = removeUndefined(v);
      }
    }
    return result as T;
  }
  return value;
}

// Strict validator to ensure zero undefined values reach Firestore
export function validateNoUndefined(value: any, path = "payload"): void {
  if (value === undefined) {
    throw new Error(`Firestore Serialization Error: Unsupported field value 'undefined' found at ${path}`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoUndefined(item, `${path}[${index}]`));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) {
        throw new Error(`Firestore Serialization Error: Unsupported field value 'undefined' found in field '${k}' in document ${path}`);
      }
      validateNoUndefined(v, `${path}.${k}`);
    }
  }
}

// Normalize chunk payload guaranteeing all required fields and converting optional fields to null
export function normalizeChunkForFirestore(
  rawChunk: any,
  documentId: string,
  fileName: string,
  createdAt: string
): KnowledgeBaseChunk {
  if (!rawChunk || typeof rawChunk !== "object") {
    throw new Error("Invalid chunk encountered: Chunk data must be a non-null object.");
  }

  const chunkIndex = typeof rawChunk.chunkIndex === "number" && !isNaN(rawChunk.chunkIndex)
    ? rawChunk.chunkIndex
    : 0;

  const rawText = rawChunk.text;
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new Error(`Document indexing failed: Chunk #${chunkIndex} contains no extractable text.`);
  }
  const text = rawText.trim();

  const tokenCount = typeof rawChunk.tokenCount === "number" && !isNaN(rawChunk.tokenCount) && rawChunk.tokenCount >= 0
    ? rawChunk.tokenCount
    : Math.max(1, Math.ceil(text.length / 4));

  // section: strictly valid string or null - NEVER undefined
  const section = typeof rawChunk.section === "string" && rawChunk.section.trim().length > 0 && rawChunk.section.trim() !== "undefined"
    ? rawChunk.section.trim()
    : null;

  // pageNumber: strictly positive number or null - NEVER undefined
  const pageNumber = typeof rawChunk.pageNumber === "number" && !isNaN(rawChunk.pageNumber) && rawChunk.pageNumber > 0
    ? rawChunk.pageNumber
    : null;

  const keywords: string[] = Array.isArray(rawChunk.keywords)
    ? rawChunk.keywords.filter((k: any) => typeof k === "string" && k.trim().length > 0).map((k: string) => k.trim())
    : [];

  const chunkId = typeof rawChunk.chunkId === "string" && rawChunk.chunkId.trim().length > 0
    ? rawChunk.chunkId.trim()
    : `${documentId}_c${chunkIndex}`;

  const sourceFileName = typeof rawChunk.sourceFileName === "string" && rawChunk.sourceFileName.trim().length > 0
    ? rawChunk.sourceFileName.trim()
    : (fileName || "document");

  const normalized: KnowledgeBaseChunk = {
    chunkId,
    documentId,
    sourceFileName,
    chunkIndex,
    pageNumber,
    section,
    text,
    tokenCount,
    keywords,
    createdAt: typeof rawChunk.createdAt === "string" && rawChunk.createdAt.trim().length > 0
      ? rawChunk.createdAt.trim()
      : createdAt,
  };

  return removeUndefined(normalized);
}

// Normalize document metadata guaranteeing valid Firestore values
export function normalizeDocumentMetadataForFirestore(
  documentId: string,
  parseResult: DocumentParseApiResponse,
  adminEmail: string,
  fileSize: number,
  customTitle?: string,
  existingCreatedAt?: string
): KnowledgeBaseDocument {
  const now = new Date().toISOString();
  const title = typeof customTitle === "string" && customTitle.trim().length > 0
    ? customTitle.trim()
    : (parseResult.fileName || "Untitled Document");

  const totalChars = typeof parseResult.totalCharacters === "number" && !isNaN(parseResult.totalCharacters)
    ? parseResult.totalCharacters
    : 0;

  const totalTokens = typeof parseResult.totalEstimatedTokens === "number" && !isNaN(parseResult.totalEstimatedTokens)
    ? parseResult.totalEstimatedTokens
    : 0;

  const totalChunks = Array.isArray(parseResult.chunks) ? parseResult.chunks.length : 0;

  const avgChunkSize = typeof parseResult.averageChunkSize === "number" && !isNaN(parseResult.averageChunkSize)
    ? parseResult.averageChunkSize
    : (totalChunks > 0 ? Math.round(totalChars / totalChunks) : 0);

  const docData: KnowledgeBaseDocument = {
    documentId,
    title,
    fileName: parseResult.fileName || "unknown_file",
    fileType: parseResult.fileType || "application/octet-stream",
    fileSize: typeof fileSize === "number" && !isNaN(fileSize) ? fileSize : 0,
    uploadedBy: typeof adminEmail === "string" && adminEmail.trim().length > 0 ? adminEmail.trim() : "admin",
    uploadedAt: existingCreatedAt || now,
    processingStatus: "COMPLETED",
    totalCharacters: totalChars,
    totalTokens: totalTokens,
    totalEstimatedTokens: totalTokens,
    totalChunks: totalChunks,
    chunkCount: totalChunks,
    averageChunkSize: avgChunkSize,
    source: "Previa Admin Ingestion",
    version: 1,
  };

  return removeUndefined(docData);
}

// Convert File object to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip off the data:*/*;base64, header prefix
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

// 1. Call server parsing endpoint
export async function parseDocumentOnServer(
  file: File,
  adminEmail: string
): Promise<DocumentParseApiResponse> {
  const base64Data = await fileToBase64(file);

  const res = await fetch("/api/kb/parse-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || file.name.split(".").pop(),
      base64Data,
      adminEmail,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to process document: ${res.statusText}`);
  }

  return data;
}

// 2. Persist parsed document and chunks to Firestore atomically
export async function persistIngestedDocument(
  parseResult: DocumentParseApiResponse,
  adminEmail: string,
  fileSize: number,
  customTitle?: string,
  onProgress?: (progress: number, status: string) => void,
  targetDocumentId?: string
): Promise<KnowledgeBaseDocument> {
  const now = new Date().toISOString();

  // Step 1: Resolve Document ID (Check for retry / existing document by ID or exact filename to avoid duplicate entries)
  let documentId = targetDocumentId;
  let existingCreatedAt: string | undefined;

  if (!documentId) {
    try {
      const existingQ = query(
        collection(db, "knowledge_base"),
        where("fileName", "==", parseResult.fileName),
        limit(1)
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        const match = existingSnap.docs[0];
        documentId = match.id;
        const matchData = match.data() as KnowledgeBaseDocument;
        existingCreatedAt = matchData.uploadedAt;
        console.log(`[KnowledgeBase] Found existing document entry "${documentId}" for file "${parseResult.fileName}". Re-indexing in place.`);
      }
    } catch (lookupErr) {
      console.warn("[KnowledgeBase] Non-fatal existing document lookup warning:", lookupErr);
    }
  }

  if (!documentId) {
    documentId = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Step 2: Validate that extracted text chunks exist
  if (!Array.isArray(parseResult.chunks) || parseResult.chunks.length === 0) {
    throw new Error(`Cannot index document "${parseResult.fileName}": No valid text chunks were extracted.`);
  }

  // Step 3: Normalize and validate document metadata
  const docData = normalizeDocumentMetadataForFirestore(
    documentId,
    parseResult,
    adminEmail,
    fileSize,
    customTitle,
    existingCreatedAt
  );
  validateNoUndefined(docData, `knowledge_base/${documentId}`);

  // Step 4: Normalize and validate every single chunk BEFORE initiating any Firestore write
  const normalizedChunks: KnowledgeBaseChunk[] = [];
  for (let idx = 0; idx < parseResult.chunks.length; idx++) {
    const rawChunk = parseResult.chunks[idx];
    const normalized = normalizeChunkForFirestore(
      rawChunk,
      documentId,
      parseResult.fileName,
      now
    );
    // Explicit validation: throw error immediately if any field is undefined
    validateNoUndefined(normalized, `knowledge_base/${documentId}/chunks/${normalized.chunkId}`);
    normalizedChunks.push(normalized);
  }

  // Step 5: Clean up any legacy or partial chunks from an earlier failed attempt to prevent orphaned chunks
  try {
    const oldChunksSnap = await getDocs(collection(db, "knowledge_base", documentId, "chunks"));
    if (!oldChunksSnap.empty) {
      const BATCH_SIZE = 400;
      const docs = oldChunksSnap.docs;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const cleanupBatch = writeBatch(db);
        docs.slice(i, i + BATCH_SIZE).forEach((d) => cleanupBatch.delete(d.ref));
        await cleanupBatch.commit();
      }
      console.log(`[KnowledgeBase] Cleaned up ${docs.length} prior chunks for document ${documentId}`);
    }
  } catch (cleanErr) {
    console.warn("[KnowledgeBase] Non-fatal legacy chunks cleanup warning:", cleanErr);
  }

  // Step 6: Commit all normalized data using Firestore WriteBatch
  try {
    if (onProgress) onProgress(15, "Preparing atomic Firestore WriteBatch...");
    const totalChunks = normalizedChunks.length;
    const CHUNK_BATCH_SIZE = 250;

    if (totalChunks <= 450) {
      // Small/medium documents fit into a single atomic WriteBatch (Firestore max is 500)
      const batch = writeBatch(db);

      // Write parent document
      const docRef = doc(db, "knowledge_base", documentId);
      batch.set(docRef, docData);

      // Write all chunks
      for (const chunk of normalizedChunks) {
        const chunkRef = doc(db, "knowledge_base", documentId, "chunks", chunk.chunkId);
        batch.set(chunkRef, chunk);
      }

      if (onProgress) onProgress(60, `Committing atomic batch (${totalChunks} chunks)...`);
      await batch.commit();
      if (onProgress) onProgress(100, "Document fully indexed and ready for retrieval.");
    } else {
      // Large documents: write chunks in safe batches
      const docRef = doc(db, "knowledge_base", documentId);
      await setDoc(docRef, docData);

      for (let i = 0; i < totalChunks; i += CHUNK_BATCH_SIZE) {
        const slice = normalizedChunks.slice(i, i + CHUNK_BATCH_SIZE);
        const batch = writeBatch(db);

        for (const chunk of slice) {
          const chunkRef = doc(db, "knowledge_base", documentId, "chunks", chunk.chunkId);
          batch.set(chunkRef, chunk);
        }

        await batch.commit();
        const pct = Math.min(95, 20 + Math.round(((i + slice.length) / totalChunks) * 75));
        if (onProgress) onProgress(pct, `Saved ${Math.min(i + slice.length, totalChunks)} of ${totalChunks} chunks...`);
      }

      if (onProgress) onProgress(100, "Document fully indexed and ready for retrieval.");
    }

    return docData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `knowledge_base/${documentId}`);
    throw error;
  }
}

// 3. Fetch all Knowledge Base documents
export async function getKnowledgeBaseDocuments(): Promise<KnowledgeBaseDocument[]> {
  if (!auth.currentUser) {
    return [];
  }
  try {
    const q = query(collection(db, "knowledge_base"), orderBy("uploadedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as KnowledgeBaseDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "knowledge_base");
    throw error;
  }
}

// 4. Delete a document and all its chunks
export async function deleteKnowledgeBaseDocument(documentId: string): Promise<void> {
  try {
    // Delete all chunks first
    const chunksRef = collection(db, "knowledge_base", documentId, "chunks");
    const snapshot = await getDocs(chunksRef);

    const BATCH_SIZE = 400;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      docs.slice(i, i + BATCH_SIZE).forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    }

    // Delete parent doc
    await deleteDoc(doc(db, "knowledge_base", documentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `knowledge_base/${documentId}`);
    throw error;
  }
}

// 5. Retrieve top matching chunks for a question
export async function searchKnowledgeBaseChunks(
  question: string,
  topK = 5
): Promise<KnowledgeBaseChunk[]> {
  if (!auth.currentUser) {
    throw new Error("Sign in to use the Previa Knowledge Assistant.");
  }

  try {
    // Extract search query keywords (removing punctuation, lowercasing)
    const cleanQuery = question.toLowerCase().replace(/[^a-z0-9_\-\s]/g, " ");
    const stopWords = new Set([
      "what", "when", "where", "which", "who", "whom", "this", "that", "these", "those",
      "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
      "do", "does", "did", "the", "a", "an", "and", "or", "but", "in", "on", "at",
      "to", "for", "with", "about", "against", "between", "into", "through", "during",
      "before", "after", "above", "below", "from", "up", "down", "can", "could", "tell",
      "me", "how", "why", "our", "my", "your"
    ]);

    const queryTokens = Array.from(
      new Set(
        cleanQuery
          .split(/\s+/)
          .filter((t) => t.length >= 2 && !stopWords.has(t))
      )
    );

    // Also look for exact acronyms / numbers in the raw question
    const acronyms = (question.match(/\b[A-Z0-9]{2,10}\b/g) || []).map((a) => a.toLowerCase());

    // Fetch chunks using collectionGroup
    const chunksGroup = query(collectionGroup(db, "chunks"), limit(120));
    const snapshot = await getDocs(chunksGroup);

    if (snapshot.empty) {
      return [];
    }

    const scoredChunks: Array<{ chunk: KnowledgeBaseChunk; score: number }> = [];

    snapshot.forEach((snap) => {
      const chunk = snap.data() as KnowledgeBaseChunk;
      const textLower = (chunk.text || "").toLowerCase();
      const keywordsSet = new Set((chunk.keywords || []).map((k) => k.toLowerCase()));
      const sectionLower = (chunk.section && typeof chunk.section === "string" && chunk.section !== "undefined" ? chunk.section : "").toLowerCase();
      const fileLower = (chunk.sourceFileName || "").toLowerCase();

      let score = 0;

      for (const token of queryTokens) {
        // Keyword match boost
        if (keywordsSet.has(token)) {
          score += 6;
        }
        // Section title match boost
        if (sectionLower.includes(token)) {
          score += 8;
        }
        // File name match boost
        if (fileLower.includes(token)) {
          score += 5;
        }
        // Exact word match in body
        const regex = new RegExp(`\\b${token}\\b`, "gi");
        const matches = textLower.match(regex);
        if (matches) {
          score += Math.min(matches.length * 3, 12);
        } else if (textLower.includes(token)) {
          score += 1;
        }
      }

      for (const ac of acronyms) {
        if (textLower.includes(ac)) {
          score += 10;
        }
      }

      if (score > 0) {
        scoredChunks.push({ chunk, score });
      }
    });

    // Sort by relevance score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // Return top K chunks
    return scoredChunks.slice(0, topK).map((s) => s.chunk);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "chunks");
    console.error("[Previa Knowledge Base] Error retrieving chunks:", error);
    return [];
  }
}

// 6. Execute Grounded RAG Chat with Server
export async function askRAGChatbot(
  question: string,
  conversationHistory?: Array<{ role: "user" | "model"; content: string }>
): Promise<RAGAnswerResponse> {
  // 1. Retrieve grounded chunks from Firestore
  const retrievedChunks = await searchKnowledgeBaseChunks(question, 5);

  // 2. Call server endpoint
  let res: Response;
  try {
    res = await fetch("/api/rag/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        retrievedChunks,
        conversationHistory,
      }),
    });
  } catch (netErr: any) {
    console.error("[Previa RAG] Network error reaching /api/rag/chat:", netErr);
    throw new Error("Previa AI could not process the request right now. Please try again.");
  }

  // Safely inspect response headers and status
  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch (parseErr) {
      console.warn("[Previa RAG] Failed to parse JSON response:", parseErr);
      data = null;
    }
  }

  if (!res.ok || !data || data.success === false) {
    if (!data) {
      throw new Error("Previa AI could not process the request right now. Please try again.");
    }

    const errObj = data.error;
    const errorCode = typeof errObj === "object" ? errObj?.code : data.code;
    const errorMessage =
      typeof errObj === "object" ? errObj?.message : typeof errObj === "string" ? errObj : "";

    if (
      res.status === 503 ||
      errorCode === "GEMINI_UNAVAILABLE" ||
      String(errorMessage).includes("temporarily unavailable") ||
      String(errorMessage).includes("temporarily unable")
    ) {
      throw new Error(
        "Previa AI is temporarily unavailable while synthesizing the grounded answer. Please try again in a moment."
      );
    }

    throw new Error(errorMessage || "Previa AI could not synthesize the answer right now. Please try again.");
  }

  return {
    answer: data.answer,
    citations: data.citations || [],
    groundedChunkCount: data.groundedChunkCount || 0,
    isInsufficientKnowledge: data.isInsufficientKnowledge || false,
    matchedChunks: retrievedChunks,
  };
}
