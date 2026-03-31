"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectOverlayProps {
  children: React.ReactNode;
  isConnected: boolean;
}

/**
 * Wraps portfolio-dependent content with a blur overlay + connect CTA
 * when no broker is connected. When connected, renders children normally.
 */
export default function ConnectOverlay({ children, isConnected }: ConnectOverlayProps) {
  if (isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="relative my-14">
      {/* Blurred skeleton content */}
      <div className="pointer-events-none select-none blur-[6px] opacity-40">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-4 text-center px-6 py-8 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 shadow-xl max-w-sm">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Connect Your Broker</h3>
            <p className="text-sm text-center text-muted-foreground">
              Select your broker to link your account and view live portfolio data.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full pt-2">
            <button
              onClick={() => window.location.href = '/api/brokers/upstox/login'}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://cdn.brandfetch.io/idH_PAk3wi/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764499218928" 
                  alt="Upstox"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-medium text-sm">Upstox</span>
            </button>

            <button
              onClick={() => window.location.href = '/api/brokers/zerodha/login'}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://cdn.brandfetch.io/idZmHUWU0C/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764611260736" 
                  alt="Zerodha"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-medium text-sm">Zerodha</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
