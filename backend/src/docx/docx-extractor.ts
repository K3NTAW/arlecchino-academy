import mammoth from "mammoth";
import type { ExtractedPdf } from "../types";

export async function extractDocxContent(fileBuffer: Buffer): Promise<ExtractedPdf> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return {
      text: result.value.trim(),
      imageCount: 0,
      usedOcrFallback: false
    };
  } catch {
    return {
      text: "",
      imageCount: 0,
      usedOcrFallback: false
    };
  }
}
