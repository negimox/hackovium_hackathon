/**
 * PDF Document Ingestion Script for Financial Advisor RAG
 *
 * Uses gemini-embedding-2-preview for native PDF embedding support.
 *
 * Usage:
 *   npx tsx scripts/ingest-pdfs.ts
 *
 * Environment variables required:
 *   - GOOGLE_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { readdir, readFile } from "fs/promises";
import { join, basename } from "path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const DOCUMENTS_DIR = join(process.cwd(), "ET_Hackathon/documents");
const EMBEDDING_MODEL = "gemini-embedding-2-preview";
const MAX_PDF_PAGES = 6; // gemini-embedding-2 supports up to 6 pages per request
const CHUNK_SIZE_CHARS = 4000; // For text fallback

// ══════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ══════════════════════════════════════════════════════════════════════════════

function getGeminiClient() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer new secret key format, fall back to legacy service_role
  const key = 
    process.env.SUPABASE_SECRET_KEY || 
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are required: " +
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createClient(url, key);
}

// ══════════════════════════════════════════════════════════════════════════════
// EMBEDDING FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generate embedding for a PDF file (up to 6 pages).
 * Uses outputDimensionality=768 to comply with Supabase HNSW limit.
 */
async function embedPdfDirect(
  client: GoogleGenAI,
  pdfBase64: string,
): Promise<number[] | null> {
  try {
    const result = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
        ],
      },
      config: {
        outputDimensionality: 768, // MRL: scale down from 768 to 768
      },
    });

    if (result.embeddings?.[0]?.values) {
      return result.embeddings[0].values;
    }
    return null;
  } catch (error) {
    console.error("  ⚠️  Direct PDF embedding failed:", error);
    return null;
  }
}

/**
 * Generate embedding for text with task prefix.
 * Uses outputDimensionality=768 to comply with Supabase HNSW limit.
 */
async function embedText(
  client: GoogleGenAI,
  text: string,
): Promise<number[] | null> {
  try {
    const formattedText = `title: none | text: ${text}`;

    const result = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: formattedText,
      config: {
        outputDimensionality: 768,
      },
    });

    if (result.embeddings?.[0]?.values) {
      return result.embeddings[0].values;
    }
    return null;
  } catch (error) {
    console.error("  ⚠️  Text embedding failed:", error);
    return null;
  }
}

/**
 * Extract text from PDF using Gemini (for fallback chunking).
 */
