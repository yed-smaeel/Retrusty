import React from "react";
import { Link, useLocation } from "wouter";
import { FileText, ShieldAlert, FileSignature, LayoutDashboard } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tnc", label: "T&C Generator", icon: FileText },
    { href: "/privacy", label: "Privacy Policy", icon: ShieldAlert },
    { href: "/license", label: "License Designer", icon: FileSignature },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0 border-r border-sidebar-border shadow-lg">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="bg-primary-foreground text-primary p-1.5 rounded-md">
            <FileSignature className="h-5 w-5" />
          </div>
          Retrusty
        </Link>
        <p className="text-sidebar-foreground/60 text-xs mt-2 font-medium">Legal OS for Builders</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm cursor-pointer ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center font-bold text-xs">
            AL
          </div>
          <div className="text-sm">
            <p className="font-medium">Alex Legal</p>
            <p className="text-sidebar-foreground/50 text-xs">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
