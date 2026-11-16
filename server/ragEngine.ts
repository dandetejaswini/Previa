import { GoogleGenAI } from "@google/genai";

export interface RetrievedChunkContext {
  chunkId: string;
  documentId: string;
  sourceFileName: string;
  pageNumber?: number;
  section?: string;
  text: string;
  tokenCount?: number;
}

export interface RAGCitation {
  fileName: string;
  pageNumber?: number;
  section?: string;
  chunkId?: string;
  excerpt?: string;
}

export interface RAGAnswerResult {
  success: boolean;
  answer: string;
  citations: RAGCitation[];
  groundedChunkCount: number;
  isInsufficientKnowledge: boolean;
  error?: string;
}

// Centralized RAG synthesis model constant
export const RAG_MODEL = "gemini-3.6-flash";

const RAG_SYSTEM_INSTRUCTION = `You are the Previa Enterprise RAG Assistant. Your sole purpose is to answer supply chain, logistics, and organizational questions strictly and accurately using the provided retrieved context from the organization's Knowledge Base.

CRITICAL GROUNDING PRINCIPLES:
1. Ground your answers strictly in the retrieved Knowledge Base context provided.
2. Do NOT invent, assume, or hallucinate facts that are not directly supported by the retrieved excerpts.
3. If the retrieved context is empty, or does not contain enough information to answer the question, state clearly: "The current Knowledge Base does not contain enough information to answer this inquiry." Suggest what specific documents, operational procedures, or contracts might be required.
4. Distinguish explicit facts found in the retrieved excerpts from any operational recommendations.
5. In your answer, include specific source citations matching the retrieved files, pages, and sections (e.g. "[Source: shipping-policy.pdf, Page 3]" or "[Source: supplier-sla.docx, Section: Lead Time SLAs]").
6. Maintain an objective, professional, and mathematically rigorous tone appropriate for enterprise supply chain and procurement operators.`;

// Helper to test for transient Gemini errors (503 UNAVAILABLE, transient 429 rate limit spikes)
function isTransientGeminiError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err?.error?.code || err?.error?.status;
  const message = String(err.message || err?.error?.message || "");

  // HTTP 503 or UNAVAILABLE
  if (status === 503 || status === "UNAVAILABLE" || status === "503") return true;
  // HTTP 429 or RESOURCE_EXHAUSTED
  if (status === 429 || status === "RESOURCE_EXHAUSTED" || status === "429") return true;

  if (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable") ||
    message.includes("Resource has been exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit")
  ) {
    return true;
  }

  return false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateGroundedRAGAnswer(
  ai: GoogleGenAI,
  question: string,
  retrievedChunks: RetrievedChunkContext[],
  conversationHistory?: Array<{ role: "user" | "model"; content: string }>
): Promise<RAGAnswerResult> {
  // If no chunks retrieved, respond cleanly without calling Gemini
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return {
      success: true,
      answer: "The current Knowledge Base does not contain enough information to answer this inquiry. No relevant document chunks were matched for this query. An Admin may upload relevant documentation (e.g., supplier agreements, standard operating procedures, customs tariffs) to the Knowledge Base to enable grounded answers.",
      citations: [],
      groundedChunkCount: 0,
      isInsufficientKnowledge: true,
    };
  }

  // Format retrieved chunks into clean numbered context blocks
  const formattedContext = retrievedChunks
    .map((c, idx) => {
      const loc = [
        `Source: ${c.sourceFileName}`,
        c.pageNumber ? `Page: ${c.pageNumber}` : null,
        c.section ? `Section: "${c.section}"` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      return `--- [Excerpt ${idx + 1} | ${loc}] ---\n${c.text.trim()}\n`;
    })
    .join("\n");

  const prompt = `RETRIEVED KNOWLEDGE BASE CONTEXT:
${formattedContext}

USER INQUIRY:
${question}

Provide a grounded, professional response based strictly on the retrieved context above with precise citations.`;

  const MAX_ATTEMPTS = 3;
  const BACKOFF_DELAYS = [1000, 2000, 4000];
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[Previa RAG Engine] Retrying Gemini synthesis (attempt ${attempt}/${MAX_ATTEMPTS})...`);
      }

      const response = await ai.models.generateContent({
        model: RAG_MODEL,
        contents: prompt,
        config: {
          systemInstruction: RAG_SYSTEM_INSTRUCTION,
          temperature: 0.2, // Low temperature for high factual precision and zero hallucination
        },
      });

      const answerText = response.text || "";

      // Build unique citations from the chunks used
      const citations: RAGCitation[] = retrievedChunks.map(c => ({
        fileName: c.sourceFileName,
        pageNumber: c.pageNumber,
        section: c.section,
        chunkId: c.chunkId,
        excerpt: c.text.slice(0, 160).trim() + "...",
      }));

      // Deduplicate citations by fileName + pageNumber + section
      const seen = new Set<string>();
      const deduplicatedCitations = citations.filter(c => {
        const key = `${c.fileName}-${c.pageNumber || 0}-${c.section || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const isInsufficient = answerText.toLowerCase().includes("does not contain enough information");

      return {
        success: true,
        answer: answerText,
        citations: deduplicatedCitations,
        groundedChunkCount: retrievedChunks.length,
        isInsufficientKnowledge: isInsufficient,
      };
    } catch (err: any) {
      lastError = err;
      const isTransient = isTransientGeminiError(err);
      console.error(
        `[Previa RAG Engine] Gemini generation error on attempt ${attempt}/${MAX_ATTEMPTS} (transient: ${isTransient}):`,
        err?.message || err
      );

      // Do not retry non-transient errors (auth, invalid input, etc.) or if maximum attempts reached
      if (!isTransient || attempt >= MAX_ATTEMPTS) {
        throw err;
      }

      const delayMs = BACKOFF_DELAYS[attempt - 1] || 2000;
      await sleep(delayMs);
    }
  }

  throw lastError;
}
