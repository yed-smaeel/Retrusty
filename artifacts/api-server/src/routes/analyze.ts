import { Router } from "express";
import * as https from "https";
import * as http from "http";

const router = Router();

const GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com";
const MODEL_NAME = "gpt-4o-mini";

const ANALYZE_SYSTEM_PROMPT = `You are a legal document analyst AI. Your job is to analyze legal documents (Terms & Conditions, Privacy Policies, EULAs, cookie policies, etc.) and produce a clear, structured report that a non-lawyer can understand.

Your analysis must include:

## Summary
A 2-3 sentence plain-English overview of what the document is and who it applies to.

## Key Findings
The most important things a user must know — highlight anything unusual, restrictive, or user-unfriendly.

## Data Collection & Privacy
What personal data is collected, how it's used, and who it's shared with.

## User Rights
What rights the user has (opt-out, deletion, access, etc.).

## Red Flags
Any clauses that are particularly aggressive, one-sided, unusual, or potentially harmful to users. Be specific. If none, state "No major red flags found."

## Overall Rating
Rate the document on a scale: User-Friendly / Neutral / Restrictive / Very Restrictive. Include a one-sentence justification.

Use markdown formatting. Be concise but thorough. Do NOT include any preamble — output ONLY the analysis.`;

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https://") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Retrusty-Analyzer/1.0)",
          Accept: "text/html,text/plain,*/*",
        },
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          fetchUrl(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

function stripHtml(html: string): string {
  // Remove scripts, styles, nav, header, footer elements and their content
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Limit to ~12000 chars to stay within token limits
  return text.slice(0, 12000);
}

router.post("/analyze", async (req, res) => {
  const { url, text } = req.body as { url?: string; text?: string };

  if (!url && !text) {
    res.status(400).json({ error: "Provide either a URL or document text" });
    return;
  }

  const apiKey = process.env.GITHUB_MODELS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GitHub Models API key not configured" });
    return;
  }

  let documentText = text || "";

  if (url) {
    try {
      const raw = await fetchUrl(url);
      // Detect if it's HTML or plain text
      const isHtml = /<html|<!doctype/i.test(raw.slice(0, 500));
      documentText = isHtml ? stripHtml(raw) : raw.slice(0, 12000);
      if (!documentText.trim()) {
        res
          .status(422)
          .json({ error: "Could not extract readable text from that URL" });
        return;
      }
    } catch (err: any) {
      req.log.warn({ err, url }, "Failed to fetch URL");
      res.status(422).json({
        error: `Could not fetch that URL: ${err.message || "unknown error"}`,
      });
      return;
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const userPrompt = `Please analyze the following legal document:\n\n---\n${documentText}\n---`;

  try {
    const response = await fetch(`${GITHUB_MODELS_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: ANALYZE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      req.log.error(
        { status: response.status, body: errorBody },
        "GitHub Models API error"
      );
      res.write(
        `data: ${JSON.stringify({ error: `API error (${response.status})` })}\n\n`
      );
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: "No response body" })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6);
          if (raw === "[DONE]") {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error streaming from GitHub Models");
    res.write(
      `data: ${JSON.stringify({ error: "Failed to analyze document" })}\n\n`
    );
    res.end();
  }
});

export default router;
