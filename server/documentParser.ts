import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedChunk {
  chunkIndex: number;
  text: string;
  tokenCount: number;
  charCount: number;
  pageNumber: number | null;
  section: string | null;
  keywords: string[];
}

export interface DocumentParseResult {
  success: boolean;
  fileName: string;
  fileType: string;
  detectedFormat: string;
  rawText: string;
  totalCharacters: number;
  totalEstimatedTokens: number;
  totalChunks: number;
  averageChunkSize: number;
  chunks: ParsedChunk[];
  error?: string;
}

// Token estimation helper: ~4 characters per token or ~1.33 tokens per word
export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const wordCount = text.trim().split(/\s+/).length;
  const charEstimate = Math.ceil(text.length / 4);
  const wordEstimate = Math.ceil(wordCount * 1.33);
  return Math.max(charEstimate, wordEstimate);
}

// Extract search keywords and key entities from chunk text
export function extractChunkKeywords(text: string): string[] {
  if (!text) return [];
  const clean = text.toLowerCase().replace(/[^a-z0-9_\-\s]/g, " ");
  const stopWords = new Set([
    "the", "and", "for", "with", "this", "that", "from", "are", "have", "were",
    "will", "which", "been", "has", "had", "they", "their", "into", "more", "also",
    "should", "would", "about", "there", "then", "some", "when", "what", "where"
  ]);

  const words = clean.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const counts = new Map<string, number>();
  for (const w of words) {
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  // Also extract uppercase supply chain acronyms (e.g., SLA, ETA, TEU, demurrage, SKU)
  const acronyms = text.match(/\b[A-Z0-9]{2,8}\b/g) || [];
  for (const ac of acronyms) {
    counts.set(ac.toLowerCase(), (counts.get(ac.toLowerCase()) || 0) + 2);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);
}

// Chunking with ~1200-1500 target characters and ~150-200 character overlap
export function chunkText(
  text: string,
  pageMap?: Array<{ pageNumber: number; startIndex: number; endIndex: number }>,
  targetChunkSize = 1350,
  overlap = 180
): ParsedChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const chunks: ParsedChunk[] = [];
  let currentPos = 0;
  let chunkIndex = 0;

  // Split into paragraphs for boundary-respecting cuts
  while (currentPos < normalized.length) {
    let endPos = Math.min(currentPos + targetChunkSize, normalized.length);

    // If not at the very end, seek the closest sentence end or paragraph break within a window
    if (endPos < normalized.length) {
      const windowStart = Math.max(currentPos + targetChunkSize - 300, currentPos);
      const lookahead = normalized.slice(windowStart, Math.min(endPos + 200, normalized.length));
      
      // Look for paragraph break "\n\n" or sentence break ". \n" or ". "
      const paraBreak = lookahead.lastIndexOf("\n\n");
      const sentenceBreak = lookahead.lastIndexOf(". ");
      const newlineBreak = lookahead.lastIndexOf("\n");

      if (paraBreak !== -1 && windowStart + paraBreak > currentPos + 600) {
        endPos = windowStart + paraBreak + 2;
      } else if (sentenceBreak !== -1 && windowStart + sentenceBreak > currentPos + 600) {
        endPos = windowStart + sentenceBreak + 2;
      } else if (newlineBreak !== -1 && windowStart + newlineBreak > currentPos + 600) {
        endPos = windowStart + newlineBreak + 1;
      }
    }

    const chunkContent = normalized.slice(currentPos, endPos).trim();

    if (chunkContent.length > 0) {
      // Determine page number if pageMap is available
      let pageNumber: number | null = null;
      if (pageMap && pageMap.length > 0) {
        const midPoint = currentPos + Math.floor((endPos - currentPos) / 2);
        const match = pageMap.find(p => midPoint >= p.startIndex && midPoint <= p.endIndex);
        if (match && typeof match.pageNumber === "number") {
          pageNumber = match.pageNumber;
        } else if (pageMap[0] && typeof pageMap[0].pageNumber === "number") {
          pageNumber = pageMap[0].pageNumber;
        }
      }

      // Determine section heading if present
      let section: string | null = null;
      const headingMatch = chunkContent.match(/^(?:#+\s*|[A-Z0-9\s\-_]{3,50}:|\bSECTION\s+[0-9A-Z]+|\bARTICLE\s+[0-9A-Z]+)(.*?)[\n\r]/m);
      if (headingMatch && headingMatch[0]) {
        const cleanSection = headingMatch[0].replace(/[#:]/g, "").trim().slice(0, 80);
        if (cleanSection.length > 0) {
          section = cleanSection;
        }
      }

      chunks.push({
        chunkIndex,
        text: chunkContent,
        charCount: chunkContent.length,
        tokenCount: estimateTokenCount(chunkContent),
        pageNumber,
        section,
        keywords: extractChunkKeywords(chunkContent),
      });

      chunkIndex++;
    }

    if (endPos >= normalized.length) {
      break;
    }

    // Advance position with overlap
    currentPos = Math.max(endPos - overlap, currentPos + 100);
  }

  return chunks;
}

// Master Document Parser
export async function parseDocumentBuffer(
  buffer: Buffer,
  fileName: string,
  declaredMimeType?: string
): Promise<DocumentParseResult> {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  let extractedText = "";
  let detectedFormat = "UNKNOWN";
  const pageMap: Array<{ pageNumber: number; startIndex: number; endIndex: number }> = [];

  try {
    if (ext === "pdf" || declaredMimeType?.includes("pdf")) {
      detectedFormat = "PDF";
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      extractedText = textResult.text || "";

      if (textResult.pages && textResult.pages.length > 0) {
        let runningIndex = 0;
        textResult.pages.forEach((p: { num: number; text: string }) => {
          const pageLen = p.text.length;
          pageMap.push({
            pageNumber: p.num,
            startIndex: runningIndex,
            endIndex: runningIndex + pageLen,
          });
          runningIndex += pageLen + 1;
        });
      } else {
        pageMap.push({
          pageNumber: 1,
          startIndex: 0,
          endIndex: extractedText.length,
        });
      }
      await parser.destroy();
    } else if (ext === "docx" || ext === "doc" || declaredMimeType?.includes("wordprocessingml")) {
      detectedFormat = "DOCX";
      const mammothResult = await mammoth.extractRawText({ buffer });
      extractedText = mammothResult.value || "";
    } else if (
      ext === "txt" ||
      ext === "text" ||
      ext === "md" ||
      ext === "markdown" ||
      ext === "csv" ||
      ext === "json" ||
      declaredMimeType?.includes("text/") ||
      declaredMimeType?.includes("json") ||
      declaredMimeType?.includes("csv")
    ) {
      detectedFormat = ext.toUpperCase() || "TEXT";
      extractedText = buffer.toString("utf-8");
    } else {
      return {
        success: false,
        fileName,
        fileType: declaredMimeType || ext,
        detectedFormat: "UNSUPPORTED",
        rawText: "",
        totalCharacters: 0,
        totalEstimatedTokens: 0,
        totalChunks: 0,
        averageChunkSize: 0,
        chunks: [],
        error: `Unsupported file type ".${ext}". Previa Knowledge Base supports PDF, DOCX, TXT, MD, CSV, and JSON documents.`,
      };
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        fileName,
        fileType: declaredMimeType || ext,
        detectedFormat,
        rawText: "",
        totalCharacters: 0,
        totalEstimatedTokens: 0,
        totalChunks: 0,
        averageChunkSize: 0,
        chunks: [],
        error: `No readable text could be extracted from "${fileName}". The file may be empty, image-only scanned, or corrupted.`,
      };
    }

    const chunks = chunkText(extractedText, pageMap);
    const totalChars = extractedText.length;
    const totalEstimatedTokens = estimateTokenCount(extractedText);
    const avgChunkSize = chunks.length > 0 ? Math.round(totalChars / chunks.length) : 0;

    return {
      success: true,
      fileName,
      fileType: declaredMimeType || ext,
      detectedFormat,
      rawText: extractedText.slice(0, 2000), // snippet of raw text
      totalCharacters: totalChars,
      totalEstimatedTokens,
      totalChunks: chunks.length,
      averageChunkSize: avgChunkSize,
      chunks,
    };
  } catch (err: any) {
    console.error(`[Previa Document Parser] Error parsing "${fileName}":`, err);
    return {
      success: false,
      fileName,
      fileType: declaredMimeType || ext,
      detectedFormat,
      rawText: "",
      totalCharacters: 0,
      totalEstimatedTokens: 0,
      totalChunks: 0,
      averageChunkSize: 0,
      chunks: [],
      error: err?.message || `Failed to process document "${fileName}".`,
    };
  }
}
