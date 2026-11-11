"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Application Error Boundary caught error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500 selection:text-white">
      <div className="relative max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/10">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1 rounded-full">
            Application Error
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-400">
            An unexpected error occurred while processing this request. Our telemetry logging has recorded this incident.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <RefreshCw size={16} /> Try Again
          </button>
          <Link
            href="/whatsapp/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all"
          >
            <Home size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

