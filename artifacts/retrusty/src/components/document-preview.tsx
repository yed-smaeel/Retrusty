import React, { useState } from "react";
import { Copy, Download, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentPreviewProps {
  documentText: string;
  isGenerating: boolean;
  onSummaryRequest?: (text: string) => void;
}

export function DocumentPreview({ documentText, isGenerating, onSummaryRequest }: DocumentPreviewProps) {
  const [mode, setMode] = useState<"preview" | "edit" | "summary">("preview");
  const [editedText, setEditedText] = useState(documentText);
  const [copied, setCopied] = useState(false);

  // Sync edited text when documentText changes during generation
  React.useEffect(() => {
    if (isGenerating) {
      setEditedText(documentText);
    }
  }, [documentText, isGenerating]);

  const handleCopy = () => {
    navigator.clipboard.writeText(mode === "edit" ? editedText : documentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: string) => {
    const content = mode === "edit" ? editedText : documentText;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <Tabs value={mode} onValueChange={(v: any) => {
          setMode(v);
          if (v === "summary" && onSummaryRequest) {
            onSummaryRequest(documentText);
          }
        }} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            {onSummaryRequest && <TabsTrigger value="summary">Summary</TabsTrigger>}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-[120px] h-9">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="txt">.txt</SelectItem>
              <SelectItem value="md">.md</SelectItem>
              <SelectItem value="html">.html</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-card relative">
        {mode === "preview" && (
          <div className="prose prose-sm dark:prose-invert max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {documentText || <span className="text-muted-foreground italic">Your document will appear here...</span>}
            {isGenerating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />}
          </div>
        )}
        {mode === "edit" && (
          <textarea
            className="w-full h-full min-h-[500px] p-4 font-mono text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
        )}
        {mode === "summary" && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating summary...
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{documentText}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
