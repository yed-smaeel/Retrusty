import React, { useState, useEffect, useRef } from "react";
import { Scale, Copy, Download, Check, AlertTriangle, Loader2, Sparkles, FileText, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

const LICENSE_TEMPLATES: Record<string, string> = {
  MIT: `MIT License

Copyright (c) [YEAR] [FULLNAME]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

  "Apache 2.0": `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and distribution.
"Licensor" shall mean the copyright owner or entity authorized by the copyright owner.
"You" (or "Your") shall mean an individual or Legal Entity exercising permissions granted by this License.

2. Grant of Copyright License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.

Copyright [YEAR] [FULLNAME]

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0`,

  "GPL v3": `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) [YEAR] [FULLNAME]

Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

PREAMBLE

The GNU General Public License is a free, copyleft license for software and other kinds of works.

TERMS AND CONDITIONS

0. Definitions.
"This License" refers to version 3 of the GNU General Public License.
"The Program" refers to any copyrightable work licensed under this License.

1. Source Code. The "source code" for a work means the preferred form of the work for making modifications to it.

2. Basic Permissions. All rights granted under this License are granted for the term of copyright on the Program, and are irrevocable provided the stated conditions are met.`,

  "AGPL v3": `GNU AFFERO GENERAL PUBLIC LICENSE
Version 3, 19 November 2007

Copyright (C) [YEAR] [FULLNAME]

Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

PREAMBLE

The GNU Affero General Public License is a free, copyleft license for software and other kinds of works, specifically designed to ensure cooperation with the community in the case of network server software.

TERMS AND CONDITIONS

0. Definitions. "This License" refers to version 3 of the GNU Affero General Public License.`,

  "BSD 2-Clause": `BSD 2-Clause License

Copyright (c) [YEAR], [FULLNAME]
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

  "BSD 3-Clause": `BSD 3-Clause License

Copyright (c) [YEAR], [FULLNAME]
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

  "MPL 2.0": `Mozilla Public License Version 2.0

1. Definitions

1.1. "Contributor" means each individual or legal entity that creates, contributes to the creation of, or owns Covered Software.
1.2. "Contributor Version" means the combination of the Contributions of others (if any) used by a Contributor and that particular Contributor's Contribution.
1.3. "Contribution" means Covered Software of a particular Contributor.
1.4. "Covered Software" means Source Code Form to which the initial Contributor has attached the notice in Exhibit A, the Executable Form of such Source Code Form, and Modifications of such Source Code Form, in each case including portions thereof.

Copyright (c) [YEAR] [FULLNAME]. All Rights Reserved.`,

  Unlicense: `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>`,
};

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
      } catch { /* skip */ }
    }
  }
  onDone();
}

export default function LicenseDesigner() {
  const [licenseType, setLicenseType] = useState("MIT");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fullname, setFullname] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");

  const [licenseText, setLicenseText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [activeTab, setActiveTab] = useState<"text" | "summary">("text");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const isCustom = licenseType === "Custom";

  useEffect(() => {
    if (!isCustom) {
      const template = LICENSE_TEMPLATES[licenseType];
      if (template) {
        const filled = template
          .replace(/\[YEAR\]/g, year || new Date().getFullYear().toString())
          .replace(/\[FULLNAME\]/g, fullname || "[NAME]");
        setLicenseText(filled);
      }
      setSummaryText("");
    }
  }, [licenseType, year, fullname]);

  useEffect(() => {
    if (isCustom && !isGenerating) {
      setLicenseText("");
      setSummaryText("");
    }
  }, [isCustom]);

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLicenseText("");
    setSummaryText("");
    setActiveTab("text");
    setIsGenerating(true);

    try {
      await streamGenerate(
        { type: "license", fullname, customRequirements },
        (text) => {
          setLicenseText(text);
          if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
        },
        () => setIsGenerating(false),
        (msg) => { setError(msg); setIsGenerating(false); }
      );
    } catch (err: any) {
      setError(err.message || "Failed to generate license");
      setIsGenerating(false);
    }
  };

  const handleSummarize = async () => {
    if (!licenseText) return;
    setError(null);
    setSummaryText("");
    setActiveTab("summary");
    setIsSummarizing(true);

    try {
      await streamGenerate(
        { type: "summary", licenseText },
        (text) => {
          setSummaryText(text);
          if (summaryRef.current) summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
        },
        () => setIsSummarizing(false),
        (msg) => { setError(msg); setIsSummarizing(false); }
      );
    } catch (err: any) {
      setError(err.message || "Failed to summarize");
      setIsSummarizing(false);
    }
  };

  const handleCopy = () => {
    const text = activeTab === "text" ? licenseText : summaryText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const text = activeTab === "text" ? licenseText : summaryText;
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeTab === "text" ? "LICENSE" : "LICENSE_SUMMARY.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeText = activeTab === "text" ? licenseText : summaryText;

  return (
    <div className="max-w-7xl mx-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          License Designer
        </h1>
        <p className="text-muted-foreground mt-1">Select a standard license template or generate a custom one with AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: "calc(100% - 80px)" }}>
        {/* Left: Controls */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">License Details</h2>
          </div>
          <div className="flex-1 overflow-auto p-5">
            <form id="license-form" onSubmit={handleGenerateCustom} className="space-y-4">
              <div className="space-y-1.5">
                <Label>License Type</Label>
                <Select value={licenseType} onValueChange={setLicenseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Popular Templates</SelectLabel>
                      <SelectItem value="MIT">MIT License</SelectItem>
                      <SelectItem value="Apache 2.0">Apache 2.0</SelectItem>
                      <SelectItem value="GPL v3">GPL v3</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Extended Library</SelectLabel>
                      <SelectItem value="AGPL v3">AGPL v3</SelectItem>
                      <SelectItem value="BSD 2-Clause">BSD 2-Clause</SelectItem>
                      <SelectItem value="BSD 3-Clause">BSD 3-Clause</SelectItem>
                      <SelectItem value="MPL 2.0">Mozilla Public License 2.0</SelectItem>
                      <SelectItem value="Unlicense">The Unlicense (Public Domain)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>AI Generated</SelectLabel>
                      <SelectItem value="Custom">Custom (AI Generated)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {!isCustom && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Copyright Year</Label>
                    <Input
                      id="year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullname">Author / Organization Name</Label>
                    <Input
                      id="fullname"
                      placeholder="Jane Doe"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                    />
                  </div>
                </>
              )}

              {isCustom && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullname-custom">Author / Organization Name</Label>
                    <Input
                      id="fullname-custom"
                      required
                      placeholder="Jane Doe"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customRequirements">License Requirements</Label>
                    <Textarea
                      id="customRequirements"
                      required
                      rows={6}
                      placeholder="e.g. Free for non-commercial use, requires attribution, commercial licenses available upon request."
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                    />
                  </div>
                </>
              )}
            </form>

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          {isCustom && (
            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <Button form="license-form" type="submit" disabled={isGenerating || !customRequirements} className="gap-2">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Generating..." : "Generate Custom License"}
              </Button>
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex px-1 pt-1">
              <button
                onClick={() => setActiveTab("text")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "text"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                Full Legal Text
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "summary"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListChecks className="h-4 w-4" />
                Human Summary
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {activeTab === "text" ? "Generated LICENSE" : "License Summary"}
              </span>
              {(isGenerating || isSummarizing) && (
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
                onClick={handleCopy}
                disabled={!activeText}
                className="gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={!activeText}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>

          {/* Content */}
          <div
            ref={activeTab === "text" ? outputRef : summaryRef}
            className="flex-1 overflow-auto p-6 bg-background/50"
          >
            {activeTab === "text" ? (
              !licenseText && !isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Scale className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm">License output will appear here</p>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                  {licenseText}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </pre>
              )
            ) : (
              !summaryText && !isSummarizing ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 text-center px-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">No summary yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs">Generate an AI summary to understand this license's permissions, conditions, and limitations in plain English.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummarize}
                    disabled={!licenseText}
                    className="gap-2 mt-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Summarize with AI
                  </Button>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                  {summaryText}
                  {isSummarizing && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
