# Retrusty

> **Your legal OS. Generate bulletproof documents in seconds, not weeks.**

Founders move fast. Lawyers don't. Retrusty bridges the gap — giving builders, indie hackers, and small teams instant access to professional-grade legal documents powered by AI, without the billable hours.

---

## The Problem

Starting a product means writing code, not legal documents. But every serious product needs:

- Terms & Conditions before you go live
- A Privacy Policy before you collect a single email
- A software license before you open-source your repo

Most founders copy-paste from random websites, use templates that don't match their jurisdiction, or spend thousands on a lawyer for boilerplate they could have generated in 30 seconds.

**Retrusty solves this.** Fill in a few details about your business, click generate, and get a complete, jurisdiction-aware legal document streamed back in real time.

---

## What It Does

### Terms & Conditions Generator
Describe your business and Retrusty drafts a full T&C tailored to your industry and jurisdiction.

**Example:** A SaaS startup in Delaware fills in their company name, picks "SaaS," adds "No refunds after 30 days" as a special clause — and gets a complete Terms & Conditions document in under 10 seconds.

### Privacy Policy Generator
GDPR, CCPA, and beyond. Enter your business details and get a comprehensive privacy policy that covers what data you collect, how you use it, and user rights.

**Example:** A mobile app founder in the EU needs a GDPR-compliant policy before submission to the App Store. They fill in their app details, specify "European Union" as jurisdiction, and get a policy ready to paste into their website.

### License Designer
Pick from 8 standard OSS licenses (MIT, Apache 2.0, GPL v3, AGPL v3, BSD 2/3-Clause, MPL 2.0, Unlicense) with instant preview — or describe your custom requirements and let AI draft a bespoke commercial license. A built-in "Human Summary" tab translates any license into plain English.

**Example:** An open-source library author wants a license that's free for personal use but requires a commercial license for business use. They select "Custom (AI Generated)," describe their requirements, and get a unique license in seconds. They then click "Human Summary" to verify the terms read correctly.

---

## Features

- **Streaming AI output** — watch your document generate word by word, no waiting for a spinner
- **Edit mode** — refine any generated document directly in the app before exporting
- **One-click export** — download as Markdown, HTML, or plain text
- **Copy to clipboard** — paste directly into your codebase, website, or docs
- **8 license templates** — instantly fill with your name and year, no API call needed
- **AI license summarizer** — understand any license in plain English

---

## Stack

- React + Vite (TypeScript)
- Express 5 API server
- GitHub Models API (GPT-4o-mini via Azure AI Inference)
- Tailwind CSS v4 + shadcn/ui
- SSE streaming — real-time token-by-token output
- Drizzle ORM + PostgreSQL

---

## Tags

`legal-tech` `ai` `developer-tools` `saas` `open-source` `terms-and-conditions` `privacy-policy` `software-license` `gpt-4o` `react` `vite` `typescript` `streaming`

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend
pnpm --filter @workspace/retrusty run dev
```

**Required env var:** `GITHUB_MODELS_API_KEY` — a GitHub Personal Access Token with access to GitHub Models.

---

## License

AGPL 3.0 — see [LICENSE](LICENSE)
