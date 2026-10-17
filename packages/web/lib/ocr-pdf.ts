import sharp from "sharp";
import { extractTextFromVisionImage } from "@/lib/ocr-extract";

export const PDF_OCR_PAGE_LIMIT = Number.parseInt(
  process.env.PDF_OCR_PAGE_LIMIT || "10",
  10
);

export async function ocrPdfFromBuffer(
  pdfBuffer: Buffer,
  options: {
    pageLimit?: number;
    customInstructions?: string;
  } = {}
): Promise<{ textContent: string; tokensUsed: number; error?: string }> {
  const pageLimit = options.pageLimit ?? PDF_OCR_PAGE_LIMIT;
  let pageCount = 1;
  try {
    const meta = await sharp(pdfBuffer, { density: 200 }).metadata();
    pageCount = Math.min(meta.pages ?? 1, pageLimit);
  } catch {
    pageCount = 1;
  }

  const parts: string[] = [];
  let tokensUsed = 0;

  for (let page = 0; page < pageCount; page++) {
    let png: Buffer;
    try {
      png = await sharp(pdfBuffer, { density: 200, page })
        .png()
        .toBuffer();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PDF page render failed";
      return { textContent: "", tokensUsed: 0, error: message };
    }

    const result = await extractTextFromVisionImage({
      image: { kind: "buffer", buffer: png },
      customInstructions: options.customInstructions,
      retryOnEmpty: true,
    });
    if (result.error) {
      return { textContent: "", tokensUsed, error: result.error };
    }
    tokensUsed += result.tokensUsed;
    if (result.text) {
      parts.push(result.text);
    }
  }

  const textContent = parts.join("\n\n---\n\n");
  return { textContent, tokensUsed };
}