async function extractTextFromPdf(
  client: GoogleGenAI,
  pdfBase64: string,
): Promise<string | null> {
  try {
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            text: "Extract all text content from this PDF document. Return only the extracted text, no commentary.",
          },
        ],
      },
    });

    return result.text || null;
  } catch (error) {
    console.error("  ⚠️  Text extraction failed:", error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// METADATA EXTRACTION
// ══════════════════════════════════════════════════════════════════════════════

interface DocumentMetadata {
  source_file: string;
  topic: string;
  category: string;
  is_nism: boolean;
}

function extractMetadata(filename: string): DocumentMetadata {
  const lowerName = filename.toLowerCase();

  // Detect NISM certification documents
  const isNism = lowerName.includes("nism");

  // Topic detection
  let topic = "general";
  let category = "education";

  const topicPatterns: [RegExp, string, string][] = [
    [/tax|taxation/i, "taxation", "tax"],
    [/mutual fund|mfd/i, "mutual_funds", "investment"],
    [/option|derivative/i, "derivatives", "trading"],
    [/futures|commodity/i, "derivatives", "trading"],
    [/currency/i, "forex", "trading"],
    [/technical analysis/i, "technical_analysis", "trading"],
    [/fundamental analysis/i, "fundamental_analysis", "investment"],
    [/personal finance|insurance/i, "personal_finance", "planning"],
    [/risk management|psychology/i, "risk_management", "trading"],
    [/trading system/i, "trading_systems", "trading"],
    [/stock market|introduction/i, "basics", "education"],
    [/investment adviser|advisor/i, "advisory", "compliance"],
    [/compliance|intermediar/i, "compliance", "compliance"],
    [/merchant bank/i, "merchant_banking", "compliance"],
    [/research analyst/i, "research", "compliance"],
    [/depository/i, "depository", "compliance"],
    [/pms|portfolio/i, "portfolio_management", "compliance"],
  ];

  for (const [pattern, t, c] of topicPatterns) {
    if (pattern.test(filename)) {
      topic = t;
      category = c;
      break;
    }
  }

  return {
    source_file: filename,
    topic,
    category,
    is_nism: isNism,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CHUNKING
// ══════════════════════════════════════════════════════════════════════════════

function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE_CHARS,
): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (
      currentChunk.length + paragraph.length > chunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      // Overlap: keep last 200 chars
      currentChunk = currentChunk.slice(-200) + "\n\n" + paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ══════════════════════════════════════════════════════════════════════════════
// DATABASE SETUP
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Ensure the financial_documents table exists with pgvector extension.
 */
async function ensureTableExists(supabase: ReturnType<typeof createClient>) {
  console.log("🔧 Checking database setup...");
  
  // Check if table exists by trying to select from it
  const { error: checkError } = await supabase
    .from("financial_documents")
    .select("id")
    .limit(1);
  
  if (checkError && checkError.message.includes("does not exist")) {
    console.log("   Creating financial_documents table...");
    
    // Create the table using raw SQL via RPC or the REST API
    // Note: This requires the pgvector extension to be enabled first
    const createTableSQL = `
      -- Enable pgvector extension (run this manually if it fails)
      CREATE EXTENSION IF NOT EXISTS vector;
      
      -- Create financial_documents table
      CREATE TABLE IF NOT EXISTS public.financial_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        content text NOT NULL,
        metadata jsonb DEFAULT '{}',
        embedding vector(768),
        fts tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
        created_at timestamptz DEFAULT now()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS financial_documents_embedding_hnsw
      ON public.financial_documents
      USING hnsw (embedding vector_cosine_ops);
      
      CREATE INDEX IF NOT EXISTS financial_documents_fts_gin
      ON public.financial_documents
      USING gin (fts);
      
      CREATE INDEX IF NOT EXISTS financial_documents_metadata_gin
      ON public.financial_documents
      USING gin (metadata);
    `;
    
    // Try to execute via RPC (if you have a run_sql function)
    // If not, print instructions
    console.log("\n" + "═".repeat(60));
    console.log("⚠️  TABLE DOES NOT EXIST");
    console.log("═".repeat(60));
    console.log("\nPlease run this SQL in your Supabase SQL Editor:\n");
    console.log(createTableSQL);
    console.log("\n" + "═".repeat(60));
    console.log("After running the SQL, re-run this script.");
    console.log("═".repeat(60) + "\n");
    process.exit(1);
  } else if (checkError) {
    // Some other error
    console.error("   ❌ Database error:", checkError.message);
    process.exit(1);
  } else {
    console.log("   ✅ Table exists\n");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN INGESTION
// ══════════════════════════════════════════════════════════════════════════════

async function ingestPdfs() {
  console.log("📚 Starting PDF ingestion with gemini-embedding-2-preview\n");

  // Validate environment
  const gemini = getGeminiClient();
  const supabase = getSupabaseClient();

  // Ensure table exists
  await ensureTableExists(supabase);

  // Read PDF files
  let files: string[];
  try {
    const allFiles = await readdir(DOCUMENTS_DIR);
    files = allFiles.filter((f) => f.toLowerCase().endsWith(".pdf"));
  } catch (error) {
    console.error(`❌ Could not read documents directory: ${DOCUMENTS_DIR}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("⚠️  No PDF files found.");
    process.exit(0);
  }

  console.log(`📁 Found ${files.length} PDF(s) to process\n`);

  let totalChunks = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    console.log(`\n📄 Processing: ${file}`);

    const filePath = join(DOCUMENTS_DIR, file);
    const pdfBuffer = await readFile(filePath);
    const pdfBase64 = pdfBuffer.toString("base64");
    const metadata = extractMetadata(file);

    console.log(`   Topic: ${metadata.topic}, Category: ${metadata.category}`);

    // Try direct PDF embedding first (best quality)
    let embedding = await embedPdfDirect(gemini, pdfBase64);

    if (embedding && embedding.length === 768) {
      // Direct PDF embedding worked - save as single document
      console.log(`   ✅ Direct PDF embedding (768 dims)`);

      // Extract text for storage (for FTS)
      const extractedText = await extractTextFromPdf(gemini, pdfBase64);

      const { error } = await supabase.from("financial_documents").insert({
        content: extractedText || `[PDF Content: ${file}]`,
        embedding,
        metadata: {
          ...metadata,
          embedding_type: "direct_pdf",
        },
      });

      if (error) {
        console.log(`   ❌ Insert error: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        totalChunks++;
      }
    } else {
      // Fallback: Extract text and chunk
      console.log(`   ℹ️  Falling back to text extraction + chunking`);

      const extractedText = await extractTextFromPdf(gemini, pdfBase64);

      if (!extractedText) {
        console.log(`   ❌ Could not extract text`);
        errorCount++;
        continue;
      }

      const chunks = chunkText(extractedText);
      console.log(`   📝 Created ${chunks.length} text chunks`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkEmbedding = await embedText(gemini, chunks[i]);

        if (!chunkEmbedding || chunkEmbedding.length !== 768) {
          console.log(`   ⚠️  Chunk ${i + 1} embedding failed`);
          errorCount++;
          continue;
        }

        const { error } = await supabase.from("financial_documents").insert({
          content: chunks[i],
          embedding: chunkEmbedding,
          metadata: {
            ...metadata,
            chunk_index: i,
            total_chunks: chunks.length,
            embedding_type: "text_chunk",
          },
        });

        if (error) {
          console.log(`   ❌ Chunk ${i + 1} insert error: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
          totalChunks++;
        }

        // Rate limiting - avoid hitting API limits
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Brief pause between files
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n" + "═".repeat(60));
  console.log(`✅ Ingestion complete!`);
  console.log(`   Documents processed: ${files.length}`);
  console.log(`   Total chunks created: ${totalChunks}`);
  console.log(`   Successful inserts: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log("═".repeat(60));
}

// Run
ingestPdfs().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
