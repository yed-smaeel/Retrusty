import React, { useState, useRef } from "react";
import { FileText, Shield, Loader2, Sparkles, AlertTriangle, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentGeneratorProps {
  type: "tnc" | "privacy";
  title: string;
}

async function streamGenerate(
  body: object,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    onError(`Server error (${response.status})`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.done) { onDone(); return; }
        if (json.error) { onError(json.error); return; }
        if (json.content) { fullText += json.content; onChunk(fullText); }
      } catch { /* skip malformed */ }
    }
  }
  onDone();
}

export default function DocumentGenerator({ type, title }: DocumentGeneratorProps) {
  const Icon = type === "tnc" ? FileText : Shield;
  const [form, setForm] = useState({
    businessName: "",
    jurisdiction: "",
    industry: "",
    specialNeeds: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [document, setDocument] = useState("");
  const [editedDocument, setEditedDocument] = useState("");
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDocument("");
    setEditedDocument("");
    setMode("preview");
    setIsGenerating(true);

    try {
      await streamGenerate(
        { type, ...form },
        (text) => {
          setDocument(text);
          setEditedDocument(text);
          if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
        },
        () => setIsGenerating(false),
        (msg) => { setError(msg); setIsGenerating(false); }
      );
    } catch (err: any) {
      setError(err.message || "Failed to generate document");
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mode === "edit" ? editedDocument : document);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: string) => {
    const content = mode === "edit" ? editedDocument : document;
    if (!content) return;
    let blob: Blob;
    if (format === "html") {
      blob = new Blob(
        [`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;}</style></head><body>${content.replace(/\n/g, "<br>")}</body></html>`],
        { type: "text/html" }
      );
    } else {
      blob = new Blob([content], { type: "text/plain" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeDoc = mode === "edit" ? editedDocument : document;

  return (
    <div className="max-w-7xl mx-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          {title} Generator
        </h1>
        <p className="text-muted-foreground mt-1">Fill in your business details and generate a professional document instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: "calc(100% - 80px)" }}>
        {/* Left: Form */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Business Details</h2>
          </div>
          <div className="flex-1 overflow-auto p-5">
            <form id="doc-form" onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  required
                  placeholder="Acme Corp"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  required
                  placeholder="State of Delaware, US"
                  value={form.jurisdiction}
                  onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  required
                  placeholder="SaaS / E-commerce"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="specialNeeds">Special Clauses or Needs <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="specialNeeds"
                  rows={4}
                  placeholder="e.g. We do not offer refunds after 30 days."
                  value={form.specialNeeds}
                  onChange={(e) => setForm({ ...form, specialNeeds: e.target.value })}
                />
              </div>
            </form>

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
            <Button form="doc-form" type="submit" disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Document Preview</span>
              {isGenerating && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                  Streaming
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
                disabled={!document}
              >
                {mode === "edit" ? "Preview" : "Edit"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!activeDoc}
                className="gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Select onValueChange={handleExport} disabled={!activeDoc}>
                <SelectTrigger className="h-8 w-[100px] text-sm">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="md">Markdown</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="txt">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div ref={outputRef} className="flex-1 overflow-auto p-6 bg-background/50">
            {!document && !isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm">Generated document will appear here</p>
              </div>
            ) : mode === "edit" ? (
              <textarea
                className="w-full h-full min-h-[400px] p-4 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm resize-none bg-background"
                value={editedDocument}
                onChange={(e) => setEditedDocument(e.target.value)}
              />
            ) : (
              <div className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                {document}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
