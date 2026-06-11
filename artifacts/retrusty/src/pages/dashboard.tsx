import React from "react";
import { Link } from "wouter";
import { FileText, ShieldAlert, FileSignature, ArrowRight, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const tools = [
    {
      title: "Terms & Conditions",
      description: "Generate compliant T&C tailored to your specific industry and jurisdiction.",
      icon: FileText,
      href: "/tnc",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      delay: "animate-in slide-in-from-bottom-4 fade-in duration-500",
    },
    {
      title: "Privacy Policy",
      description: "Draft comprehensive privacy policies covering GDPR, CCPA, and more.",
      icon: ShieldAlert,
      href: "/privacy",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      delay: "animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100",
    },
    {
      title: "License Designer",
      description: "Apply standard OSS licenses or generate custom commercial terms with AI.",
      icon: FileSignature,
      href: "/license",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      delay: "animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Welcome back.</h1>
        <p className="text-muted-foreground text-lg">What do you need to draft today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className={`hover:border-primary/50 transition-colors cursor-pointer h-full border-border/60 shadow-sm ${tool.delay} hover:shadow-md`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${tool.bg}`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <CardTitle>{tool.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2 leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-primary mt-2">
                  Launch generator <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="border-t border-border pt-8 animate-in fade-in duration-700 delay-300">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recent Documents
        </h2>
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No documents generated yet.</p>
            <p className="text-sm">Start by selecting a tool from above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
