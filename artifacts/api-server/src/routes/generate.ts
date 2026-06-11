import { Router } from "express";
import { GenerateDocumentBody } from "@workspace/api-zod";

const router = Router();

const GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com";
const MODEL_NAME = "gpt-4o-mini";

const SYSTEM_PROMPTS: Record<string, string> = {
  tnc: `You are a legal document expert AI assistant. Generate professional, comprehensive Terms and Conditions documents.
Write in clear, formal legal language. Include standard sections like: Acceptance of Terms, User Obligations, Intellectual Property,
Limitation of Liability, Termination, Governing Law, and Dispute Resolution.
Tailor the document based on the business details provided. Use proper markdown formatting with headers (##), bold text, and numbered lists.
Do NOT include any preamble or explanation — output ONLY the Terms and Conditions document itself.`,

  privacy: `You are a legal document expert AI assistant. Generate professional, comprehensive Privacy Policy documents that comply with GDPR, CCPA, and other major privacy regulations.
Write in clear, formal legal language. Include standard sections like: Information We Collect, How We Use Your Information,
Data Sharing and Disclosure, Data Security, Your Rights, Cookies and Tracking, Children's Privacy, Changes to This Policy, and Contact Information.
Tailor the document based on the business details provided. Use proper markdown formatting with headers (##), bold text, and numbered lists.
Do NOT include any preamble or explanation — output ONLY the Privacy Policy document itself.`,

  license: `You are a legal document expert AI assistant specializing in open-source and software licenses.
Generate a custom software license based on the user's requirements. Use proper markdown formatting.
Do NOT include any preamble or explanation — output ONLY the license text itself.`,

  summary: `You are a legal expert AI assistant. Your task is to analyze the provided software license text and summarize it for a layperson.
Break it down strictly into three clear sections:
## Permissions
What the user is allowed to do (e.g., Commercial use, Modification, Distribution).
## Conditions
What the user must do (e.g., Include copyright notice, State changes, Disclose source).
## Limitations
What the user cannot do or what the licensor is protected against (e.g., No Liability, No Warranty, Trademark use).

Be concise and use bullet points. Do NOT include any preamble or explanation. Output ONLY the markdown summary.`,
};

function buildUserPrompt(data: {
  type: string;
  businessName?: string | null;
  jurisdiction?: string | null;
  industry?: string | null;
  specialNeeds?: string | null;
  licenseType?: string | null;
  year?: string | null;
  fullname?: string | null;
  customRequirements?: string | null;
  licenseText?: string | null;
}): string {
  if (data.type === "summary") {
    return `Please summarize the following license text:\n\n---\n${data.licenseText || ""}\n---`;
  }

  let prompt = `Generate a ${
    data.type === "tnc"
      ? "Terms and Conditions"
      : data.type === "privacy"
        ? "Privacy Policy"
        : "License"
  } document for the following:\n\n`;

  if (data.businessName) prompt += `**Business Name:** ${data.businessName}\n`;
  if (data.fullname) prompt += `**Author / Organization:** ${data.fullname}\n`;
  if (data.jurisdiction) prompt += `**Jurisdiction:** ${data.jurisdiction}\n`;
  if (data.industry) prompt += `**Industry:** ${data.industry}\n`;
  if (data.year) prompt += `**Year:** ${data.year}\n`;
  if (data.licenseType && data.licenseType !== "Custom")
    prompt += `**License Type:** ${data.licenseType}\n`;
  if (data.specialNeeds)
    prompt += `\n**Special Requirements:**\n${data.specialNeeds}\n`;
  if (data.customRequirements)
    prompt += `\n**License Requirements:**\n${data.customRequirements}\n`;

  prompt += `\nPlease generate a complete, professional document ready for use. Use the current date as the effective date.`;
  return prompt;
}

router.post("/generate", async (req, res) => {
  const parsed = GenerateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const apiKey = process.env.GITHUB_MODELS_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "GitHub Models API key not configured" });
    return;
  }

  const systemPrompt = SYSTEM_PROMPTS[data.type] || SYSTEM_PROMPTS.tnc;
  const userPrompt = buildUserPrompt(data);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      req.log.error({ status: response.status, body: errorBody }, "GitHub Models API error");
      res.write(`data: ${JSON.stringify({ error: `API error (${response.status})` })}\n\n`);
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
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

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
            // skip malformed JSON chunks
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error streaming from GitHub Models");
    res.write(`data: ${JSON.stringify({ error: "Failed to generate document" })}\n\n`);
    res.end();
  }
});

export default router;
