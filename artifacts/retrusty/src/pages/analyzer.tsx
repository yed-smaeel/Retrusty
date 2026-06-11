import React, { useState, useRef } from "react";
import {
  Search,
  Upload,
  Link,
  FileText,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  X,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InputMode = "url" | "text" | "file";

async function streamAnalyze(
  body: object,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    onError(json.error || `Server error (${response.status})`);
    return;
  }

  if (!response.body) {
    onError("No response body");
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
      } catch { /* skip */ }
    }
  }
  onDone();
}

function getRatingIcon(analysis: string) {
  const lower = analysis.toLowerCase();
  if (lower.includes("very restrictive")) return <ShieldX className="h-5 w-5 text-red-500" />;
  if (lower.includes("restrictive")) return <ShieldAlert className="h-5 w-5 text-orange-500" />;
  if (lower.includes("user-friendly")) return <ShieldCheck className="h-5 w-5 text-green-500" />;
  return <Shield className="h-5 w-5 text-blue-500" />;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold mt-5 mb-2 text-foreground border-b border-border pb-1">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-foreground leading-relaxed list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    } else {
      // Bold inline
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      elements.push(
        <p key={i} className="text-sm text-foreground leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    }
    i++;
  }
  return elements;
}

export default function Analyzer() {
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFileName(null);
    setFileContent("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAnalysis("");
    setIsAnalyzing(true);

    let body: object;
    if (mode === "url") {
      if (!url.trim()) { setError("Please enter a URL"); setIsAnalyzing(false); return; }
      body = { url: url.trim() };
    } else if (mode === "text") {
      if (!pastedText.trim()) { setError("Please paste some document text"); setIsAnalyzing(false); return; }
      body = { text: pastedText.trim() };
    } else {
      if (!fileContent) { setError("Please select a file"); setIsAnalyzing(false); return; }
      body = { text: fileContent };
    }

    try {
      await streamAnalyze(
        body,
        (text) => {
          setAnalysis(text);
          if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
        },
        () => setIsAnalyzing(false),
        (msg) => { setError(msg); setIsAnalyzing(false); }
      );
    } catch (err: any) {
      setError(err.message || "Failed to analyze");
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!analysis) return;
    const blob = new Blob([analysis], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "document-analysis.md";
    a.click();
  };

  const tabs: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: "url", label: "Website URL", icon: <Link className="h-4 w-4" /> },
    { id: "text", label: "Paste Text", icon: <FileText className="h-4 w-4" /> },
    { id: "file", label: "Upload File", icon: <Upload className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Document Analyzer
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyze any Terms & Conditions, Privacy Policy, or EULA — via URL, paste, or file upload.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: "calc(100% - 80px)" }}>
        {/* Left: Input */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          {/* Mode tabs */}
          <div className="border-b border-border">
            <div className="flex px-1 pt-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setMode(tab.id); setError(null); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    mode === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5">
            <form id="analyze-form" onSubmit={handleAnalyze} className="space-y-4">
              {mode === "url" && (
                <div className="space-y-1.5">
                  <Label htmlFor="doc-url">Document URL</Label>
                  <Input
                    id="doc-url"
                    type="url"
                    placeholder="https://example.com/privacy-policy"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the direct link to a Privacy Policy, Terms & Conditions, EULA, or any legal document page.
                  </p>
                </div>
              )}

              {mode === "text" && (
                <div className="space-y-1.5">
                  <Label htmlFor="doc-text">Document Text</Label>
                  <Textarea
                    id="doc-text"
                    rows={14}
                    placeholder="Paste the full text of the legal document here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="font-mono text-xs resize-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {pastedText.length.toLocaleString()} characters
                  </p>
                </div>
              )}

              {mode === "file" && (
                <div className="space-y-3">
                  <Label>Document File</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF text layer, TXT, or Markdown files</p>
                    <p className="text-xs text-muted-foreground">Note: Only text-based PDFs are supported (not scanned images)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.text"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {fileName && (
                    <div className="flex items-center justify-between bg-muted/50 border border-border rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium truncate max-w-[220px]">{fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(fileContent.length / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button onClick={clearFile} type="button" className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
            <Button form="analyze-form" type="submit" disabled={isAnalyzing} className="gap-2">
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isAnalyzing ? "Analyzing..." : "Analyze Document"}
            </Button>
          </div>
        </div>

        {/* Right: Analysis output */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Analysis Report</span>
              {analysis && getRatingIcon(analysis)}
              {isAnalyzing && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                  Analyzing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!analysis}
                className="gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!analysis}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          </div>

          <div ref={outputRef} className="flex-1 overflow-auto p-6 bg-background/50">
            {!analysis && !isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 text-center px-6">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-medium mb-1">No document analyzed yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Provide a URL, paste the text, or upload a .txt file to get an instant AI-powered breakdown of any legal document.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-xs text-xs">
                  {["Privacy Policies", "Terms & Conditions", "EULAs", "Cookie Policies"].map((t) => (
                    <div key={t} className="bg-muted rounded-md px-3 py-1.5 text-center text-muted-foreground">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-foreground">
                {renderMarkdown(analysis)}
                {isAnalyzing && (
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
